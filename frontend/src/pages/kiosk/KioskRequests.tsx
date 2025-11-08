import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Send, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

export default function KioskRequests() {
  const { kioskId } = useAuth();

  const { data: requests, isLoading } = useQuery({
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-success/30 text-success";
      case "rejected": return "bg-destructive/30 text-destructive";
      default: return "bg-warning/30 text-warning";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">My Requests</h1>
        <p className="text-muted-foreground">Track your redistribution requests and their status</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Request History</CardTitle>
          <p className="text-sm text-muted-foreground">All redistribution requests submitted by your kiosk</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading requests...</div>
          ) : requests?.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No requests found</div>
          ) : (
            <div className="space-y-4">
              {requests?.map((request: any) => {
                const isReceiving = request.to_kiosk_id === kioskId;
                return (
                  <div key={request.id} className="border border-border/40 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isReceiving ? "bg-success/10" : "bg-warning/10"
                        }`}>
                          {isReceiving ? (
                            <TrendingDown className="w-5 h-5 text-success" />
                          ) : (
                            <Send className="w-5 h-5 text-warning" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {isReceiving ? "Requesting Items" : "Sending Items"}
                          </p>
                          <p className="text-sm text-muted-foreground">#{request.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-foreground">{request.products?.name}</span>
                        <span className="text-muted-foreground">Created</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Quantity: {request.quantity} {request.unit}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(request.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <Badge variant="outline" className="text-xs">{request.priority}</Badge>
                      </div>
                    </div>

                    {request.reason && (
                      <div className="mt-4 pt-4 border-t border-border/40">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Reason:</span> {request.reason}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
