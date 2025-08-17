import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";

interface FuturesStatsProps {
  stats: {
    totalOpenPositions: number;
    totalClosedPositions: number;
    totalUnrealizedPL: number;
    totalRealizedPL: number;
    totalFeesUSD: number;
    totalPL: number;
  };
}

export default function FuturesStats({ stats }: FuturesStatsProps) {
  // Força uso de USD na página de futuros (não usa configuração de moeda do usuário)
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getColorClass = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="card-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Posições Abertas</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOpenPositions}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalClosedPositions} fechadas
          </p>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">P&L Não Realizado</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getColorClass(stats.totalUnrealizedPL)}`}>
            {formatCurrency(stats.totalUnrealizedPL)}
          </div>
          <p className="text-xs text-muted-foreground">
            Posições abertas
          </p>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">P&L Realizado</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getColorClass(stats.totalRealizedPL)}`}>
            {formatCurrency(stats.totalRealizedPL)}
          </div>
          <p className="text-xs text-muted-foreground">
            Posições fechadas
          </p>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">P&L Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getColorClass(stats.totalPL)}`}>
            {formatCurrency(stats.totalPL)}
          </div>
          <p className="text-xs text-muted-foreground">
            Taxas: {formatCurrency(stats.totalFeesUSD)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}