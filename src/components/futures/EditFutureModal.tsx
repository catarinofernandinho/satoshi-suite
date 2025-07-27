import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useFutures, type Future } from "@/hooks/useFutures";
import { useToast } from "@/hooks/use-toast";

interface EditFutureModalProps {
  future: Future | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditFutureModal({ future, isOpen, onClose }: EditFutureModalProps) {
  const [loading, setLoading] = useState(false);
  const { updateFuture } = useFutures();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    direction: "LONG" as "LONG" | "SHORT",
    entry_price: "",
    exit_price: "",
    target_price: "",
    quantity_usd: "",
    leverage: "",
    status: "OPEN" as "OPEN" | "CLOSED" | "STOP" | "CANCELLED",
    buy_date: new Date()
  });

  useEffect(() => {
    if (future) {
      setFormData({
        direction: future.direction,
        entry_price: future.entry_price.toString(),
        exit_price: future.exit_price?.toString() || "",
        target_price: future.target_price?.toString() || "",
        quantity_usd: future.quantity_usd.toString(),
        leverage: future.leverage.toString(),
        status: future.status,
        buy_date: new Date(future.buy_date)
      });
    }
  }, [future]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!future) return;

    // Validation
    if (!formData.entry_price || !formData.quantity_usd || !formData.leverage) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const entryPrice = parseFloat(formData.entry_price);
    const quantityUsd = parseFloat(formData.quantity_usd);
    const leverage = parseFloat(formData.leverage);

    if (entryPrice <= 0 || quantityUsd <= 0 || leverage <= 0) {
      toast({
        title: "Valores inválidos",
        description: "Preço, quantidade e alavancagem devem ser maiores que zero.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        direction: formData.direction,
        entry_price: entryPrice,
        exit_price: formData.exit_price ? parseFloat(formData.exit_price) : undefined,
        target_price: formData.target_price ? parseFloat(formData.target_price) : undefined,
        quantity_usd: quantityUsd,
        leverage,
        status: formData.status,
        buy_date: formData.buy_date.toISOString()
      };

      await updateFuture(future.id, updateData);
      onClose();
    } catch (error) {
      console.error('Error updating future:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Editar Contrato Futuro
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Direction */}
            <div className="space-y-2">
              <Label htmlFor="direction">Direção *</Label>
              <Select value={formData.direction} onValueChange={(value) => handleInputChange('direction', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LONG">LONG</SelectItem>
                  <SelectItem value="SHORT">SHORT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Aberto</SelectItem>
                  <SelectItem value="CLOSED">Fechado</SelectItem>
                  <SelectItem value="STOP">Stop</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
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
                value={formData.entry_price}
                onChange={(e) => handleInputChange('entry_price', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            {/* Exit Price */}
            <div className="space-y-2">
              <Label htmlFor="exit_price">Preço de Saída (USD)</Label>
              <Input
                id="exit_price"
                type="number"
                step="0.01"
                value={formData.exit_price}
                onChange={(e) => handleInputChange('exit_price', e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Target Price */}
            <div className="space-y-2">
              <Label htmlFor="target_price">Preço Alvo (USD)</Label>
              <Input
                id="target_price"
                type="number"
                step="0.01"
                value={formData.target_price}
                onChange={(e) => handleInputChange('target_price', e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Quantity USD */}
            <div className="space-y-2">
              <Label htmlFor="quantity_usd">Quantidade (USD) *</Label>
              <Input
                id="quantity_usd"
                type="number"
                step="0.01"
                value={formData.quantity_usd}
                onChange={(e) => handleInputChange('quantity_usd', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            {/* Leverage */}
            <div className="space-y-2">
              <Label htmlFor="leverage">Alavancagem *</Label>
              <Input
                id="leverage"
                type="number"
                step="0.1"
                value={formData.leverage}
                onChange={(e) => handleInputChange('leverage', e.target.value)}
                placeholder="1.0"
                required
              />
            </div>

            {/* Buy Date */}
            <div className="space-y-2">
              <Label>Data da Operação *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.buy_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.buy_date ? (
                      format(formData.buy_date, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.buy_date}
                    onSelect={(date) => handleInputChange('buy_date', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

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