import { useState, useEffect, useCallback } from 'react';

interface BitcoinPriceData {
  price: number;
  priceChange: number;
  loading: boolean;
  lastUpdate: number;
}

const CACHE_DURATION = 60000; // 1 minute cache
const LOCALSTORAGE_KEYS = {
  PRICE: 'lastBtcPrice',
  CHANGE: 'lastBtcPriceChange',
  TIMESTAMP: 'lastBtcPriceTimestamp',
  CURRENCY: 'lastBtcPriceCurrency'
};

export function useBitcoinPrice(currency: string = 'USD') {
  const [data, setData] = useState<BitcoinPriceData>(() => {
    // Initialize with cached data if available and currency matches
    const cachedPrice = localStorage.getItem(LOCALSTORAGE_KEYS.PRICE);
    const cachedChange = localStorage.getItem(LOCALSTORAGE_KEYS.CHANGE);
    const cachedTimestamp = localStorage.getItem(LOCALSTORAGE_KEYS.TIMESTAMP);
    const cachedCurrency = localStorage.getItem(LOCALSTORAGE_KEYS.CURRENCY);
    
    // Only use cached data if currency matches current currency
    const shouldUseCachedData = cachedCurrency === currency && cachedPrice && cachedChange && cachedTimestamp;
    
    return {
      price: shouldUseCachedData ? parseFloat(cachedPrice) : 100000,
      priceChange: shouldUseCachedData ? parseFloat(cachedChange) : 0,
      loading: false,
      lastUpdate: shouldUseCachedData ? parseInt(cachedTimestamp) : 0
    };
  });

  const fetchPrice = useCallback(async () => {
    const now = Date.now();
    const cachedCurrency = localStorage.getItem(LOCALSTORAGE_KEYS.CURRENCY);
    
    // Check if cache is still valid AND currency hasn't changed
    if (now - data.lastUpdate < CACHE_DURATION && data.lastUpdate > 0 && cachedCurrency === currency) {
      return;
    }

    setData(prev => ({ ...prev, loading: true }));

    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_24hr_change=true');
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const apiData = await response.json();
      
      if (apiData.bitcoin) {
        const price = currency === 'BRL' ? apiData.bitcoin.brl : apiData.bitcoin.usd;
        const priceChange = currency === 'BRL' ? (apiData.bitcoin.brl_24h_change || 0) : (apiData.bitcoin.usd_24h_change || 0);
        
        // Cache the data with currency
        localStorage.setItem(LOCALSTORAGE_KEYS.PRICE, price.toString());
        localStorage.setItem(LOCALSTORAGE_KEYS.CHANGE, priceChange.toString());
        localStorage.setItem(LOCALSTORAGE_KEYS.TIMESTAMP, now.toString());
        localStorage.setItem(LOCALSTORAGE_KEYS.CURRENCY, currency);
        
        setData({
          price,
          priceChange,
          loading: false,
          lastUpdate: now
        });
      }
    } catch (error) {
      console.error('Failed to fetch BTC price:', error);
      // Keep existing cached data on error
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [currency, data.lastUpdate]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  const refetch = useCallback(() => {
    setData(prev => ({ ...prev, lastUpdate: 0 }));
    fetchPrice();
  }, [fetchPrice]);

  return {
    btcPrice: data.price,
    btcPriceChange: data.priceChange,
    loading: data.loading,
    refetch
  };
}
