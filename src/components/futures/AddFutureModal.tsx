import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useTimezone } from "@/contexts/TimezoneContext";
import DatePicker from "react-datepicker";
import { ArrowUp, ArrowDown } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/datepicker-dark.css";

interface AddFutureModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  addFuture?: (data: any) => Promise<any>;
}
export default function AddFutureModal({
  isOpen,
  onClose,
  onSuccess,
  addFuture
}: AddFutureModalProps) {
  const [open, setOpen] = useState(false);

  // Use external control if provided, otherwise use internal state
  const modalOpen = isOpen !== undefined ? isOpen : open;
  const setModalOpen = onClose !== undefined ? onClose : setOpen;
  const [loading, setLoading] = useState(false);
const { getCurrentTime, convertToUserTime, convertToUTC } = useTimezone();

  const [formData, setFormData] = useState({
    direction: "",
    entry_price: "",
    exit_price: "",
    target_price: "",
    quantity_usd: "",
    buy_date: getCurrentTime(),
    status: "OPEN",
    close_date: null as Date | null,
    realized_pl: "",
    fee_trade: "",
    fee_funding: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData: any = {
        direction: formData.direction as "LONG" | "SHORT",
        entry_price: parseFloat(formData.entry_price),
        target_price: formData.target_price ? parseFloat(formData.target_price) : undefined,
        quantity_usd: parseFloat(formData.quantity_usd),
        buy_date: convertToUTC(formData.buy_date).toISOString(),
        status: formData.status as "OPEN" | "CLOSED"
      };

      if (formData.status === "CLOSED") {
        orderData.exit_price = formData.exit_price ? parseFloat(formData.exit_price) : undefined;
        orderData.fees_paid = (parseInt(formData.fee_trade, 10) + parseInt(formData.fee_funding, 10));
        orderData.net_pl_sats = parseInt(formData.realized_pl, 10);
        orderData.percent_gain = orderData.exit_price && orderData.entry_price ? 
          (orderData.direction === "LONG" ? 
            ((orderData.exit_price - orderData.entry_price) / orderData.entry_price) * 100 :
            ((orderData.entry_price - orderData.exit_price) / orderData.entry_price) * 100) : 0;
        orderData.percent_fee = orderData.fees_paid ? (orderData.fees_paid / orderData.quantity_usd) * 100 : 0;
        if (formData.close_date) {
          orderData.close_date = convertToUTC(formData.close_date).toISOString();
        }
      }

      if (!addFuture) {
        console.error('addFuture prop not provided to AddFutureModal');
        setLoading(false);
        return;
      }

      const result = await addFuture(orderData);
      if (result === false) {
        setLoading(false);
        return;
      }
      
      setFormData({
        direction: "",
        entry_price: "",
        exit_price: "",
        target_price: "",
        quantity_usd: "",
        buy_date: getCurrentTime(),
        status: "OPEN",
        close_date: null,
        realized_pl: "",
        fee_trade: "",
        fee_funding: "",
      });
      if (onClose) onClose();
      else setModalOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding future:', error);
    } finally {
      setLoading(false);
    }
  };

  return <Dialog open={modalOpen} onOpenChange={setModalOpen}>
    {!isOpen && <DialogTrigger asChild>

    </DialogTrigger>}
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Adicionar Nova Ordem</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="direction">Direção</Label>
            <Select value={formData.direction} onValueChange={value => setFormData({
              ...formData,
              direction: value
            })} required>
            <SelectTrigger>
              <SelectValue placeholder="LONG/SHORT" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LONG">
                <ArrowUp className="inline-block mr-2 h-4 w-4 text-green-500" />
                LONG (Comprado)
              </SelectItem>
              <SelectItem value="SHORT">
                <ArrowDown className="inline-block mr-2 h-4 w-4 text-red-500" />
                SHORT (Vendido)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entry_price">Preço de Entrada (USD)</Label>
          <Input id="entry_price" type="number" step="0.01" placeholder="95000.00" value={formData.entry_price} onChange={e => setFormData({
            ...formData,
            entry_price: e.target.value
          })} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_price">Preço Alvo (USD)</Label>
          <Input id="target_price" type="number" step="0.01" placeholder="100000.00" value={formData.target_price} onChange={e => setFormData({
            ...formData,
            target_price: e.target.value
          })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity_usd">Quantidade (USD)</Label>
          <Input id="quantity_usd" type="number" step="0.01" placeholder="1000.00" value={formData.quantity_usd} onChange={e => setFormData({
            ...formData,
            quantity_usd: e.target.value
          })} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={value => setFormData({
            ...formData,
            status: value
          })} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Aberto</SelectItem>
            <SelectItem value="CLOSED">Fechado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label 
          htmlFor="buy_date" 
          className="mb-0 w-full"
        >
          Data/Hora de Abertura:
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
        />
      </div>
    </div>


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
          />
        </div>
      <div className="space-y-2">
        <Label htmlFor="realized_pl">NET PL (SATS)</Label>
        <Input
          id="realized_pl"
          type="number"
          step="1"
          placeholder="Lucro líquido em satoshis"
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



    <div className="flex justify-end gap-3 pt-4">
      <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
        Cancelar
      </Button>
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar Ordem"}
      </Button>
    </div>
  </form>
</DialogContent>
</Dialog>;
}