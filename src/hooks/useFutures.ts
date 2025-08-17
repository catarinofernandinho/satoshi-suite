import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { validateFutureData, validateUserContext, sanitizeFutureData } from '@/utils/validation';
import { errorHandler } from '@/lib/errorHandler';

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
  
  status: "OPEN" | "CLOSED" | "STOP" | "CANCELLED";
  percent_gain?: number;
  percent_fee?: number;
  fees_paid?: number;
  net_pl_sats?: number;
  pl_sats?: number;
  buy_date: string;
  close_date?: string;
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
      
      const backendOrders = (data as Future[]) || [];
      
      // Sincronizar ordens locais com o backend se existirem
      await syncLocalOrdersToBackend();
      
      setFutures(backendOrders);
      
      // Limpar cache local após sincronização bem-sucedida
      if (backendOrders.length > 0) {
        clearLocalCache();
      }
      
    } catch (error: any) {
      errorHandler.log({
        code: 'FUTURES_FETCH_FAILED',
        message: 'Failed to fetch futures data',
        severity: 'medium',
        context: { error: error.message }
      });
      
      // Em caso de erro, carrega apenas do cache local
      const localOrders = getLocalOrders();
      setFutures(localOrders);
      
      if (localOrders.length > 0) {
        toast({
          title: "Modo offline",
          description: "Usando dados salvos localmente. Dados serão sincronizados quando a conexão for restabelecida.",
          variant: "default"
        });
      }
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
      ? ((currentBtcPrice - future.entry_price) / future.entry_price) * 100
      : ((future.entry_price - currentBtcPrice) / future.entry_price) * 100;
      
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

  // Função para sincronizar ordens locais com o backend
  const syncLocalOrdersToBackend = async () => {
    if (!user) return;
    
    const localOrders = getLocalOrders();
    for (const order of localOrders) {
      try {
        const price = order.target_price ?? order.exit_price ?? null;
        const { error } = await supabase
        .from('futures')
        .insert({
          user_id: user.id,
          direction: order.direction,
          entry_price: order.entry_price,
          exit_price: price,
          target_price: price,
          quantity_usd: order.quantity_usd,
          status: order.status,
          buy_date: order.buy_date,
          percent_gain: order.percent_gain,
          percent_fee: order.percent_fee,
          fees_paid: order.fees_paid,
          net_pl_sats: order.net_pl_sats
        });
        
        if (error) {
          errorHandler.log({
            code: 'LOCAL_ORDER_SYNC_FAILED',
            message: 'Failed to sync local order to backend',
            severity: 'low'
          });
        }
      } catch (error) {
        errorHandler.log({
          code: 'LOCAL_ORDER_SYNC_ERROR',
          message: 'Error during local order sync',
          severity: 'low'
        });
      }
    }
  };

  const addFuture = async (futureData: Omit<Future, 'id' | 'created_at' | 'updated_at'>) => {
    if (!validateUserContext(user?.id)) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar ordens.",
        variant: "destructive"
      });
      return;
    }

    // Validar e sanitizar dados
    const unifiedPrice = futureData.target_price ?? futureData.exit_price;
    const sanitizedData = {
      direction: futureData.direction,
      entry_price: futureData.entry_price,
      exit_price: unifiedPrice,
      target_price: unifiedPrice,
      quantity_usd: futureData.quantity_usd,
      
      status: futureData.status,
      buy_date: futureData.buy_date,
        percent_gain: futureData.percent_gain,
        percent_fee: futureData.percent_fee,
        fees_paid: futureData.fees_paid,
        net_pl_sats: futureData.net_pl_sats,
        pl_sats: (futureData as any).pl_sats || 0
    };
    
    const validationErrors = validateFutureData(sanitizedData);
    
    if (validationErrors.length > 0) {
      toast({
        title: "Dados inválidos",
        description: validationErrors[0],
        variant: "destructive"
      });
      return false;
    }

    try {
      const { data, error } = await supabase
      .from('futures')
      .insert({
        user_id: user.id,
        direction: sanitizedData.direction,
        entry_price: sanitizedData.entry_price,
        exit_price: sanitizedData.exit_price,
        target_price: sanitizedData.target_price,
        quantity_usd: sanitizedData.quantity_usd,
        status: sanitizedData.status,
        buy_date: sanitizedData.buy_date,
        close_date: sanitizedData.status === 'CLOSED' ? (futureData as any).close_date : null,
        fee_trade: sanitizedData.status === 'CLOSED' ? (futureData as any).fee_trade : null,
        fee_funding: sanitizedData.status === 'CLOSED' ? (futureData as any).fee_funding : null,
        percent_gain: sanitizedData.percent_gain,
        percent_fee: sanitizedData.percent_fee,
        fees_paid: sanitizedData.fees_paid,
        net_pl_sats: sanitizedData.net_pl_sats,
        pl_sats: (sanitizedData as any).pl_sats
      })
      .select()
      .single();

      if (error) throw error;

      setFutures(prev => [data as Future, ...prev]);
      toast({
        title: "Ordem criada",
        description: "Ordem salva com sucesso no servidor!"
      });
      
      return data;
    } catch (error: any) {
      errorHandler.log({
        code: 'FUTURE_CREATE_FAILED',
        message: 'Failed to create future order',
        severity: 'high',
        context: { error: error.message }
      });
      
      // Só salva offline se for erro de conexão!
      if (error.status === 0 || error.message?.includes("Failed to fetch")) {
        const localOrderData = {
          ...sanitizedData,
          id: `local_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as LocalOrder;
        const localOrder = saveLocalOrder(localOrderData);
        setFutures(prev => [localOrder, ...prev]);
        toast({
          title: "Ordem salva offline",
          description: "Ordem salva localmente. Será sincronizada quando a conexão for restabelecida.",
          variant: "default"
        });
        return localOrder;
      } else {
        toast({
          title: "Erro ao criar ordem",
          description: error.message || error.details || JSON.stringify(error),
          variant: "destructive"
        });
        return false;
      }
    }  
  };

  const updateFuture = async (id: string, updates: Partial<Future & { pl_sats?: number }>) => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para editar ordens.",
        variant: "destructive"
      });
      return;
    }

    const isLocalOrder = id.startsWith('local_');
    
    try {
      const normalizedUpdates = { ...updates } as Partial<Future>;
      if (normalizedUpdates.exit_price != null && normalizedUpdates.target_price == null) {
        normalizedUpdates.target_price = normalizedUpdates.exit_price;
      }
      if (normalizedUpdates.target_price != null && normalizedUpdates.exit_price == null) {
        normalizedUpdates.exit_price = normalizedUpdates.target_price;
      }
      if (!isLocalOrder) {
        const { data, error } = await supabase
        .from('futures')
        .update(normalizedUpdates)
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
        // Para ordens locais, tentar salvar no servidor primeiro
        try {
          const localOrder = futures.find(f => f.id === id) as LocalOrder;
          if (localOrder) {
            const price = updates.exit_price ?? localOrder.exit_price ?? updates.target_price ?? localOrder.target_price;
            const { data, error } = await supabase
            .from('futures')
            .insert({
              user_id: user.id,
              direction: localOrder.direction,
              entry_price: localOrder.entry_price,
              exit_price: price,
              target_price: price,
              quantity_usd: localOrder.quantity_usd,
              status: updates.status || localOrder.status,
              buy_date: localOrder.buy_date,
              percent_gain: updates.percent_gain || localOrder.percent_gain,
          percent_fee: updates.percent_fee || localOrder.percent_fee,
          fees_paid: updates.fees_paid || localOrder.fees_paid,
          net_pl_sats: updates.net_pl_sats || localOrder.net_pl_sats,
          pl_sats: updates.pl_sats || (localOrder as any).pl_sats
            })
            .select()
            .single();

            if (error) throw error;

            // Remover da lista local e adicionar versão do servidor
            setFutures(prev => 
              prev.filter(f => f.id !== id).concat([data as Future])
              );
            
            // Limpar do cache local
            deleteLocalOrder(id);
            
            toast({
              title: "Ordem sincronizada",
              description: "Ordem local foi salva no servidor!"
            });
            
            return data;
          }
        } catch (syncError) {
          // Se falhar a sincronização, atualizar localmente
          const offlineNormalized = { ...updates } as Partial<Future>;
          if (offlineNormalized.exit_price != null && offlineNormalized.target_price == null) {
            offlineNormalized.target_price = offlineNormalized.exit_price;
          }
          if (offlineNormalized.target_price != null && offlineNormalized.exit_price == null) {
            offlineNormalized.exit_price = offlineNormalized.target_price;
          }
          const updatedOrder = updateLocalOrder(id, offlineNormalized);
          if (updatedOrder) {
            setFutures(prev => 
              prev.map(f => f.id === id ? updatedOrder : f)
              );
            
            toast({
              title: "Ordem atualizada offline",
              description: "Ordem local modificada. Será sincronizada quando possível."
            });
            
            return updatedOrder;
          }
        }
      }
    } catch (error: any) {
      errorHandler.log({
        code: 'FUTURE_UPDATE_FAILED',
        message: 'Failed to update future order',
        severity: 'medium',
        context: { error: error.message, futureId: id }
      });
      toast({
        title: "Erro ao atualizar ordem",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteFuture = async (id: string) => {
    if (!user) {
      toast({
        title: "Erro de autenticação", 
        description: "Você precisa estar logado para excluir ordens.",
        variant: "destructive"
      });
      return;
    }

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
      errorHandler.log({
        code: 'FUTURE_DELETE_FAILED',
        message: 'Failed to delete future order',
        severity: 'medium',
        context: { error: error.message, futureId: id }
      });
      toast({
        title: "Erro ao remover ordem",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const closeFuture = async (id: string, closeData: { exit_price: number; fees_paid: number; net_pl_sats: number; pl_sats?: number; close_date?: string; fee_trade?: number; fee_funding?: number }) => {
    const updates = {
      status: 'CLOSED' as const,
      exit_price: closeData.exit_price,
      target_price: closeData.exit_price,
      fees_paid: closeData.fees_paid,
      net_pl_sats: closeData.net_pl_sats,
      pl_sats: closeData.pl_sats,
      close_date: closeData.close_date || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      fee_trade: closeData.fee_trade,
      fee_funding: closeData.fee_funding
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
    if (user) {
      fetchFutures();
      
      // Configurar realtime para atualizações automáticas
      const channel = supabase
        .channel('futures-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'futures',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Atualizar estado imediatamente com base no evento
            if (payload.eventType === 'INSERT' && payload.new) {
              setFutures(prev => {
                const exists = prev.some(f => f.id === (payload.new as any).id);
                return exists ? prev : [payload.new as Future, ...prev];
              });
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              setFutures(prev => prev.map(f => f.id === (payload.new as any).id ? payload.new as Future : f));
            } else if (payload.eventType === 'DELETE' && payload.old) {
              setFutures(prev => prev.filter(f => f.id !== (payload.old as any).id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  // If user is not logged in, return empty state
  if (!user) {
    return {
      futures: [],
      loading,
      addFuture: async () => {},
      updateFuture: async () => {},
      deleteFuture: async () => {},
      closeFuture: async () => {},
      refreshFutures: () => {},
      getFuturesStats: () => ({
        totalOpenPositions: 0,
        totalClosedPositions: 0,
        totalUnrealizedPL: 0,
        totalRealizedPL: 0,
        totalFeesUSD: 0,
        totalPL: 0
      }),
      calculateFutureMetrics: () => ({
        percent_gain: 0,
        percent_fee: 0,
        net_pl_sats: 0,
        fees_paid: 0
      }),
      clearLocalCache: () => {},
      syncLocalOrdersToBackend: async () => {}
    };
  }

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
    clearLocalCache,
    syncLocalOrdersToBackend
  };
}