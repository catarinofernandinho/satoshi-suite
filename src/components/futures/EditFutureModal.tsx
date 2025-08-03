import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { useFutures, type Future } from "@/hooks/useFutures";
import { useToast } from "@/hooks/use-toast";
import { useTimezone } from "@/contexts/TimezoneContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/datepicker-dark.css";

interface EditFutureModalProps {
  future: Future | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditFutureModal({ future, isOpen, onClose }: EditFutureModalProps) {
  const [loading, setLoading] = useState(false);
  const { updateFuture } = useFutures();
  const { toast } = useToast();
  const { getCurrentTime, convertToUserTime, convertToUTC } = useTimezone();

  const [formData, setFormData] = useState({
    direction: "LONG" as "LONG" | "SHORT",
    entry_price: "",
    target_price: "",
    quantity_usd: "",
    status: "OPEN" as "OPEN" | "CLOSED",
    buy_date: getCurrentTime(),
    close_date: null as Date | null,
    realized_pl: "",
    fee_trade: "",
    fee_funding: "",
  });

  useEffect(() => {
    if (future) {
      setFormData({
        direction: future.direction,
        entry_price: future.entry_price.toString(),
        target_price: future.target_price?.toString() || "",
        quantity_usd: future.quantity_usd.toString(),
        status: future.status as "OPEN" | "CLOSED",
        buy_date: new Date(future.buy_date),
        close_date: (future as any).close_date ? new Date((future as any).close_date) : null,
        realized_pl: (future as any).realized_pl?.toString() || "",
        fee_trade: (future as any).fee_trade?.toString() || "",
        fee_funding: (future as any).fee_funding?.toString() || "",
      });
    }
  }, [future]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!future) return;

    // Validation
    if (!formData.entry_price || !formData.quantity_usd) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const entryPrice = parseFloat(formData.entry_price);
    const quantityUsd = parseFloat(formData.quantity_usd);

    if (entryPrice <= 0 || quantityUsd <= 0) {
      toast({
        title: "Valores inválidos",
        description: "Preço e quantidade devem ser maiores que zero.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const updateData: any = {
        direction: formData.direction,
        entry_price: entryPrice,
        target_price: formData.target_price ? parseFloat(formData.target_price) : undefined,
        quantity_usd: quantityUsd,
        status: formData.status,
        buy_date: convertToUTC(formData.buy_date).toISOString()
      };

      if (formData.status === "CLOSED") {
        updateData.close_date = formData.close_date ? convertToUTC(formData.close_date).toISOString() : null;
        updateData.realized_pl = parseFloat(formData.realized_pl);
        updateData.fee_trade = parseInt(formData.fee_trade, 10);
        updateData.fee_funding = parseInt(formData.fee_funding, 10);
        updateData.total_fees = updateData.fee_trade + updateData.fee_funding;
        updateData.net_pl = updateData.realized_pl - updateData.total_fees;
      }

      await updateFuture(future.id, updateData);
      onClose();
      toast({
        title: "Ordem atualizada",
        description: "A ordem foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Error updating future:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar a ordem.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Editar Ordem
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Direction */}
            <div className="space-y-2">
              <Label htmlFor="direction">Direção *</Label>
              <Select value={formData.direction} onValueChange={value => setFormData({...formData, direction: value as "LONG" | "SHORT"})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar LONG/SHORT" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LONG">LONG (Comprado)</SelectItem>
                  <SelectItem value="SHORT">SHORT (Vendido)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={value => setFormData({...formData, status: value as "OPEN" | "CLOSED"})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Aberto</SelectItem>
                  <SelectItem value="CLOSED">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entry Price */}
            <div className="space-y-2">
              <Label htmlFor="entry_price">Preço de Entrada (USD) *</Label>
              <Input
                id="entry_price"
                type="number"
                step="0.01"
                placeholder="95000.00"
                value={formData.entry_price}
                onChange={e => setFormData({...formData, entry_price: e.target.value})}
                required
              />
            </div>

            {/* Target Price */}
            <div className="space-y-2">
              <Label htmlFor="target_price">Preço Alvo (USD)</Label>
              <Input
                id="target_price"
                type="number"
                step="0.01"
                placeholder="100000.00"
                value={formData.target_price}
                onChange={e => setFormData({...formData, target_price: e.target.value})}
              />
            </div>

            {/* Quantity USD */}
            <div className="space-y-2">
              <Label htmlFor="quantity_usd">Quantidade (USD) *</Label>
              <Input
                id="quantity_usd"
                type="number"
                step="0.01"
                placeholder="1000.00"
                value={formData.quantity_usd}
                onChange={e => setFormData({...formData, quantity_usd: e.target.value})}
                required
              />
            </div>

            {/* Buy Date */}
            <div className="space-y-2">
              <Label htmlFor="buy_date" className="mb-0 w-full">
                Data/Hora de Abertura *
              </Label>
              <DatePicker
                selected={convertToUserTime(formData.buy_date)}
                onChange={(date: Date | null) => {
                  if (date) {
                    const utcDate = convertToUTC(date);
                    setFormData(prev => ({
                      ...prev,
                      buy_date: utcDate 
                    }));
                  }
                }}
                dateFormat="dd/MM/yyyy HH:mm"
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={5}
                className="h-12 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground"
                placeholderText="DD/MM/AAAA HH:mm"
                locale="pt-BR"
              />
            </div>
          </div>

          {/* Campos adicionais quando status é CLOSED */}
          {formData.status === "CLOSED" && (
            <>
              <div className="flex items-center gap-2">
                <Label htmlFor="close_date" className="mb-0">Data de Saída:</Label>
                <DatePicker
                  selected={formData.close_date}
                  onChange={(date: Date | null) => setFormData(f => ({ ...f, close_date: date }))}
                  dateFormat="dd/MM/yyyy HH:mm"
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={5}
                  className="h-12 w-[220px] px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground"
                  placeholderText="DD/MM/AAAA HH:mm"
                  locale="pt-BR"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="realized_pl">PL Realizado (USD)</Label>
                <Input
                  id="realized_pl"
                  type="number"
                  step="0.01"
                  placeholder="Valor total ganho"
                  value={formData.realized_pl}
                  onChange={e => setFormData({ ...formData, realized_pl: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee_trade">Taxa de Negociação (sats)</Label>
                <Input
                  id="fee_trade"
                  type="number"
                  step="1"
                  placeholder="Satoshis pagos na negociação"
                  value={formData.fee_trade}
                  onChange={e => setFormData({ ...formData, fee_trade: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee_funding">Taxa de Financiamento (sats)</Label>
                <Input
                  id="fee_funding"
                  type="number"
                  step="1"
                  placeholder="Satoshis pagos em funding"
                  value={formData.fee_funding}
                  onChange={e => setFormData({ ...formData, fee_funding: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}