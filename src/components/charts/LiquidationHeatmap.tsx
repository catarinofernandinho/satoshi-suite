import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BarChart3, ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function LiquidationHeatmap() {
  const [isLoading, setIsLoading] = useState(false);

  const refreshHeatmap = () => {
    setIsLoading(true);
    // Simulate refresh - in reality this would reload the iframe
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Mapa de Calor - Liquidações
            </CardTitle>
            <CardDescription>
              Visualização em tempo real das liquidações de contratos futuros
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshHeatmap}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Alert */}
        <Alert>
          <AlertDescription>
            Este heatmap mostra onde estão concentradas as liquidações de posições long (verde) e short (vermelho) 
            em diferentes níveis de preço do Bitcoin.
          </AlertDescription>
        </Alert>

        {/* Embedded Heatmap */}
        <div className="border rounded-lg overflow-hidden bg-gray-50">
          <iframe
            src="https://bitcoincounterflow.com/liquidation-heatmap/"
            width="100%"
            height="500"
            frameBorder="0"
            title="Liquidation Heatmap"
            className="w-full"
            style={{ minHeight: '500px' }}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Liquidações SHORT (Vendidas)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Liquidações LONG (Compradas)</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>
            Dados atualizados em tempo real
          </span>
          <a 
            href="https://bitcoincounterflow.com/liquidation-heatmap/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Ver em tela cheia <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}