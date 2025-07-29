import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FearGreedIndexImage from "@/components/charts/FearGreedIndexImage";
import FearGreedIndexHistory from "@/components/charts/FearGreedIndexHistory";
import FearGreedIndexExplanation from "@/components/charts/FearGreedIndexHistory";
import LiquidationHeatmap from "@/components/charts/LiquidationHeatmap";
import BitcoinPriceChart from "@/components/charts/BitcoinPriceChart";
import TradingViewChart from "@/components/charts/TradingViewChart";
import CurrencyConverter from "@/components/conversor/CurrencyConverter";
import { BarChart3, TrendingUp, Calculator, Activity } from "lucide-react";
export default function Charts() {
  return <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gráficos & Análises</h1>
        
      </div>

      {/* Tabs for different chart sections */}
      <Tabs defaultValue="price" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="price" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Preço
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Sentimento
          </TabsTrigger>
          <TabsTrigger value="liquidations" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Liquidações
          </TabsTrigger>
        </TabsList>

        {/* Price Chart Tab */}
        <TabsContent value="price" className="space-y-6">
          <BitcoinPriceChart />
        </TabsContent>

        {/* Sentiment Analysis Tab */}
        <TabsContent value="sentiment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FearGreedIndexImage />
            <FearGreedIndexHistory />
          </div>
          <FearGreedIndexExplanation />
        </TabsContent>

        {/* Liquidations Tab */}
        <TabsContent value="liquidations" className="space-y-6">
          <LiquidationHeatmap />
        </TabsContent>
      </Tabs>
    </div>;
}