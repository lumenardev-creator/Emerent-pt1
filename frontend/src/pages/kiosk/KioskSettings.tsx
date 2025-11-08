import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function KioskSettings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your kiosk preferences and configurations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Kiosk Information</CardTitle>
          <p className="text-sm text-muted-foreground">Your kiosk details and current configuration</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Kiosk ID</p>
            <p className="text-lg font-semibold text-foreground">KIOSK001</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Kiosk Name</p>
            <p className="text-lg font-semibold text-foreground">Downtown Fresh Market</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
            <p className="text-lg font-semibold text-foreground">kiosk001@akta.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
