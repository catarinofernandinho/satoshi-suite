import { useState, useEffect } from "react";
import PortfolioStatsEnhanced from "@/components/portfolio/PortfolioStatsEnhanced";
import TransactionTableEnhanced from "@/components/portfolio/TransactionTableEnhanced";
import { useTransactions } from "@/hooks/useTransactions";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useToast } from "@/hooks/use-toast";
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
        
        
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Carregando portfólio...</span>
        </div>
      ) : (
        <>
          <PortfolioStatsEnhanced
            btcPrice={btcPrice}
            btcPriceChange={btcPriceChange}
            totalValue={portfolioStats.currentValue}
            totalBtc={portfolioStats.totalBtc}
            totalCost={portfolioStats.totalCost}
            totalRevenue={portfolioStats.totalRevenue}
            totalGainLoss={portfolioStats.gainLoss}
            currency={currentCurrency}
          />

          <TransactionTableEnhanced 
            transactions={transactions} 
            currency={currentCurrency}
            btcCurrentPrice={btcPrice}
            onAddTransaction={handleAddTransaction} 
            onEditTransaction={handleEditTransaction} 
            onDeleteTransaction={deleteTransaction} 
          />
        </>
      )}

      <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={async transaction => {
      await addTransaction(transaction);
      toast({
        title: "Sucesso",
        description: "Transação adicionada com sucesso!"
      });
    }} currency={currentCurrency} />
    </div>;
}