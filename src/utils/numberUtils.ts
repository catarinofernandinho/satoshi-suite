// Utility functions for number formatting in transaction modals

/**
 * Formats a fiat currency value to 2 decimal places, rounding down
 * @param value - The value to format
 * @param locale - Locale for formatting (pt-BR for Brazil, en-US for USA)
 * @returns Formatted value as string
 */
export const formatFiatValue = (value: string | number, locale: string = 'en-US'): string => {
  if (!value || value === "") return "";
  
  const numValue = typeof value === "string" ? parseFloat(value.replace(',', '.')) : value;
  if (isNaN(numValue)) return "";
  
  // Simply return the raw value as string without formatting
  return value.toString();
};

/**
 * Formats a BTC value to 8 decimal places, rounding down
 * @param value - The value to format
 * @param locale - Locale for formatting (pt-BR for Brazil, en-US for USA)
 * @returns Formatted value as string
 */
export const formatBtcValue = (value: string | number, locale: string = 'en-US'): string => {
  if (!value || value === "") return "";
  
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "";
  
  // Round down to 8 decimal places
  const rounded = Math.floor(numValue * 100000000) / 100000000;
  return rounded.toLocaleString(locale, {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8
  });
};

/**
 * Calculates the missing field value based on which two fields are filled
 * @param changedField - Which field was just changed
 * @param totalSpent - Total spent/received value
 * @param quantity - Quantity value  
 * @param pricePerCoin - Price per coin value
 * @param quantityUnit - BTC or SATS
 * @returns Object with calculated values
 */
export const calculateInterlinkedValues = (
  changedField: 'totalSpent' | 'quantity' | 'pricePerCoin',
  totalSpent: string,
  quantity: string,
  pricePerCoin: string,
  quantityUnit: "BTC" | "SATS",
  currency: string = 'USD'
): { totalSpent: string; quantity: string; pricePerCoin: string } => {
  // Use the normalize function based on currency
  const totalSpentNum = parseFloat(normalizeDecimalInput(totalSpent, currency)) || 0;
  const quantityNum = parseFloat(normalizeDecimalInput(quantity, currency)) || 0;
  const pricePerCoinNum = parseFloat(normalizeDecimalInput(pricePerCoin, currency)) || 0;
  
  // Convert SATS to BTC for calculations
  let quantityInBtc = quantityNum;
  if (quantityUnit === "SATS" && quantityNum > 0) {
    quantityInBtc = quantityNum / 100000000;
  }
  
  let result = { totalSpent, quantity, pricePerCoin };
  
  // Calculate based on which field was changed and what other fields have values
  if (changedField === 'totalSpent') {
    // If quantity is filled, calculate price per coin
    if (quantityInBtc > 0) {
      const calculatedPrice = totalSpentNum / quantityInBtc;
      result.pricePerCoin = calculatedPrice > 0 ? calculatedPrice.toFixed(2) : "";
    }
  } else if (changedField === 'quantity') {
    // If total spent is filled, calculate price per coin
    if (totalSpentNum > 0 && quantityInBtc > 0) {
      const calculatedPrice = totalSpentNum / quantityInBtc;
      result.pricePerCoin = calculatedPrice > 0 ? calculatedPrice.toFixed(2) : "";
    }
    // If price per coin is filled, calculate total spent
    else if (pricePerCoinNum > 0 && quantityInBtc > 0) {
      const calculatedTotal = quantityInBtc * pricePerCoinNum;
      result.totalSpent = calculatedTotal > 0 ? calculatedTotal.toFixed(2) : "";
    }
  } else if (changedField === 'pricePerCoin') {
    // If quantity is filled, calculate total spent
    if (quantityInBtc > 0 && pricePerCoinNum > 0) {
      const calculatedTotal = quantityInBtc * pricePerCoinNum;
      result.totalSpent = calculatedTotal > 0 ? calculatedTotal.toFixed(2) : "";
    }
    // If total spent is filled, calculate quantity - prevent division by zero
    else if (totalSpentNum > 0 && pricePerCoinNum > 0) {
      const calculatedQuantity = totalSpentNum / pricePerCoinNum;
      if (calculatedQuantity > 0) {
        const finalQuantity = quantityUnit === "SATS" 
          ? Math.floor(calculatedQuantity * 100000000).toString()
          : calculatedQuantity.toFixed(8);
        result.quantity = finalQuantity;
      }
    }
  }
  
  return result;
};

/**
 * Formats input value based on field type and currency
 * @param value - Input value
 * @param fieldType - Type of field (fiat, btc, sats)
 * @param market - Currency market (USD/BRL) for locale formatting
 * @returns Formatted value
 */
export const formatInputValue = (value: string, fieldType: "fiat" | "btc" | "sats", market: string = 'USD'): string => {
  if (!value || value === "") return "";
  
  const locale = market === 'BRL' ? 'pt-BR' : 'en-US';
  
  switch (fieldType) {
    case "fiat":
      return formatFiatValue(value, locale);
    case "btc":
      return formatBtcValue(value, locale);
    case "sats":
      // SATS should be whole numbers
      const satsValue = parseFloat(value);
      return isNaN(satsValue) ? "" : Math.floor(satsValue).toString();
    default:
      return value;
  }
};

/**
 * Validates input against the correct decimal separator for the currency
 * @param value - The input value
 * @param currency - The currency (USD/BRL)
 * @returns True if valid, false otherwise
 */
export const validateDecimalInput = (value: string, currency: string): boolean => {
  if (!value) return true;
  
  const isBRL = currency === 'BRL';

  if (isBRL) {
    // Permite: 123456,78 ou 1, ou 1,2, ou 1,234
    return /^(\d+)?(,\d*)?$/.test(value);
  } else {
    // Permite: 123456.78 ou 1. ou 1.2 ou 1.234
    return /^(\d+)?(\.\d*)?$/.test(value);
  }
};

/**
 * Normalizes input value to standard number format (with dot as decimal separator)
 * @param value - The input value
 * @param currency - The currency (USD/BRL)
 * @returns Normalized value
 */
// Limita para apenas 2 casas decimais na hora de normalizar para cálculo/salvar
export const normalizeDecimalInput = (value: string, currency: string): string => {
  if (!value) return "";
  
  const isBRL = currency === 'BRL';
  let normalized = value;

  if (isBRL) {
    // Só troca vírgula por ponto para cálculo/salvar
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = normalized.replace(/,/g, '');
  }

  // Limita para 2 casas decimais
  const parts = normalized.split('.');
  if (parts.length === 2) {
    parts[1] = parts[1].slice(0, 2);
    normalized = parts[0] + '.' + parts[1];
  }

  return normalized;
};

/**
 * Gets the correct placeholder for input fields based on currency
 * @param fieldType - Type of field (fiat, btc, sats)
 * @param currency - The currency (USD/BRL)
 * @returns Placeholder string
 */
export const getInputPlaceholder = (fieldType: "fiat" | "btc" | "sats", currency: string): string => {
  const isBRL = currency === 'BRL';
  
  switch (fieldType) {
    case "fiat":
      return isBRL ? "0,00" : "0.00";
    case "btc":
      return isBRL ? "0,00000000" : "0.00000000";
    case "sats":
      return "0";
    default:
      return "";
  }
};