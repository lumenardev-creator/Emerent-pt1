import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ItemSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    unit: string;
  };
  currentStock: number;
  currentThreshold: number;
  autoRequestEnabled: boolean;
}

export function ItemSettingsDialog({
  open,
  onOpenChange,
  product,
  currentStock,
  currentThreshold,
  autoRequestEnabled,
}: ItemSettingsDialogProps) {
  const [threshold, setThreshold] = useState(currentThreshold.toString());
  const [autoRequest, setAutoRequest] = useState(autoRequestEnabled);
  const { kioskId } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    setThreshold(currentThreshold.toString());
    setAutoRequest(autoRequestEnabled);
  }, [currentThreshold, autoRequestEnabled, open]);

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!kioskId) throw new Error("Kiosk not found");
      
      const thresholdValue = parseFloat(threshold);
      if (isNaN(thresholdValue) || thresholdValue < 0) {
        throw new Error("Invalid threshold value");
      }

      const { error } = await supabase
        .from("kiosk_inventory")
        .update({
          threshold: thresholdValue,
          auto_request_enabled: autoRequest,
        })
        .eq("kiosk_id", kioskId)
        .eq("product_id", product.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["kiosk-inventory"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to save settings: " + error.message);
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Item Settings</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Configure threshold and auto-request settings for {product.name}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="threshold">Threshold ({product.unit})</Label>
            <Input
              id="threshold"
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              min="0"
              step="0.1"
            />
            <p className="text-xs text-muted-foreground">
              Current stock: {currentStock} {product.unit}
            </p>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="auto-request"
              checked={autoRequest}
              onCheckedChange={(checked) => setAutoRequest(checked as boolean)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="auto-request"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Enable automatic redistribution requests
              </Label>
              <p className="text-xs text-muted-foreground">
                When enabled, requests will be automatically sent when stock falls below threshold
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending}
            className="flex-1"
          >
            Save Settings
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
