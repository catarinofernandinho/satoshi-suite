import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Trophy, AlertTriangle, Percent } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface FuturesStatsEnhancedProps {
  stats: {
    totalProfitSats: number;
    totalFeesSats: number;
    netProfitSats: number;
    totalOrders: number;
    winningOrders: number;
    losingOrders: number;
    winRate: number;
  };
}

export default function FuturesStatsEnhanced({ stats }: FuturesStatsEnhancedProps) {
  const { currency, formatNumber } = useCurrency();
  
  const formatSats = (value: number) => {
    return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US').format(Math.round(value));
  };

  const formatPercent = (value: number) => {
    return `${formatNumber(value)}%`;
  };

  const statCards = [
    {
      title: "Lucro total (satoshis)",
      value: formatSats(stats.totalProfitSats),
      icon: DollarSign,
      bgColor: "bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/30",
      textColor: "text-primary",
      iconColor: "text-primary"
    },
    {
      title: "Total de taxas (satoshis)", 
      value: formatSats(stats.totalFeesSats),
      icon: BarChart3,
      bgColor: "bg-gradient-to-br from-bitcoin/10 to-bitcoin/20 border border-bitcoin/30",
      textColor: "text-bitcoin",
      iconColor: "text-bitcoin"
    },
    {
      title: "Lucro líquido (satoshis)",
      value: formatSats(stats.netProfitSats),
      icon: stats.netProfitSats >= 0 ? TrendingUp : TrendingDown,
      bgColor: stats.netProfitSats >= 0 
        ? "bg-gradient-to-br from-success/10 to-success/20 border border-success/30"
        : "bg-gradient-to-br from-destructive/10 to-destructive/20 border border-destructive/30",
      textColor: stats.netProfitSats >= 0 ? "text-success" : "text-destructive",
      iconColor: stats.netProfitSats >= 0 ? "text-success" : "text-destructive"
    },
    {
      title: "Total de Ordens",
      value: stats.totalOrders.toString(),
      icon: Target,
      bgColor: "bg-gradient-to-br from-secondary/10 to-secondary/20 border border-secondary/30",
      textColor: "text-secondary-foreground",
      iconColor: "text-secondary-foreground"
    },
    {
      title: "Ganhos",
      value: stats.winningOrders.toString(),
      icon: Trophy,
      bgColor: "bg-gradient-to-br from-success/10 to-success/20 border border-success/30",
      textColor: "text-success",
      iconColor: "text-success"
    },
    {
      title: "Perdas",
      value: stats.losingOrders.toString(),
      icon: AlertTriangle,
      bgColor: "bg-gradient-to-br from-destructive/10 to-destructive/20 border border-destructive/30",
      textColor: "text-destructive",
      iconColor: "text-destructive"
    },
    {
      title: "Aproveitamento",
      value: formatPercent(stats.winRate),
      icon: Percent,
      bgColor: "bg-gradient-to-br from-accent/10 to-accent/20 border border-accent/30",
      textColor: "text-accent-foreground",
      iconColor: "text-accent-foreground"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        
        return (
          <Card key={index} className={`${stat.bgColor} hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-md`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className={`text-sm font-medium ${stat.textColor}`}>
                {stat.title}
              </CardTitle>
              <div className="p-2 rounded-lg bg-background/10">
                <IconComponent className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className={`text-2xl font-bold ${stat.textColor} tracking-tight`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}