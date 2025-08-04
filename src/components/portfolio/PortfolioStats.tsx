import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Bitcoin } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface PortfolioStatsProps {
  totalValue: number;
  btcPrice: number;
  btcPriceChange: number;
  btcHoldings: number;
  totalGainLoss: number;
  currency: string;
}

export default function PortfolioStats({
  totalValue,
  btcPrice,
  btcPriceChange,
  btcHoldings,
  totalGainLoss,
  currency
}: PortfolioStatsProps) {
  const { formatCurrency: formatCurrencyContext, formatNumber, exchangeRate } = useCurrency();
  
  const btcPriceConverted = btcPrice;
  
  const formatCurrency = (amount: number, curr: string) => {
    if (curr === "BTC") return `${amount.toFixed(8)} BTC`;
    if (curr === "SATS") return `${Math.floor(amount * 100000000)} sats`;
    return formatCurrencyContext(amount);
  };

  const isPositive = totalGainLoss >= 0;
  const isPriceUp = btcPriceChange >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* Total Portfolio Value */}
      <Card className="p-6 card-shadow bg-gradient-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totalValue, currency)}
            </p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Bitcoin className="h-6 w-6 text-primary" />
          </div>
        </div>
      </Card>

      {/* BTC Price */}
      <Card className="p-6 card-shadow bg-gradient-card">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Preço BTC</p>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(btcPrice, currency)}
          <div className={`flex items-center gap-1 mt-1 ${isPriceUp ? 'text-success' : 'text-error'}`}>
            {isPriceUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm font-medium">
              {isPriceUp ? '+' : ''}{formatNumber(btcPriceChange)}%
            </span>
          </div>
        </div>
      </Card>

      {/* BTC Holdings */}
      <Card className="p-6 card-shadow bg-gradient-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Bitcoin</p>
            <p className="text-2xl font-bold text-bitcoin">
              {btcHoldings.toFixed(8)} BTC
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {Math.floor(btcHoldings * 100000000)} sats
            </p>
          </div>
        </div>
      </Card>

      {/* Total Gain/Loss */}
      <Card className="p-6 card-shadow bg-gradient-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Ganho/Perda</p>
            <p className={`text-2xl font-bold ${isPositive ? 'text-success' : 'text-error'}`}>
              {isPositive ? '+' : ''}{formatCurrency(totalGainLoss, currency)}
            </p>
            <div className={`flex items-center gap-1 mt-1 ${isPositive ? 'text-success' : 'text-error'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {formatNumber((totalGainLoss / (totalValue - totalGainLoss)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}