import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, TrendingUp, TrendingDown, X } from "lucide-react";
import { type Future } from "@/hooks/useFutures";
import { useTimezone } from "@/contexts/TimezoneContext";

interface FuturesMobileCardProps {
  future: Future;
  btcCurrentPrice: number;
  calculateFutureMetrics: (future: Future, currentBtcPrice: number) => {
    percent_gain?: number;
    percent_fee?: number;
    net_pl_sats?: number;
    fees_paid?: number;
  };
  onEdit: (future: Future) => void;
  onClose: (future: Future) => void;
  onDelete: (id: string) => void;
}

export default function FuturesMobileCard({
  future,
  btcCurrentPrice,
  calculateFutureMetrics,
  onEdit,
  onClose,
  onDelete
}: FuturesMobileCardProps) {
  const { formatDateTime } = useTimezone();

  const formatCurrency = (value: number | undefined, currencyType: 'USD' | 'SATS' = 'USD') => {
    if (value === undefined || value === null) return '-';
    
    if (currencyType === 'USD') {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ' sats';
  };

  const formatPercent = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    const formatted = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${value >= 0 ? '+' : ''}${formatted}%`;
  };

  const getGainPercent = () => {
    const refPrice = future.status === 'CLOSED'
      ? (future.exit_price ?? future.target_price)
      : (future.target_price ?? future.exit_price);

    if (refPrice == null) return undefined;

    return future.direction === 'LONG'
      ? ((refPrice - future.entry_price) / future.entry_price) * 100
      : ((future.entry_price - refPrice) / future.entry_price) * 100;
  };

  const getPLColor = (value: number | undefined) => {
    if (value === undefined || value === null) return 'text-muted-foreground';
    return value >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getStatusBadge = () => {
    const netPl = future.net_pl_sats;
    
    if (future.status === 'OPEN') {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Aberto</Badge>;
    } else if (future.status === 'CLOSED') {
      if (netPl && netPl > 0) {
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Fechado</Badge>;
      } else if (netPl && netPl < 0) {
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Fechado</Badge>;
      } else {
        return <Badge className="bg-muted/20 text-muted-foreground border-muted/30">Fechado</Badge>;
      }
    }
    return <Badge variant="outline">{future.status}</Badge>;
  };

  const gainPercent = getGainPercent();
  const pl = (future as any).pl_sats;
  const netPl = future.net_pl_sats;

  return (
    <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
      <CardContent className="p-4 space-y-4">
        {/* Header - Direction, PL, Percentage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {future.direction === 'LONG' ? (
                <TrendingUp className="h-5 w-5 text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400" />
              )}
              <span className="font-semibold text-lg">{future.direction}</span>
            </div>
            {getStatusBadge()}
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${getPLColor(pl)}`}>
              PL {pl ? `${Math.round(pl)} sats` : '-'}
            </div>
            <div className={`text-sm ${getPLColor(gainPercent)}`}>
              {formatPercent(gainPercent)}
            </div>
          </div>
        </div>

        {/* Main Data Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block">Entry Price</span>
            <span className="font-medium">{formatCurrency(future.entry_price)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Exit Price</span>
            <span className="font-medium">
              {future.target_price ? formatCurrency(future.target_price) : 'None'}
            </span>
          </div>
          
          <div>
            <span className="text-muted-foreground block">Quantidade</span>
            <span className="font-medium">{formatCurrency(future.quantity_usd)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Fees</span>
            <span className="font-medium">
              {future.status === 'CLOSED' 
                ? `${Math.round((future.fees_paid || 0) + ((future as any).fee_funding || 0))} sats`
                : '-'
              }
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block">Creation Date</span>
            <span className="font-medium">{formatDateTime(future.buy_date, 'dd/MM/yyyy HH:mm')}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Exit Date</span>
            <span className="font-medium">
              {future.status === 'CLOSED' && future.close_date 
                ? formatDateTime(future.close_date, 'dd/MM/yyyy HH:mm') 
                : '-'
              }
            </span>
          </div>
        </div>

        {/* NET PL */}
        {future.status === 'CLOSED' && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">NET PL</span>
              <span className={`font-bold text-lg ${getPLColor(netPl)}`}>
                {netPl ? `${Math.round(netPl)} sats` : '-'}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <div className="flex gap-2 flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(future)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            {future.status === 'OPEN' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onClose(future)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(future.id)}
            className="text-red-400 hover:text-red-300 sm:w-auto w-full"
          >
            <Trash2 className="h-4 w-4 mr-2 sm:mr-0" />
            <span className="sm:hidden">Deletar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}