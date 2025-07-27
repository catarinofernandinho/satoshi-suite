import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bitcoin, TrendingUp, Settings, Globe } from "lucide-react";

interface HeaderProps {
  currentCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

export default function Header({ currentCurrency, onCurrencyChange }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-bitcoin rounded-lg shadow-bitcoin">
              <Bitcoin className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Bitcoin SaaS</h1>
              <p className="text-sm text-muted-foreground">Portfolio & Trading Platform</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" className="text-foreground">
              Portfolio
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Futuros
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Gráficos
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Conversor
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
            
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}