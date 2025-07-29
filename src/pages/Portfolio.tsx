import { useState, useEffect } from "react";
import PortfolioStats from "@/components/portfolio/PortfolioStats";
import TransactionTable from "@/components/portfolio/TransactionTable";
import { useTransactions } from "@/hooks/useTransactions";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddTransactionModal from "@/components/portfolio/AddTransactionModal";
export default function Portfolio() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [btcPrice, setBtcPrice] = useState(100000); // Default fallback price
  const [btcPriceChange, setBtcPriceChange] = useState(0);
  const {
    settings
  } = useUserSettings();
  const currentCurrency = settings?.preferred_currency || "USD";
  const {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getPortfolioStats
  } = useTransactions();
  const {
    toast
  } = useToast();

  // Fetch Bitcoin price from CoinGecko
  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_24hr_change=true');
        const data = await response.json();
        if (data.bitcoin) {
          const price = currentCurrency === 'BRL' ? data.bitcoin.brl : data.bitcoin.usd;
          setBtcPrice(price);
          setBtcPriceChange(data.bitcoin.usd_24h_change || 0);
        }
      } catch (error) {
        console.error('Failed to fetch BTC price:', error);
        toast({
          title: "Erro ao buscar preço do Bitcoin",
          description: "Usando preço padrão. Verifique sua conexão.",
          variant: "destructive"
        });
      }
    };
    fetchBtcPrice();
    const interval = setInterval(fetchBtcPrice, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [currentCurrency, toast]);
  const portfolioStats = getPortfolioStats(btcPrice);

  // Dashboard calculations
  const assetsValue = portfolioStats.currentValue || 0;
  const totalAssets = portfolioStats.totalBtc || 0;
  const totalCost = transactions.reduce((sum, t) => sum + t.total_spent, 0);
  const avgCost = totalCost / (totalAssets || 1);
  const totalProfitLoss = portfolioStats.gainLoss || 0;
  const handleAddTransaction = () => {
    setIsAddModalOpen(true);
  };
  const handleEditTransaction = (id: string) => {
    console.log("Edit transaction:", id);
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Edição de transações será implementada em breve."
    });
  };
  return <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Portfólio Bitcoin</h1>
        <p className="text-muted-foreground">Acompanhe seus investimentos em Bitcoin em tempo real</p>
      </div>

      {loading ? <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Carregando portfólio...</span>
        </div> : <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bitcoin BTC</CardTitle>
                
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{currentCurrency === "BRL" ? "R$" : "US$"}{btcPrice.toLocaleString()}</div>
                <Badge className={btcPriceChange >= 0 ? "bg-green-500" : "bg-red-500"}>
                  {btcPriceChange >= 0 ? "+" : ""}{btcPriceChange.toFixed(2)}%
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor dos Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl font-bold">{currentCurrency === "BRL" ? "R$" : "US$"}{assetsValue.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl font-bold">{totalAssets.toFixed(8)} BTC</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl font-bold">{currentCurrency === "BRL" ? "R$" : "US$"}{totalCost.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-xl font-bold">{currentCurrency === "BRL" ? "R$" : "US$"}{avgCost.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2 lg:col-span-3 xl:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Ganhos/Perdas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl sm:text-2xl font-bold ${totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {currentCurrency === "BRL" ? "R$" : "US$"}{totalProfitLoss.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <TransactionTable transactions={transactions} currency={currentCurrency} onAddTransaction={handleAddTransaction} onEditTransaction={handleEditTransaction} onDeleteTransaction={deleteTransaction} />
        </>}

      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={async transaction => {
      await addTransaction(transaction);
      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso!"
      });
    }} currency={currentCurrency} />
    </div>;
}