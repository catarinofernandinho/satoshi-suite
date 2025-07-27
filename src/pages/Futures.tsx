import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFutures } from "@/hooks/useFutures";
import FuturesStats from "@/components/futures/FuturesStats";
import FuturesTable from "@/components/futures/FuturesTable";
import AddFutureModal from "@/components/futures/AddFutureModal";
import { Skeleton } from "@/components/ui/skeleton";

export default function Futures() {
  const { futures, loading, getFuturesStats } = useFutures();
  const [btcPrice, setBtcPrice] = useState(0);
  const [priceLoading, setPriceLoading] = useState(true);

  const fetchBitcoinPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const data = await response.json();
      setBtcPrice(data.bitcoin?.usd || 0);
    } catch (error) {
      console.error('Failed to fetch Bitcoin price:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  useEffect(() => {
    fetchBitcoinPrice();
    // Update price every 30 seconds
    const interval = setInterval(fetchBitcoinPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = btcPrice > 0 ? getFuturesStats(btcPrice) : {
    totalOpenPositions: 0,
    totalClosedPositions: 0,
    totalUnrealizedPL: 0,
    totalRealizedPL: 0,
    totalFeesUSD: 0,
    totalPL: 0
  };

  if (loading || priceLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Futuros</h1>
          <p className="text-muted-foreground">
            Gerencie seus contratos futuros de Bitcoin com cálculos automáticos de P&L e taxas
          </p>
        </div>
        <AddFutureModal />
      </div>

      {/* Current BTC Price */}
      <Card className="bg-gradient-card border-bitcoin/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-foreground">Bitcoin (BTC/USD)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-bitcoin">
            ${btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-sm text-muted-foreground">Preço usado para cálculos em tempo real</p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <FuturesStats stats={stats} />

      {/* Futures Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contratos Futuros</CardTitle>
          <CardDescription>
            Histórico completo de operações com cálculos automáticos de taxas e P&L
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FuturesTable futures={futures} btcCurrentPrice={btcPrice} />
        </CardContent>
      </Card>
    </div>
  );
}