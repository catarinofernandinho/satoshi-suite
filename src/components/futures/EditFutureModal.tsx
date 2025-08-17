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
  updateFuture?: (id: string, updates: Partial<Future>) => Promise<any>;
}

export default function EditFutureModal({ future, isOpen, onClose, updateFuture: updateFutureProp }: EditFutureModalProps) {
  const [loading, setLoading] = useState(false);
  const { updateFuture } = useFutures();
  const updateFn = updateFutureProp ?? updateFuture;
  const { toast } = useToast();
  const { getCurrentTime, convertToUserTime, convertToUTC } = useTimezone();

  const [dateError, setDateError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    direction: "LONG" as "LONG" | "SHORT",
    entry_price: "",
    target_price: "",
    quantity_usd: "",
    status: "OPEN" as "OPEN" | "CLOSED",
    buy_date: getCurrentTime(),
    close_date: null as Date | null,
    pl_sats: "",
    fee_trade: "",
    fee_funding: "",
    net_pl_sats: "",
  });

  const validateDates = (next: { status?: string; buy_date?: Date; close_date?: Date | null }) => {
    const status = (next.status ?? formData.status) as "OPEN" | "CLOSED";
    const buy = next.buy_date ?? formData.buy_date;
    const close = next.close_date ?? formData.close_date;
    if (status === "CLOSED") {
      if (!close) {
        setDateError("Defina a data de saída para ordens fechadas.");
        return false;
      }
      const buyUTC = convertToUTC(buy).getTime();
      const closeUTC = convertToUTC(close).getTime();
      if (buyUTC >= closeUTC) {
        setDateError("Data de entrada deve ser anterior à data de saída.");
        return false;
      }
    }
    setDateError(null);
    return true;
  };

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
        pl_sats: (future as any).pl_sats?.toString() || "",
        fee_trade: (future as any).fee_trade?.toString() || "",
        fee_funding: (future as any).fee_funding?.toString() || "",
        net_pl_sats: future.net_pl_sats?.toString() || "",
      });
      // Run initial validation for CLOSED orders
      validateDates({});
    }
  }, [future]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!future) return;

    // Validate dates before submit
    if (!validateDates({})) {
      return;
    }

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

      // Manter target_price e exit_price sempre iguais quando houver um valor informado
      if (updateData.target_price != null) {
        updateData.exit_price = updateData.target_price;
      }

      if (formData.status === "CLOSED") {
        updateData.close_date = formData.close_date ? convertToUTC(formData.close_date).toISOString() : null;
        updateData.exit_price = updateData.target_price;
        updateData.pl_sats = parseInt(formData.pl_sats, 10) || 0;
        updateData.fee_trade = parseInt(formData.fee_trade, 10) || 0;
        updateData.fee_funding = parseInt(formData.fee_funding, 10) || 0;
        updateData.net_pl_sats = parseInt(formData.net_pl_sats, 10) || 0;
        updateData.fees_paid = updateData.fee_trade + updateData.fee_funding;
        
        // Calcular percent_gain
        updateData.percent_gain = updateData.exit_price && updateData.entry_price ? 
          (updateData.direction === "LONG" ? 
            ((updateData.exit_price - updateData.entry_price) / updateData.entry_price) * 100 :
            ((updateData.entry_price - updateData.exit_price) / updateData.entry_price) * 100) : 0;
        updateData.percent_fee = updateData.fees_paid ? (updateData.fees_paid / updateData.quantity_usd) * 100 : 0;
      }

      await updateFn(future.id, updateData);
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
              <Select value={formData.status} onValueChange={value => {
                setFormData({...formData, status: value as "OPEN" | "CLOSED"});
                validateDates({ status: value as any });
              }}>
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
                    validateDates({ buy_date: utcDate });
                  }
                }}
                dateFormat="dd/MM/yyyy HH:mm"
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={5}
                className={`h-12 w-full px-3 py-2 rounded-md border ${dateError ? 'border-destructive' : 'border-input'} bg-background text-foreground placeholder:text-muted-foreground`}
                placeholderText="DD/MM/AAAA HH:mm"
                locale="pt-BR"
              />
            </div>
          </div>

            {/* Campos adicionais quando status é CLOSED */}
          {formData.status === "CLOSED" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="close_date">Data de Saída *</Label>
                <DatePicker
                  selected={formData.close_date ? convertToUserTime(formData.close_date) : null}
                  onChange={(date: Date | null) => {
                    if (date) {
                      const utcDate = convertToUTC(date);
                      setFormData(prev => ({ ...prev, close_date: utcDate }));
                      validateDates({ close_date: utcDate });
                    }
                  }}
                  dateFormat="dd/MM/yyyy HH:mm"
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={5}
                  className={`h-12 w-full px-3 py-2 rounded-md border ${dateError ? 'border-destructive' : 'border-input'} bg-background text-foreground placeholder:text-muted-foreground`}
                  placeholderText="DD/MM/AAAA HH:mm"
                />
                {dateError && (
                  <p className="text-sm text-destructive">{dateError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exit_price">Preço de Saída (USD) *</Label>
                <Input
                  id="exit_price"
                  type="number"
                  step="0.01"
                  placeholder="100000.00"
                  value={formData.target_price}
                  onChange={e => setFormData({ ...formData, target_price: e.target.value })}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Valor preenchido automaticamente com o preço alvo
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pl_sats">PL (SATS)</Label>
                <Input
                  id="pl_sats"
                  type="number"
                  step="1"
                  placeholder="Lucro bruto em satoshis"
                  value={formData.pl_sats}
                  onChange={e => {
                    const newPl = e.target.value;
                    const pl = parseInt(newPl) || 0;
                    const feeTrade = parseInt(formData.fee_trade) || 0;
                    const feeFunding = parseInt(formData.fee_funding) || 0;
                    const netPl = pl - feeTrade - feeFunding;
                    setFormData({ 
                      ...formData, 
                      pl_sats: newPl,
                      net_pl_sats: netPl.toString()
                    });
                  }}
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
                  onChange={e => {
                    const newFeeTrade = e.target.value;
                    const pl = parseInt(formData.pl_sats) || 0;
                    const feeTrade = parseInt(newFeeTrade) || 0;
                    const feeFunding = parseInt(formData.fee_funding) || 0;
                    const netPl = pl - feeTrade - feeFunding;
                    setFormData({ 
                      ...formData, 
                      fee_trade: newFeeTrade,
                      net_pl_sats: netPl.toString()
                    });
                  }}
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
                  onChange={e => {
                    const newFeeFunding = e.target.value;
                    const pl = parseInt(formData.pl_sats) || 0;
                    const feeTrade = parseInt(formData.fee_trade) || 0;
                    const feeFunding = parseInt(newFeeFunding) || 0;
                    const netPl = pl - feeTrade - feeFunding;
                    setFormData({ 
                      ...formData, 
                      fee_funding: newFeeFunding,
                      net_pl_sats: netPl.toString()
                    });
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="net_pl_sats">NET PL (SATS)</Label>
                <Input
                  id="net_pl_sats"
                  type="number"
                  step="1"
                  placeholder="Lucro líquido calculado automaticamente"
                  value={formData.net_pl_sats}
                  onChange={e => setFormData({ ...formData, net_pl_sats: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  NET PL calculado automaticamente: PL - Taxa Negociação - Taxa Financiamento
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !!dateError}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}