import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useFutures, type Future } from "@/hooks/useFutures";
import { useTimezone } from "@/contexts/TimezoneContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/datepicker-dark.css";

interface AddFutureModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}
export default function AddFutureModal({
  isOpen,
  onClose,
  onSuccess
}: AddFutureModalProps) {
  const [open, setOpen] = useState(false);

  // Use external control if provided, otherwise use internal state
  const modalOpen = isOpen !== undefined ? isOpen : open;
  const setModalOpen = onClose !== undefined ? onClose : setOpen;
  const [loading, setLoading] = useState(false);
  const {
    addFuture
  } = useFutures();
  const { getCurrentTime, convertToUserTime, convertToUTC } = useTimezone();

  const [formData, setFormData] = useState({
    direction: "",
    entry_price: "",
    target_price: "",
    quantity_usd: "",
    buy_date: getCurrentTime(),
    status: "OPEN",
  close_date: null, // Date
  realized_pl: "", // string para valor
  fee_trade: "",   // taxa negociação (sats)
  fee_funding: "", // taxa financiamento (sats)
});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const orderData = {
      direction: formData.direction as "LONG" | "SHORT",
      entry_price: parseFloat(formData.entry_price),
      target_price: formData.target_price ? parseFloat(formData.target_price) : undefined,
      quantity_usd: parseFloat(formData.quantity_usd),
      buy_date: convertToUTC(formData.buy_date).toISOString(),
      status: formData.status as "OPEN" | "CLOSED"
    };

    if (formData.status === "CLOSED") {
      orderData.close_date = formData.close_date ? convertToUTC(formData.close_date).toISOString() : null;
      orderData.realized_pl = parseFloat(formData.realized_pl);
      orderData.fee_trade = parseInt(formData.fee_trade, 10);
      orderData.fee_funding = parseInt(formData.fee_funding, 10);
    orderData.total_fees = orderData.fee_trade + orderData.fee_funding; // se quiser já calcular
    orderData.net_pl = orderData.realized_pl - orderData.total_fees; // se quiser já calcular
  }

  try {
    await addFuture({
      direction: formData.direction as "LONG" | "SHORT",
      entry_price: parseFloat(formData.entry_price),
      target_price: formData.target_price ? parseFloat(formData.target_price) : undefined,
      quantity_usd: parseFloat(formData.quantity_usd),
      buy_date: convertToUTC(formData.buy_date).toISOString(),
      status: formData.status as "OPEN" | "CLOSED"
    } as Omit<Future, 'id' | 'created_at' | 'updated_at'>);
    setFormData({
      direction: "",
      entry_price: "",
      target_price: "",
      quantity_usd: "",
      buy_date: getCurrentTime(),
      status: "OPEN"
    });
    setModalOpen(false);
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
            <SelectValue placeholder="Selecionar direção" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LONG">LONG (Comprado)</SelectItem>
            <SelectItem value="SHORT">SHORT (Vendido)</SelectItem>
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

    <div className="flex items-center gap-2">
      <Label 
        htmlFor="buy_date" 
        className="mb-0 w-[170px]"
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
        className="h-12 w-[220px] px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground"
        placeholderText="DD/MM/AAAA HH:mm"
        locale="pt-BR"
      />
    </div>
  </div>


  {formData.status === "CLOSED" && (
    <>
    <div className="flex items-center gap-2">
      <Label htmlFor="close_date" className="mb-0">Data de Saída:</Label>
      <DatePicker
        selected={formData.close_date}
        onChange={date => setFormData(f => ({ ...f, close_date: date }))}
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