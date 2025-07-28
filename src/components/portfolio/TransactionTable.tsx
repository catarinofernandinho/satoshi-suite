import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Transaction } from "@/hooks/useTransactions";

interface TransactionTableProps {
  transactions: Transaction[];
  currency: string;
  onAddTransaction: () => void;
  onEditTransaction: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
  currentBtcPrice: number; // Novo, para calcular GP
}

export default function TransactionTable({
  transactions,
  currency,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  currentBtcPrice
}: TransactionTableProps) {
  const formatCurrency = (amount: number, curr: string) => {
    if (curr === "BTC") return `${amount.toFixed(8)} BTC`;
    if (curr === "SATS") return `${Math.floor(amount * 100000000)} sats`;
    if (curr === "BRL") return `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    return `US$ ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Comprar": return "bg-chart-green/10 text-chart-green border-chart-green/20";
      case "Vender": return "bg-chart-red/10 text-chart-red border-chart-red/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const calculateGP = (transaction: Transaction) => {
    if (transaction.type === "Vender") {
      return (transaction.quantity * currentBtcPrice) - transaction.total_spent;
    } else if (transaction.type === "Comprar") {
      return (transaction.quantity * currentBtcPrice) - transaction.total_spent;
    }
    return 0; // Transferência não tem GP
  };

  return (
    <Card className="card-shadow bg-gradient-card">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Transações</h3>
            <p className="text-sm text-muted-foreground">Histórico de compras, vendas e transferências</p>
          </div>
          <Button onClick={onAddTransaction} variant="bitcoin" className="gap-2" style={{ position: "sticky", top: "0", zIndex: "10" }}>
            <Plus className="h-4 w-4" />
            Adicionar Transação
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-muted-foreground">Preço</TableHead>
              <TableHead className="text-muted-foreground">Quantidade</TableHead>
              <TableHead className="text-muted-foreground">Data e Hora</TableHead>
              <TableHead className="text-muted-foreground">Taxas</TableHead>
              <TableHead className="text-muted-foreground">Custo</TableHead>
              <TableHead className="text-muted-foreground">Receitas</TableHead>
              <TableHead className="text-muted-foreground">GP</TableHead>
              <TableHead className="text-muted-foreground">Notas</TableHead>
              <TableHead className="text-muted-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Nenhuma transação encontrada. Clique em "Adicionar Transação" para começar.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => {
                const gp = calculateGP(transaction);
                return (
                  <TableRow key={transaction.id} className={`border-border ${transaction.type === "Comprar" ? "bg-chart-green/5" : transaction.type === "Vender" ? "bg-chart-red/5" : ""}`}>
                    <TableCell>
                      <Badge variant="outline" className={getTypeColor(transaction.type)}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {formatCurrency(transaction.price, currency)}
                    </TableCell>
                    <TableCell className="text-foreground">
                      <div className="flex items-center gap-1">
                        {transaction.type === "Comprar" ? "+" : transaction.type === "Vender" ? "-" : ""}{transaction.quantity.toFixed(8)} BTC
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {new Date(transaction.date).toLocaleString('pt-BR', { hour12: true })}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {formatCurrency(transaction.fees || 0, currency)}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {formatCurrency(transaction.total_spent, currency)}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {transaction.type === "Vender" ? formatCurrency(transaction.total_spent, currency) : "-"}
                    </TableCell>
                    <TableCell className={`text-foreground ${gp >= 0 ? 'text-chart-green' : 'text-chart-red'}`}>
                      {gp >= 0 ? `+${formatCurrency(gp, currency)}` : formatCurrency(gp, currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-32 truncate">
                      {transaction.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditTransaction(transaction.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteTransaction(transaction.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
    </Card>
  );
}