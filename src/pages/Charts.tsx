import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FearGreedIndexImage from "@/components/charts/FearGreedIndexImage";
import FearGreedIndexHistory from "@/components/charts/FearGreedIndexHistory";
import FearGreedIndexExplanation from "@/components/charts/FearGreedIndexExplanation";
import BitcoinPriceChart from "@/components/charts/BitcoinPriceChart";
import TradingViewChart from "@/components/charts/TradingViewChart";
import CurrencyConverter from "@/components/conversor/CurrencyConverter";
import { TrendingUp, Activity, BarChart3, Calculator, PieChart, LineChart } from "lucide-react";
import MiniPanelsCounterflow from "@/components/charts/MiniPanelsCounterflow";
import CounterflowIframePanel from "@/components/charts/CounterflowIframePanel";

export default function Charts() {
  return <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gráficos & Análises</h1>
        
      </div>

      {/* Tabs for different chart sections */}
      
      <Tabs defaultValue="price" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="price" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Preço
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="flex items-center gap-2">
            <Activity className="h-4 w-4" /> Sentimento
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Análise Avançada
          </TabsTrigger>
          <TabsTrigger value="dca" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" /> Calculadora DCA
          </TabsTrigger>
          <TabsTrigger value="retirement" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" /> Aposentadoria
          </TabsTrigger>
          <TabsTrigger value="etf" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" /> Rastreador ETF
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

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
  <CounterflowIframePanel
    url="https://bitcoincounterflow.com/pt/satsails-2/mini-paineis-iframe/"
    title="Mini Painéis Bitcoin Counterflow"
    height={4500}
  />
</TabsContent>

<TabsContent value="dca" className="space-y-6">
  <CounterflowIframePanel
    url="https://bitcoincounterflow.com/pt/satsails-2/calculadora-dca-iframe/"
    title="Calculadora DCA Bitcoin Counterflow"
    height={2500}
  />
</TabsContent>
<TabsContent value="retirement" className="space-y-6">
  <CounterflowIframePanel
    url="https://bitcoincounterflow.com/pt/satsails-2/calculadora-de-aposentadoria-bitcoin-iframe/"
    title="Calculadora de aposentadoria Bitcoin Counterflow"
    height={3000}
  />
</TabsContent>
<TabsContent value="etf" className="space-y-6">
  <CounterflowIframePanel
    url="https://bitcoincounterflow.com/pt/satsails-2/etf-tracker-btc-iframe"
    title="Rastreador ETF Bitcoin Counterflow"
    height={4800}
  />
</TabsContent>

      </Tabs>
    </div>;
}