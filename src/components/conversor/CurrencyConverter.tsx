import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useBitcoinPrice } from "@/hooks/useBitcoinPrice";
import { errorHandler } from "@/lib/errorHandler";
import { bitcoinPriceApi } from "@/lib/apiClient";

function CurrencyConverter() {
  const { currency } = useCurrency();
  const { btcPrice: btcUsdPrice, loading: btcLoading, refetch: refetchBtc } = useBitcoinPrice(currency);
  const [usdBrlRate, setUsdBrlRate] = useState(0);
  const [values, setValues] = useState({
    btc: "",
    sats: "",
    usd: "",
    brl: ""
  });
  const [brlLoading, setBrlLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();
  
  const loading = btcLoading || brlLoading;
  const rates = useMemo(() => ({
    btcUsd: btcUsdPrice,
    usdBrl: usdBrlRate
  }), [btcUsdPrice, usdBrlRate]);

  // Format value according to currency preference - exact replica of HTML logic
  const formatValue = useCallback((value: number, decimals: number) => {
    if (currency === 'BRL') {
      // Brazilian formatting: 1.000.000,00
      let numStr = value.toFixed(decimals);
      let parts = numStr.split('.');
      let intPart = parts[0];
      let decPart = parts.length > 1 ? parts[1] : '';
      
      // Add thousand separators to integer part
      intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      // Return formatted number with comma for decimals
      return intPart + (decPart ? ',' + decPart : '');
    } else {
      // US formatting for USD preference
      return value.toLocaleString('en-US', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
      });
    }
  }, [currency]);

  // Parse input value - handle both comma and dot as decimal separator for BRL
  const parseInputValue = useCallback((value: string) => {
    if (!value) return 0;
    
    if (currency === 'BRL') {
      // Remove thousand separators (dots) and replace comma with dot for parsing
      const cleanValue = value.replace(/\./g, '').replace(',', '.');
      return parseFloat(cleanValue) || 0;
    } else {
      // For USD, standard parsing
      return parseFloat(value.replace(/,/g, '')) || 0;
    }
  }, [currency]);

  // Clear all inputs
  const clearInputs = useCallback(() => {
    setValues({ btc: "", sats: "", usd: "", brl: "" });
  }, []);

  // Handle input changes - exact replica of HTML logic
  const handleInput = useCallback((source: string, inputValue: string) => {
    // Check if rates are available
    if (rates.btcUsd <= 0 || rates.usdBrl <= 0) {
      return;
    }

    const numValue = parseInputValue(inputValue);
    
    if (!inputValue || isNaN(numValue)) {
      clearInputs();
      return;
    }

    let btcValue: number;
    
    // Convert to BTC first - exact HTML logic
    switch (source) {
      case 'btc':
        btcValue = numValue;
        break;
      case 'sats':
        btcValue = numValue / 100000000;
        break;
      case 'usd':
        btcValue = numValue / rates.btcUsd;
        break;
      case 'brl':
        btcValue = numValue / (rates.btcUsd * rates.usdBrl);
        break;
      default:
        return;
    }

    // Convert BTC to all currencies
    const satoshiValue = btcValue * 100000000;
    const usdValue = btcValue * rates.btcUsd;
    const brlValue = btcValue * rates.btcUsd * rates.usdBrl;

    // Update all fields except the source field
    const newValues = { ...values };
    
    if (source !== 'btc') {
      newValues.btc = formatValue(btcValue, 8);
    } else {
      newValues.btc = inputValue; // Keep original input
    }
    
    if (source !== 'sats') {
      newValues.sats = formatValue(satoshiValue, 0);
    } else {
      newValues.sats = inputValue; // Keep original input
    }
    
    if (source !== 'usd') {
      newValues.usd = formatValue(usdValue, 2);
    } else {
      newValues.usd = inputValue; // Keep original input
    }
    
    if (source !== 'brl') {
      newValues.brl = formatValue(brlValue, 2);
    } else {
      newValues.brl = inputValue; // Keep original input
    }

    setValues(newValues);
  }, [rates.btcUsd, rates.usdBrl, parseInputValue, formatValue, values, clearInputs]);

  // Fetch USD/BRL rate function using optimized API client
  const fetchBrlRate = useCallback(async () => {
    setBrlLoading(true);
    try {
      const rate = await bitcoinPriceApi.fetchExchangeRate('USD', 'BRL');
      setUsdBrlRate(rate);
      setLastUpdated(new Date());

      // Recalculate conversions if any field has value
      if (values.btc) handleInput('btc', values.btc);
      else if (values.sats) handleInput('sats', values.sats);
      else if (values.usd) handleInput('usd', values.usd);
      else if (values.brl) handleInput('brl', values.brl);
      
    } catch (error) {
      errorHandler.log({
        code: 'BRL_RATE_FETCH_FAILED',
        message: 'Failed to fetch USD/BRL rate',
        severity: 'low'
      });
      toast({
        title: "Erro ao buscar cotação BRL",
        description: "Não foi possível atualizar a cotação BRL. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setBrlLoading(false);
    }
  }, [toast, values, handleInput]);

  // Combined refresh function
  const refreshRates = useCallback(async () => {
    await Promise.all([refetchBtc(), fetchBrlRate()]);
  }, [refetchBtc, fetchBrlRate]);

  useEffect(() => {
    fetchBrlRate();
  }, [fetchBrlRate]);

  // Copy to clipboard with enhanced feedback
  const copyToClipboard = async (field: string) => {
    const value = values[field as keyof typeof values];
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
      
      toast({
        title: "Valor copiado!",
        description: `${value} foi copiado para a área de transferência.`
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o valor.",
        variant: "destructive"
      });
    }
  };

  // Rate display with proper formatting
  const rateDisplay = useMemo(() => {
    if (loading) {
      return <div className="text-muted-foreground">Buscando cotações atualizadas...</div>;
    }
    
    return (
      <div className="space-y-1 text-sm text-muted-foreground">
        <div>BTC/USD: US$ {formatValue(rates.btcUsd, 2)}</div>
        <div>USD/BRL: R$ {formatValue(rates.usdBrl, 2)}</div>
      </div>
    );
  }, [loading, rates.btcUsd, rates.usdBrl, formatValue]);

  // Get placeholders based on currency preference
  const getPlaceholder = (type: 'btc' | 'sats' | 'fiat') => {
    if (currency === 'BRL') {
      switch (type) {
        case 'btc': return "0,00000000";
        case 'sats': return "0";
        case 'fiat': return "0,00";
      }
    } else {
      switch (type) {
        case 'btc': return "0.00000000";
        case 'sats': return "0";
        case 'fiat': return "0.00";
      }
    }
  };

  return (
    <>
      {/* Mobile: Full width without card */}
      <div className="block sm:hidden w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Conversor de Satoshi</h2>
          {rateDisplay}
        </div>

        <div className="space-y-4">
          {/* BTC Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder={getPlaceholder('btc')}
              value={values.btc}
              onChange={(e) => handleInput('btc', e.target.value)}
              className="pr-20"
            />
            <button
              onClick={() => copyToClipboard('btc')}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-bitcoin/20 text-bitcoin rounded text-sm font-medium hover:bg-bitcoin/30 transition-colors flex items-center gap-1"
            >
              {copiedField === 'btc' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              ₿ BTC
            </button>
          </div>

          {/* SATS Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder={getPlaceholder('sats')}
              value={values.sats}
              onChange={(e) => handleInput('sats', e.target.value)}
              className="pr-20"
            />
            <button
              onClick={() => copyToClipboard('sats')}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-bitcoin/20 text-bitcoin rounded text-sm font-medium hover:bg-bitcoin/30 transition-colors flex items-center gap-1"
            >
              {copiedField === 'sats' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              ₿ SATS
            </button>
          </div>

          {/* USD Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder={getPlaceholder('fiat')}
              value={values.usd}
              onChange={(e) => handleInput('usd', e.target.value)}
              className="pr-20"
            />
            <button
              onClick={() => copyToClipboard('usd')}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary/20 text-primary rounded text-sm font-medium hover:bg-primary/30 transition-colors flex items-center gap-1"
            >
              {copiedField === 'usd' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              $ USD
            </button>
          </div>

          {/* BRL Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder={getPlaceholder('fiat')}
              value={values.brl}
              onChange={(e) => handleInput('brl', e.target.value)}
              className="pr-20"
            />
            <button
              onClick={() => copyToClipboard('brl')}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-accent/20 text-accent-foreground rounded text-sm font-medium hover:bg-accent/30 transition-colors flex items-center gap-1"
            >
              {copiedField === 'brl' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              R$ BRL
            </button>
          </div>
        </div>

        <Button 
          onClick={refreshRates} 
          disabled={loading}
          variant="outline" 
          className="w-full mt-6 gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar cotações
        </Button>

        {lastUpdated && (
          <div className="text-center text-xs text-muted-foreground mt-4">
            Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground mt-4 border-t border-border pt-4">
          1 BTC = 100.000.000 satoshis • Clique na moeda para copiar o valor
        </div>
      </div>

      {/* Tablet and Desktop: With card */}
      <Card className="hidden sm:block card-shadow bg-gradient-card p-6 max-w-md mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Conversor de Satoshi</h2>
          {rateDisplay}
        </div>

        <div className="space-y-4">
          {/* BTC Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder={getPlaceholder('btc')}
              value={values.btc}
              onChange={(e) => handleInput('btc', e.target.value)}
              className="pr-20"
            />
            <button
              onClick={() => copyToClipboard('btc')}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-bitcoin/20 text-bitcoin rounded text-sm font-medium hover:bg-bitcoin/30 transition-colors flex items-center gap-1"
            >
              {copiedField === 'btc' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              ₿ BTC
            </button>
          </div>

          {/* SATS Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder={getPlaceholder('sats')}
              value={values.sats}
              onChange={(e) => handleInput('sats', e.target.value)}
              className="pr-20"
            />
            <button
              onClick={() => copyToClipboard('sats')}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-bitcoin/20 text-bitcoin rounded text-sm font-medium hover:bg-bitcoin/30 transition-colors flex items-center gap-1"
            >
              {copiedField === 'sats' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              ₿ SATS
            </button>
          </div>

          {/* USD Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder={getPlaceholder('fiat')}
              value={values.usd}
              onChange={(e) => handleInput('usd', e.target.value)}
              className="pr-20"
            />
            <button
              onClick={() => copyToClipboard('usd')}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary/20 text-primary rounded text-sm font-medium hover:bg-primary/30 transition-colors flex items-center gap-1"
            >
              {copiedField === 'usd' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              $ USD
            </button>
          </div>

          {/* BRL Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder={getPlaceholder('fiat')}
              value={values.brl}
              onChange={(e) => handleInput('brl', e.target.value)}
              className="pr-20"
            />
            <button
              onClick={() => copyToClipboard('brl')}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-accent/20 text-accent-foreground rounded text-sm font-medium hover:bg-accent/30 transition-colors flex items-center gap-1"
            >
              {copiedField === 'brl' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              R$ BRL
            </button>
          </div>
        </div>

        <Button 
          onClick={refreshRates} 
          disabled={loading}
          variant="outline" 
          className="w-full mt-6 gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar cotações
        </Button>

        {lastUpdated && (
          <div className="text-center text-xs text-muted-foreground mt-4">
            Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground mt-4 border-t border-border pt-4">
          1 BTC = 100.000.000 satoshis • Clique na moeda para copiar o valor
        </div>
      </Card>
    </>
  );
}

export default memo(CurrencyConverter);