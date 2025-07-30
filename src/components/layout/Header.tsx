import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bitcoin, Settings, Globe, LogOut, User, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import UserSettingsModal from "@/components/settings/UserSettingsModal";
import { useUserSettings } from "@/hooks/useUserSettings";
import AuthModal from "@/components/auth/AuthModal";
import UserDropdown from "@/components/auth/UserDropdown";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  currentCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

export default function Header({ currentCurrency, onCurrencyChange }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { settings, updateSettings } = useUserSettings();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            <div className="p-2 bg-gradient-bitcoin rounded-lg shadow-bitcoin">
              <Bitcoin className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Satoshi 10x</h1>
              <p className="text-sm text-muted-foreground">Portfolio & Trading Platform</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
              <a href="/futures">Futuros</a>
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
              <a href="/charts">Gráficos</a>
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
              <a href="/conversor">Conversor</a>
            </Button>
          </nav>

          {/* Currency Selector & Settings */}
          <div className="flex items-center gap-3">
            <Select value={currentCurrency} onValueChange={onCurrencyChange}>
              <SelectTrigger className="w-20 h-9 border-border bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="BRL">BRL</SelectItem>
                <SelectItem value="BTC">BTC</SelectItem>
                <SelectItem value="SATS">SATS</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Globe className="h-4 w-4" />
            </Button>
            
            <UserSettingsModal />

            {/* Auth Section */}
            {user ? (
              <div className="flex items-center gap-2">
                <UserDropdown />
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setIsAuthModalOpen(true)}
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Entrar
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </header>
  );
}