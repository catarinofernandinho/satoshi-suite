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
    leverage: "",
    buy_date: getCurrentTime(),
    status: "OPEN"
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addFuture({
        direction: formData.direction as "LONG" | "SHORT",
        entry_price: parseFloat(formData.entry_price),
        target_price: formData.target_price ? parseFloat(formData.target_price) : undefined,
        quantity_usd: parseFloat(formData.quantity_usd),
        leverage: parseFloat(formData.leverage),
        buy_date: convertToUTC(formData.buy_date).toISOString(),
        status: formData.status as "OPEN" | "CLOSED" | "STOP" | "CANCELLED"
      } as Omit<Future, 'id' | 'created_at' | 'updated_at'>);
      setFormData({
        direction: "",
        entry_price: "",
        target_price: "",
        quantity_usd: "",
        leverage: "",
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
    <DialogContent className="sm:max-w-[600px]">
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
          <Label htmlFor="leverage">Alavancagem</Label>
          <Select value={formData.leverage} onValueChange={value => setFormData({
            ...formData,
            leverage: value
          })} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar alavancagem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1x</SelectItem>
            <SelectItem value="2">2x</SelectItem>
            <SelectItem value="3">3x</SelectItem>
            <SelectItem value="5">5x</SelectItem>
            <SelectItem value="10">10x</SelectItem>
            <SelectItem value="20">20x</SelectItem>
            <SelectItem value="50">50x</SelectItem>
            <SelectItem value="100">100x</SelectItem>
          </SelectContent>
        </Select>
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
          <SelectItem value="STOP">Stop</SelectItem>
          <SelectItem value="CANCELLED">Cancelado</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="flex items-center gap-2">
      <Label htmlFor="buy_date" className="mb-0">Data/Hora de Abertura: </Label>
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