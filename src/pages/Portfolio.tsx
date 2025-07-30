import { useState, useEffect } from "react";
import PortfolioStatsEnhanced from "@/components/portfolio/PortfolioStatsEnhanced";
import TransactionTableEnhanced from "@/components/portfolio/TransactionTableEnhanced";
import { useTransactions } from "@/hooks/useTransactions";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useToast } from "@/hooks/use-toast";
import AddTransactionModal from "@/components/portfolio/AddTransactionModal";
import EditTransactionModal from "@/components/portfolio/EditTransactionModal";
import { Transaction } from "@/hooks/useTransactions";
export default function Portfolio() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
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

  // Fetch Bitcoin price from CoinGecko only on page load
  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_24hr_change=true');
        const data = await response.json();
        if (data.bitcoin) {
          const price = currentCurrency === 'BRL' ? data.bitcoin.brl : data.bitcoin.usd;
          setBtcPrice(price);
          setBtcPriceChange(data.bitcoin.usd_24h_change || 0);
          
          // Store last known price in localStorage
          localStorage.setItem('lastBtcPrice', price.toString());
          localStorage.setItem('lastBtcPriceChange', (data.bitcoin.usd_24h_change || 0).toString());
        }
      } catch (error) {
        console.error('Failed to fetch BTC price:', error);
        // Try to use last known price from localStorage
        const lastPrice = localStorage.getItem('lastBtcPrice');
        const lastPriceChange = localStorage.getItem('lastBtcPriceChange');
        if (lastPrice) {
          setBtcPrice(parseFloat(lastPrice));
          setBtcPriceChange(parseFloat(lastPriceChange || '0'));
        }
        // Don't show toast error, just silently handle it
      }
    };
    fetchBtcPrice();
  }, [currentCurrency]);
  const portfolioStats = getPortfolioStats(btcPrice);
  const handleAddTransaction = () => {
    setIsAddModalOpen(true);
  };
  const handleEditTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setEditingTransaction(transaction);
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    await updateTransaction(id, updates);
    toast({
      title: "Sucesso",
      description: "Transação atualizada com sucesso!"
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

      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSubmit={async transaction => {
          await addTransaction(transaction);
          toast({
            title: "Sucesso",
            description: "Transação adicionada com sucesso!"
          });
        }} 
        currency={currentCurrency}
        availableBtc={portfolioStats.totalBtc}
      />

      <EditTransactionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleUpdateTransaction}
        transaction={editingTransaction}
        currency={currentCurrency}
        availableBtc={portfolioStats.totalBtc}
      />
    </div>;
}