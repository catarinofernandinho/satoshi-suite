import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Transaction {
  id: string;
  type: "Comprar" | "Vender" | "Transferência";
  price: number;
  quantity: number;
  total_spent: number;
  price_per_coin: number;
  market: string;
  fees?: number;
  notes?: string;
  date: string;
  created_at: string;
  updated_at: string;
  transfer_type?: "entrada" | "saida";
  revenue?: number;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      
      setTransactions((data as Transaction[]) || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar transações",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            ...transactionData,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => [data as Transaction, ...prev]);
      toast({
        title: "Transação adicionada",
        description: "Transação criada com sucesso!"
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar transação",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev => 
        prev.map(t => t.id === id ? data as Transaction : t)
      );
      
      toast({
        title: "Transação atualizada",
        description: "Transação modificada com sucesso!"
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar transação",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Transação removida",
        description: "Transação excluída com sucesso!"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover transação",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  // Calculate portfolio stats from transactions
  const getPortfolioStats = (btcCurrentPrice: number) => {
    let totalBtc = 0;
    let totalCost = 0;
    let totalRevenue = 0;
    
    transactions.forEach(t => {
      if (t.type === 'Comprar') {
        totalBtc += t.quantity;
        totalCost += t.total_spent;
      } else if (t.type === 'Vender') {
        totalBtc -= t.quantity;
        totalRevenue += t.total_spent; // What was received from sale
      } else if (t.type === 'Transferência') {
        if (t.transfer_type === 'entrada') {
          totalBtc += t.quantity;
        } else if (t.transfer_type === 'saida') {
          totalBtc -= t.quantity;
        }
      }
    });
    
    const currentValue = totalBtc * btcCurrentPrice;
    const netCost = totalCost - totalRevenue;
    const gainLoss = currentValue - netCost;
    const avgBuyPrice = totalBtc > 0 ? netCost / totalBtc : 0;
    
    return {
      totalBtc,
      totalCost,
      totalRevenue,
      netCost,
      currentValue,
      gainLoss,
      avgBuyPrice
    };
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  return {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions: fetchTransactions,
    getPortfolioStats
  };
}