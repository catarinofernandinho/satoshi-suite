import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FearGreedIndex from "@/components/charts/FearGreedIndex";
import LiquidationHeatmap from "@/components/charts/LiquidationHeatmap";
import BitcoinPriceChart from "@/components/charts/BitcoinPriceChart";
import CurrencyConverter from "@/components/conversor/CurrencyConverter";
import { BarChart3, TrendingUp, Calculator, Activity } from "lucide-react";

export default function Charts() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gráficos & Análises</h1>
        <p className="text-muted-foreground">
          Acompanhe o mercado Bitcoin com gráficos em tempo real e indicadores de sentimento
        </p>
      </div>

      {/* Tabs for different chart sections */}
      <Tabs defaultValue="price" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="converter" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Conversor
          </TabsTrigger>
        </TabsList>

        {/* Price Chart Tab */}
        <TabsContent value="price" className="space-y-6">
          <BitcoinPriceChart />
        </TabsContent>

        {/* Sentiment Analysis Tab */}
        <TabsContent value="sentiment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FearGreedIndex />
            <Card>
              <CardHeader>
                <CardTitle>Análise de Sentimento</CardTitle>
                <CardDescription>
                  Indicadores adicionais de mercado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Mais indicadores de sentimento serão adicionados em breve.</p>
                  <p className="text-sm mt-2">
                    Sugestões: RSI Bitcoin, Volume Trading, Social Sentiment
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Liquidations Tab */}
        <TabsContent value="liquidations" className="space-y-6">
          <LiquidationHeatmap />
        </TabsContent>

        {/* Converter Tab */}
        <TabsContent value="converter" className="space-y-6">
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <CurrencyConverter />
            </div>
          </div>

          {/* Additional converter info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como usar o conversor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <div className="font-medium">Digite o valor</div>
                    <div className="text-muted-foreground">Insira qualquer quantidade em qualquer campo</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <div className="font-medium">Conversão automática</div>
                    <div className="text-muted-foreground">Todos os outros valores são calculados automaticamente</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <div className="font-medium">Copiar valores</div>
                    <div className="text-muted-foreground">Clique na moeda para copiar o valor</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sobre as cotações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="font-medium">Fonte dos dados</div>
                  <div className="text-muted-foreground">CoinGecko API e ExchangeRate API</div>
                </div>
                <div>
                  <div className="font-medium">Frequência de atualização</div>
                  <div className="text-muted-foreground">Manual através do botão "Atualizar cotações"</div>
                </div>
                <div>
                  <div className="font-medium">Precisão</div>
                  <div className="text-muted-foreground">
                    BTC: 8 casas decimais<br />
                    SATS: números inteiros<br />
                    USD/BRL: 2 casas decimais
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}