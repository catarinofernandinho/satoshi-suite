import { useState, useEffect } from "react";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bitcoin, 
  Settings, 
  LogOut, 
  User, 
  Menu, 
  TrendingUp, 
  BarChart3, 
  Calculator,
  Home
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUserSettings } from "@/hooks/useUserSettings";
import UserSettingsModal from "@/components/settings/UserSettingsModal";

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { settings, updateSettings } = useUserSettings();
  const location = useLocation();

  // Theme management
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('user-theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = savedTheme || settings?.theme === 'system' ? systemTheme : (settings?.theme as 'light' | 'dark') || 'light';
    
    setCurrentTheme(theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [settings?.theme]);

  const handleCurrencyChange = async (currency: string) => {
    if (settings && currency !== settings.preferred_currency) {
      try {
        await updateSettings({ preferred_currency: currency as 'USD' | 'BRL' });
      } catch (error) {
        console.error('Error updating currency:', error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout.",
        variant: "destructive"
      });
    }
  };

  const navigationItems = [
    { href: "/", label: "Portfolio", icon: Home },
    { href: "/futures", label: "Futuros", icon: TrendingUp },
    { href: "/charts", label: "Gráficos", icon: BarChart3 },
    { href: "/conversor", label: "Conversor", icon: Calculator },
  ];

  const NavLink = ({ href, label, icon: Icon, mobile = false }: { 
    href: string; 
    label: string; 
    icon: any; 
    mobile?: boolean 
  }) => (
    <Button
      variant={location.pathname === href ? "default" : "ghost"}
      className={`${mobile ? 'w-full justify-start' : ''} text-foreground`}
      asChild
      onClick={() => mobile && setIsMobileMenuOpen(false)}
    >
      <a href={href} className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </a>
    </Button>
  );

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-bitcoin rounded-lg shadow-bitcoin">
                <Bitcoin className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-foreground">Bitcoin SaaS</h1>
                <p className="text-sm text-muted-foreground">Portfolio & Trading Platform</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              {navigationItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Currency Selector */}
              <Select 
                value={settings?.preferred_currency || 'USD'} 
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger className="w-20 h-9 border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="BRL">BRL</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Settings */}
              <UserSettingsModal />

              {/* User Menu - Desktop */}
              <div className="hidden sm:flex items-center gap-2 border-l border-border pl-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="max-w-24 truncate">{user?.email}</span>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Menu Trigger */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col h-full">
                    {/* Mobile Header */}
                    <div className="flex items-center gap-3 pb-6 border-b">
                      <div className="p-2 bg-gradient-bitcoin rounded-lg shadow-bitcoin">
                        <Bitcoin className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="font-bold">Bitcoin SaaS</h2>
                        <p className="text-sm text-muted-foreground">Menu</p>
                      </div>
                    </div>

                    {/* Mobile Navigation */}
                    <nav className="flex flex-col gap-2 py-6">
                      {navigationItems.map((item) => (
                        <NavLink key={item.href} {...item} mobile />
                      ))}
                    </nav>

                    {/* Mobile User Info */}
                    <div className="mt-auto pt-6 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <User className="h-4 w-4" />
                        <span className="truncate">{user?.email}</span>
                      </div>
                      <Button
                        onClick={handleSignOut}
                        variant="outline"
                        className="w-full"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}