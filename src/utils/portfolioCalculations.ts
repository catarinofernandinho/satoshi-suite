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

// Memoized portfolio calculations
export const calculatePortfolioStats = (
  transactions: Transaction[],
  btcCurrentPrice: number,
  userCurrency: string,
  exchangeRate: number
  ): PortfolioMetrics => {
  let totalBtc = 0;
  let totalCost = 0;
  let totalRevenue = 0;
  
  transactions.forEach(t => {
    if (t.type === 'Comprar') {
      totalBtc += Math.abs(t.quantity);
      // Include fees in total cost
      const totalCostWithFees = t.total_spent + (t.fees || 0);
      // Convert transaction cost to user's currency if needed
      if (t.market === userCurrency) {
        totalCost += totalCostWithFees;
      } else if (t.market === 'BRL' && userCurrency === 'USD') {
        // Corrigir conversão: BRL para USD
        totalCost += totalCostWithFees / exchangeRate;
      } else if (t.market === 'USD' && userCurrency === 'BRL') {
        // Corrigir conversão: USD para BRL
        totalCost += totalCostWithFees * exchangeRate;
      } else {
        totalCost += totalCostWithFees;
      }
    } else if (t.type === 'Vender') {
      totalBtc -= Math.abs(t.quantity);
      // Convert transaction revenue to user's currency if needed
      if (t.market === userCurrency) {
        totalRevenue += t.total_spent;
      } else if (t.market === 'BRL' && userCurrency === 'USD') {
        // Corrigir conversão: BRL para USD
        totalRevenue += t.total_spent / exchangeRate;
      } else if (t.market === 'USD' && userCurrency === 'BRL') {
        // Corrigir conversão: USD para BRL
        totalRevenue += t.total_spent * exchangeRate;
      } else {
        totalRevenue += t.total_spent;
      }
    } else if (t.type === 'Transferência') {
      if (t.transfer_type === 'entrada') {
        totalBtc += t.quantity;
      } else if (t.transfer_type === 'saida') {
        totalBtc -= t.quantity;
      }
    }
  });
  
  if (totalBtc < 0) totalBtc = 0;
  // Se o totalBtc for menor que 1 satoshi, considere zero!
  if (Math.abs(totalBtc) < 0.00000001) totalBtc = 0;

  // Calcular valor atual convertendo preço BTC para moeda do usuário
  const btcPriceInUserCurrency = userCurrency === 'USD' ? btcCurrentPrice : btcCurrentPrice * exchangeRate;
  const currentValue = totalBtc * btcPriceInUserCurrency;
  const netCost = totalCost - totalRevenue;
  const gainLoss = currentValue - netCost;
  const avgBuyPrice = totalBtc > 0 ? netCost / totalBtc : 0;
  
  return {
    totalBtc,
    totalCost,
    totalRevenue,
    netCost,
    currentValue,
    gainLoss,
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