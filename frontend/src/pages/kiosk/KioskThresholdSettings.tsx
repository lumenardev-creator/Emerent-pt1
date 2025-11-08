import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit } from "lucide-react";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  threshold: number;
  auto_request_enabled: boolean;
}

export default function KioskThresholdSettings() {
  const { kioskId } = useAuth();
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [threshold, setThreshold] = useState<number>(0);
  const [autoRequest, setAutoRequest] = useState<boolean>(false);

  const { data: inventoryItems, isLoading } = useQuery({
    queryKey: ["kiosk-threshold-settings", kioskId],
    enabled: !!kioskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kiosk_inventory")
        .select(`
          id,
          product_id,
          quantity,
          threshold,
          auto_request_enabled,
          products (
            name,
            unit
          )
        `)
        .eq("kiosk_id", kioskId)
        .order("products(name)");

      if (error) throw error;
      
      return data.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products.name,
        quantity: item.quantity,
        unit: item.products.unit,
        threshold: item.threshold || 20,
        auto_request_enabled: item.auto_request_enabled || false,
      })) as InventoryItem[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, threshold, autoRequest }: { id: string; threshold: number; autoRequest: boolean }) => {
      const { error } = await supabase
        .from("kiosk_inventory")
        .update({
          threshold: threshold,
          auto_request_enabled: autoRequest,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kiosk-threshold-settings", kioskId] });
      queryClient.invalidateQueries({ queryKey: ["kiosk-inventory", kioskId] });
      toast.success("Threshold settings updated successfully");
      setEditingItem(null);
    },
    onError: (error) => {
      toast.error("Failed to update threshold settings");
      console.error(error);
    },
  });

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setThreshold(item.threshold);
    setAutoRequest(item.auto_request_enabled);
  };

  const handleSave = () => {
    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        threshold,
        autoRequest,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Threshold Settings</h1>
        <p className="text-muted-foreground">Configure auto-request thresholds for each item</p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading inventory items...</div>
        ) : inventoryItems?.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No inventory items found</div>
        ) : (
          inventoryItems?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-5 bg-card border border-border/40 rounded-lg hover:border-border transition-all"
            >
              <div>
                <h3 className="font-semibold text-foreground text-base mb-1">{item.product_name}</h3>
                <p className="text-sm text-primary/80">
                  Current: {item.quantity} {item.unit}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-sm text-foreground">
                  Threshold: <span className="font-semibold">{item.threshold} {item.unit}</span>
                </span>

                <span className="text-sm text-foreground min-w-[140px]">
                  Auto-Request: <span className={item.auto_request_enabled ? "font-semibold text-success" : "font-semibold text-muted-foreground"}>
                    {item.auto_request_enabled ? "On" : "Off"}
                  </span>
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(item)}
                  className="gap-2 hover:bg-accent"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Threshold Settings</DialogTitle>
            <DialogDescription>
              Update threshold and auto-request settings for {editingItem?.product_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="threshold">
                Threshold ({editingItem?.unit})
              </Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                placeholder="Enter threshold value"
              />
              <p className="text-xs text-muted-foreground">
                Current stock: {editingItem?.quantity} {editingItem?.unit}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-request">Auto-Request</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically request restock when below threshold
                </p>
              </div>
              <Switch
                id="auto-request"
                checked={autoRequest}
                onCheckedChange={setAutoRequest}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
