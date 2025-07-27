import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, TrendingDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useFutures, type Future } from "@/hooks/useFutures";
import { useToast } from "@/hooks/use-toast";

interface CloseOrderModalProps {
  order: Future | null;
  isOpen: boolean;
  onClose: () => void;
  btcCurrentPrice: number;
}

export default function CloseOrderModal({ order, isOpen, onClose, btcCurrentPrice }: CloseOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const { closeFuture } = useFutures();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    close_date: new Date(),
    net_pl_sats: "",
    fees_paid_sats: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    // Validação
    if (!formData.net_pl_sats || !formData.fees_paid_sats) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const netPLSats = parseFloat(formData.net_pl_sats);
    const feesSats = parseFloat(formData.fees_paid_sats);

    if (isNaN(netPLSats) || isNaN(feesSats)) {
      toast({
        title: "Valores inválidos",
        description: "Os valores devem ser números válidos.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Calcular preço de saída baseado no P&L
      const exitPrice = calculateExitPrice(order, netPLSats, btcCurrentPrice);
      
      await closeFuture(order.id, {
        exit_price: exitPrice,
        fees_paid: (feesSats / 100000000) * btcCurrentPrice, // Convert sats to USD
        net_pl_sats: netPLSats,
        close_date: formData.close_date.toISOString()
      });

      // Reset form
      setFormData({
        close_date: new Date(),
        net_pl_sats: "",
        fees_paid_sats: ""
      });
      
      onClose();
    } catch (error) {
      console.error('Error closing order:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateExitPrice = (order: Future, netPLSats: number, btcPrice: number): number => {
    // Estimativa do preço de saída baseado no P&L líquido
    const netPLUSD = (netPLSats / 100000000) * btcPrice;
    const percentChange = (netPLUSD / order.quantity_usd) * 100 / order.leverage;
    
    if (order.direction === "LONG") {
      return order.entry_price * (1 + percentChange / 100);
    } else {
      return order.entry_price * (1 - percentChange / 100);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Fechar Ordem
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Direção:</span>
              <div className="font-medium">{order.direction}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Quantidade:</span>
              <div className="font-medium">${order.quantity_usd.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Alavancagem:</span>
              <div className="font-medium">{order.leverage}x</div>
            </div>
            <div>
              <span className="text-muted-foreground">Preço Entrada:</span>
              <div className="font-medium">${order.entry_price.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Data de Fechamento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.close_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.close_date ? (
                    format(formData.close_date, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecionar data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.close_date}
                  onSelect={(date) => setFormData(prev => ({ ...prev, close_date: date || new Date() }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="net_pl_sats">Valor Líquido (satoshis) *</Label>
            <Input
              id="net_pl_sats"
              type="number"
              step="1"
              placeholder="0"
              value={formData.net_pl_sats}
              onChange={(e) => setFormData(prev => ({ ...prev, net_pl_sats: e.target.value }))}
              required
            />
            <p className="text-xs text-muted-foreground">
              P&L líquido final em satoshis (positivo = lucro, negativo = prejuízo)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fees_paid_sats">Taxa Paga (satoshis) *</Label>
            <Input
              id="fees_paid_sats"
              type="number"
              step="1"
              placeholder="0"
              value={formData.fees_paid_sats}
              onChange={(e) => setFormData(prev => ({ ...prev, fees_paid_sats: e.target.value }))}
              required
            />
            <p className="text-xs text-muted-foreground">
              Total de taxas pagas em satoshis
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
              {loading ? "Fechando..." : "Fechar Ordem"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}