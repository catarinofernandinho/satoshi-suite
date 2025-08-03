import { lazy, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Activity, BarChart3, Calculator, PieChart, LineChart } from "lucide-react";

// Lazy load components for better performance
const FearGreedIndexImage = lazy(() => import("@/components/charts/FearGreedIndexImage"));
const FearGreedIndexHistory = lazy(() => import("@/components/charts/FearGreedIndexHistory"));
const FearGreedIndexExplanation = lazy(() => import("@/components/charts/FearGreedIndexExplanation"));
const BitcoinPriceChart = lazy(() => import("@/components/charts/BitcoinPriceChart"));
const CounterflowIframePanel = lazy(() => import("@/components/charts/CounterflowIframePanel"));

export default function Charts() {
  return <div className="w-full px-0 sm:px-2 md:px-4 lg:px-6 lg:container lg:mx-auto lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gráficos & Análises</h1>
        
      </div>

      {/* Tabs for different chart sections */}
      
      <Tabs defaultValue="price" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-1 gap-y-2 sm:grid-cols-3 sm:gap-2 sm:gap-y-3 lg:grid-cols-6 lg:gap-2 lg:gap-y-4 mb-6 sm:mb-8 lg:mb-9 p-1 sm:p-1 relative z-0">
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
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <BitcoinPriceChart />
          </Suspense>
        </TabsContent>

        {/* Sentiment Analysis Tab */}
        <TabsContent value="sentiment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <FearGreedIndexImage />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <FearGreedIndexHistory />
            </Suspense>
          </div>
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <FearGreedIndexExplanation />
          </Suspense>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <CounterflowIframePanel
              url="https://bitcoincounterflow.com/pt/satsails-2/mini-paineis-iframe/"
              title="Análise Avançada - Bitcoin Counterflow"
              height={4500}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="dca" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <CounterflowIframePanel
              url="https://bitcoincounterflow.com/pt/satsails-2/calculadora-dca-iframe/"
              title="Calculadora DCA - Bitcoin Counterflow"
              height={2500}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="retirement" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <CounterflowIframePanel
              url="https://bitcoincounterflow.com/pt/satsails-2/calculadora-de-aposentadoria-bitcoin-iframe/"
              title="Calculadora de Aposentadoria - Bitcoin Counterflow"
              height={3900}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="etf" className="space-y-6">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <CounterflowIframePanel
              url="https://bitcoincounterflow.com/pt/satsails-2/etf-tracker-btc-iframe"
              title="Rastreador ETF - Bitcoin Counterflow"
              height={4800}
            />
          </Suspense>
        </TabsContent>

      </Tabs>
    </div>;
}