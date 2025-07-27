import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Future {
  id: string;
  direction: "LONG" | "SHORT";
  entry_price: number;
  exit_price?: number;
  target_price?: number;
  quantity_usd: number;
  leverage: number;
  status: "OPEN" | "CLOSED" | "STOP" | "CANCELLED";
  percent_gain?: number;
  percent_fee?: number;
  fees_paid?: number;
  net_pl_sats?: number;
  buy_date: string;
  created_at: string;
  updated_at: string;
}

export function useFutures() {
  const [futures, setFutures] = useState<Future[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFutures = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('futures')
        .select('*')
        .eq('user_id', user.id)
        .order('buy_date', { ascending: false });

      if (error) throw error;
      
      setFutures((data as Future[]) || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar futuros",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateFutureMetrics = (future: Future, currentBtcPrice: number) => {
    if (future.status === "OPEN") {
      const days_open = Math.floor((Date.now() - new Date(future.buy_date).getTime()) / (1000 * 60 * 60 * 24));
      const fixed_fee = 0.055; // 0.055% fee
      const daily_fee = 0.0026; // 0.0026% daily funding fee
      
      const total_fee_percent = fixed_fee + (daily_fee * days_open);
      const unrealized_gain = future.direction === "LONG" 
        ? ((currentBtcPrice - future.entry_price) / future.entry_price) * 100 * future.leverage
        : ((future.entry_price - currentBtcPrice) / future.entry_price) * 100 * future.leverage;
      
      const net_gain_percent = unrealized_gain - total_fee_percent;
      const net_pl_usd = (future.quantity_usd * net_gain_percent) / 100;
      const net_pl_sats = (net_pl_usd / currentBtcPrice) * 100000000; // Convert to satoshis

      return {
        percent_gain: unrealized_gain,
        percent_fee: total_fee_percent,
        net_pl_sats: net_pl_sats,
        fees_paid: (future.quantity_usd * total_fee_percent) / 100
      };
    }
    
    return {
      percent_gain: future.percent_gain,
      percent_fee: future.percent_fee,
      net_pl_sats: future.net_pl_sats,
      fees_paid: future.fees_paid
    };
  };

  const addFuture = async (futureData: Omit<Future, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('futures')
        .insert([
          {
            ...futureData,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setFutures(prev => [data as Future, ...prev]);
      toast({
        title: "Futuro adicionado",
        description: "Contrato futuro criado com sucesso!"
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar futuro",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateFuture = async (id: string, updates: Partial<Future>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('futures')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setFutures(prev => 
        prev.map(f => f.id === id ? data as Future : f)
      );
      
      toast({
        title: "Futuro atualizado",
        description: "Contrato futuro modificado com sucesso!"
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar futuro",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteFuture = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('futures')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setFutures(prev => prev.filter(f => f.id !== id));
      toast({
        title: "Futuro removido",
        description: "Contrato futuro excluído com sucesso!"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover futuro",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const getFuturesStats = (btcCurrentPrice: number) => {
    const openFutures = futures.filter(f => f.status === 'OPEN');
    const closedFutures = futures.filter(f => f.status === 'CLOSED');
    
    let totalUnrealizedPL = 0;
    let totalRealizedPL = 0;
    let totalFeesUSD = 0;

    openFutures.forEach(future => {
      const metrics = calculateFutureMetrics(future, btcCurrentPrice);
      totalUnrealizedPL += (metrics.net_pl_sats || 0) / 100000000 * btcCurrentPrice;
      totalFeesUSD += metrics.fees_paid || 0;
    });

    closedFutures.forEach(future => {
      totalRealizedPL += (future.net_pl_sats || 0) / 100000000 * btcCurrentPrice;
    });

    return {
      totalOpenPositions: openFutures.length,
      totalClosedPositions: closedFutures.length,
      totalUnrealizedPL,
      totalRealizedPL,
      totalFeesUSD,
      totalPL: totalUnrealizedPL + totalRealizedPL
    };
  };

  useEffect(() => {
    fetchFutures();
  }, [user]);

  return {
    futures,
    loading,
    addFuture,
    updateFuture,
    deleteFuture,
    refreshFutures: fetchFutures,
    getFuturesStats,
    calculateFutureMetrics
  };
}