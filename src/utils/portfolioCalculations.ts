import { Transaction } from '@/hooks/useTransactions';

export interface PortfolioMetrics {
  totalBtc: number;
  totalCost: number;
  totalRevenue: number;
  netCost: number;
  currentValue: number;
  gainLoss: number;
  avgBuyPrice: number;
}

export interface TransactionGP {
  value: number;
  color: string;
}

// Refactored portfolio calculations based on actual displayed transactions
export const calculatePortfolioStats = (
  transactions: Transaction[],
  btcCurrentPrice: number,
  userCurrency: string,
  exchangeRate: number
): PortfolioMetrics => {
  let totalBtc = 0;
  let totalCost = 0; // Sum of cost column for Buy transactions only
  let totalRevenue = 0; // Sum of revenue column for Sell transactions only
  let totalGainLoss = 0; // Direct sum of GP column values
  
  // Calculate totals EXACTLY like what is displayed in the table
  transactions.forEach((t) => {
    if (t.type === 'Comprar') {
      // Add to BTC holdings
      totalBtc += t.quantity;
      
      // Add to total cost (exactly like Cost column: total_spent + fees)
      const transactionCost = (t.total_spent || 0) + (t.fees || 0);
      const convertedCost = convertToUserCurrency(transactionCost, t.market, userCurrency, exchangeRate);
      totalCost += convertedCost;
      
    } else if (t.type === 'Vender') {
      // Subtract from BTC holdings
      totalBtc -= t.quantity;
      
      // Add to revenue (exactly like Revenue column: total_spent)
      const convertedRevenue = convertToUserCurrency(t.total_spent, t.market, userCurrency, exchangeRate);
      totalRevenue += convertedRevenue;
      
    } else if (t.type === 'Transferência') {
      if (t.transfer_type === 'entrada') {
        totalBtc += t.quantity;
      } else if (t.transfer_type === 'saida') {
        totalBtc -= t.quantity;
      }
    }
    
    // Calculate GP for this transaction (exactly like GP column)
    const gpResult = calculateTransactionGP(t, btcCurrentPrice, userCurrency, exchangeRate);
    totalGainLoss += gpResult.value;
  });
  
  // Ensure totalBtc doesn't go negative
  if (totalBtc < 0) totalBtc = 0;
  if (Math.abs(totalBtc) < 0.00000001) totalBtc = 0;

  // Current value of all BTC holdings at current price
  const currentValue = totalBtc * btcCurrentPrice;
  
  // Net cost = total cost - total revenue
  const netCost = totalCost - totalRevenue;
  
  // Use the calculated totalGainLoss directly (sum of GP column)
  const gainLoss = totalGainLoss;
  
  // Average buy price = net cost / total BTC (liquid average cost)
  const avgBuyPrice = totalBtc > 0 ? netCost / totalBtc : 0;
  
  return {
    totalBtc,
    totalCost, // Cost of open positions only
    totalRevenue,
    netCost,
    currentValue,
    gainLoss, // Direct sum from GP column
    avgBuyPrice
  };
};

// Convert amount from transaction's original currency to user's preferred currency
export const convertToUserCurrency = (
  amount: number,
  transactionMarket: string,
  userCurrency: string,
  exchangeRate: number
  ): number => {
  // If transaction and user currency are the same, no conversion needed
  if (transactionMarket === userCurrency) {
    return amount;
  }
  
  // Convert between USD and BRL
  if (transactionMarket === 'BRL' && userCurrency === 'USD') {
    return amount / exchangeRate;
  } else if (transactionMarket === 'USD' && userCurrency === 'BRL') {
    return amount * exchangeRate;
  }
  
  // Fallback - return original amount
  return amount;
};

// Calculate GP for a single transaction
export const calculateTransactionGP = (
  transaction: Transaction,
  btcCurrentPrice: number,
  userCurrency: string,
  exchangeRate: number
  ): TransactionGP => {
  if (transaction.type === "Comprar") {
    const currentValue = transaction.quantity * btcCurrentPrice;
    const totalCostWithFees = (transaction.total_spent || 0) + (transaction.fees || 0);
    const convertedTotalSpent = convertToUserCurrency(
      totalCostWithFees,
      transaction.market,
      userCurrency,
      exchangeRate
      );
    const gp = currentValue - convertedTotalSpent;
    return {
      value: gp,
      color: gp >= 0 ? "text-success" : "text-destructive"
    };
  } else if (transaction.type === "Vender") {
    const convertedTotalSpent = convertToUserCurrency(
      transaction.total_spent,
      transaction.market,
      userCurrency,
      exchangeRate
      );
    const convertedPricePerCoin = convertToUserCurrency(
      transaction.price_per_coin,
      transaction.market,
      userCurrency,
      exchangeRate
      );
    const gp = convertedTotalSpent - (transaction.quantity * convertedPricePerCoin);
    return {
      value: gp,
      color: gp >= 0 ? "text-success" : "text-destructive"
    };
  }
  
  // For transfers, show value in USD (then convert to user currency)
  const transferValue = transaction.quantity * btcCurrentPrice;
  return {
    value: transferValue,
    color: "text-muted-foreground"
  };
};

// Format currency helper
export const formatCurrencyDirect = (amount: number, currency: string): string => {
  const prefix = currency === "BRL" ? "R$" : "US$";
  const locale = currency === "BRL" ? "pt-BR" : "en-US";
  return `${prefix} ${amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};