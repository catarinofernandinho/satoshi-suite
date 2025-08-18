import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";
import { type Transaction } from "@/hooks/useTransactions";
import { useTimezone } from "@/contexts/TimezoneContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { convertToUserCurrency, calculateTransactionGP } from "@/utils/portfolioCalculations";

interface TransactionMobileCardProps {
  transaction: Transaction;
  currency: string;
  btcCurrentPrice: number;
  exchangeRate: number;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionMobileCard({
  transaction,
  currency,
  btcCurrentPrice,
  exchangeRate,
  onEdit,
  onDelete
}: TransactionMobileCardProps) {
  const { formatDateTime } = useTimezone();

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

  const getTypeIcon = () => {
    switch (transaction.type) {
      case "Comprar":
        return <TrendingUp className="h-5 w-5 text-green-400" />;
      case "Vender":
        return <TrendingDown className="h-5 w-5 text-red-400" />;
      case "Transferência":
        return <ArrowLeftRight className="h-5 w-5 text-blue-400" />;
      default:
        return <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTypeBadge = () => {
    switch (transaction.type) {
      case "Comprar":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Comprar</Badge>;
      case "Vender":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Vender</Badge>;
      case "Transferência":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Transferência</Badge>;
      default:
        return <Badge variant="outline">{transaction.type}</Badge>;
    }
  };

  const getQuantityColor = () => {
    if (transaction.type === "Vender" || (transaction.type === "Transferência" && transaction.transfer_type === "saida")) {
      return "text-red-400";
    }
    return "text-green-400";
  };

  const getQuantitySign = () => {
    if (transaction.type === "Vender" || (transaction.type === "Transferência" && transaction.transfer_type === "saida")) {
      return "-";
    }
    return "+";
  };

  const gp = calculateTransactionGP(transaction, btcCurrentPrice, currency, exchangeRate);

  return (
    <Card className="bg-card/80 border-border/50 backdrop-blur-sm">
      <CardContent className="p-4 space-y-4">
        {/* Header - Type, Quantity, Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getTypeIcon()}
              <span className="font-semibold text-lg">{transaction.type}</span>
            </div>
            {getTypeBadge()}
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${getQuantityColor()}`}>
              {getQuantitySign()}{transaction.quantity.toFixed(8)} BTC
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDateTime(transaction.date, 'dd/MM/yyyy HH:mm')}
            </div>
          </div>
        </div>

        {/* Main Data Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block">Preço</span>
            <span className="font-medium">
              {transaction.type === "Transferência" ? "-" : formatCurrency(transaction.price_per_coin, currency, transaction.market)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Taxas</span>
            <span className="font-medium">
              {formatCurrency(transaction.fees || 0, currency, transaction.market)}
            </span>
          </div>
          
          <div>
            <span className="text-muted-foreground block">
              {transaction.type === "Comprar" ? "Custo Total" : transaction.type === "Vender" ? "Receita" : "Valor"}
            </span>
            <span className="font-medium">
              {transaction.type === "Comprar" 
                ? formatCurrency((transaction.total_spent || 0) + (transaction.fees || 0), currency, transaction.market)
                : formatCurrency(transaction.total_spent, currency, transaction.market)
              }
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">GP Atual</span>
            <span className={`font-medium ${gp.color}`}>
              {transaction.type === "Vender" ? "-" : formatCurrency(gp.value, currency)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {transaction.notes && (
          <div className="pt-2 border-t border-border/50">
            <span className="text-muted-foreground block text-sm">Notas</span>
            <span className="text-sm">{transaction.notes}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(transaction)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(transaction.id)}
            className="text-red-400 hover:text-red-300 flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}