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
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Lucro Total por Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => formatSats(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#f59e0b" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Waterfall Chart */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Gráfico de Lucro Líquido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={waterfallChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => formatSats(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {waterfallChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          {/* Labels on bars */}
          <div className="flex justify-between mt-4 px-8">
            <div className="text-center">
              <div className="text-sm font-medium text-orange-600">
                {formatSats(waterfallData.totalProfit)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600">
                -{formatSats(waterfallData.totalFees)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-orange-600">
                {formatSats(waterfallData.netProfit)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}