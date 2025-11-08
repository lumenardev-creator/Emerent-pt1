import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Package, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Alerts() {
  const queryClient = useQueryClient();

  const { data: redistributions, isLoading } = useQuery({
    queryKey: ["admin-redistributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("redistributions")
        .select(`
          *,
          products (name),
          from_kiosk:from_kiosk_id (name, kiosk_code),
          to_kiosk:to_kiosk_id (name, kiosk_code)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("redistributions")
        .update({ status: "approved", completed_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request approved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-redistributions"] });
      queryClient.invalidateQueries({ queryKey: ["redistribution-stats"] });
      queryClient.invalidateQueries({ queryKey: ["kiosk-requests-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["kiosk-redistributions"] });
    },
    onError: () => {
      toast.error("Failed to approve request");
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
      toast.success("Request rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-redistributions"] });
      queryClient.invalidateQueries({ queryKey: ["redistribution-stats"] });
      queryClient.invalidateQueries({ queryKey: ["kiosk-requests-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["kiosk-redistributions"] });
    },
    onError: () => {
      toast.error("Failed to reject request");
    },
  });

  const getPriorityColor = (priority: string) => {
    if (priority?.includes("High")) return "bg-destructive/10 text-destructive";
    if (priority?.includes("Medium")) return "bg-warning/10 text-warning";
    return "bg-muted";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-success/30 text-success";
      case "rejected": return "bg-destructive/30 text-destructive";
      default: return "bg-warning/30 text-warning";
    }
  };

  const pendingCount = redistributions?.filter(r => r.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Alerts & Notifications</h1>
        <p className="text-muted-foreground">Stay updated on surplus items, redistributions, and system updates</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Redistribution Requests
              {pendingCount > 0 && (
                <Badge className="bg-destructive">{pendingCount}</Badge>
              )}
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">Review and approve redistribution requests from all kiosks</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading requests...</div>
          ) : redistributions?.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No requests found</div>
          ) : (
            <div className="space-y-3">
              {redistributions?.map((request: any) => (
                <Card
                  key={request.id}
                  className="border-l-4 border-l-primary"
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold">
                              {request.from_kiosk_id ? "Send Request" : "Receive Request"}
                            </h3>
                            <Badge variant="secondary" className={getPriorityColor(request.priority)}>
                              {request.priority}
                            </Badge>
                            <Badge variant="secondary" className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">
                            <span className="font-medium">{request.products?.name}</span> - {request.quantity} {request.unit}
                          </p>
                          <p className="text-sm text-muted-foreground mb-2">
                            {request.from_kiosk_id ? (
                              <>From: {request.from_kiosk?.name} ({request.from_kiosk?.kiosk_code})</>
                            ) : (
                              <>To: {request.to_kiosk?.name} ({request.to_kiosk?.kiosk_code})</>
                            )}
                          </p>
                          {request.reason && (
                            <p className="text-xs text-muted-foreground mb-2">
                              <span className="font-medium">Reason:</span> {request.reason}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleString()} • ID: #{request.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>

                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-success hover:bg-success/90"
                            onClick={() => approveRequestMutation.mutate(request.id)}
                            disabled={approveRequestMutation.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => rejectRequestMutation.mutate(request.id)}
                            disabled={rejectRequestMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
