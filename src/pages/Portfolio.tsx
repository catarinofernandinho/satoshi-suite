import { useState, useEffect } from "react";
import PortfolioStats from "@/components/portfolio/PortfolioStats";
import TransactionTable from "@/components/portfolio/TransactionTable";
import { useTransactions } from "@/hooks/useTransactions";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Portfolio() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [btcPrice, setBtcPrice] = useState(100000); // Default fallback price
  const [btcPriceChange, setBtcPriceChange] = useState(0);
  
  const { settings } = useUserSettings();
  const currentCurrency = settings?.preferred_currency || "USD";
  
  const { 
    transactions, 
    loading, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction, 
    getPortfolioStats 
  } = useTransactions();
  
  const { toast } = useToast();

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

  const handleSubmitTransaction = async (transactionData: any) => {
    try {
      await addTransaction({
        ...transactionData,
        market: currentCurrency,
        fees: parseFloat(transactionData.feesNotes.split("\n")[0]) || 0,
        notes: transactionData.feesNotes.split("\n").slice(1).join("\n") || "",
      });
      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso!",
      });
      setIsAddModalOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao adicionar transação.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Portfólio Bitcoin</h1>
        <p className="text-muted-foreground">Acompanhe seus investimentos em Bitcoin em tempo real</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Carregando portfólio...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bitcoin BTC</CardTitle>
                <img src="/bitcoin-logo.png" alt="BTC Logo" className="h-6 w-6" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentCurrency === "BRL" ? "R$" : "US$"}{btcPrice.toLocaleString()}</div>
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
                <div className="text-2xl font-bold">{currentCurrency === "BRL" ? "R$" : "US$"}{assetsValue.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAssets.toFixed(8)} BTC</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentCurrency === "BRL" ? "R$" : "US$"}{totalCost.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo Médio por Unidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentCurrency === "BRL" ? "R$" : "US$"}{avgCost.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card className="col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Ganhos/Perdas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"} style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {currentCurrency === "BRL" ? "R$" : "US$"}{totalProfitLoss.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <TransactionTable
            transactions={transactions}
            currency={currentCurrency}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        </>
      )}

      <Sheet open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Adicionar Transação</SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="Comprar" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="Comprar">Comprar</TabsTrigger>
              <TabsTrigger value="Vender">Vender</TabsTrigger>
              <TabsTrigger value="Transferência">Transferência</TabsTrigger>
            </TabsList>
            <TabsContent value="Comprar">
              <form onSubmit={(e) => { e.preventDefault(); handleSubmitTransaction({ type: "Comprar", price: btcPrice, quantity: "", total_spent: "", feesNotes: "" }); }} className="space-y-4 py-4">
                <Select onValueChange={(value) => handleSubmitTransaction({ ...{ type: "Comprar", price: btcPrice, quantity: "", total_spent: "", feesNotes: "" }, coin: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a moeda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">BTC <img src="/bitcoin-logo.png" alt="BTC" className="h-4 w-4 inline" /></SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Gasto Total"
                  onChange={(e) => handleSubmitTransaction({ ...{ type: "Comprar", price: btcPrice, quantity: "", feesNotes: "" }, total_spent: e.target.value })}
                  step="0.01"
                />
                <Input
                  type="number"
                  placeholder="Quantidade"
                  onChange={(e) => handleSubmitTransaction({ ...{ type: "Comprar", price: btcPrice, total_spent: "", feesNotes: "" }, quantity: e.target.value })}
                  step="0.00000001"
                />
                <Select onValueChange={(value) => handleSubmitTransaction({ ...{ type: "Comprar", quantity: "", total_spent: "", feesNotes: "" }, pricePerCoin: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Preço por Moeda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Utilizar o Mercado</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Preço Personalizado"
                  onChange={(e) => handleSubmitTransaction({ ...{ type: "Comprar", quantity: "", total_spent: "", feesNotes: "" }, pricePerCoin: e.target.value })}
                  step="0.01"
                  disabled={true} // Habilitar só se "custom" for selecionado
                />
                <Input
                  type="datetime-local"
                  onChange={(e) => handleSubmitTransaction({ ...{ type: "Comprar", price: btcPrice, quantity: "", total_spent: "", feesNotes: "" }, date: e.target.value })}
                />
                <Textarea
                  placeholder="Taxas e Observações (taxa em nova linha)"
                  onChange={(e) => handleSubmitTransaction({ ...{ type: "Comprar", price: btcPrice, quantity: "", total_spent: "" }, feesNotes: e.target.value })}
                />
                <Button type="submit" className="w-full">Adicionar</Button>
              </form>
            </TabsContent>
            <TabsContent value="Vender">
              {/* Lógica semelhante, ajustada para venda */}
            </TabsContent>
            <TabsContent value="Transferência">
              {/* Lógica para transferência */}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
}