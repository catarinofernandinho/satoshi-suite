import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFutures } from "@/hooks/useFutures";
import FuturesStatsEnhanced from "@/components/futures/FuturesStatsEnhanced";
import FuturesCharts from "@/components/futures/FuturesCharts";
import FuturesTableAdvanced from "@/components/futures/FuturesTableAdvanced";
import AddFutureButton from "@/components/futures/AddFutureButton";
import ImportLNMarketsButton from "@/components/futures/ImportLNMarketsButton";
import DateRangeFilterAdvanced from "@/components/futures/DateRangeFilterAdvanced";
import OrderStatusTabs from "@/components/futures/OrderStatusTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { subDays, format, isWithinInterval, parseISO } from "date-fns";
import { useTimezone } from "@/contexts/TimezoneContext";
import { useBitcoinPrice } from "@/hooks/useBitcoinPrice";
import { UserCheck } from "lucide-react";
export default function Futures() {
  const {
    futures,
    loading,
    calculateFutureMetrics,
    addFuture,
    deleteFuture,
    updateFuture,
    closeFuture
  } = useFutures();
  const {
    getCurrentTime,
    convertToUserTime
  } = useTimezone();
  // Força uso de USD na página de futuros (não usa configuração de moeda do usuário)
  const formatCurrency = (value: number, showCurrency = false) => {
    return showCurrency 
      ? `US$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const { btcPrice, btcPriceChange, loading: priceLoading } = useBitcoinPrice('USD');
  const [activeTab, setActiveTab] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: subDays(getCurrentTime(), 365 * 5), // Default to "Tempo Todo" (5 years)
    to: getCurrentTime()
  });

  // Filter futures by date range
  const filteredFutures = futures.filter(future => {
    const futureDate = convertToUserTime(future.buy_date);
    return isWithinInterval(futureDate, {
      start: dateRange.from,
      end: dateRange.to
    });
  });

  // Calculate enhanced stats - ONLY for CLOSED orders
  const getEnhancedStats = () => {
    // Filter only CLOSED orders for statistics
    const closedFutures = filteredFutures.filter(future => future.status === 'CLOSED');
    
    if (btcPrice === 0 || closedFutures.length === 0) {
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
    
    let totalProfitSats = 0; // Gross profit (pl_sats)
    let totalFeesSats = 0;
    let totalNetProfitSats = 0;
    let totalReturnPercent = 0;
    let winningOrders = 0;
    let losingOrders = 0;
    
    closedFutures.forEach(future => {
      const grossProfitSats = future.pl_sats || 0;
      const feesSats = future.fees_paid || 0;
      const netProfitSats = future.net_pl_sats || 0;
      
      totalProfitSats += grossProfitSats;
      totalFeesSats += feesSats;
      totalNetProfitSats += netProfitSats;
      totalReturnPercent += future.percent_gain || 0;
      
      if (netProfitSats > 0) {
        winningOrders++;
      } else if (netProfitSats < 0) {
        losingOrders++;
      }
    });
    
    return {
      totalProfitSats,
      totalFeesSats,
      netProfitSats: totalNetProfitSats,
      averageReturn: closedFutures.length > 0 ? totalReturnPercent / closedFutures.length : 0,
      totalOrders: closedFutures.length,
      winningOrders,
      losingOrders,
      winRate: closedFutures.length > 0 ? winningOrders / closedFutures.length * 100 : 0
    };
  };
  const stats = getEnhancedStats();

  // Prepare monthly data for chart - ONLY from CLOSED orders
  const getMonthlyData = () => {
    const monthlyMap = new Map<string, number>();
    
    // Filter only CLOSED orders for monthly chart
    const closedFutures = filteredFutures.filter(future => future.status === 'CLOSED');
    
    closedFutures.forEach(future => {
      const month = format(convertToUserTime(future.buy_date), 'MMM yyyy');
      // Use net_pl_sats from closed orders (real data)
      const netProfitSats = future.net_pl_sats || 0;
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + netProfitSats);
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
    return <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({
          length: 4
        }).map((_, i) => <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>)}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <DateRangeFilterAdvanced dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>
        <div className="flex gap-2">
          <AddFutureButton addFuture={addFuture} onSuccess={() => setDateRange(prev => ({
          ...prev,
          to: getCurrentTime()
        }))} />
          <ImportLNMarketsButton addFuture={addFuture} onSuccess={() => setDateRange(prev => ({
            ...prev,
            to: getCurrentTime()
          }))} />
        </div>
      </div>

      {/* Current BTC Price */}
      <Card className="bg-gradient-card border-bitcoin/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-foreground">Bitcoin (BTC/USD)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-bitcoin">
            {formatCurrency(btcPrice)}
          </div>
          <p className="text-sm text-muted-foreground">Preço usado para cálculos em tempo real</p>
        </CardContent>
      </Card>

      {/* Enhanced Stats Cards */}
      <FuturesStatsEnhanced stats={stats} />

      {/* Charts */}
      <FuturesCharts monthlyData={monthlyData} waterfallData={waterfallData} />


      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ordens</CardTitle>
          <CardDescription>
            <div className="flex items-center justify-between">
              <span>
                Operações do período selecionado ({filteredFutures.length} de {futures.length} total)
              </span>
              <div className="flex items-center gap-2">
                <DateRangeFilterAdvanced dateRange={dateRange} onDateRangeChange={setDateRange} />
                <div className="flex items-center gap-2">
                  <AddFutureButton addFuture={addFuture} onSuccess={() => setDateRange(prev => ({
                    ...prev,
                    to: getCurrentTime()
                  }))} />
                  <ImportLNMarketsButton addFuture={addFuture} onSuccess={() => setDateRange(prev => ({
                    ...prev,
                    to: getCurrentTime()
                  }))} />
                </div>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFutures.length === 0 ? <div className="text-center py-8 text-muted-foreground">
              {futures.length === 0 ? <>
                  <p>Nenhuma ordem criada ainda</p>
                  <p className="text-sm mt-2">Clique em "Adicionar Ordem" para começar</p>
                </> : <>
                  <p>Sem operações no período selecionado</p>
                  <p className="text-sm mt-2">
                    Período: {dateRange.from.toLocaleDateString('pt-BR')} até {dateRange.to.toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm mt-1">
                    Ajuste o filtro de datas ou <Button variant="link" className="p-0 h-auto" onClick={() => setDateRange({
                from: subDays(getCurrentTime(), 365),
                to: getCurrentTime()
              })}>visualize o último ano</Button>
                  </p>
                </>}
            </div> : <OrderStatusTabs futures={filteredFutures} activeTab={activeTab} onTabChange={setActiveTab}>
              {tabFilteredFutures => <FuturesTableAdvanced futures={tabFilteredFutures} btcCurrentPrice={btcPrice} calculateFutureMetrics={calculateFutureMetrics} deleteFuture={deleteFuture} closeFuture={closeFuture} updateFuture={updateFuture} />}
            </OrderStatusTabs>}
        </CardContent>
      </Card>
    </div>;
}