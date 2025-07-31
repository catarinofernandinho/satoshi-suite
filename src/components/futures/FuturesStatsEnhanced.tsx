import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Trophy, AlertTriangle, Percent } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface FuturesStatsEnhancedProps {
  stats: {
    totalProfitSats: number;
    totalFeesSats: number;
    netProfitSats: number;
    averageReturn: number;
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
      bgColor: "bg-gradient-to-br from-orange-500 to-orange-600",
      textColor: "text-white"
    },
    {
      title: "Total de taxas (satoshis)", 
      value: formatSats(stats.totalFeesSats),
      icon: BarChart3,
      bgColor: "bg-gradient-to-br from-gray-500 to-gray-600",
      textColor: "text-white"
    },
    {
      title: "Lucro líquido (satoshis)",
      value: formatSats(stats.netProfitSats),
      icon: TrendingUp,
      bgColor: "bg-gradient-to-br from-orange-500 to-orange-600",
      textColor: "text-white"
    },
    {
      title: "Rentabilidade média",
      value: formatPercent(stats.averageReturn),
      icon: Percent,
      bgColor: "bg-gradient-to-br from-cyan-500 to-cyan-600",
      textColor: "text-white"
    },
    {
      title: "Total de Ordens",
      value: stats.totalOrders.toString(),
      icon: Target,
      bgColor: "bg-gradient-to-br from-gray-800 to-gray-900",
      textColor: "text-white"
    },
    {
      title: "Ganhos",
      value: stats.winningOrders.toString(),
      icon: Trophy,
      bgColor: "bg-gradient-to-br from-green-500 to-green-600",
      textColor: "text-white"
    },
    {
      title: "Perdas",
      value: stats.losingOrders.toString(),
      icon: AlertTriangle,
      bgColor: "bg-gradient-to-br from-red-500 to-red-600",
      textColor: "text-white"
    },
    {
      title: "Aproveitamento",
      value: formatPercent(stats.winRate),
      icon: TrendingUp,
      bgColor: "bg-gradient-to-br from-cyan-500 to-cyan-600",
      textColor: "text-white"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        
        return (
          <Card key={index} className={`border-0 ${stat.bgColor} card-shadow hover:scale-105 transition-transform duration-200`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${stat.textColor}`}>
                {stat.title}
              </CardTitle>
              <IconComponent className={`h-4 w-4 ${stat.textColor} opacity-80`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.textColor}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}