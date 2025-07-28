import { Future } from '@/hooks/useFutures';

export const validateFutureData = (data: Partial<Future>): string[] => {
  const errors: string[] = [];

  // Validar campos obrigatórios
  if (!data.direction) {
    errors.push('Direção é obrigatória (LONG ou SHORT)');
  }

  if (!data.entry_price || data.entry_price <= 0) {
    errors.push('Preço de entrada deve ser maior que zero');
  }

  if (!data.quantity_usd || data.quantity_usd <= 0) {
    errors.push('Quantidade em USD deve ser maior que zero');
  }

  if (!data.leverage || data.leverage < 1 || data.leverage > 125) {
    errors.push('Alavancagem deve estar entre 1x e 125x');
  }

  if (!data.buy_date) {
    errors.push('Data de compra é obrigatória');
  }

  if (!data.status) {
    errors.push('Status é obrigatório');
  }

  // Validar valores numéricos
  if (data.target_price && data.target_price <= 0) {
    errors.push('Preço alvo deve ser maior que zero');
  }

  if (data.exit_price && data.exit_price <= 0) {
    errors.push('Preço de saída deve ser maior que zero');
  }

  return errors;
};

export const validateUserContext = (userId?: string): boolean => {
  return !!userId && userId.length > 0;
};

export const sanitizeFutureData = (data: any): Future => {
  return {
    id: data.id || '',
    direction: data.direction?.toUpperCase() as 'LONG' | 'SHORT',
    entry_price: Number(data.entry_price),
    exit_price: data.exit_price ? Number(data.exit_price) : undefined,
    target_price: data.target_price ? Number(data.target_price) : undefined,
    quantity_usd: Number(data.quantity_usd),
    leverage: Number(data.leverage),
    status: data.status?.toUpperCase() as 'OPEN' | 'CLOSED' | 'STOP' | 'CANCELLED',
    buy_date: data.buy_date,
    created_at: data.created_at || '',
    updated_at: data.updated_at || '',
    percent_gain: data.percent_gain ? Number(data.percent_gain) : undefined,
    percent_fee: data.percent_fee ? Number(data.percent_fee) : undefined,
    fees_paid: data.fees_paid ? Number(data.fees_paid) : undefined,
    net_pl_sats: data.net_pl_sats ? Number(data.net_pl_sats) : undefined
  };
};