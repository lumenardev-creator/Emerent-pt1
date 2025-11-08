import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, Package, Loader2, XCircle, Link2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listRedistributions, approveRedistribution, getCommand, getTransaction } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Redistribution() {
  const queryClient = useQueryClient();
  const [selectedRedist, setSelectedRedist] = useState<any>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedForDetails, setSelectedForDetails] = useState<any>(null);

  // Fetch pending redistributions (poll every 5 seconds)
  const { data: redistributionsResponse, isLoading } = useQuery({
    queryKey: ["admin-redistributions"],
    queryFn: async () => {
      return listRedistributions({ status: "requested" });
    },
    refetchInterval: 5000,
  });

  // Also fetch approved/in-progress ones
  const { data: inProgressResponse } = useQuery({
    queryKey: ["admin-redistributions-progress"],
    queryFn: async () => {
      return listRedistributions({});
    },
    refetchInterval: 3000, // Poll more frequently for in-progress
  });

  const redistributions = redistributionsResponse?.items || [];
  const allRedistributions = inProgressResponse?.items || [];
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-warning/30 text-warning';
      case 'approved': return 'bg-blue-500/30 text-blue-500';
      case 'submitted': return 'bg-purple-500/30 text-purple-500';
      case 'fulfilled': return 'bg-green-500/30 text-green-500';
      case 'reconciled': return 'bg-emerald-500/30 text-emerald-500';
      case 'failed': return 'bg-destructive/30 text-destructive';
      default: return 'bg-secondary';
    }
  };

  // Get admin wallet address
  const { data: adminWallet } = useQuery({
    queryKey: ["admin-wallet"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("admins")
        .select("wallet_address")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data.wallet_address;
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (redistributionId: string) => {
      if (!adminWallet) throw new Error("Admin wallet not found");
      
      return approveRedistribution(
        redistributionId,
        adminWallet,
        `approve-${redistributionId}-${Date.now()}`
      );
    },
    onSuccess: () => {
      toast.success("Redistribution approved successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-redistributions"] });
      setApproveDialogOpen(false);
      setSelectedRedist(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve redistribution");
    },
  });

  const handleApprove = (redist: any) => {
    setSelectedRedist(redist);
    setApproveDialogOpen(true);
  };

  const confirmApprove = () => {
    if (selectedRedist) {
      approveMutation.mutate(selectedRedist.id);
    }
  };

  const handleViewDetails = (redist: any) => {
    setSelectedForDetails(redist);
    setDetailsDialogOpen(true);
  };

  // Get kiosk names
  const { data: kiosks } = useQuery({
    queryKey: ["all-kiosks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kiosks")
        .select("id, name");
      
      if (error) throw error;
      return data.reduce((acc: any, k: any) => {
        acc[k.id] = k.name;
        return acc;
      }, {});
    },
  });

  const getKioskName = (kioskId: string) => {
    return kiosks?.[kioskId] || kioskId.substring(0, 8);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-heading font-bold text-foreground mb-3">
          Redistribution Approvals
        </h1>
        <p className="text-muted-foreground text-lg">
          Review and approve inventory redistribution requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Requests</p>
                <p className="text-3xl font-bold">{redistributions.length}</p>
              </div>
              <Clock className="w-10 h-10 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Approved Today</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <Package className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : redistributions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No pending requests
            </div>
          ) : (
            <div className="space-y-4">
              {redistributions.map((redist: any) => (
                <div
                  key={redist.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Package className="w-10 h-10 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {getKioskName(redist.from_kiosk_id)} → {getKioskName(redist.to_kiosk_id)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {redist.items?.length || 0} item(s) • Created {new Date(redist.created_at).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Request ID: {redist.id.substring(0, 16)}...
                      </p>
                      {redist.items && redist.items.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Items: {redist.items.map((item: any) => `${item.sku} (${item.quantity})`).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-warning/30 text-warning capitalize">
                      {redist.status}
                    </Badge>
                    <Button
                      onClick={() => handleApprove(redist)}
                      disabled={approveMutation.isPending}
                      size="sm"
                    >
                      {approveMutation.isPending && selectedRedist?.id === redist.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Approve"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Redistributions with Status */}
      <Card>
        <CardHeader>
          <CardTitle>All Redistributions</CardTitle>
        </CardHeader>
        <CardContent>
          {allRedistributions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No redistributions found
            </div>
          ) : (
            <div className="space-y-4">
              {allRedistributions.map((redist: any) => (
                <div
                  key={redist.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Package className="w-10 h-10 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {getKioskName(redist.from_kiosk_id)} → {getKioskName(redist.to_kiosk_id)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {redist.items?.length || 0} item(s) • {new Date(redist.created_at).toLocaleString()}
                      </p>
                      {redist.txid && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Link2 className="w-3 h-3" />
                          TxID: {redist.txid.substring(0, 16)}...
                        </p>
                      )}
                      {redist.blockchain_ref && (
                        <a
                          href={`https://testnet.algoexplorer.io/tx/${redist.txid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline mt-1 inline-block"
                        >
                          View on AlgoExplorer →
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={getStatusColor(redist.status) + " capitalize"}>
                      {redist.status}
                    </Badge>
                    <Button
                      onClick={() => handleViewDetails(redist)}
                      size="sm"
                      variant="outline"
                    >
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Redistribution</DialogTitle>
            <DialogDescription>
              This will create a blockchain command for processing. The redistribution will be recorded on Algorand TestNet.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRedist && (
            <div className="space-y-3 py-4">
              <div>
                <p className="text-sm font-medium">From:</p>
                <p className="text-sm text-muted-foreground">{getKioskName(selectedRedist.from_kiosk_id)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">To:</p>
                <p className="text-sm text-muted-foreground">{getKioskName(selectedRedist.to_kiosk_id)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Items:</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRedist.items?.map((item: any) => `${item.sku}: ${item.quantity}`).join(", ")}
                </p>
              </div>
              {selectedRedist.pricing && (
                <div>
                  <p className="text-sm font-medium">Pricing:</p>
                  <p className="text-sm text-muted-foreground">
                    Total: ₹{selectedRedist.pricing.total_revenue?.toFixed(2) || "N/A"}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={approveMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={confirmApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Redistribution Details</DialogTitle>
          </DialogHeader>
          
          {selectedForDetails && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedForDetails.status) + " mt-1"}>
                    {selectedForDetails.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm mt-1">{new Date(selectedForDetails.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">From Kiosk</p>
                  <p className="text-sm mt-1">{getKioskName(selectedForDetails.from_kiosk_id)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">To Kiosk</p>
                  <p className="text-sm mt-1">{getKioskName(selectedForDetails.to_kiosk_id)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Items</p>
                <div className="bg-muted/50 rounded p-3">
                  {selectedForDetails.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm py-1">
                      <span>{item.sku}</span>
                      <span className="font-medium">{item.quantity} units</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedForDetails.pricing && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Pricing</p>
                  <div className="bg-muted/50 rounded p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Cost:</span>
                      <span>₹{selectedForDetails.pricing.total_cost?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Revenue:</span>
                      <span>₹{selectedForDetails.pricing.total_revenue?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>Net Value:</span>
                      <span>₹{selectedForDetails.pricing.net_value?.toFixed(2) || "0.00"}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedForDetails.blockchain_ref && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Blockchain</p>
                  <div className="bg-muted/50 rounded p-3 space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <p className="font-mono text-xs mt-1 break-all">{selectedForDetails.txid}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Blockchain Reference:</span>
                      <p className="font-mono text-xs mt-1">{selectedForDetails.blockchain_ref}</p>
                    </div>
                    {selectedForDetails.txid && !selectedForDetails.txid.startsWith('demo-') && (
                      <a
                        href={`https://testnet.algoexplorer.io/tx/${selectedForDetails.txid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm inline-flex items-center gap-1"
                      >
                        <Link2 className="w-3 h-3" />
                        View on AlgoExplorer
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground">Request ID</p>
                <p className="text-xs font-mono mt-1 text-muted-foreground">{selectedForDetails.id}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
