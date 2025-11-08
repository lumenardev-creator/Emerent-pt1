import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Store,
  TrendingUp,
  Receipt,
  Bell,
  Settings,
  LogOut,
  Package2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Kiosk Management", url: "/kiosk-management", icon: Store },
  { title: "Redistribution Management", url: "/redistribution", icon: TrendingUp },
  { title: "Transactions", url: "/transactions", icon: Receipt },
  { title: "Alerts", url: "/alerts", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-primary/20 text-primary font-bold shadow-glow border border-primary/30"
      : "hover:bg-white/5 text-sidebar-foreground/80 hover:text-sidebar-foreground border border-transparent";

  return (
    <Sidebar className="border-r border-sidebar-border/30 gradient-dark">
      <SidebarHeader className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg hover-lift">
            <Package2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">ÄKTA</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 text-xs font-bold px-4 mb-3 tracking-widest uppercase">
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5 px-3">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12 rounded-xl transition-all duration-300">
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-white/70 hover:text-white hover:bg-white/10 font-medium h-12 rounded-xl transition-all duration-300">
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
