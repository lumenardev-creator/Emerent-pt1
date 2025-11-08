import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingDown, TrendingUp, IndianRupee, AlertTriangle, ArrowUpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { RestockDialog } from "@/components/RestockDialog";
import { SurplusDialog } from "@/components/SurplusDialog";

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  threshold: number;
}

export default function KioskDashboard() {
  const { kioskId } = useAuth();
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [surplusDialogOpen, setSurplusDialogOpen] = useState(false);

  const { data: inventoryItems } = useQuery({
    queryKey: ["kiosk-inventory", kioskId],
    enabled: !!kioskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kiosk_inventory")
        .select(`
          id,
          product_id,
          quantity,
          threshold,
          products (
            name,
            unit
          )
        `)
        .eq("kiosk_id", kioskId);

      if (error) throw error;
      
      return data.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products.name,
        quantity: item.quantity,
        unit: item.products.unit,
        threshold: item.threshold || 20,
      })) as InventoryItem[];
    },
  });

  const { data: pendingRequests } = useQuery({
    queryKey: ["kiosk-redistributions", kioskId],
    enabled: !!kioskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("redistributions")
        .select(`
          *,
          products (name),
          from_kiosk:from_kiosk_id (name),
          to_kiosk:to_kiosk_id (name)
        `)
        .or(`from_kiosk_id.eq.${kioskId},to_kiosk_id.eq.${kioskId}`)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  const lowStockItems = inventoryItems?.filter(item => item.quantity < item.threshold) || [];
  const surplusItems = inventoryItems?.filter(item => item.quantity > item.threshold * 1.5) || [];
  const totalValue = inventoryItems?.reduce((sum, item) => sum + (item.quantity * 100), 0) || 0;

  const stats = {
    total: inventoryItems?.length || 0,
    lowStock: lowStockItems.length,
    surplus: surplusItems.length,
    value: totalValue,
  };
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Downtown Fresh Market</h1>
        <p className="text-muted-foreground">Monitor your inventory levels and manage redistribution requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-foreground">{stats.lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Surplus Items</p>
                <p className="text-2xl font-bold text-foreground">{stats.surplus}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold text-foreground">₹{stats.value.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-destructive/30 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Low Stock Alert
              </CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">{stats.lowStock} items are below threshold</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">• {item.product_name}: {item.quantity} {item.unit}</span>
                </div>
              ))}
              {lowStockItems.length === 0 && (
                <div className="text-sm text-muted-foreground">All items are above threshold</div>
              )}
            </div>
            <Button 
              className="w-full mt-4 bg-destructive hover:bg-destructive/90"
              disabled={lowStockItems.length === 0}
              onClick={() => setRestockDialogOpen(true)}
            >
              Request Restocking
            </Button>
          </CardContent>
        </Card>

        <Card className="border-warning/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-warning">
              <ArrowUpCircle className="w-5 h-5" />
              Surplus Available
            </CardTitle>
            <p className="text-sm text-muted-foreground">{stats.surplus} items have excess inventory</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {surplusItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">• {item.product_name}: {item.quantity} {item.unit}</span>
                </div>
              ))}
              {surplusItems.length > 3 && (
                <div className="text-sm text-muted-foreground">+{surplusItems.length - 3} more items</div>
              )}
              {surplusItems.length === 0 && (
                <div className="text-sm text-muted-foreground">No surplus items currently</div>
              )}
            </div>
            <Button 
              className="w-full mt-4 bg-warning hover:bg-warning/90 text-warning-foreground"
              disabled={surplusItems.length === 0}
              onClick={() => setSurplusDialogOpen(true)}
            >
              Send Surplus
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Pending Redistribution Requests</CardTitle>
          <p className="text-sm text-muted-foreground">Track your requests waiting for admin approval</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingRequests?.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No pending requests
              </div>
            ) : (
              pendingRequests?.map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-4">
                    <Package className="w-10 h-10 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">
                        {request.from_kiosk_id ? "Sending" : "Requesting"}: {request.products.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {request.quantity} {request.unit} • {new Date(request.created_at).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Request ID: {request.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-warning/20 text-warning">{request.priority}</Badge>
                    <Badge variant="secondary" className="bg-warning/30 text-warning">Pending Approval</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RestockDialog
        open={restockDialogOpen}
        onOpenChange={setRestockDialogOpen}
        lowStockItems={lowStockItems}
      />

      <SurplusDialog
        open={surplusDialogOpen}
        onOpenChange={setSurplusDialogOpen}
        surplusItems={surplusItems}
      />
    </div>
  );
}
