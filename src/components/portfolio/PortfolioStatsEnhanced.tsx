import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Bitcoin } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface PortfolioStatsEnhancedProps {
  btcPrice: number;
  btcPriceChange: number;
  totalValue: number;
  totalBtc: number;
  totalCost: number;
  totalRevenue: number;
  totalGainLoss: number;
  currency: string;
}

const PortfolioStatsEnhanced = memo(function PortfolioStatsEnhanced({
  btcPrice,
  btcPriceChange,
  totalValue,
  totalBtc,
  totalCost,
  totalRevenue,
  totalGainLoss,
  currency
}: PortfolioStatsEnhancedProps) {
  const { formatNumber, formatCurrency } = useCurrency();
  
  // Create a safe formatting function that doesn't double-convert
  const formatSafeValue = (amount: number) => {
    // Values from calculatePortfolioStats are already in correct currency, just format
    return formatCurrency(amount, true); // skipConversion = true
  };
  
  // Use imported utility function for formatting

  // Calculate net liquid average cost
  const netCost = totalCost - totalRevenue;
  const liquidAverageCost = totalBtc > 0 ? netCost / totalBtc : 0;
  const isNegativeCost = liquidAverageCost < 0;

  const tooltipText = `Fórmula de Custo Líquido Médio:
Custo líquido médio = (Custo total - Receitas totais) / Ativos.
  Caso o custo líquido médio seja negativo, as receitas são superiores ao custo (incluindo taxas) combinado.`;

  return (
    <div className="space-y-4">
      {/* Bitcoin Price Row */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-bitcoin rounded-lg shadow-bitcoin">
              <Bitcoin className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Bitcoin BTC</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(btcPrice, true)}
                </span>
                <Badge 
                  variant="outline" 
                  className={btcPriceChange >= 0 
                  ? "bg-success/20 text-success border-success/30" 
                  : "bg-destructive/20 text-destructive border-destructive/30"
                }
              >
                {btcPriceChange >= 0 ? "+" : ""}{formatNumber(btcPriceChange)}%
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

      {/* Statistics Row */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <Card className="bg-gradient-card border-border">
        <CardContent className="pt-4">
          <div className="text-xs text-muted-foreground mb-1">Valor dos Ativos</div>
          <div className="text-lg font-bold text-foreground">
            {formatSafeValue(totalValue)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border">
        <CardContent className="pt-4">
          <div className="text-xs text-muted-foreground mb-1">Ativos</div>
          <div className="text-lg font-bold text-foreground">
            {totalBtc.toFixed(8)} BTC
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border">
        <CardContent className="pt-4">
          <div className="text-xs text-muted-foreground mb-1">Custo Total</div>
          <div className="text-lg font-bold text-foreground">
            {formatSafeValue(totalCost)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border">
        <CardContent className="pt-4">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs text-muted-foreground">Custo Líquido Médio</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="whitespace-pre-line text-sm">{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-lg font-bold text-foreground">
            {formatSafeValue(totalBtc > 0 ? liquidAverageCost : 0)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border">
        <CardContent className="pt-4">
          <div className="text-xs text-muted-foreground mb-1">Total de Ganhos/Perdas</div>
          <div className={`text-lg font-bold ${
            totalGainLoss >= 0 ? "text-success" : "text-destructive"
          }`}>
          {formatSafeValue(totalGainLoss)}
        </div>
      </CardContent>
    </Card>
  </div>
</div>
);
});

export default PortfolioStatsEnhanced;