import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logo from "@/assets/akta-logo.jpeg";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin-login');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-soft">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-20 border-b border-border/30 bg-card/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-6 flex-1">
              <SidebarTrigger className="text-foreground hover:text-primary transition-all hover:scale-110" />
              <img src={logo} alt="ÄKTA Logo" className="h-10 w-10 object-contain rounded-xl hover-lift" />
              <div className="max-w-xl flex-1">
                <Input
                  type="search"
                  placeholder="Search inventory, SKUs, locations..."
                  className="w-full shadow-md"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              <button className="relative p-2.5 hover:bg-accent/40 rounded-xl transition-all duration-300 hover:scale-110 group">
                <Bell className="w-5 h-5 text-foreground/80 group-hover:text-primary transition-colors" />
                <Badge className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs shadow-md">
                  4
                </Badge>
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2.5 hover:bg-accent/40 rounded-xl transition-all duration-300 hover:scale-110">
                    <User className="w-5 h-5 text-foreground/80" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className="flex-1 p-8 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
