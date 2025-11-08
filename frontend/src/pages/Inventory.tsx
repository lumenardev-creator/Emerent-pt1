import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Search,
  Filter,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RedistributeDialog } from "@/components/RedistributeDialog";
import { ItemSettingsDialog } from "@/components/ItemSettingsDialog";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

interface Product {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: string | null;
  supply_level: number | null;
  depletion_rate: string | null;
  eligible_for_redistribution: boolean | null;
  forecasted_daily_requirement: number;
  acquired_price: number;
  mrp: number;
  suggested_selling_price: number;
  over_supply_limit: number;
  under_supply_limit: number;
  normal_supply_level: number;
  estimated_market_demand: string | null;
  redistribution_revenue: number;
  redistribution_cost: number;
  redistributable_quantity: number;
  updated_at: string;
}

interface KioskInventory {
  kiosk_id: string;
  kiosk_name: string;
  kiosk_code: string;
  quantity: number;
  last_updated: string;
}

export default function Inventory() {
  const queryClient = useQueryClient();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [redistributeDialog, setRedistributeDialog] = useState<{
    open: boolean;
    product: Product | null;
  }>({ open: false, product: null });

  // Validation schema for eligibility update
  const eligibilitySchema = z.object({
    productId: z.string().uuid("Invalid product ID"),
    eligible: z.boolean(),
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: kioskInventoryMap } = useQuery({
    queryKey: ["kiosk-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kiosk_inventory")
        .select(`
          product_id,
          quantity,
          last_updated,
          kiosks (
            id,
            name,
            kiosk_code
          )
        `);
      if (error) throw error;
      
      const inventoryMap: Record<string, KioskInventory[]> = {};
      data?.forEach((item: any) => {
        if (!inventoryMap[item.product_id]) {
          inventoryMap[item.product_id] = [];
        }
        inventoryMap[item.product_id].push({
          kiosk_id: item.kiosks.id,
          kiosk_name: item.kiosks.name,
          kiosk_code: item.kiosks.kiosk_code,
          quantity: item.quantity,
          last_updated: item.last_updated,
        });
      });
      return inventoryMap;
    },
  });

  const toggleItem = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((item) => item !== itemName)
        : [...prev, itemName]
    );
  };

  const getSupplyStatus = (product: Product) => {
    const quantity = product.quantity || 0;
    const overSupplyLimit = product.over_supply_limit;
    const underSupplyLimit = product.under_supply_limit;
    
    if (quantity > overSupplyLimit) {
      return { text: "Oversupply", color: "bg-destructive", variant: "destructive" as const };
    } else if (quantity < underSupplyLimit) {
      return { text: "Low Supply", color: "bg-warning", variant: "secondary" as const };
    }
    return { text: "Normal Supply", color: "bg-success", variant: "default" as const };
  };

  const getDepletionColor = (depletion: string | null) => {
    switch (depletion?.toLowerCase()) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-warning";
      case "low":
        return "text-success";
      default:
        return "text-muted-foreground";
    }
  };

  const getDepletionIcon = (depletion: string | null) => {
    switch (depletion?.toLowerCase()) {
      case "high":
        return <TrendingUp className="w-4 h-4" />;
      case "medium":
        return <Minus className="w-4 h-4" />;
      case "low":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const calculateFinancialStatus = (product: Product) => {
    // Calculate redistributable quantity (oversupply amount)
    const redistributableQty = Math.max(0, product.quantity - product.over_supply_limit);
    
    // Expected revenue from selling at suggested price
    const expectedRevenue = redistributableQty * product.suggested_selling_price;
    
    // Original cost (what we paid for this stock)
    const originalCost = redistributableQty * product.acquired_price;
    
    // Redistribution cost (logistics + misc fees, estimated at 10% of original cost)
    const redistributionCost = originalCost * 0.10;
    
    // Net profit/loss = revenue - original cost - redistribution cost
    const netProfit = expectedRevenue - originalCost - redistributionCost;
    
    const isProfitable = netProfit > 50;
    const breakEven = Math.abs(netProfit) <= 50;
    
    return {
      redistributableQty,
      expectedRevenue,
      originalCost,
      redistributionCost,
      netProfit,
      isProfitable,
      breakEven,
    };
  };

  const updateEligibilityMutation = useMutation({
    mutationFn: async ({ productId, eligible }: { productId: string; eligible: boolean }) => {
      // Validate input
      try {
        eligibilitySchema.parse({ productId, eligible });
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(error.errors[0].message);
        }
        throw error;
      }

      const { error } = await supabase
        .from("products")
        .update({ eligible_for_redistribution: eligible })
        .eq("id", productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item eligibility updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update eligibility",
        variant: "destructive",
      });
    },
  });

  const handleEligibilityChange = (productId: string, eligible: string) => {
    const isEligible = eligible === "eligible";
    updateEligibilityMutation.mutate({ productId, eligible: isEligible });
  };

  const toggleEligibility = async (productId: string, currentStatus: boolean | null) => {
    updateEligibilityMutation.mutate({ 
      productId, 
      eligible: !currentStatus 
    });
  };

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const quantity = product.quantity || 0;
    const matchesFilter = 
      filterStatus === "all" || 
      (filterStatus === "eligible" && product.eligible_for_redistribution) ||
      (filterStatus === "oversupply" && quantity > product.over_supply_limit) ||
      (filterStatus === "undersupply" && quantity < product.under_supply_limit);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Inventory Management</h1>
        <p className="text-muted-foreground">
          Monitor stock levels and identify surplus items for redistribution
        </p>
      </div>

      <Tabs defaultValue="cards" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="cards">Summary Cards</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>

          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory, SKUs, locations..."
                className="pl-10 w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="eligible">Eligible</SelectItem>
                <SelectItem value="oversupply">Oversupply</SelectItem>
                <SelectItem value="undersupply">Low Supply</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Combined Inventory (All Kiosks)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading inventory...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Total Quantity</TableHead>
                        <TableHead>Kiosk Distribution</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts?.map((product) => {
                        const kioskData = kioskInventoryMap?.[product.id] || [];
                        const supplyStatus = getSupplyStatus(product);
                        
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                              <span className="font-semibold">{product.quantity}</span>{" "}
                              <span className="text-muted-foreground text-sm">{product.unit}</span>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                {kioskData.slice(0, 3).map((kiosk) => (
                                  <div key={kiosk.kiosk_id}>
                                    <span className="font-medium">{kiosk.kiosk_code}:</span>{" "}
                                    <span>{kiosk.quantity} {product.unit}</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  product.depletion_rate === "High depletion" ? "destructive" :
                                  product.depletion_rate === "Medium depletion" ? "secondary" :
                                  "default"
                                }
                              >
                                {product.depletion_rate || "Normal"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(product.updated_at).toLocaleDateString()} {new Date(product.updated_at).toLocaleTimeString()}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const isEligible = product.quantity > product.over_supply_limit;
                                return (
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={
                                        product.eligible_for_redistribution 
                                          ? "eligible" 
                                          : "not-eligible"
                                      }
                                      onValueChange={(value) => handleEligibilityChange(product.id, value)}
                                      disabled={updateEligibilityMutation.isPending}
                                    >
                                      <SelectTrigger className="w-[150px] h-9">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="eligible">
                                          <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-success" />
                                            <span>Eligible</span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="not-eligible">
                                          <div className="flex items-center gap-2">
                                            <XCircle className="w-4 h-4 text-muted-foreground" />
                                            <span>Not Eligible</span>
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {isEligible && (
                                      <Button 
                                        size="sm"
                                        variant="default"
                                        className="gap-2"
                                        disabled={!isEligible}
                                      >
                                        Redistribute
                                      </Button>
                                    )}
                                  </div>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Combined Inventory Summary
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Aggregated view across all kiosks. Click on any item to view detailed analytics and redistribution options
            </p>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading inventory...</div>
            ) : (
              <div className="space-y-4">
                {filteredProducts?.map((product) => {
                  const isExpanded = expandedItems.includes(product.id);
                  const supplyStatus = getSupplyStatus(product);
                  const financialStatus = calculateFinancialStatus(product);
                  const kioskData = kioskInventoryMap?.[product.id] || [];
                  const isOverThreshold = (product.quantity || 0) > (product.over_supply_limit || 0);

                  return (
                    <Card
                      key={product.id}
                      className={`transition-all hover:shadow-md ${
                        (product.supply_level || 0) > 100 
                          ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40" 
                          : (product.supply_level || 0) < 67
                          ? "bg-warning/5 border-warning/20 hover:border-warning/40"
                          : "bg-card border-border hover:border-primary/40"
                      }`}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div
                            className="flex items-start justify-between cursor-pointer"
                            onClick={() => toggleItem(product.id)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-foreground">{product.name}</h3>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex items-center gap-6">
                                <div>
                                  <p className="text-3xl font-bold text-foreground">
                                    {product.quantity} <span className="text-lg font-normal text-muted-foreground">{product.unit}</span>
                                  </p>
                                </div>
                                <Badge variant={supplyStatus.variant}>
                                  {supplyStatus.text}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex flex-col gap-2">
                                <Select
                                  value={
                                    product.eligible_for_redistribution 
                                      ? "eligible" 
                                      : "not-eligible"
                                  }
                                  onValueChange={(value) => handleEligibilityChange(product.id, value)}
                                  disabled={updateEligibilityMutation.isPending}
                                >
                                  <SelectTrigger className="w-[180px] h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="eligible">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-success" />
                                        <span>Eligible</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="not-eligible">
                                      <div className="flex items-center gap-2">
                                        <XCircle className="w-4 h-4 text-muted-foreground" />
                                        <span>Not Eligible</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Badge 
                                  variant={isOverThreshold ? "default" : "secondary"}
                                  className="text-xs justify-center"
                                >
                                  <div className={`w-2 h-2 rounded-full mr-1 ${
                                    isOverThreshold ? "bg-success" : "bg-muted"
                                  }`} />
                                  {isOverThreshold ? "Over Threshold" : "Within Range"}
                                </Badge>
                              </div>

                              <div
                                className={`flex items-center gap-1 ${getDepletionColor(
                                  product.depletion_rate
                                )}`}
                              >
                                {getDepletionIcon(product.depletion_rate)}
                                <span className="text-sm font-medium">
                                  {product.depletion_rate} depletion
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Supply Level</span>
                              <span className="font-semibold">{product.supply_level}%</span>
                            </div>
                            <Progress value={product.supply_level || 0} className="h-2" />
                          </div>

                          {isExpanded && (
                            <div className="space-y-6 pt-4 border-t border-border">
                              <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Acquired Price</p>
                                    <p className="text-lg font-semibold">₹{product.acquired_price}/{product.unit}</p>
                                  </div>

                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                      Forecasted Daily Requirement
                                    </p>
                                    <p className="text-lg font-semibold">
                                      {product.forecasted_daily_requirement} {product.unit}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Over Supply Limit</p>
                                    <p className="text-lg font-semibold">
                                      {product.over_supply_limit} {product.unit}
                                    </p>
                                  </div>

                                  <div className="pt-2">
                                    <div className="flex items-start gap-2">
                                      <p className="text-sm text-muted-foreground">
                                        Estimated Market Demand Nearby
                                      </p>
                                      <Badge variant="secondary" className="text-xs">
                                        Blockchain Data
                                      </Badge>
                                    </div>
                                    <p className="text-lg font-semibold mt-1">
                                      {product.estimated_market_demand}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">MRP</p>
                                    <p className="text-lg font-semibold">₹{product.mrp}/{product.unit}</p>
                                  </div>

                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Depletion Rate</p>
                                    <p className={`text-lg font-semibold ${getDepletionColor(product.depletion_rate)}`}>
                                      {product.depletion_rate}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Under Supply Limit</p>
                                    <p className="text-lg font-semibold">
                                      {product.under_supply_limit} {product.unit}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-card border border-border p-6 rounded-lg space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-lg text-foreground">
                                    Redistribution Financial Analysis
                                  </h4>
                                  {financialStatus.redistributableQty > 0 && (
                                    <Badge variant={financialStatus.isProfitable ? "default" : financialStatus.breakEven ? "secondary" : "destructive"}>
                                      {financialStatus.breakEven ? "Break-even" : financialStatus.isProfitable ? "Profitable" : "Loss"}
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">Redistributable Quantity</p>
                                      <p className="text-2xl font-bold text-foreground">
                                        {financialStatus.redistributableQty.toFixed(0)} {product.unit}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">Expected Revenue</p>
                                      <p className="text-2xl font-bold text-success">
                                        ₹{financialStatus.expectedRevenue.toFixed(0)}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        @ ₹{product.suggested_selling_price}/{product.unit}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">Original Cost</p>
                                      <p className="text-xl font-semibold text-foreground">
                                        ₹{financialStatus.originalCost.toFixed(0)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">Redistribution Cost</p>
                                      <p className="text-xl font-semibold text-foreground">
                                        ₹{financialStatus.redistributionCost.toFixed(0)}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        (Logistics + Misc fees)
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-border">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Net Profit/Loss</span>
                                    <span className={`text-2xl font-bold ${
                                      financialStatus.isProfitable ? "text-success" : 
                                      financialStatus.breakEven ? "text-foreground" : "text-destructive"
                                    }`}>
                                      {financialStatus.netProfit >= 0 ? "+" : ""}₹{financialStatus.netProfit.toFixed(0)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {isOverThreshold && (
                                <Alert className={financialStatus.isProfitable ? "border-success bg-success/10" : "border-warning bg-warning/10"}>
                                  <AlertTriangle className={`w-4 h-4 ${financialStatus.isProfitable ? "text-success" : "text-warning"}`} />
                                  <AlertDescription className="text-sm text-foreground">
                                    You're {Math.round(financialStatus.redistributableQty)} {product.unit} over your set threshold. 
                                    Redistributing can prevent spoilage and will result in a{" "}
                                    <span className={financialStatus.isProfitable ? "text-success font-semibold" : "text-destructive font-semibold"}>
                                      ₹{Math.abs(financialStatus.netProfit).toFixed(0)} {financialStatus.isProfitable ? "gain" : "loss"}
                                    </span>. Proceed?
                                  </AlertDescription>
                                </Alert>
                              )}

                              <Button 
                                className="w-full" 
                                size="lg"
                                disabled={!product.eligible_for_redistribution || financialStatus.redistributableQty === 0}
                                variant={product.eligible_for_redistribution && financialStatus.redistributableQty > 0 ? "default" : "secondary"}
                                onClick={() => setRedistributeDialog({ open: true, product })}
                              >
                                <TrendingUp className="w-4 h-4 mr-2" />
                                {!product.eligible_for_redistribution ? "Not Eligible for Redistribution" : 
                                 financialStatus.redistributableQty === 0 ? "No Excess Stock to Redistribute" :
                                 "Redistribute Now"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Combined Inventory (All Kiosks)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Total Quantity</TableHead>
                    <TableHead>Kiosk Distribution</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts?.map((product) => {
                    const supplyStatus = getSupplyStatus(product);
                    const kioskData = kioskInventoryMap?.[product.id] || [];
                    const isOverstock = (product.supply_level || 0) > 100;
                    const lastUpdate = new Date(product.updated_at).toLocaleDateString("en-US", {
                      month: "numeric",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-semibold">{product.name}</TableCell>
                        <TableCell>
                          {product.quantity} {product.unit}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {kioskData.map((kiosk, idx) => (
                              <div key={idx}>
                                <span className="font-medium">{kiosk.kiosk_code}:</span> {kiosk.quantity} {product.unit}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isOverstock ? (
                              <TrendingUp className="w-4 h-4 text-destructive" />
                            ) : (
                              <Minus className="w-4 h-4 text-warning" />
                            )}
                            <Badge
                              variant={isOverstock ? "destructive" : "secondary"}
                              className={!isOverstock ? "border-warning text-warning bg-warning/10" : ""}
                            >
                              {isOverstock ? "High Depletion" : "Medium Depletion"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{lastUpdate}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={isOverstock ? "default" : "outline"}
                            disabled={!isOverstock}
                            onClick={() => isOverstock && setRedistributeDialog({ open: true, product })}
                          >
                            {isOverstock ? "Redistribute" : "No Action"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Redistribution Dialog */}
      {redistributeDialog.product && (
        <RedistributeDialog
          open={redistributeDialog.open}
          onOpenChange={(open) => setRedistributeDialog({ open, product: null })}
          product={{
            id: redistributeDialog.product.id,
            name: redistributeDialog.product.name,
            unit: redistributeDialog.product.unit,
          }}
          currentStock={redistributeDialog.product.quantity}
          threshold={redistributeDialog.product.under_supply_limit}
        />
      )}
    </div>
  );
}
