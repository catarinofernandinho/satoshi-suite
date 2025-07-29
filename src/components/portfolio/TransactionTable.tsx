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
}

export default function TransactionTable({
  transactions,
  currency,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionTableProps) {
  const formatCurrency = (amount: number, curr: string) => {
    if (curr === "BTC") return `${amount.toFixed(8)} BTC`;
    if (curr === "SATS") return `${Math.floor(amount * 100000000)} sats`;
    if (curr === "BRL") return `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    return `US$ ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Comprar": return "bg-green-500 text-white";
      case "Vender": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getRowClass = (type: string, index: number) => {
    return index % 2 === 0 ? (type === "Comprar" ? "bg-green-50" : "bg-red-50") : "";
  };

  const calculateGP = (transaction: Transaction) => {
    if (transaction.type === "Vender") {
      return transaction.price_per_coin - (transaction.total_spent / transaction.quantity);
    }
    return 0; // GP só calculado para vendas por enquanto
  };

  return (
    <Card className="card-shadow bg-gradient-card">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Transações</h3>
            <p className="text-sm text-muted-foreground">Histórico de compras, vendas e transferências</p>
          </div>
          <Button onClick={onAddTransaction} variant="bitcoin" className="gap-2">
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
              <TableHead className="text-muted-foreground hidden sm:table-cell">Data</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Taxas</TableHead>
              <TableHead className="text-muted-foreground">Total</TableHead>
              <TableHead className="text-muted-foreground hidden lg:table-cell">Notas</TableHead>
              <TableHead className="text-muted-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma transação encontrada. Clique em "Adicionar Transação" para começar.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction, index) => (
                <TableRow key={transaction.id} className={getRowClass(transaction.type, index) + " border-border hover:bg-muted/20"}>
                  <TableCell>
                    <Badge variant="outline" className={getTypeColor(transaction.type)}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {formatCurrency(transaction.price_per_coin, currency)}
                  </TableCell>
                  <TableCell className="text-foreground">
                    <div className="flex items-center gap-1">
                      {transaction.type === "Vender" ? "-" : "+"}
                      {transaction.quantity.toFixed(8)} BTC
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground hidden sm:table-cell">
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-foreground hidden md:table-cell">
                    {formatCurrency(transaction.fees || 0, currency)}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {formatCurrency(transaction.total_spent, currency)}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-32 truncate hidden lg:table-cell">
                    {transaction.notes || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditTransaction(transaction.id)}
                        aria-label={`Editar transação ${transaction.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteTransaction(transaction.id)}
                        aria-label={`Deletar transação ${transaction.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}