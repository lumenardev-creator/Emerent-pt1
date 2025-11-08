import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight, Package, TrendingDown, TrendingUp } from "lucide-react";

export default function KioskTransactions() {
  const transactions = [
    {
      id: '#TXN001',
      type: 'Received',
      product: 'Organic Apples',
      quantity: '25 kg',
      from: 'Mall Central Kiosk',
      date: '1/15/2024, 8:00:00 PM',
      status: 'completed'
    },
    {
      id: '#TXN002',
      type: 'Sent',
      product: 'Greek Yogurt',
      quantity: '40 containers',
      to: 'Airport Terminal Kiosk',
      date: '1/14/2024, 10:15:00 PM',
      status: 'completed'
    },
    {
      id: '#TXN003',
      type: 'Received',
      product: 'Baby Spinach',
      quantity: '15 bags',
      from: 'Downtown Plaza Kiosk',
      date: '1/13/2024, 4:50:00 PM',
      status: 'completed'
    },
    {
      id: '#TXN004',
      type: 'Sent',
      product: 'Whole Wheat Bread',
      quantity: '20 loaves',
      to: 'Mall Central Kiosk',
      date: '1/12/2024, 2:45:00 PM',
      status: 'completed'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Transaction History</h1>
        <p className="text-muted-foreground">Complete history of all redistribution activities for your kiosk</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold text-foreground">4</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Items Received</p>
                <p className="text-2xl font-bold text-foreground">2</p>
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
                <p className="text-sm text-muted-foreground">Items Sent</p>
                <p className="text-2xl font-bold text-foreground">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Transaction Log</CardTitle>
          <p className="text-sm text-muted-foreground">Detailed history of all your redistribution transactions</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border border-border/40 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      transaction.type === 'Received' 
                        ? 'bg-success/10' 
                        : 'bg-warning/10'
                    }`}>
                      {transaction.type === 'Received' ? (
                        <ArrowDownLeft className="w-5 h-5 text-success" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{transaction.type}</p>
                      <p className="text-sm text-muted-foreground">{transaction.id}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-success/20 text-success">
                    {transaction.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-foreground">{transaction.product}</span>
                    <span className="text-muted-foreground">Date & Time</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantity: {transaction.quantity}</span>
                    <span className="text-muted-foreground">{transaction.date}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/40">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">
                      {transaction.type === 'Received' ? 'From' : 'To'}:
                    </span>{' '}
                    {transaction.type === 'Received' ? transaction.from : transaction.to}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
