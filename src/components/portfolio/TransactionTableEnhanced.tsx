import { useState, useMemo, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Transaction } from "@/hooks/useTransactions";
import { useAuthIntercept } from "@/contexts/AuthInterceptContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { convertToUserCurrency, calculateTransactionGP } from "@/utils/portfolioCalculations";

interface TransactionTableEnhancedProps {
  transactions: Transaction[];
  currency: string;
  btcCurrentPrice: number;
  onAddTransaction: () => void;
  onEditTransaction: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
}

const TransactionTableEnhanced = memo(function TransactionTableEnhanced({
  transactions,
  currency,
  btcCurrentPrice,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction
}: TransactionTableEnhancedProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<string | null>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const { requireAuth } = useAuthIntercept();
  const { formatCurrency: formatCurrencyWithConversion, exchangeRate } = useCurrency();

  // Use imported utility function for currency conversion

  const formatCurrency = (amount: number, curr: string, transactionMarket?: string) => {
    if (curr === "BTC") return `${amount.toFixed(8)} BTC`;
    if (curr === "SATS") return `${Math.floor(amount * 100000000)} sats`;
    
    // For fiat currencies, apply conversion if needed
    const convertedAmount = transactionMarket ? convertToUserCurrency(amount, transactionMarket, currency, exchangeRate) : amount;
    
    if (curr === "BRL") return `R$ ${convertedAmount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
    return `US$ ${convertedAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('pt-BR', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    return `${day} ${month} ${year}, ${time}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Comprar":
        return "bg-success text-success-foreground";
      case "Vender":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Use imported utility function for GP calculation

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }, [sortField, sortDirection]);

  // Memoized sorting to prevent unnecessary recalculations
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: any = a[sortField as keyof Transaction];
    let bValue: any = b[sortField as keyof Transaction];
    
    // Special handling for date
    if (sortField === "date") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    // Special handling for numeric fields
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
  }, [transactions, sortField, sortDirection]);

  // Memoized pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentTransactions = sortedTransactions.slice(startIndex, startIndex + itemsPerPage);
    
    return { totalPages, startIndex, currentTransactions };
  }, [sortedTransactions, itemsPerPage, currentPage]);

  const { totalPages, startIndex, currentTransactions } = paginationData;

  const confirmDelete = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (transactionToDelete) {
      onDeleteTransaction(transactionToDelete);
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return (
    <Card className="card-shadow bg-gradient-card">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Transações</h3>
            <p className="text-sm text-muted-foreground">Histórico de compras, vendas e transferências</p>
          </div>
          <Button onClick={() => requireAuth(onAddTransaction)} variant="bitcoin" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Transação
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/20">
              <TableHead 
                className="text-muted-foreground cursor-pointer"
                onClick={() => handleSort("type")}
              >
                <div className="flex items-center gap-1">
                  Tipo <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="text-muted-foreground cursor-pointer"
                onClick={() => handleSort("price_per_coin")}
              >
                <div className="flex items-center gap-1">
                  Preço <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="text-muted-foreground cursor-pointer"
                onClick={() => handleSort("quantity")}
              >
                <div className="flex items-center gap-1">
                  Quantidade <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="text-muted-foreground cursor-pointer"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center gap-1">
                  Data Hora <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground">Taxas</TableHead>
              <TableHead className="text-muted-foreground">Custo</TableHead>
              <TableHead className="text-muted-foreground">Receita</TableHead>
              <TableHead className="text-muted-foreground">GP</TableHead>
              <TableHead className="text-muted-foreground">Notas</TableHead>
              <TableHead className="text-muted-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Nenhuma transação encontrada. Clique em "Adicionar Transação" para começar.
                </TableCell>
              </TableRow>
            ) : (
              currentTransactions.map((transaction) => {
                const gp = calculateTransactionGP(transaction, btcCurrentPrice, currency, exchangeRate);
                return (
                  <TableRow key={transaction.id} className="border-border hover:bg-muted/10 transition-colors">
                    <TableCell>
                      <Badge variant="outline" className={getTypeColor(transaction.type)}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-foreground">
                       {transaction.type === "Transferência" 
                         ? "-" 
                         : formatCurrency(transaction.price_per_coin, currency, transaction.market)
                       }
                    </TableCell>
                    <TableCell className="text-foreground">
                      <div className={`flex items-center gap-1 ${
                        transaction.type === "Vender" || (transaction.type === "Transferência" && transaction.transfer_type === "saida") 
                          ? "text-destructive" : "text-success"
                      }`}>
                        {transaction.type === "Vender" || (transaction.type === "Transferência" && transaction.transfer_type === "saida") ? "-" : "+"}
                        {transaction.quantity.toFixed(8)}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {formatDate(transaction.date)}
                    </TableCell>
                     <TableCell className="text-foreground">
                       {formatCurrency(transaction.fees || 0, currency, transaction.market)}
                    </TableCell>
                     <TableCell className="text-foreground">
                       {transaction.type === "Comprar" 
                         ? formatCurrency(transaction.total_spent, currency, transaction.market)
                         : "-"
                       }
                    </TableCell>
                     <TableCell className="text-foreground">
                       {transaction.type === "Vender" 
                         ? formatCurrency(transaction.total_spent, currency, transaction.market)
                         : "-"
                       }
                    </TableCell>
                    <TableCell className={transaction.type === "Vender" ? "text-foreground" : gp.color}>
                      {transaction.type === "Vender" 
                        ? "-"
                        : transaction.type === "Transferência" 
                          ? formatCurrency(gp.value, currency)
                          : formatCurrency(gp.value, currency)
                      }
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-32 truncate">
                      {transaction.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onEditTransaction(transaction.id)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Editar transação ${transaction.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => confirmDelete(transaction.id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Deletar transação ${transaction.id}`}
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
            Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedTransactions.length)} de {sortedTransactions.length} transações
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
            Tem certeza de que deseja excluir esta transação? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
});

export default TransactionTableEnhanced;