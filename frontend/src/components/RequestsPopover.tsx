import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Send, TrendingDown, ExternalLink, CheckCircle2, XCircle, Package, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export function RequestsPopover() {
  const { kioskId, userRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = userRole === "admin";

  // Kiosk-specific requests
  const { data: kioskRequests } = useQuery({
    queryKey: ["kiosk-requests-notifications", kioskId],
    enabled: !!kioskId && !isAdmin,
    refetchInterval: 30000,
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
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Admin - all requests
  const { data: allRequests } = useQuery({
    queryKey: ["admin-requests-notifications"],
    enabled: isAdmin,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("redistributions")
        .select(`
          *,
          products (name),
          from_kiosk:from_kiosk_id (name, kiosk_code),
          to_kiosk:to_kiosk_id (name, kiosk_code)
        `)
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) throw error;
      return data;
    },
  });

  const requests = isAdmin ? allRequests : kioskRequests;
  const pendingRequests = requests?.filter(r => r.status === "pending") || [];
  const otherRequests = requests?.filter(r => r.status !== "pending") || [];

  const approveRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("redistributions")
        .update({ status: "approved", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Request approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["kiosk-requests-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-requests-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["kiosk-redistributions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-redistributions"] });
      queryClient.invalidateQueries({ queryKey: ["redistribution-stats"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve request", variant: "destructive" });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("redistributions")
        .update({ status: "rejected" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Request rejected" });
      queryClient.invalidateQueries({ queryKey: ["kiosk-requests-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-requests-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["kiosk-redistributions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-redistributions"] });
      queryClient.invalidateQueries({ queryKey: ["redistribution-stats"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject request", variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-success/30 text-success";
      case "rejected": return "bg-destructive/30 text-destructive";
      default: return "bg-warning/30 text-warning";
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority?.includes("High")) return "bg-destructive text-destructive-foreground";
    if (priority?.includes("Medium")) return "bg-warning text-warning-foreground";
    return "bg-success text-success-foreground";
  };

  const handleViewAll = () => {
    navigate(isAdmin ? "/alerts" : "/kiosk/requests");
  };

  const renderRequestCard = (request: any) => {
    const isReceiving = request.to_kiosk_id === kioskId;
    const isPending = request.status === "pending";

    return (
      <div
        key={request.id}
        className="p-3 mb-2 rounded-lg border hover:bg-accent/20 transition-all hover:shadow-md"
      >
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isPending ? "bg-warning/10" : 
            request.status === "approved" ? "bg-success/10" : "bg-destructive/10"
          }`}>
            {isPending ? (
              <AlertCircle className="w-4 h-4 text-warning" />
            ) : request.status === "approved" ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-semibold text-sm text-foreground truncate">
                {request.products?.name}
              </p>
              <Badge className={`${getStatusColor(request.status)} text-xs flex-shrink-0`}>
                {request.status}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground mb-1.5">
              {request.quantity} {request.unit}
            </p>

            {isAdmin && (
              <div className="text-xs text-muted-foreground mb-1.5">
                <span className="font-medium">From:</span> {request.from_kiosk?.kiosk_code || "N/A"} 
                <span className="mx-1">→</span>
                <span className="font-medium">To:</span> {request.to_kiosk?.kiosk_code || "N/A"}
              </div>
            )}
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getPriorityColor(request.priority)} variant="outline">
                {request.priority}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(request.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {request.reason && (
          <p className="text-xs text-muted-foreground mt-2 pl-11 line-clamp-2">
            <span className="font-medium">Reason:</span> {request.reason}
          </p>
        )}

        {isPending && (
          <div className="flex gap-2 mt-3 pl-11">
            <Button
              size="sm"
              className="h-7 text-xs bg-success hover:bg-success/90 flex-1"
              onClick={(e) => {
                e.stopPropagation();
                approveRequestMutation.mutate(request.id);
              }}
              disabled={approveRequestMutation.isPending}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs flex-1"
              onClick={(e) => {
                e.stopPropagation();
                rejectRequestMutation.mutate(request.id);
              }}
              disabled={rejectRequestMutation.isPending}
            >
              <XCircle className="w-3 h-3 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2.5 hover:bg-accent/40 rounded-xl transition-all duration-300 hover:scale-110 group">
          <Bell className="w-5 h-5 text-foreground/80 group-hover:text-primary transition-colors" />
          {pendingRequests.length > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs shadow-md animate-pulse">
              {pendingRequests.length}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4" />
              {isAdmin ? "All Alerts" : "My Alerts"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingRequests.length} pending, {otherRequests.length} recent
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={handleViewAll}
          >
            View All
            <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full rounded-none border-b bg-transparent h-10">
            <TabsTrigger value="pending" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Pending
              {pendingRequests.length > 0 && (
                <Badge className="ml-2 bg-destructive text-destructive-foreground">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Recent
              {otherRequests.length > 0 && (
                <Badge className="ml-2" variant="secondary">{otherRequests.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="m-0">
            <ScrollArea className="h-[450px]">
              {pendingRequests.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 px-4">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs mt-1">No pending requests at the moment</p>
                </div>
              ) : (
                <div className="p-3">
                  {pendingRequests.map(renderRequestCard)}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="recent" className="m-0">
            <ScrollArea className="h-[450px]">
              {otherRequests.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 px-4">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No recent activity</p>
                  <p className="text-xs mt-1">Recent approved/rejected requests will appear here</p>
                </div>
              ) : (
                <div className="p-3">
                  {otherRequests.map(renderRequestCard)}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
