import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useFutures, type Future } from "@/hooks/useFutures";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface FuturesTableProps {
  futures: Future[];
  btcCurrentPrice: number;
}

export default function FuturesTable({ futures, btcCurrentPrice }: FuturesTableProps) {
  const { deleteFuture, calculateFutureMetrics } = useFutures();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteFuture(id);
    } catch (error) {
      console.error('Error deleting future:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (value: number | undefined, currency: 'USD' | 'SATS' = 'USD') => {
    if (value === undefined || value === null) return '-';
    
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(value);
    }
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ' sats';
  };

  const formatPercent = (value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    const formatted = value.toFixed(2);
    return `${value >= 0 ? '+' : ''}${formatted}%`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'OPEN': 'default' as const,
      'CLOSED': 'secondary' as const,
      'STOP': 'destructive' as const,
      'CANCELLED': 'outline' as const
    };
    
    const labels = {
      'OPEN': 'Aberto',
      'CLOSED': 'Fechado', 
      'STOP': 'Stop',
      'CANCELLED': 'Cancelado'
    };
    
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{labels[status as keyof typeof labels] || status}</Badge>;
  };

  const getPLColor = (value: number | undefined) => {
    if (value === undefined || value === null) return '';
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (futures.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Nenhum contrato futuro encontrado</h3>
          <p>Adicione seu primeiro contrato futuro para começar a rastrear seus trades.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Direção</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Alavancagem</TableHead>
            <TableHead>Preço Entrada</TableHead>
            <TableHead>Preço Alvo</TableHead>
            <TableHead>% Ganho</TableHead>
            <TableHead>% Taxa</TableHead>
            <TableHead>Taxas Pagas</TableHead>
            <TableHead>NET P&L</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {futures.map((future) => {
            const metrics = calculateFutureMetrics(future, btcCurrentPrice);
            
            return (
              <TableRow key={future.id}>
                <TableCell>{getStatusBadge(future.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {future.direction === 'LONG' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    {future.direction}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(future.quantity_usd)}</TableCell>
                <TableCell>{future.leverage}x</TableCell>
                <TableCell>{formatCurrency(future.entry_price)}</TableCell>
                <TableCell>{formatCurrency(future.target_price)}</TableCell>
                <TableCell className={getPLColor(metrics.percent_gain)}>
                  {formatPercent(metrics.percent_gain)}
                </TableCell>
                <TableCell>{formatPercent(metrics.percent_fee)}</TableCell>
                <TableCell>{formatCurrency(metrics.fees_paid)}</TableCell>
                <TableCell className={getPLColor(metrics.net_pl_sats)}>
                  {formatCurrency(metrics.net_pl_sats, 'SATS')}
                </TableCell>
                <TableCell>
                  {new Date(future.buy_date).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir contrato futuro</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este contrato futuro? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(future.id)}
                            disabled={deletingId === future.id}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deletingId === future.id ? "Excluindo..." : "Excluir"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}