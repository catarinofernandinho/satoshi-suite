import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ExternalLink } from "lucide-react";

export default function TradingViewChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          TradingView - Bitcoin
        </CardTitle>
        <CardDescription>
          Análise técnica avançada com indicadores profissionais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* TradingView Widget */}
        <div className="border rounded-lg overflow-hidden bg-black">
          <iframe
            src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_76d87&symbol=BINANCE%3ABTCUSDT&interval=4h&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&hideideas=1&theme=dark&style=1&timezone=America%2FSao_Paulo&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=pt&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=BINANCE%3ABTCUSDT"
            width="100%"
            height="500"
            frameBorder="0"
            title="TradingView Chart"
            className="w-full"
            style={{ minHeight: '500px' }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>
            Dados em tempo real via TradingView
          </span>
          <a 
            href="https://www.tradingview.com/chart/?symbol=BINANCE%3ABTCUSDT" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Abrir no TradingView <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}