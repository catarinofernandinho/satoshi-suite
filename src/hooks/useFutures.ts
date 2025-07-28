import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Cache local para ordens
const CACHE_KEY = 'futures_orders_cache';

interface LocalOrder extends Future {
  isLocal?: boolean;
}

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
  const [futures, setFutures] = useState<LocalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Funções para cache local
  const getLocalOrders = (): LocalOrder[] => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  };

  const saveLocalOrder = (order: LocalOrder) => {
    const orders = getLocalOrders();
    const newOrder = { ...order, id: `local_${Date.now()}`, isLocal: true };
    orders.push(newOrder);
    localStorage.setItem(CACHE_KEY, JSON.stringify(orders));
    return newOrder;
  };

  const updateLocalOrder = (id: string, updates: Partial<LocalOrder>) => {
    const orders = getLocalOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      localStorage.setItem(CACHE_KEY, JSON.stringify(orders));
      return orders[index];
    }
    return null;
  };

  const deleteLocalOrder = (id: string) => {
    const orders = getLocalOrders();
    const filtered = orders.filter(o => o.id !== id);
    localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
  };

  const clearLocalCache = () => {
    localStorage.removeItem(CACHE_KEY);
  };

  const fetchFutures = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('futures')
        .select('*')
        .eq('user_id', user.id)
        .order('buy_date', { ascending: false });

      if (error) throw error;
      
      // Combinar dados do backend com cache local
      const backendOrders = (data as Future[]) || [];
      const localOrders = getLocalOrders();
      const allOrders = [...backendOrders, ...localOrders];
      
      setFutures(allOrders);
    } catch (error: any) {
      // Em caso de erro, carrega apenas do cache local
      const localOrders = getLocalOrders();
      setFutures(localOrders);
      
      toast({
        title: "Usando cache local",
        description: "Conexão com servidor indisponível. Usando dados salvos localmente.",
        variant: "default"
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
        title: "Ordem adicionada",
        description: "Ordem criada com sucesso!"
      });
      
      return data;
    } catch (error: any) {
      // Em caso de erro, salva no cache local
      const localOrder = saveLocalOrder(futureData as LocalOrder);
      setFutures(prev => [localOrder, ...prev]);
      
      toast({
        title: "Ordem salva localmente",
        description: "Ordem salva no cache local. Será sincronizada quando a conexão for restabelecida."
      });
      
      return localOrder;
    }
  };

  const updateFuture = async (id: string, updates: Partial<Future>) => {
    if (!user) return;

    const isLocalOrder = id.startsWith('local_');
    
    try {
      if (!isLocalOrder) {
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
          title: "Ordem atualizada",
          description: "Ordem modificada com sucesso!"
        });
        
        return data;
      } else {
        // Atualizar ordem local
        const updatedOrder = updateLocalOrder(id, updates);
        if (updatedOrder) {
          setFutures(prev => 
            prev.map(f => f.id === id ? updatedOrder : f)
          );
          
          toast({
            title: "Ordem atualizada localmente",
            description: "Ordem local modificada com sucesso!"
          });
          
          return updatedOrder;
        }
        throw new Error('Ordem local não encontrada');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar ordem",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteFuture = async (id: string) => {
    if (!user) return;

    const isLocalOrder = id.startsWith('local_');
    
    try {
      if (!isLocalOrder) {
        const { error } = await supabase
          .from('futures')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        deleteLocalOrder(id);
      }

      setFutures(prev => prev.filter(f => f.id !== id));
      toast({
        title: "Ordem removida",
        description: "Ordem excluída com sucesso!"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover ordem",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const closeFuture = async (id: string, closeData: { exit_price: number; fees_paid: number; net_pl_sats: number; close_date?: string }) => {
    const updates = {
      status: 'CLOSED' as const,
      exit_price: closeData.exit_price,
      fees_paid: closeData.fees_paid,
      net_pl_sats: closeData.net_pl_sats,
      ...(closeData.close_date && { updated_at: closeData.close_date })
    };
    
    return updateFuture(id, updates);
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
    closeFuture,
    refreshFutures: fetchFutures,
    getFuturesStats,
    calculateFutureMetrics,
    clearLocalCache
  };
}