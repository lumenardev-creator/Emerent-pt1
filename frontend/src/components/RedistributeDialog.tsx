import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Send, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface RedistributeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    unit: string;
  };
  currentStock: number;
  threshold: number;
}

export function RedistributeDialog({
  open,
  onOpenChange,
  product,
  currentStock,
  threshold,
}: RedistributeDialogProps) {
  const [action, setAction] = useState<"receive" | "send">("receive");
  const [quantity, setQuantity] = useState("");
  const { kioskId } = useAuth();
  const queryClient = useQueryClient();

  const smartSuggestion = currentStock < threshold ? "receiving" : "sending";
  const suggestedQuantity = Math.abs(currentStock - threshold);

  const createRedistributionMutation = useMutation({
    mutationFn: async () => {
      if (!kioskId) throw new Error("Kiosk not found");
      
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) throw new Error("Invalid quantity");

      const redistributionData = {
        product_id: product.id,
        quantity: qty,
        unit: product.unit,
        status: "pending",
        priority: "Medium Priority",
        reason: action === "receive" 
          ? `Stock below threshold (${threshold} ${product.unit})`
          : `Surplus stock above threshold`,
        ...(action === "receive" 
          ? { to_kiosk_id: kioskId, from_kiosk_id: null }
          : { from_kiosk_id: kioskId, to_kiosk_id: null }
        ),
      };

      const { error } = await supabase
        .from("redistributions")
        .insert(redistributionData);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Redistribution request submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["kiosk-inventory"] });
      onOpenChange(false);
      setQuantity("");
    },
    onError: (error: Error) => {
      toast.error("Failed to submit request: " + error.message);
    },
  });

  const handleSubmit = () => {
    createRedistributionMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Redistribute Inventory</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Create a redistribution request for {product.name}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Item:</span> {product.name}
            </div>
            <div className="text-sm">
              <span className="font-medium">Current Stock:</span> {currentStock} {product.unit}
            </div>
            <div className="text-sm">
              <span className="font-medium">Threshold:</span> {threshold} {product.unit}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base">Redistribution Action</Label>
            <RadioGroup value={action} onValueChange={(val) => setAction(val as "receive" | "send")}>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="receive" id="receive" />
                <Label htmlFor="receive" className="font-normal cursor-pointer flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-success" />
                  <div>
                    <div className="font-medium">Receive Inventory</div>
                    <div className="text-xs text-muted-foreground">Request items from other kiosks</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="send" id="send" />
                <Label htmlFor="send" className="font-normal cursor-pointer flex items-center gap-2">
                  <Send className="w-4 h-4 text-warning" />
                  <div>
                    <div className="font-medium">Send Inventory</div>
                    <div className="text-xs text-muted-foreground">Send surplus to other kiosks</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <div className="bg-accent/50 p-3 rounded-md text-sm flex items-start gap-2">
              <span className="text-lg">💡</span>
              <div>
                <span className="font-medium">Smart suggestion:</span> Based on your current stock level, we recommend{" "}
                <span className="font-semibold">{smartSuggestion}</span> inventory for this item.
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity to {action === "receive" ? "Receive" : "Send"} ({product.unit})
            </Label>
            <Input
              id="quantity"
              type="number"
              placeholder={`Enter quantity to ${action}`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
              step="0.1"
            />
            <p className="text-xs text-muted-foreground">
              This will help bring your stock {action === "receive" ? "above" : "back to"} the threshold of {threshold} {product.unit}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!quantity || createRedistributionMutation.isPending}
            className="flex-1"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit {action === "receive" ? "Receive" : "Send"} Request
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
