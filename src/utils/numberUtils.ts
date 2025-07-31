// Utility functions for number formatting in transaction modals

/**
 * Formats a fiat currency value to 2 decimal places, rounding down
 * @param value - The value to format
 * @param locale - Locale for formatting (pt-BR for Brazil, en-US for USA)
 * @returns Formatted value as string
 */
export const formatFiatValue = (value: string | number, locale: string = 'en-US'): string => {
  if (!value || value === "") return "";
  
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "";
  
  // Round down to 2 decimal places
  const rounded = Math.floor(numValue * 100) / 100;
  return rounded.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
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
  quantityUnit: "BTC" | "SATS"
): { totalSpent: string; quantity: string; pricePerCoin: string } => {
  const totalSpentNum = parseFloat(totalSpent) || 0;
  const quantityNum = parseFloat(quantity) || 0;
  const pricePerCoinNum = parseFloat(pricePerCoin) || 0;
  
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
      result.pricePerCoin = calculatedPrice > 0 ? calculatedPrice.toString() : "";
    }
  } else if (changedField === 'quantity') {
    // If total spent is filled, calculate price per coin
    if (totalSpentNum > 0) {
      const calculatedPrice = totalSpentNum / quantityInBtc;
      result.pricePerCoin = calculatedPrice > 0 ? calculatedPrice.toString() : "";
    }
    // If price per coin is filled, calculate total spent
    else if (pricePerCoinNum > 0) {
      const calculatedTotal = quantityInBtc * pricePerCoinNum;
      result.totalSpent = calculatedTotal > 0 ? calculatedTotal.toString() : "";
    }
  } else if (changedField === 'pricePerCoin') {
    // If quantity is filled, calculate total spent
    if (quantityInBtc > 0) {
      const calculatedTotal = quantityInBtc * pricePerCoinNum;
      result.totalSpent = calculatedTotal > 0 ? calculatedTotal.toString() : "";
    }
    // If total spent is filled, calculate quantity
    else if (totalSpentNum > 0) {
      const calculatedQuantity = totalSpentNum / pricePerCoinNum;
      if (calculatedQuantity > 0) {
        const finalQuantity = quantityUnit === "SATS" 
          ? Math.floor(calculatedQuantity * 100000000).toString()
          : calculatedQuantity.toString();
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
  const decimalSeparator = isBRL ? ',' : '.';
  const thousandsSeparator = isBRL ? '.' : ',';
  
  // Remove any thousands separators first
  const cleanValue = value.replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '');
  
  // Check if it uses the correct decimal separator
  if (cleanValue.includes('.') && cleanValue.includes(',')) {
    return false; // Cannot have both separators
  }
  
  if (isBRL) {
    // For BRL, decimal should be comma, no dots allowed except as thousands
    return !cleanValue.includes('.') || cleanValue.indexOf('.') < cleanValue.lastIndexOf(',');
  } else {
    // For USD, decimal should be dot, no commas allowed except as thousands  
    return !cleanValue.includes(',') || cleanValue.indexOf(',') < cleanValue.lastIndexOf('.');
  }
};

/**
 * Normalizes input value to standard number format (with dot as decimal separator)
 * @param value - The input value
 * @param currency - The currency (USD/BRL)
 * @returns Normalized value
 */
export const normalizeDecimalInput = (value: string, currency: string): string => {
  if (!value) return "";
  
  const isBRL = currency === 'BRL';
  
  if (isBRL) {
    // For BRL: replace comma with dot for calculation
    return value.replace(/\./g, '').replace(',', '.');
  } else {
    // For USD: remove commas (thousands separator)
    return value.replace(/,/g, '');
  }
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