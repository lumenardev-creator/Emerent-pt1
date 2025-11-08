import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Search, Copy, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          product:products(name),
          from_kiosk:kiosks!transactions_from_kiosk_id_fkey(name, kiosk_code),
          to_kiosk:kiosks!transactions_to_kiosk_id_fkey(name, kiosk_code),
          redistribution:redistributions(priority, reason)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load transactions");
        throw error;
      }

      return data;
    },
  });

  const filteredTransactions = transactions?.filter((tx) => {
    const matchesSearch = 
      tx.tx_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.from_kiosk?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.to_kiosk?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "pending":
        return "bg-warning text-warning-foreground";
      case "failed":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High Priority":
        return "bg-destructive text-destructive-foreground";
      case "Medium Priority":
        return "bg-warning text-warning-foreground";
      case "Low Priority":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Transaction History</h1>
        <p className="text-muted-foreground">Complete audit trail of all redistribution activities</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Transaction History
          </CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">TX ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">From → To</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Item & Quantity</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Priority</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Timestamp</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Value</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Blockchain Ref</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      Loading transactions...
                    </td>
                  </tr>
                ) : !filteredTransactions || filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {tx.tx_id.substring(0, 30)}...
                        </code>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <div className="font-medium">
                            {tx.from_kiosk?.kiosk_code || "Unknown"}
                          </div>
                          <div className="text-muted-foreground">↓</div>
                          <div className="font-medium">
                            {tx.to_kiosk?.kiosk_code || "Unknown"}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <div className="font-medium">{tx.product?.name || "Unknown"}</div>
                          <div className="text-muted-foreground">
                            {tx.quantity} {tx.unit}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {tx.redistribution?.priority ? (
                          <Badge className={getPriorityColor(tx.redistribution.priority)}>
                            {tx.redistribution.priority}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusColor(tx.status)}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {tx.value ? `$${tx.value}` : "-"}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {tx.blockchain_ref}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(tx.blockchain_ref)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
