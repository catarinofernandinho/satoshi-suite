import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import PortfolioStats from "@/components/portfolio/PortfolioStats";
import TransactionTable from "@/components/portfolio/TransactionTable";
import AddTransactionModal from "@/components/portfolio/AddTransactionModal";
import { useTransactions } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";

export default function Portfolio() {
  const [currentCurrency, setCurrentCurrency] = useState("USD");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [btcPrice, setBtcPrice] = useState(100000); // Default fallback price
  const [btcPriceChange, setBtcPriceChange] = useState(0);
  
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

  const handleAddTransaction = () => {
    setIsAddModalOpen(true);
  };

  const handleEditTransaction = (id: string) => {
    console.log("Edit transaction:", id);
    // TODO: Implement edit functionality
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Edição de transações será implementada em breve."
    });
  };

  const handleSubmitTransaction = async (transactionData: any) => {
    await addTransaction(transactionData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        currentCurrency={currentCurrency}
        onCurrencyChange={setCurrentCurrency}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Portfólio Bitcoin</h2>
          <p className="text-muted-foreground">Acompanhe seus investimentos em Bitcoin em tempo real</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Carregando portfólio...</span>
          </div>
        ) : (
          <>
            <PortfolioStats
              totalValue={portfolioStats.currentValue}
              btcPrice={btcPrice}
              btcPriceChange={btcPriceChange}
              btcHoldings={portfolioStats.totalBtc}
              totalGainLoss={portfolioStats.gainLoss}
              currency={currentCurrency}
            />

            <TransactionTable
              transactions={transactions}
              currency={currentCurrency}
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={deleteTransaction}
            />
          </>
        )}

        <AddTransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleSubmitTransaction}
          currency={currentCurrency}
        />
      </main>
    </div>
  );
}