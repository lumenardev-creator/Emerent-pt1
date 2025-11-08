import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, MapPin, User, Mail, Eye, Pencil, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Kiosk {
  id: string;
  name: string;
  kiosk_code: string;
  address: string;
  manager_name: string | null;
  email: string | null;
  phone: string | null;
  total_items: number | null;
  sku_count: number | null;
  last_activity: string | null;
  status: string | null;
}

interface KioskInventoryItem {
  product_name: string;
  quantity: number;
  unit: string;
  status: string;
  category: string;
  price: number;
}

export default function KioskManagement() {
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editKioskOpen, setEditKioskOpen] = useState(false);
  const [selectedKiosk, setSelectedKiosk] = useState<Kiosk | null>(null);

  const { data: kiosks, isLoading } = useQuery({
    queryKey: ["kiosks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kiosks")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Kiosk[];
    },
  });

  const { data: kioskInventory } = useQuery({
    queryKey: ["kiosk-inventory-detail", selectedKiosk?.id],
    enabled: !!selectedKiosk?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kiosk_inventory")
        .select(`
          quantity,
          products (
            name,
            unit,
            status,
            mrp
          )
        `)
        .eq("kiosk_id", selectedKiosk!.id);
      if (error) throw error;
      
      return data.map((item: any) => ({
        product_name: item.products.name,
        quantity: item.quantity,
        unit: item.products.unit,
        status: item.products.status || "Normal",
        category: getCategoryFromName(item.products.name),
        price: item.products.mrp,
      })) as KioskInventoryItem[];
    },
  });

  const getCategoryFromName = (name: string): string => {
    if (name.toLowerCase().includes("milk") || name.toLowerCase().includes("yogurt") || name.toLowerCase().includes("eggs")) return "Dairy";
    if (name.toLowerCase().includes("spinach") || name.toLowerCase().includes("banana") || name.toLowerCase().includes("apple")) return "Vegetables";
    if (name.toLowerCase().includes("bread")) return "Bakery";
    if (name.toLowerCase().includes("sauce") || name.toLowerCase().includes("quinoa")) return "Pantry";
    return "Fruits";
  };

  const getStatusColor = (status: string) => {
    if (status.includes("Oversupply") || status.includes("surplus")) return "secondary";
    if (status.includes("Undersupply") || status.includes("Low")) return "destructive";
    return "default";
  };

  const getStatusLabel = (status: string) => {
    if (status.includes("Oversupply")) return "Surplus";
    if (status.includes("Undersupply")) return "Low Stock";
    return "Normal";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Kiosk Management</h1>
          <p className="text-muted-foreground">Register and manage your network of kiosks</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Register New Kiosk
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading kiosks...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {kiosks?.map((kiosk) => (
            <Card key={kiosk.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">{kiosk.name}</h3>
                        <Badge
                          variant={kiosk.status === "Active" ? "default" : "secondary"}
                          className={kiosk.status === "Active" ? "bg-success" : "bg-muted"}
                        >
                          {kiosk.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{kiosk.address}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span>{kiosk.manager_name || "N/A"}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span>{kiosk.email || "N/A"}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Items:</span>
                      <span className="font-semibold">{kiosk.total_items || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SKUs:</span>
                      <span className="font-semibold">{kiosk.sku_count || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Activity:</span>
                      <span className="font-semibold">
                        {kiosk.last_activity ? new Date(kiosk.last_activity).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="sm"
                      onClick={() => {
                        setSelectedKiosk(kiosk);
                        setViewDetailsOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="sm"
                      onClick={() => {
                        setSelectedKiosk(kiosk);
                        setEditKioskOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Kiosk Inventory - {selectedKiosk?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Current inventory levels and item details
            </p>
          </DialogHeader>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kioskInventory?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell>
                    <span className="font-semibold">{item.quantity}</span>{" "}
                    <span className="text-muted-foreground text-sm">{item.unit}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>₹{item.price}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Edit Kiosk Dialog */}
      <Dialog open={editKioskOpen} onOpenChange={setEditKioskOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Kiosk</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Update kiosk details and save changes
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="kiosk-code">Kiosk Code</Label>
              <Input
                id="kiosk-code"
                defaultValue={selectedKiosk?.kiosk_code}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="kiosk-name">Kiosk Name</Label>
              <Input
                id="kiosk-name"
                defaultValue={selectedKiosk?.name}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Textarea
                id="location"
                defaultValue={selectedKiosk?.address}
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="contact-person">Contact Person</Label>
              <Input
                id="contact-person"
                defaultValue={selectedKiosk?.manager_name || ""}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                defaultValue={selectedKiosk?.phone || ""}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                defaultValue={selectedKiosk?.email || ""}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="activity-status">Activity Status</Label>
              <Select defaultValue={selectedKiosk?.status || "Active"}>
                <SelectTrigger id="activity-status" className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Active kiosks will automatically update when they log in. Set to Inactive for manual control.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => setEditKioskOpen(false)}>
              Delete
            </Button>
            <Button variant="outline" onClick={() => setEditKioskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setEditKioskOpen(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
