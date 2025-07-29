import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, ExternalLink, Maximize2 } from "lucide-react";
import { useState } from "react";
export default function BitcoinPriceChart() {
  const [timeframe, setTimeframe] = useState("1D");
  const [symbol] = useState("BTCUSD");
  const timeframes = [{
    value: "1",
    label: "1 Minuto"
  }, {
    value: "5",
    label: "5 Minutos"
  }, {
    value: "15",
    label: "15 Minutos"
  }, {
    value: "1H",
    label: "1 Hora"
  }, {
    value: "4H",
    label: "4 Horas"
  }, {
    value: "1D",
    label: "1 Dia"
  }, {
    value: "1W",
    label: "1 Semana"
  }];
  const tradingViewUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${symbol}&interval=${timeframe}&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=181A20&studies=[]&hideideas=1&theme=dark&style=1&timezone=America%2FSao_Paulo&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=pt&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=${symbol}`;
  return <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Gráfico Bitcoin (BTC/USD)
            </CardTitle>
            <CardDescription>
              Preço em tempo real com análise técnica completa
            </CardDescription>
          </div>
          
        </div>
      </CardHeader>
      <CardContent>
        {/* TradingView Chart Widget */}
        <div className="border rounded-lg overflow-hidden bg-black">
          <iframe src={tradingViewUrl} width="100%" height="500" frameBorder="0" title="Bitcoin Price Chart" className="w-full" style={{
          minHeight: '500px'
        }} />
        </div>

        {/* Chart Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="font-medium text-muted-foreground">Timeframe</div>
            <div className="text-lg font-bold">{timeframes.find(tf => tf.value === timeframe)?.label}</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="font-medium text-muted-foreground">Par</div>
            <div className="text-lg font-bold">BTC/USD</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="font-medium text-muted-foreground">Fonte</div>
            <div className="text-lg font-bold">TradingView</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t mt-4">
          <span>
            Dados fornecidos por exchanges globais em tempo real
          </span>
          <a href={`https://www.tradingview.com/chart/?symbol=${symbol}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
            TradingView <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>;
}