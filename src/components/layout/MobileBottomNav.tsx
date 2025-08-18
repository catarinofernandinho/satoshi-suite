import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  TrendingUp, 
  BarChart3, 
  Calculator 
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const navigationItems = [
    { href: "/", label: "Portfólio", icon: Briefcase },
    { href: "/futures", label: "Futuros", icon: TrendingUp },
    { href: "/charts", label: "Gráficos", icon: BarChart3 },
    { href: "/conversor", label: "Conversor", icon: Calculator },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50 md:hidden">
      <div className="grid grid-cols-4 gap-1 p-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.href)}
              className={`flex flex-col gap-1 h-auto py-2 px-1 ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}