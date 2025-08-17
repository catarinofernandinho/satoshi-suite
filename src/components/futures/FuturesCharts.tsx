import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface FuturesChartsProps {
  monthlyData: Array<{
    month: string;
    profit: number;
  }>;
  waterfallData: {
    totalProfit: number;
    totalFees: number;
    netProfit: number;
  };
}

export default function FuturesCharts({ monthlyData, waterfallData }: FuturesChartsProps) {
  const formatSats = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(value));
  };

  const waterfallChartData = [
    {
      name: "Lucro Total",
      value: waterfallData.totalProfit,
      fill: "#f59e0b"
    },
    {
      name: "Taxas",
      value: -waterfallData.totalFees,
      fill: "#6b7280"
    },
    {
      name: "Lucro Líquido",
      value: waterfallData.netProfit,
      fill: "#f59e0b"
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            <span className="text-muted-foreground">Valor: </span>
            <span className="font-semibold">{formatSats(Math.abs(payload[0].value))} sats</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Monthly Profit Chart */}
      <Card className="card-shadow border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-lg bg-accent/20">
              📊
            </div>
            Lucro Total por Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => formatSats(value)}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="hsl(var(--accent))" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Waterfall Chart */}
      <Card className="card-shadow border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 rounded-lg bg-primary/20">
              💰
            </div>
            Gráfico de Lucro Líquido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={waterfallChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => formatSats(value)}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {waterfallChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.name === "Lucro Total" ? "hsl(var(--success))" :
                      entry.name === "Taxas" ? "hsl(var(--destructive))" :
                      "hsl(var(--primary))"
                    } 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          {/* Enhanced Labels */}
          <div className="grid grid-cols-3 gap-4 mt-6 px-4">
            <div className="text-center p-3 rounded-lg bg-success/10 border border-success/20">
              <div className="text-sm font-medium text-success mb-1">
                Lucro Total
              </div>
              <div className="text-lg font-bold text-success">
                {formatSats(waterfallData.totalProfit)}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="text-sm font-medium text-destructive mb-1">
                Taxas
              </div>
              <div className="text-lg font-bold text-destructive">
                -{formatSats(waterfallData.totalFees)}
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="text-sm font-medium text-primary mb-1">
                Lucro Líquido
              </div>
              <div className="text-lg font-bold text-primary">
                {formatSats(waterfallData.netProfit)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}