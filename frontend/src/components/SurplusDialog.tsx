import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SurplusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surplusItems: Array<{
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit: string;
    threshold: number;
  }>;
}

export function SurplusDialog({ open, onOpenChange, surplusItems }: SurplusDialogProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; quantity: string }>>({});
  const { kioskId } = useAuth();
  const queryClient = useQueryClient();

  const createRequestsMutation = useMutation({
    mutationFn: async () => {
      if (!kioskId) throw new Error("Kiosk not found");

      const requests = Object.entries(selectedItems)
        .filter(([_, data]) => data.selected && parseFloat(data.quantity) > 0)
        .map(([itemId, data]) => {
          const item = surplusItems.find(i => i.id === itemId);
          if (!item) return null;

          return {
            product_id: item.product_id,
            from_kiosk_id: kioskId,
            quantity: parseFloat(data.quantity),
            unit: item.unit,
            status: "pending",
            priority: "Medium Priority",
            reason: `Surplus inventory - Current: ${item.quantity} ${item.unit}, Threshold: ${item.threshold} ${item.unit}`,
          };
        })
        .filter(Boolean);

      if (requests.length === 0) {
        throw new Error("Please select at least one item and enter quantity");
      }

      const { error } = await supabase.from("redistributions").insert(requests);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Surplus distribution requests submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["kiosk-redistributions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-redistributions"] });
      onOpenChange(false);
      setSelectedItems({});
    },
    onError: (error: Error) => {
      toast.error("Failed to submit requests: " + error.message);
    },
  });

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        selected: !prev[itemId]?.selected,
        quantity: prev[itemId]?.quantity || "",
      },
    }));
  };

  const updateQuantity = (itemId: string, quantity: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity,
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Surplus Inventory</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select surplus items and specify quantities to redistribute
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {surplusItems.map((item) => {
            const surplus = item.quantity - item.threshold;
            return (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={item.id}
                    checked={selectedItems[item.id]?.selected || false}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={item.id} className="font-semibold cursor-pointer">
                      {item.product_name}
                    </Label>
                    <div className="text-sm text-muted-foreground mt-1">
                      Current: {item.quantity} {item.unit} • Threshold: {item.threshold} {item.unit}
                    </div>
                    <div className="text-xs text-warning mt-1">
                      {surplus.toFixed(1)} {item.unit} surplus available
                    </div>
                  </div>
                </div>

                {selectedItems[item.id]?.selected && (
                  <div className="ml-7">
                    <Label htmlFor={`quantity-${item.id}`} className="text-sm">
                      Quantity to Send ({item.unit})
                    </Label>
                    <Input
                      id={`quantity-${item.id}`}
                      type="number"
                      min="0"
                      max={surplus}
                      step="0.1"
                      placeholder="Enter quantity"
                      value={selectedItems[item.id]?.quantity || ""}
                      onChange={(e) => updateQuantity(item.id, e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Max: {surplus.toFixed(1)} {item.unit}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => createRequestsMutation.mutate()}
            disabled={createRequestsMutation.isPending}
            className="flex-1"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Requests
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
