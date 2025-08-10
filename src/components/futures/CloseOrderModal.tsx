import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingDown } from "lucide-react";
import { useTimezone } from "@/contexts/TimezoneContext";
import { useFutures, type Future } from "@/hooks/useFutures";
import { useToast } from "@/hooks/use-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/datepicker-dark.css";

interface CloseOrderModalProps {
  order: Future | null;
  isOpen: boolean;
  onClose: () => void;
  btcCurrentPrice: number;
  closeFuture?: (id: string, closeData: { exit_price: number; fees_paid: number; net_pl_sats: number; close_date?: string; fee_trade?: number; fee_funding?: number }) => Promise<any>;
}

export default function CloseOrderModal({ order, isOpen, onClose, btcCurrentPrice, closeFuture: closeFutureProp }: CloseOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const { closeFuture: hookCloseFuture } = useFutures();
  const closeFn = closeFutureProp ?? hookCloseFuture;
  const { toast } = useToast();
  const { getCurrentTime, convertToUTC } = useTimezone();

  const [formData, setFormData] = useState({
    close_date: getCurrentTime(),
    exit_price: "",
    realized_pl: "",
    fee_trade: "",
    fee_funding: ""
  });

  // Atualizar preço de saída quando a ordem muda
  useEffect(() => {
    if (order?.target_price) {
      setFormData(prev => ({
        ...prev,
        exit_price: order.target_price.toString()
      }));
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    // Validação
    if (!formData.exit_price || !formData.realized_pl || !formData.fee_trade || !formData.fee_funding) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const exitPrice = parseFloat(formData.exit_price);
    const realizedPL = parseInt(formData.realized_pl);
    const feeTrade = parseInt(formData.fee_trade);
    const feeFunding = parseInt(formData.fee_funding);

    if (isNaN(exitPrice) || isNaN(realizedPL) || isNaN(feeTrade) || isNaN(feeFunding)) {
      toast({
        title: "Valores inválidos",
        description: "Os valores devem ser números válidos.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const totalFees = feeTrade + feeFunding;
      
      await closeFn(order.id, {
        exit_price: exitPrice,
        fees_paid: totalFees,
        net_pl_sats: realizedPL,
        close_date: convertToUTC(formData.close_date).toISOString(),
        fee_trade: feeTrade,
        fee_funding: feeFunding
      });

      // Reset form
      setFormData({
        close_date: getCurrentTime(),
        exit_price: "",
        realized_pl: "",
        fee_trade: "",
        fee_funding: ""
      });
      
      onClose();
    } catch (error) {
      console.error('Error closing order:', error);
    } finally {
      setLoading(false);
    }
  };


  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
              <span className="text-muted-foreground">Preço Entrada:</span>
              <div className="font-medium">${order.entry_price.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="close_date">Data de Saída *</Label>
            <DatePicker
              selected={formData.close_date}
              onChange={(date: Date | null) => setFormData(prev => ({ ...prev, close_date: date || getCurrentTime() }))}
              dateFormat="dd/MM/yyyy HH:mm"
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={5}
              className="h-12 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground"
              placeholderText="DD/MM/AAAA HH:mm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exit_price">Preço de Saída (USD) *</Label>
            <Input
              id="exit_price"
              type="number"
              step="0.01"
              placeholder="100000.00"
              value={formData.exit_price}
              onChange={(e) => setFormData(prev => ({ ...prev, exit_price: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="realized_pl">NET PL (SATS) *</Label>
            <Input
              id="realized_pl"
              type="number"
              step="1"
              placeholder="Lucro líquido em satoshis"
              value={formData.realized_pl}
              onChange={(e) => setFormData(prev => ({ ...prev, realized_pl: e.target.value }))}
              required
            />
            <p className="text-xs text-muted-foreground">
              NET PL em satoshis (lucro líquido final)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee_trade">Taxa de Negociação (sats) *</Label>
            <Input
              id="fee_trade"
              type="number"
              step="1"
              placeholder="Satoshis pagos na negociação"
              value={formData.fee_trade}
              onChange={(e) => setFormData(prev => ({ ...prev, fee_trade: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee_funding">Taxa de Financiamento (sats) *</Label>
            <Input
              id="fee_funding"
              type="number"
              step="1"
              placeholder="Satoshis pagos em funding"
              value={formData.fee_funding}
              onChange={(e) => setFormData(prev => ({ ...prev, fee_funding: e.target.value }))}
              required
            />
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