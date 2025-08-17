import { useState, useMemo, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, TrendingUp, TrendingDown, X, ChevronLeft, ChevronRight, ArrowUpDown, UserCheck, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { type Future } from "@/hooks/useFutures";
import EditFutureModal from "./EditFutureModal";
import CloseOrderModal from "./CloseOrderModal";
import { useTimezone } from "@/contexts/TimezoneContext";
import { useCurrency } from "@/contexts/CurrencyContext";

interface FuturesTableAdvancedProps {
  futures: Future[];
  btcCurrentPrice: number;
  calculateFutureMetrics: (future: Future, currentBtcPrice: number) => {
    percent_gain?: number;
    percent_fee?: number;
    net_pl_sats?: number;
    fees_paid?: number;
  };
  deleteFuture: (id: string) => Promise<void> | any;
  closeFuture: (id: string, closeData: { exit_price: number; fees_paid: number; net_pl_sats: number; pl_sats: number; close_date?: string; fee_trade?: number; fee_funding?: number }) => Promise<any>;
  updateFuture: (id: string, updates: Partial<Future>) => Promise<any>;
}

const FuturesTableAdvanced = memo(function FuturesTableAdvanced({
  futures,
  btcCurrentPrice,
  calculateFutureMetrics,
  deleteFuture,
  closeFuture,
  updateFuture
}: FuturesTableAdvancedProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<string | null>("buy_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [futureToDelete, setFutureToDelete] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Future | null>(null);
  const [closingOrder, setClosingOrder] = useState<Future | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const { formatDateTime } = useTimezone();
  const { formatCurrency: formatCurrencyContext, formatNumber, currency } = useCurrency();

  const formatCurrency = useCallback((value: number | undefined, currencyType: 'USD' | 'SATS' = 'USD') => {
    if (value === undefined || value === null) return '-';
    
    if (currencyType === 'USD') {
      return formatCurrencyContext(value);
    }
    
    return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ' sats';
  }, [formatCurrencyContext, currency]);

  const formatPercent = useCallback((value: number | undefined) => {
    if (value === undefined || value === null) return '-';
    const formatted = formatNumber(value);
    return `${value >= 0 ? '+' : ''}${formatted}%`;
  }, [formatNumber]);

  const getStatusBadge = useCallback((status: string, netPl?: number) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = 'default';
    let className = '';
    
    if (status === 'OPEN') {
      variant = 'default';
      className = 'bg-orange-500 text-white hover:bg-orange-600 cursor-pointer transition-colors';
    } else if (status === 'CLOSED') {
      if (netPl && netPl > 0) {
        className = 'bg-green-600 text-white';
        variant = 'secondary';
      } else if (netPl && netPl < 0) {
        className = 'bg-red-600 text-white';
        variant = 'destructive';
      } else {
        variant = 'secondary';
      }
    } else if (status === 'STOP') {
      variant = 'destructive';
    } else {
      variant = 'outline';
    }
    
    const labels = {
      'OPEN': 'Aberto',
      'CLOSED': 'Fechado', 
      'STOP': 'Stop',
      'CANCELLED': 'Cancelado'
    };
    
    return (
      <Badge 
        variant={variant} 
        className={className}
      >
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  }, []);

  const getPLColor = useCallback((value: number | undefined) => {
    if (value === undefined || value === null) return '';
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  }, []);

  const handleSort = useCallback((field: string) => {
    if (field === 'actions') return; // Don't sort actions column
    
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }, [sortField, sortDirection]);

  const getGainPercent = useCallback((f: Future) => {
    const refPrice = f.status === 'CLOSED'
      ? (f.exit_price ?? f.target_price)
      : (f.target_price ?? f.exit_price);

    if (refPrice == null) return undefined;

    return f.direction === 'LONG'
      ? ((refPrice - f.entry_price) / f.entry_price) * 100
      : ((f.entry_price - refPrice) / f.entry_price) * 100;
  }, []);

  // Selection handlers
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedOrders(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === currentFutures.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(currentFutures.map(f => f.id)));
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(Array.from(selectedOrders).map(id => deleteFuture(id)));
      setSelectedOrders(new Set());
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting orders:', error);
    }
  };

  // Memoized sorting to prevent unnecessary recalculations
  const sortedFutures = useMemo(() => {
    return [...futures].sort((a, b) => {
      if (!sortField) return 0;
      let aValue: any = a[sortField as keyof Future];
      let bValue: any = b[sortField as keyof Future];

      // Special handling for date
      if (sortField === "buy_date" || sortField === "close_date") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Special handling for numeric fields with null/undefined values
      if (sortField === "net_pl_sats" || sortField === "pl_sats" || sortField === "fees_paid" || 
          sortField === "target_price" || sortField === "exit_price") {
        const aNum = aValue !== null && aValue !== undefined ? Number(aValue) : null;
        const bNum = bValue !== null && bValue !== undefined ? Number(bValue) : null;
        
        // Handle null/undefined values for descending sort
        if (sortDirection === "desc") {
          if (aNum === null && bNum === null) return 0;
          if (aNum === null) return 1; // nulls go to end in descending
          if (bNum === null) return -1; // non-nulls come first
          return bNum - aNum; // descending order for numbers
        } else {
          if (aNum === null && bNum === null) return 0;
          if (aNum === null) return 1; // nulls go to end in ascending too
          if (bNum === null) return -1; // non-nulls come first
          return aNum - bNum; // ascending order for numbers
        }
      }

      // Regular numeric handling
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      // String comparison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [futures, sortField, sortDirection]);

  // Memoized pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(sortedFutures.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentFutures = sortedFutures.slice(startIndex, startIndex + itemsPerPage);
    return {
      totalPages,
      startIndex,
      currentFutures
    };
  }, [sortedFutures, itemsPerPage, currentPage]);

  const { totalPages, startIndex, currentFutures } = paginationData;

  const confirmDelete = (id: string) => {
    setFutureToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (futureToDelete) {
      setDeletingId(futureToDelete);
      try {
        await deleteFuture(futureToDelete);
        setDeleteDialogOpen(false);
        setFutureToDelete(null);
      } catch (error) {
        console.error('Error deleting future:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleStatusClick = (future: Future) => {
    if (future.status === 'OPEN') {
      setClosingOrder(future);
    }
  };

  if (futures.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Nenhuma ordem encontrada</h3>
          <p>Adicione sua primeira ordem para começar a rastrear seus trades.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-shadow bg-gradient-card">
      {/* Table Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold">Lista de Ordens</h3>
        <div className="flex items-center gap-3">
          <Button
            variant={selectionMode ? "secondary" : "outline"}
            size="sm"
            onClick={toggleSelectionMode}
            className="gap-2"
          >
            <UserCheck className="h-4 w-4" />
            {selectionMode ? 'Cancelar' : 'Selecionar'}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
           <TableHeader>
            <TableRow className="border-border hover:bg-muted/20">
              {selectionMode && (
                <TableHead className="text-muted-foreground w-12">
                  <Checkbox
                    checked={selectedOrders.size === currentFutures.length && currentFutures.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead className="text-muted-foreground cursor-pointer" onClick={() => handleSort("direction")}>
                <div className="flex items-center gap-1">
                  Direção <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground cursor-pointer" onClick={() => handleSort("buy_date")}>
                <div className="flex items-center gap-1">
                  Data Entrada <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground cursor-pointer" onClick={() => handleSort("quantity_usd")}>
                <div className="flex items-center gap-1">
                  Quantidade <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground cursor-pointer" onClick={() => handleSort("entry_price")}>
                <div className="flex items-center gap-1">
                  Preço Entrada <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground cursor-pointer" onClick={() => handleSort("target_price")}>
                <div className="flex items-center gap-1">
                  Preço Alvo <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground cursor-pointer" onClick={() => handleSort("gain_percent")}>
                <div className="flex items-center gap-1">
                  Ganho <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground cursor-pointer" onClick={() => handleSort("close_date")}>
                <div className="flex items-center gap-1">
                  Data Saída <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground cursor-pointer" onClick={() => handleSort("pl_sats")}>
                <div className="flex items-center gap-1">
                  PL <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground cursor-pointer" onClick={() => handleSort("fees_paid")}>
                <div className="flex items-center gap-1">
                  Taxas <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground cursor-pointer" onClick={() => handleSort("net_pl_sats")}>
                <div className="flex items-center gap-1">
                  NET PL <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground cursor-pointer" onClick={() => handleSort("status")}>
                <div className="flex items-center gap-1">
                  Status <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentFutures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={selectionMode ? 13 : 12} className="text-center py-8 text-muted-foreground">
                  Nenhuma ordem encontrada. Adicione sua primeira ordem para começar.
                </TableCell>
              </TableRow>
            ) : (
              currentFutures.map((future) => {
                const metrics = calculateFutureMetrics(future, btcCurrentPrice);
                
                return (
                  <TableRow key={future.id} className="border-border hover:bg-muted/10 transition-colors">
                    {selectionMode && (
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.has(future.id)}
                          onCheckedChange={() => toggleSelectOrder(future.id)}
                        />
                      </TableCell>
                    )}
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
                    <TableCell className="text-foreground">
                      {formatDateTime(future.buy_date, 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-foreground font-mono">{formatCurrency(future.quantity_usd)}</TableCell>
                    <TableCell className="text-foreground font-mono">{formatCurrency(future.entry_price)}</TableCell>
                    <TableCell className="text-foreground font-mono">
                      {future.target_price ? formatCurrency(future.target_price) : '-'}
                    </TableCell>
                    <TableCell className={`font-mono ${getPLColor(getGainPercent(future))}`}>
                      {formatPercent(getGainPercent(future))}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {future.status === 'CLOSED' && future.close_date ? formatDateTime(future.close_date, 'dd/MM/yyyy HH:mm') : '-'}
                    </TableCell>
                    <TableCell className={`font-mono ${getPLColor((future as any).pl_sats)}`}>
                      {(future as any).pl_sats ? `${Math.round((future as any).pl_sats || 0)} sats` : '-'}
                    </TableCell>
                    <TableCell className="text-foreground font-mono">
                      {future.status === 'CLOSED' ? `${Math.round(future.fees_paid || 0)} sats` : '-'}
                    </TableCell>
                    <TableCell className={`font-mono ${getPLColor(future.net_pl_sats)}`}>
                      {future.status === 'CLOSED' ? `${Math.round(future.net_pl_sats || 0)} sats` : '-'}
                    </TableCell>
                    <TableCell>
                      <div 
                        className={future.status === 'OPEN' ? 'group relative' : ''}
                        onClick={() => handleStatusClick(future)}
                      >
                        {future.status === 'OPEN' ? (
                          <>
                            <div className="block group-hover:hidden">
                              {getStatusBadge(future.status, future.net_pl_sats)}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="hidden group-hover:flex h-8 px-2 text-red-600 hover:text-red-700 items-center gap-1"
                            >
                              <X className="h-4 w-4" />
                              Fechar
                            </Button>
                          </>
                        ) : (
                          getStatusBadge(future.status, future.net_pl_sats)
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingOrder(future)}
                          aria-label={`Editar ordem ${future.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => confirmDelete(future.id)}
                          aria-label={`Deletar ordem ${future.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Selection Controls */}
      {selectionMode && (
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {selectedOrders.size} de {currentFutures.length} selecionadas
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              disabled={currentFutures.length === 0}
            >
              {selectedOrders.size === currentFutures.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
            </Button>
          </div>
          {selectedOrders.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash className="h-4 w-4" />
              Excluir Selecionadas ({selectedOrders.size})
            </Button>
          )}
        </div>
      )}

      {/* Pagination and Items Per Page Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-t border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Itens por página:</span>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedFutures.length)} de {sortedFutures.length} ordens
          </div>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
              disabled={currentPage === 1} 
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
              disabled={currentPage === totalPages} 
              className="gap-1"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>


      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Tem certeza de que deseja excluir esta ordem? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={!!deletingId}
            >
              {deletingId ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão em Lote</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Tem certeza de que deseja excluir {selectedOrders.size} ordem(ns) selecionada(s)? 
            Esta ação não pode ser desfeita e as ordens serão excluídas para sempre.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
            >
              Excluir {selectedOrders.size} Ordem(ns)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditFutureModal 
        future={editingOrder}
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        updateFuture={updateFuture}
      />

      {/* Close Modal */}
      <CloseOrderModal
        order={closingOrder}
        isOpen={!!closingOrder}
        onClose={() => setClosingOrder(null)}
        btcCurrentPrice={btcCurrentPrice}
        closeFuture={closeFuture}
      />
    </Card>
  );
});

export default FuturesTableAdvanced;