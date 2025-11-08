import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, TrendingDown, TrendingUp, RefreshCw, Plus, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { RedistributeDialog } from "@/components/RedistributeDialog";
import { ItemSettingsDialog } from "@/components/ItemSettingsDialog";

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  threshold: number;
  auto_request_enabled: boolean;
}

export default function KioskInventory() {
  const { kioskId } = useAuth();
  const [redistributeDialog, setRedistributeDialog] = useState<{
    open: boolean;
    item: InventoryItem | null;
  }>({ open: false, item: null });
  const [settingsDialog, setSettingsDialog] = useState<{
    open: boolean;
    item: InventoryItem | null;
  }>({ open: false, item: null });

  const { data: inventoryItems, isLoading } = useQuery({
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
          auto_request_enabled,
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
        auto_request_enabled: item.auto_request_enabled || false,
      })) as InventoryItem[];
    },
  });

  const getStatus = (stock: number, threshold: number) => {
    if (stock < threshold) return { label: "Low Stock", variant: "destructive" as const };
    if (stock > threshold * 1.5) return { label: "Surplus", variant: "secondary" as const, className: "bg-warning/20 text-warning" };
    return { label: "Normal", variant: "default" as const, className: "bg-success/20 text-success" };
  };

  const stats = {
    total: inventoryItems?.length || 0,
    lowStock: inventoryItems?.filter(i => i.quantity < i.threshold).length || 0,
    surplus: inventoryItems?.filter(i => i.quantity > i.threshold * 1.5).length || 0,
    autoRequest: inventoryItems?.filter(i => i.auto_request_enabled).length || 0,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your kiosk's inventory levels and threshold settings</p>
        </div>
        <Button className="shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Add Items
        </Button>
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
                <RefreshCw className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auto-Request On</p>
                <p className="text-2xl font-bold text-foreground">{stats.autoRequest}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Current Inventory</CardTitle>
            <Tabs defaultValue="inventory" className="w-auto">
              <TabsList>
                <TabsTrigger value="inventory">Inventory View</TabsTrigger>
                <TabsTrigger value="threshold">Threshold Settings</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <p className="text-sm text-muted-foreground">Real-time view of your inventory with quick action buttons</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Details</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Auto-Request</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading inventory...
                  </TableCell>
                </TableRow>
              ) : inventoryItems?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No inventory items found
                  </TableCell>
                </TableRow>
              ) : (
                inventoryItems?.map((item) => {
                  const status = getStatus(item.quantity, item.threshold);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">{item.product_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground">{item.quantity} {item.unit}</p>
                      </TableCell>
                      <TableCell className="text-foreground">{item.threshold} {item.unit}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={status.variant}
                          className={status.className}
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.auto_request_enabled ? 'default' : 'secondary'}>
                          {item.auto_request_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => setRedistributeDialog({ open: true, item })}
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1" />
                            Redistribute
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSettingsDialog({ open: true, item })}
                          >
                            <Settings className="w-3.5 h-3.5 mr-1" />
                            Settings
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {redistributeDialog.item && (
        <RedistributeDialog
          open={redistributeDialog.open}
          onOpenChange={(open) => setRedistributeDialog({ open, item: null })}
          product={{
            id: redistributeDialog.item.product_id,
            name: redistributeDialog.item.product_name,
            unit: redistributeDialog.item.unit,
          }}
          currentStock={redistributeDialog.item.quantity}
          threshold={redistributeDialog.item.threshold}
        />
      )}

      {settingsDialog.item && (
        <ItemSettingsDialog
          open={settingsDialog.open}
          onOpenChange={(open) => setSettingsDialog({ open, item: null })}
          product={{
            id: settingsDialog.item.product_id,
            name: settingsDialog.item.product_name,
            unit: settingsDialog.item.unit,
          }}
          currentStock={settingsDialog.item.quantity}
          currentThreshold={settingsDialog.item.threshold}
          autoRequestEnabled={settingsDialog.item.auto_request_enabled}
        />
      )}
    </div>
  );
}
