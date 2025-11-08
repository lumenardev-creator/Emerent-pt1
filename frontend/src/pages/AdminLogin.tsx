import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import aktaLogo from "@/assets/akta-logo.jpeg";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email too long" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(100, { message: "Password too long" }),
});

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(validation.data.email, validation.data.password);

      if (error) {
        toast.error(error.message || "Invalid credentials");
      } else {
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero relative overflow-hidden">
      {/* Minimalist gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[140px]"></div>
      </div>

      <div className="w-full max-w-md mx-4 animate-fade-in-up">
        {/* Logo section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 mb-6 overflow-hidden rounded-2xl shadow-lg bg-white">
            <img src={aktaLogo} alt="AKTA Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-light text-foreground mb-2 tracking-tight">Admin Portal</h1>
          <p className="text-muted-foreground text-sm">Manage your inventory system</p>
        </div>

        {/* Login form card */}
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-lg border border-border/50 p-8 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@akta.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-medium" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/50 space-y-2 text-center">
            <p className="text-sm text-muted-foreground">
              Kiosk user?{" "}
              <Link to="/kiosk-login" className="text-primary font-medium hover:underline transition-all">
                Sign in here
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              Need demo users?{" "}
              <Link to="/demo-setup" className="text-primary font-medium hover:underline transition-all">
                Set up demo accounts
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-accent/30 backdrop-blur-sm rounded-xl border border-border/30 text-center">
          <p className="text-xs text-muted-foreground font-medium mb-1">Demo Credentials</p>
          <p className="text-xs text-foreground/80">admin@akta.com / admin123456</p>
        </div>
      </div>
    </div>
  );
}
