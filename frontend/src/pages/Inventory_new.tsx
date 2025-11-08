import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string;
  unit_price: number;
  acquired_price: number | null;
  suggested_price: number | null;
  quantity: number;
}

interface KioskInventory {
  id: string;
  kiosk_id: string;
  product_id: string;
  quantity: number;
  threshold: number | null;
  products: Product;
  kiosks: {
    name: string;
  };
}

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedView, setSelectedView] = useState<"summary" | "table">("summary");

  // Fetch all kiosk inventory with products
  const { data: inventoryItems, isLoading } = useQuery({
    queryKey: ["all-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kiosk_inventory")
        .select(`
          id,
          kiosk_id,
          product_id,
          quantity,
          threshold,
          products (
            id,
            sku,
            name,
            unit,
            unit_price,
            acquired_price,
            suggested_price,
            quantity
          ),
          kiosks (
            name
          )
        `)
        .order("quantity", { ascending: true });

      if (error) throw error;
      return data as KioskInventory[];
    },
  });

  // Get unique products with aggregated quantities
  const aggregatedProducts = inventoryItems?.reduce((acc, item) => {
    const existing = acc.find(p => p.product_id === item.product_id);
    if (existing) {
      existing.total_quantity += item.quantity;
      existing.kiosks.push({ kiosk: item.kiosks.name, quantity: item.quantity });
    } else {
      acc.push({
        product_id: item.product_id,
        product: item.products,
        total_quantity: item.quantity,
        kiosks: [{ kiosk: item.kiosks.name, quantity: item.quantity }]
      });
    }
    return acc;
  }, [] as any[]);

  // Filter by search
  const filteredProducts = aggregatedProducts?.filter(item =>
    item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-bold text-foreground mb-3">
          Inventory Management
        </h1>
        <p className="text-muted-foreground text-lg">
          Monitor stock levels across all kiosks
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search inventory, SKUs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
              <TabsList>
                <TabsTrigger value="summary">Summary Cards</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Products</p>
                <p className="text-3xl font-bold">{aggregatedProducts?.length || 0}</p>
              </div>
              <Package className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Units</p>
                <p className="text-3xl font-bold">
                  {aggregatedProducts?.reduce((sum, item) => sum + item.total_quantity, 0) || 0}
                </p>
              </div>
              <Package className="w-10 h-10 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Kiosks</p>
                <p className="text-3xl font-bold">{inventoryItems?.length || 0}</p>
              </div>
              <Package className="w-10 h-10 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {selectedView === "summary" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <Card><CardContent className="py-8 text-center">Loading...</CardContent></Card>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            filteredProducts.map((item) => (
              <Card key={item.product_id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{item.product.name}</span>
                    <Badge variant="secondary">{item.product.sku}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Quantity</span>
                      <span className="text-xl font-bold">{item.total_quantity} {item.product.unit}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="font-semibold">₹{item.product.unit_price}</span>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Distribution:</p>
                      <div className="space-y-1">
                        {item.kiosks.map((k: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span>{k.kiosk}</span>
                            <span className="font-medium">{k.quantity} {item.product.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                No inventory items found
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Table</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Total Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Kiosks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts?.map((item) => (
                  <TableRow key={item.product_id}>
                    <TableCell className="font-mono">{item.product.sku}</TableCell>
                    <TableCell className="font-medium">{item.product.name}</TableCell>
                    <TableCell>{item.total_quantity}</TableCell>
                    <TableCell>{item.product.unit}</TableCell>
                    <TableCell>₹{item.product.unit_price}</TableCell>
                    <TableCell>{item.kiosks.length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
