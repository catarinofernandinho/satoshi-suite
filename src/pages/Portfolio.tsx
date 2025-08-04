import { useState, useCallback, useMemo } from "react";
import PortfolioStatsEnhanced from "@/components/portfolio/PortfolioStatsEnhanced";
import TransactionTableEnhanced from "@/components/portfolio/TransactionTableEnhanced";
import { useTransactions } from "@/hooks/useTransactions";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useToast } from "@/hooks/use-toast";
import AddTransactionModal from "@/components/portfolio/AddTransactionModal";
import EditTransactionModal from "@/components/portfolio/EditTransactionModal";
import { Transaction } from "@/hooks/useTransactions";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useBitcoinPrice } from "@/hooks/useBitcoinPrice";
import { calculatePortfolioStats } from "@/utils/portfolioCalculations";
export default function Portfolio() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const { settings } = useUserSettings();
  const { currency: currentCurrency, exchangeRate } = useCurrency();
  const { btcPrice, btcPriceChange, loading: priceLoading } = useBitcoinPrice(currentCurrency);
  
  const {
    transactions,
    loading: transactionsLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();
  
  const { toast } = useToast();

  // Memoized portfolio calculations to prevent unnecessary recalculations
  const portfolioStats = useMemo(() => {
    return calculatePortfolioStats(transactions, btcPrice, currentCurrency, exchangeRate);
  }, [transactions, btcPrice, currentCurrency, exchangeRate]);

  const loading = transactionsLoading || priceLoading;
  // Memoized handlers to prevent unnecessary re-renders
  const handleAddTransaction = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleEditTransaction = useCallback((id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setEditingTransaction(transaction);
      setIsEditModalOpen(true);
    }
  }, [transactions]);

  const handleUpdateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    await updateTransaction(id, updates);
    toast({
      title: "Sucesso",
      description: "Transação atualizada com sucesso!"
    });
  }, [updateTransaction, toast]);

  const handleAddTransactionSubmit = useCallback(async (transaction: any) => {
    await addTransaction(transaction);
    toast({
      title: "Sucesso",
      description: "Transação adicionada com sucesso!"
    });
  }, [addTransaction, toast]);
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
        onSubmit={handleAddTransactionSubmit} 
        currency={currentCurrency}
        availableBtc={portfolioStats.totalBtc}
        btcCurrentPrice={btcPrice}
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
        btcCurrentPrice={btcPrice}
      />
    </div>;
}