import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, User, Package, Bell, Shield, FileText } from "lucide-react";
import { useState } from "react";

const settingsCategories = [
  { id: "general", label: "General", icon: User },
  { id: "inventory", label: "Inventory Preferences", icon: Package },
  { id: "notifications", label: "Notifications & Alerts", icon: Bell },
  { id: "security", label: "Access & Security", icon: Shield },
  { id: "reports", label: "Reports & Data Exports", icon: FileText },
];

export default function Settings() {
  const [activeCategory, setActiveCategory] = useState("general");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your kiosk preferences, alerts, thresholds, and notifications.</p>
      </div>

      <div className="flex items-center justify-end">
        <div className="text-sm text-muted-foreground">
          <User className="w-4 h-4 inline mr-2" />
          Logged in as: <span className="font-semibold text-foreground">Branch Manager</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <nav className="space-y-1">
              {settingsCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeCategory === category.id
                      ? "bg-accent text-accent-foreground font-medium"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <category.icon className="w-5 h-5" />
                  <span>{category.label}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input id="branchName" defaultValue="Downtown Store" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" defaultValue="Mumbai Central, MH 400008" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input id="email" type="email" defaultValue="manager@akta.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" defaultValue="+91 98765 43210" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select defaultValue="manager">
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="bg-accent hover:bg-accent/90">
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
