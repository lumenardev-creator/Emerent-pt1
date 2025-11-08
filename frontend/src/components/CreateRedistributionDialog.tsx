import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createRedistribution, CreateRedistributionRequest } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface CreateRedistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRedistributionDialog({ open, onOpenChange }: CreateRedistributionDialogProps) {
  const { kioskId } = useAuth();
  const queryClient = useQueryClient();
  const [toKioskId, setToKioskId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");

  // Fetch other kiosks
  const { data: kiosks } = useQuery({
    queryKey: ["other-kiosks", kioskId],
    enabled: !!kioskId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kiosks")
        .select("id, name")
        .neq("id", kioskId);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch products with inventory
  const { data: products } = useQuery({
    queryKey: ["kiosk-products", kioskId],
    enabled: !!kioskId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kiosk_inventory")
        .select(`
          product_id,
          quantity,
          products (
            id,
            sku,
            name,
            unit
          )
        `)
        .eq("kiosk_id", kioskId)
        .gt("quantity", 0);
      
      if (error) throw error;
      return data.map((item: any) => ({
        id: item.products.id,
        sku: item.products.sku,
        name: item.products.name,
        unit: item.products.unit,
        available_quantity: item.quantity
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!kioskId || !toKioskId || !selectedProduct || !quantity) {
        throw new Error("Please fill all fields");
      }

      const product = products?.find(p => p.id === selectedProduct);
      if (!product) throw new Error("Product not found");

      const qty = parseInt(quantity);
      if (isNaN(qty) || qty <= 0) {
        throw new Error("Invalid quantity");
      }

      if (qty > product.available_quantity) {
        throw new Error(`Only ${product.available_quantity} units available`);
      }

      const request: CreateRedistributionRequest = {
        from_kiosk_id: kioskId,
        to_kiosk_id: toKioskId,
        items: [{
          sku: product.sku,
          quantity: qty
        }],
        client_req_id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        signature: "",
        public_key: ""
      };

      return createRedistribution(request);
    },
    onSuccess: () => {
      toast.success("Redistribution request created successfully!");
      queryClient.invalidateQueries({ queryKey: ["kiosk-redistributions"] });
      onOpenChange(false);
      // Reset form
      setToKioskId("");
      setSelectedProduct("");
      setQuantity("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create request");
    },
  });

  const selectedProductData = products?.find(p => p.id === selectedProduct);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Redistribution Request</DialogTitle>
          <DialogDescription>
            Send inventory to another kiosk. Admin approval required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="to-kiosk">Destination Kiosk</Label>
            <Select value={toKioskId} onValueChange={setToKioskId}>
              <SelectTrigger id="to-kiosk">
                <SelectValue placeholder="Select kiosk" />
              </SelectTrigger>
              <SelectContent>
                {kiosks?.map((kiosk) => (
                  <SelectItem key={kiosk.id} value={kiosk.id}>
                    {kiosk.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.sku}) - {product.available_quantity} {product.unit} available
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={selectedProductData?.available_quantity || 0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
            />
            {selectedProductData && (
              <p className="text-xs text-muted-foreground">
                Available: {selectedProductData.available_quantity} {selectedProductData.unit}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !toKioskId || !selectedProduct || !quantity}
          >
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
