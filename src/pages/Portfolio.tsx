import { useState } from "react";
import Header from "@/components/layout/Header";
import PortfolioStats from "@/components/portfolio/PortfolioStats";
import TransactionTable from "@/components/portfolio/TransactionTable";

// Mock data for demonstration
const mockTransactions = [
  {
    id: "1",
    type: "Comprar" as const,
    price: 119589,
    quantity: 0.00045006,
    totalSpent: 53.8,
    pricePerCoin: 119589,
    market: "USD",
    gainProfit: 0.75,
    notes: "Primeira compra",
    date: "2024-01-15"
  },
  {
    id: "2",
    type: "Comprar" as const,
    price: 117000,
    quantity: 0.00857,
    totalSpent: 1002.69,
    pricePerCoin: 117000,
    market: "USD",
    gainProfit: 78.32,
    notes: "Acumulação mensal",
    date: "2024-01-20"
  }
];

export default function Portfolio() {
  const [currentCurrency, setCurrentCurrency] = useState("USD");
  const [transactions, setTransactions] = useState(mockTransactions);

  // Mock portfolio data
  const portfolioData = {
    totalValue: 1265.90,
    btcPrice: 117909,
    btcPriceChange: 0.6,
    btcHoldings: 0.0107378,
    totalGainLoss: 279.04
  };

  const handleAddTransaction = () => {
    console.log("Add transaction");
    // TODO: Open add transaction modal
  };

  const handleEditTransaction = (id: string) => {
    console.log("Edit transaction:", id);
    // TODO: Open edit transaction modal
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
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

        <PortfolioStats
          totalValue={portfolioData.totalValue}
          btcPrice={portfolioData.btcPrice}
          btcPriceChange={portfolioData.btcPriceChange}
          btcHoldings={portfolioData.btcHoldings}
          totalGainLoss={portfolioData.totalGainLoss}
          currency={currentCurrency}
        />

        <TransactionTable
          transactions={transactions}
          currency={currentCurrency}
          onAddTransaction={handleAddTransaction}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />
      </main>
    </div>
  );
}