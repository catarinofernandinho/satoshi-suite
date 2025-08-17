import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useAuth } from '@/hooks/useAuth';
import { bitcoinPriceApi } from '@/lib/apiClient';
import { errorHandler } from '@/lib/errorHandler';

interface CurrencyContextType {
  currency: 'USD' | 'BRL';
  exchangeRate: number;
  loading: boolean;
  updateCurrency: (newCurrency: 'USD' | 'BRL') => void;
  formatCurrency: (amount: number, skipConversion?: boolean) => string;
  formatNumber: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const GUEST_SETTINGS_KEY = 'guest_preferred_currency';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useUserSettings();
  const { user } = useAuth();
  const [exchangeRate, setExchangeRate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [guestCurrency, setGuestCurrency] = useState<'USD' | 'BRL'>(() => {
    // Initialize guest currency from localStorage
    const saved = localStorage.getItem(GUEST_SETTINGS_KEY);
    return (saved as 'USD' | 'BRL') || 'USD';
  });

  const fetchExchangeRate = async () => {
    try {
      const rate = await bitcoinPriceApi.fetchExchangeRate();
      setExchangeRate(rate);
    } catch (error) {
      errorHandler.log({
        code: 'EXCHANGE_RATE_FETCH_FAILED',
        message: 'Failed to fetch USD/BRL exchange rate',
        severity: 'low'
      });
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
    if (user && settings) {
      // For logged-in users, update in database
      if (newCurrency !== settings.preferred_currency) {
        setLoading(true);
        try {
          await updateSettings({ preferred_currency: newCurrency });
        } catch (error) {
          errorHandler.log({
            code: 'CURRENCY_UPDATE_FAILED',
            message: 'Failed to update currency preference',
            severity: 'low',
            context: { newCurrency, error }
          });
        } finally {
          setLoading(false);
        }
      }
    } else {
      // For guest users, update localStorage
      localStorage.setItem(GUEST_SETTINGS_KEY, newCurrency);
      setGuestCurrency(newCurrency);
    }
  };

  // Get current currency: user settings if logged in, guest settings if not
  const currentCurrency = user ? (settings?.preferred_currency || 'USD') : guestCurrency;

  const formatCurrency = (amount: number, skipConversion = false) => {
    // If skipConversion is true, the value is already in the target currency
    const value = skipConversion ? amount : (currentCurrency === 'BRL' ? amount * exchangeRate : amount);
    
    return new Intl.NumberFormat(currentCurrency === 'BRL' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: currentCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat(currentCurrency === 'BRL' ? 'pt-BR' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{
      currency: currentCurrency,
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