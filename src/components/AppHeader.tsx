import { Code2, ArrowLeft, LogOut, TrendingUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AppHeaderProps {
  subtitle?: string;
}

export const AppHeader = ({ subtitle }: AppHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isHome = location.pathname === "/" || location.pathname === "/home";

  return (
    <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {!isHome && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Code2 className="w-4.5 h-4.5 text-primary" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              Code<span className="text-primary">Guru</span>
              {subtitle && (
                <span className="text-xs text-muted-foreground ml-2 font-normal">{subtitle}</span>
              )}
            </h1>
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {user ? (
            <>
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1.5" onClick={() => navigate("/progress")}>
                <TrendingUp className="w-3.5 h-3.5" />
                Progress
              </Button>
              <span className="text-muted-foreground hidden sm:inline">{user.email}</span>
              <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={async () => {
                await signOut();
                toast.success("Signed out successfully");
                navigate("/auth");
              }}>
                <LogOut className="w-3 h-3" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => navigate("/auth")}>
              <User className="w-3 h-3 mr-1" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
