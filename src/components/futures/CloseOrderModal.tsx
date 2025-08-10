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
  closeFuture?: (id: string, closeData: {
    exit_price: number;
    fees_paid: number;
    net_pl_sats: number;
    pl_sats: number;
    close_date?: string;
    fee_trade?: number;
    fee_funding?: number;
  }) => Promise<any>;
}
export default function CloseOrderModal({
  order,
  isOpen,
  onClose,
  btcCurrentPrice,
  closeFuture: closeFutureProp
}: CloseOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const {
    closeFuture: hookCloseFuture
  } = useFutures();
  const closeFn = closeFutureProp ?? hookCloseFuture;
  const {
    toast
  } = useToast();
  const {
    getCurrentTime,
    convertToUTC
  } = useTimezone();
  const [formData, setFormData] = useState({
    close_date: getCurrentTime(),
    exit_price: "",
    pl_sats: "",
    fee_trade: "",
    fee_funding: "",
    net_pl_sats: ""
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
    if (!formData.exit_price || !formData.pl_sats || !formData.fee_trade || !formData.fee_funding) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    const exitPrice = parseFloat(formData.exit_price);
    const plSats = parseInt(formData.pl_sats);
    const feeTrade = parseInt(formData.fee_trade);
    const feeFunding = parseInt(formData.fee_funding);
    const netPlSats = parseInt(formData.net_pl_sats);
    if (isNaN(exitPrice) || isNaN(plSats) || isNaN(feeTrade) || isNaN(feeFunding) || isNaN(netPlSats)) {
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
        net_pl_sats: netPlSats,
        pl_sats: plSats,
        close_date: convertToUTC(formData.close_date).toISOString(),
        fee_trade: feeTrade,
        fee_funding: feeFunding
      });

      // Reset form
      setFormData({
        close_date: getCurrentTime(),
        exit_price: "",
        pl_sats: "",
        fee_trade: "",
        fee_funding: "",
        net_pl_sats: ""
      });
      onClose();
    } catch (error) {
      console.error('Error closing order:', error);
    } finally {
      setLoading(false);
    }
  };
  if (!order) return null;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            
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
            <DatePicker selected={formData.close_date} onChange={(date: Date | null) => setFormData(prev => ({
            ...prev,
            close_date: date || getCurrentTime()
          }))} dateFormat="dd/MM/yyyy HH:mm" showTimeSelect timeFormat="HH:mm" timeIntervals={5} className="h-12 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground" placeholderText="DD/MM/AAAA HH:mm" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exit_price">Preço de Saída (USD) *</Label>
            <Input id="exit_price" type="number" step="0.01" placeholder="100000.00" value={formData.exit_price} onChange={e => setFormData(prev => ({
            ...prev,
            exit_price: e.target.value
          }))} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pl_sats">PL (SATS) *</Label>
            <Input id="pl_sats" type="number" step="1" placeholder="Lucro bruto em satoshis" value={formData.pl_sats} onChange={e => {
            const newPl = e.target.value;
            setFormData(prev => {
              const pl = parseInt(newPl) || 0;
              const feeTrade = parseInt(prev.fee_trade) || 0;
              const feeFunding = parseInt(prev.fee_funding) || 0;
              const netPl = pl - feeTrade - feeFunding;
              return {
                ...prev,
                pl_sats: newPl,
                net_pl_sats: netPl.toString()
              };
            });
          }} required />
            <p className="text-xs text-muted-foreground">
              PL bruto em satoshis (antes das taxas)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee_trade">Taxa de Negociação (sats) *</Label>
            <Input id="fee_trade" type="number" step="1" placeholder="Satoshis pagos na negociação" value={formData.fee_trade} onChange={e => {
            const newFeeTrade = e.target.value;
            setFormData(prev => {
              const pl = parseInt(prev.pl_sats) || 0;
              const feeTrade = parseInt(newFeeTrade) || 0;
              const feeFunding = parseInt(prev.fee_funding) || 0;
              const netPl = pl - feeTrade - feeFunding;
              return {
                ...prev,
                fee_trade: newFeeTrade,
                net_pl_sats: netPl.toString()
              };
            });
          }} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee_funding">Taxa de Financiamento (sats) *</Label>
            <Input id="fee_funding" type="number" step="1" placeholder="Satoshis pagos em funding" value={formData.fee_funding} onChange={e => {
            const newFeeFunding = e.target.value;
            setFormData(prev => {
              const pl = parseInt(prev.pl_sats) || 0;
              const feeTrade = parseInt(prev.fee_trade) || 0;
              const feeFunding = parseInt(newFeeFunding) || 0;
              const netPl = pl - feeTrade - feeFunding;
              return {
                ...prev,
                fee_funding: newFeeFunding,
                net_pl_sats: netPl.toString()
              };
            });
          }} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="net_pl_sats">NET PL (SATS) *</Label>
            <Input id="net_pl_sats" type="number" step="1" placeholder="Lucro líquido calculado automaticamente" value={formData.net_pl_sats} onChange={e => setFormData(prev => ({
            ...prev,
            net_pl_sats: e.target.value
          }))} required />
            <p className="text-xs text-muted-foreground">
              NET PL calculado automaticamente: PL - Taxa Negociação - Taxa Financiamento
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
    </Dialog>;
}