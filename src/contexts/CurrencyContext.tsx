import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';

interface CurrencyContextType {
  currency: 'USD' | 'BRL';
  exchangeRate: number;
  loading: boolean;
  updateCurrency: (newCurrency: 'USD' | 'BRL') => void;
  formatCurrency: (amount: number) => string;
  formatNumber: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useUserSettings();
  const [exchangeRate, setExchangeRate] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setExchangeRate(data.rates.BRL || 5.5); // Fallback rate
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      setExchangeRate(5.5); // Fallback rate
    }
  };

  useEffect(() => {
    fetchExchangeRate();
    // Update exchange rate every 30 minutes
    const interval = setInterval(fetchExchangeRate, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const updateCurrency = async (newCurrency: 'USD' | 'BRL') => {
    if (settings && newCurrency !== settings.preferred_currency) {
      setLoading(true);
      try {
        await updateSettings({ preferred_currency: newCurrency });
      } catch (error) {
        console.error('Error updating currency:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = settings?.preferred_currency || 'USD';
    const value = currency === 'BRL' ? amount * exchangeRate : amount;
    
    return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (amount: number) => {
    const currency = settings?.preferred_currency || 'USD';
    
    return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{
      currency: settings?.preferred_currency || 'USD',
      exchangeRate,
      loading,
      updateCurrency,
      formatCurrency,
      formatNumber
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}