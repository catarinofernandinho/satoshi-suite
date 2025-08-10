import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { normalizeDecimalInput } from "@/utils/numberUtils";

export default function CurrencyConverter() {
  const [rates, setRates] = useState({
    btcUsd: 0,
    usdBrl: 0
  });
  const [values, setValues] = useState({
    btc: "",
    sats: "",
    usd: "",
    brl: ""
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();
  const { formatNumber, currency } = useCurrency();

  // Memoize fetch function to prevent unnecessary re-renders
  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch BTC/USD and USD/BRL rates in parallel
      const [btcResponse, brlResponse] = await Promise.all([
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', {
          signal: AbortSignal.timeout(10000) // 10s timeout
        }),
        fetch('https://api.exchangerate-api.com/v4/latest/USD', {
          signal: AbortSignal.timeout(10000) // 10s timeout
        })
      ]);

      if (!btcResponse.ok || !brlResponse.ok) {
        throw new Error('Network response was not ok');
      }

      const [btcData, brlData] = await Promise.all([
        btcResponse.json(),
        brlResponse.json()
      ]);

      const newRates = {
        btcUsd: btcData.bitcoin?.usd || 0,
        usdBrl: brlData.rates?.BRL || 0
      };

      setRates(newRates);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      toast({
        title: "Erro ao buscar cotações",
        description: "Não foi possível atualizar as cotações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRates();
  }, []);

  // Limita casas decimais para valores fiat (máx 2) respeitando separador
  const limitFiatDecimals = (val: string, currencyCode: string) => {
    if (!val) return "";
    const sep = currencyCode === 'BRL' ? ',' : '.';
    const parts = val.split(sep);
    if (parts.length === 1) return val;
    const [intPart, decPart] = parts;
    return `${intPart}${sep}${(decPart || '').slice(0, 2)}`;
  };

  // Memoize conversion calculations for better performance
  const updateValues = useCallback((field: string, value: string) => {
    // Sanitize fiat inputs to max 2 decimals and normalize for parsing
    let displayValue = value;
    let num: number;

    if (field === 'usd' || field === 'brl') {
      displayValue = limitFiatDecimals(value, currency);
      const normalized = normalizeDecimalInput(displayValue, currency);
      num = parseFloat(normalized);
    } else {
      num = parseFloat(value);
    }

    if (!displayValue || isNaN(num) || rates.btcUsd === 0 || rates.usdBrl === 0) {
      setValues({ btc: "", sats: "", usd: "", brl: "" });
      return;
    }

    const newValues = { ...values };

    switch (field) {
      case 'btc':
        newValues.btc = displayValue;
        newValues.sats = (num * 100000000).toString();
        newValues.usd = formatNumber(num * rates.btcUsd);
        newValues.brl = formatNumber(num * rates.btcUsd * rates.usdBrl);
        break;
      case 'sats':
        newValues.sats = displayValue;
        newValues.btc = (num / 100000000).toFixed(8);
        newValues.usd = formatNumber((num / 100000000) * rates.btcUsd);
        newValues.brl = formatNumber((num / 100000000) * rates.btcUsd * rates.usdBrl);
        break;
      case 'usd':
        newValues.usd = displayValue;
        newValues.btc = (num / rates.btcUsd).toFixed(8);
        newValues.sats = Math.floor((num / rates.btcUsd) * 100000000).toString();
        newValues.brl = formatNumber(num * rates.usdBrl);
        break;
      case 'brl':
        newValues.brl = displayValue;
        newValues.usd = formatNumber(num / rates.usdBrl);
        newValues.btc = (num / (rates.btcUsd * rates.usdBrl)).toFixed(8);
        newValues.sats = Math.floor((num / (rates.btcUsd * rates.usdBrl)) * 100000000).toString();
        break;
    }

    setValues(newValues);
  }, [rates.btcUsd, rates.usdBrl, formatNumber, values, currency]);

  const copyToClipboard = async (field: string) => {
    const value = values[field as keyof typeof values];
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      
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

  // Memoize rate display to prevent unnecessary re-renders
  const rateDisplay = useMemo(() => {
    if (loading) {
      return <div className="text-muted-foreground">Buscando cotações atualizadas...</div>;
    }
    
    return (
      <div className="space-y-1 text-sm text-muted-foreground">
        <div>BTC/USD: US$ {currency === 'BRL' ? rates.btcUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : rates.btcUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div>USD/BRL: R$ {currency === 'BRL' ? rates.usdBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : rates.usdBrl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
    );
  }, [loading, currency, rates.btcUsd, rates.usdBrl]);

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
              placeholder={currency === 'BRL' ? "0,00000000" : "0.00000000"}
              value={values.btc}
              onChange={(e) => updateValues('btc', e.target.value)}
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
              placeholder="0"
              value={values.sats}
              onChange={(e) => updateValues('sats', e.target.value)}
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
              placeholder={currency === 'BRL' ? "0,00" : "0.00"}
              value={values.usd}
              onChange={(e) => updateValues('usd', e.target.value)}
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
              placeholder={currency === 'BRL' ? "0,00" : "0.00"}
              value={values.brl}
              onChange={(e) => updateValues('brl', e.target.value)}
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
          onClick={fetchRates} 
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
              placeholder={currency === 'BRL' ? "0,00000000" : "0.00000000"}
              value={values.btc}
              onChange={(e) => updateValues('btc', e.target.value)}
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
              placeholder="0"
              value={values.sats}
              onChange={(e) => updateValues('sats', e.target.value)}
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
              placeholder={currency === 'BRL' ? "0,00" : "0.00"}
              value={values.usd}
              onChange={(e) => updateValues('usd', e.target.value)}
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
              placeholder={currency === 'BRL' ? "0,00" : "0.00"}
              value={values.brl}
              onChange={(e) => updateValues('brl', e.target.value)}
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
          onClick={fetchRates} 
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