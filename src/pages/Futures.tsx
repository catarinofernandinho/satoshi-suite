import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFutures } from "@/hooks/useFutures";
import FuturesStatsEnhanced from "@/components/futures/FuturesStatsEnhanced";
import FuturesCharts from "@/components/futures/FuturesCharts";
import FuturesTable from "@/components/futures/FuturesTable";
import AddFutureModal from "@/components/futures/AddFutureModal";
import DateRangeFilter from "@/components/futures/DateRangeFilter";
import OrderStatusTabs from "@/components/futures/OrderStatusTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { subDays, format, isWithinInterval, parseISO } from "date-fns";

export default function Futures() {
  const { futures, loading, calculateFutureMetrics } = useFutures();
  const [btcPrice, setBtcPrice] = useState(0);
  const [priceLoading, setPriceLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });

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

  // Filter futures by date range
  const filteredFutures = futures.filter(future => {
    const futureDate = parseISO(future.buy_date);
    return isWithinInterval(futureDate, { start: dateRange.from, end: dateRange.to });
  });

  // Calculate enhanced stats
  const getEnhancedStats = () => {
    if (btcPrice === 0) {
      return {
        totalProfitSats: 0,
        totalFeesSats: 0,
        netProfitSats: 0,
        averageReturn: 0,
        totalOrders: 0,
        winningOrders: 0,
        losingOrders: 0,
        winRate: 0
      };
    }

    let totalProfitSats = 0;
    let totalFeesSats = 0;
    let totalReturnPercent = 0;
    let winningOrders = 0;
    let losingOrders = 0;

    filteredFutures.forEach(future => {
      const metrics = calculateFutureMetrics(future, btcPrice);
      const profitSats = metrics.net_pl_sats || 0;
      const feesSats = (metrics.fees_paid || 0) / btcPrice * 100000000;
      
      totalProfitSats += profitSats + feesSats; // Gross profit
      totalFeesSats += feesSats;
      totalReturnPercent += metrics.percent_gain || 0;

      if (profitSats > 0) {
        winningOrders++;
      } else if (profitSats < 0) {
        losingOrders++;
      }
    });

    return {
      totalProfitSats,
      totalFeesSats,
      netProfitSats: totalProfitSats - totalFeesSats,
      averageReturn: filteredFutures.length > 0 ? totalReturnPercent / filteredFutures.length : 0,
      totalOrders: filteredFutures.length,
      winningOrders,
      losingOrders,
      winRate: filteredFutures.length > 0 ? (winningOrders / filteredFutures.length) * 100 : 0
    };
  };

  const stats = getEnhancedStats();

  // Prepare monthly data for chart
  const getMonthlyData = () => {
    const monthlyMap = new Map<string, number>();
    
    filteredFutures.forEach(future => {
      const month = format(parseISO(future.buy_date), 'MMM yyyy');
      const metrics = calculateFutureMetrics(future, btcPrice);
      const profitSats = (metrics.net_pl_sats || 0) + ((metrics.fees_paid || 0) / btcPrice * 100000000);
      
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + profitSats);
    });

    return Array.from(monthlyMap.entries()).map(([month, profit]) => ({
      month,
      profit
    }));
  };

  const monthlyData = getMonthlyData();
  const waterfallData = {
    totalProfit: stats.totalProfitSats,
    totalFees: stats.totalFeesSats,
    netProfit: stats.netProfitSats
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Ordens</h1>
          <p className="text-muted-foreground">
            Análise detalhada das suas ordens de futuros com indicadores visuais e gráficos
          </p>
        </div>
        <AddFutureModal />
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter 
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

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

      {/* Enhanced Stats Cards */}
      <FuturesStatsEnhanced stats={stats} />

      {/* Charts */}
      <FuturesCharts 
        monthlyData={monthlyData}
        waterfallData={waterfallData}
      />

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ordens</CardTitle>
          <CardDescription>
            Operações do período selecionado ({filteredFutures.length} de {futures.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFutures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Sem operações nesse intervalo</p>
              <p className="text-sm mt-2">Ajuste o período ou adicione novas ordens</p>
            </div>
          ) : (
            <OrderStatusTabs 
              futures={filteredFutures} 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
            >
              {(tabFilteredFutures) => (
                <FuturesTable futures={tabFilteredFutures} btcCurrentPrice={btcPrice} />
              )}
            </OrderStatusTabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}