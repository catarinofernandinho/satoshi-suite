import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, ExternalLink } from "lucide-react";

interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update?: string;
}

export default function FearGreedIndex() {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFearGreedData = async () => {
    try {
      // Using Alternative.me API for Fear & Greed Index
      const response = await fetch('https://api.alternative.me/fng/?limit=1');
      const result = await response.json();
      
      if (result.data && result.data[0]) {
        setData(result.data[0]);
        setError(null);
      }
    } catch (err) {
      setError('Falha ao carregar dados do Fear & Greed Index');
      console.error('Fear & Greed API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFearGreedData();
    // Update every 10 minutes
    const interval = setInterval(fetchFearGreedData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getColorByValue = (value: number) => {
    if (value <= 25) return 'text-red-600 bg-red-50 border-red-200';
    if (value <= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (value <= 75) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getDescription = (classification: string) => {
    const descriptions = {
      'Extreme Fear': 'Medo Extremo - Oportunidade de compra potencial',
      'Fear': 'Medo - Mercado pessimista',
      'Neutral': 'Neutro - Mercado equilibrado',
      'Greed': 'Ganância - Mercado otimista',
      'Extreme Greed': 'Ganância Extrema - Possível topo de mercado'
    };
    return descriptions[classification as keyof typeof descriptions] || classification;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Fear & Greed Index
          </CardTitle>
          <CardDescription>Índice de sentimento do mercado Bitcoin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Fear & Greed Index
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const value = parseInt(data.value);
  const colorClass = getColorByValue(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Fear & Greed Index
        </CardTitle>
        <CardDescription>
          Índice de sentimento do mercado Bitcoin (0-100)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Index Display */}
        <div className={`text-center p-6 rounded-lg border ${colorClass}`}>
          <div className="text-4xl font-bold mb-2">{data.value}</div>
          <div className="text-lg font-medium">{data.value_classification}</div>
          <div className="text-sm mt-2">{getDescription(data.value_classification)}</div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Medo Extremo</span>
            <span>Ganância Extrema</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="h-3 rounded-full transition-all duration-300"
              style={{
                width: `${value}%`,
                background: value <= 25 ? '#ef4444' : 
                          value <= 50 ? '#f97316' : 
                          value <= 75 ? '#eab308' : '#22c55e'
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>

        {/* Embedded Chart */}
        <div className="border rounded-lg overflow-hidden">
          <iframe
            src="https://charts.bitbo.io/fear-greed/"
            width="100%"
            height="300"
            frameBorder="0"
            title="Fear & Greed Index Chart"
            className="w-full"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>
            Atualizado: {new Date(parseInt(data.timestamp) * 1000).toLocaleString('pt-BR')}
          </span>
          <a 
            href="https://alternative.me/crypto/fear-and-greed-index/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Fonte <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}