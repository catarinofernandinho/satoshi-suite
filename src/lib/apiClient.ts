// Optimized API client with retry logic, caching, and error handling

import { cache } from './performance';
import { errorHandler } from './errorHandler';

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  cache?: boolean;
  cacheTTL?: number;
  retries?: number;
  timeout?: number;
}

class ApiClient {
  private baseURL: string = '';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  async request<T>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      cache: useCache = method === 'GET',
      cacheTTL = 300000, // 5 minutes
      retries = 3,
      timeout = 10000
    } = config;

    const cacheKey = `${method}:${url}:${JSON.stringify(body)}`;

    // Check cache for GET requests
    if (useCache && method === 'GET') {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestHeaders = { ...this.defaultHeaders, ...headers };
    
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseURL}${url}`, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache successful GET responses
        if (useCache && method === 'GET') {
          cache.set(cacheKey, data, cacheTTL);
        }

        return data;

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on abort or client errors
        if (error instanceof Error && (
          error.name === 'AbortError' ||
          error.message.includes('HTTP 4')
        )) {
          break;
        }

        if (attempt < retries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    clearTimeout(timeoutId);

    errorHandler.log({
      code: 'API_REQUEST_FAILED',
      message: `Failed to fetch ${url}: ${lastError.message}`,
      severity: 'medium',
      context: {
        url,
        method,
        attempts: retries + 1
      }
    });

    throw lastError;
  }

  get<T>(url: string, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  post<T>(url: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'POST', body });
  }

  put<T>(url: string, body?: any, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'PUT', body });
  }

  delete<T>(url: string, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

// Optimized Bitcoin price fetcher
export const bitcoinPriceApi = {
  async fetchPrice(): Promise<{btc_usd: number; btc_brl: number; change_24h: number}> {
    try {
      const data = await apiClient.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_24hr_change=true', {
        cache: true,
        cacheTTL: 60000, // 1 minute cache
      }) as any;

      return {
        btc_usd: data.bitcoin.usd,
        btc_brl: data.bitcoin.brl,
        change_24h: data.bitcoin.usd_24h_change || 0
      };
    } catch (error) {
      // Fallback to CoinDesk API
      try {
        const coinDeskData = await apiClient.get('https://api.coindesk.com/v1/bpi/currentprice/USD.json', {
          cache: true,
          cacheTTL: 60000,
        }) as any;
        
        return {
          btc_usd: coinDeskData.bpi.USD.rate_float,
          btc_brl: coinDeskData.bpi.USD.rate_float * 5.5, // Fallback rate
          change_24h: 0
        };
      } catch (fallbackError) {
        throw new Error('All Bitcoin price APIs failed');
      }
    }
  },

  // Exchange rate API with multiple fallbacks
  async fetchExchangeRate(from: string = 'USD', to: string = 'BRL'): Promise<number> {
    const endpoints = [
      `https://api.exchangerate-api.com/v4/latest/${from}`,
      `https://economia.awesomeapi.com.br/json/last/${from}-${to}`,
      `https://api.fixer.io/latest?base=${from}&symbols=${to}`
    ];

    for (const endpoint of endpoints) {
      try {
        if (endpoint.includes('awesomeapi')) {
          const data = await apiClient.get(`https://economia.awesomeapi.com.br/json/last/${from}-${to}`, {
            cache: true,
            cacheTTL: 3600000,
          }) as any;
          const key = `${from}${to}`;
          return parseFloat(data[key]?.bid) || 0;
        } else {
          const data = await apiClient.get(endpoint, {
            cache: true,
            cacheTTL: 3600000,
          }) as any;
          return data.rates[to] || 0;
        }
      } catch (error) {
        continue; // Try next endpoint
      }
    }

    // Final fallback rates
    const fallbackRates: Record<string, number> = {
      'USD-BRL': 5.2,
      'BRL-USD': 0.19,
      'EUR-USD': 1.1,
      'USD-EUR': 0.91
    };

    const fallbackKey = `${from}-${to}`;
    const fallbackRate = fallbackRates[fallbackKey] || 1;
    
    errorHandler.log({
      code: 'EXCHANGE_RATE_FALLBACK',
      message: `All exchange rate APIs failed, using fallback rate for ${from}/${to}: ${fallbackRate}`,
      severity: 'medium'
    });
    
    return fallbackRate;
  }
};