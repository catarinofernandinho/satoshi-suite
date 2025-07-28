import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Transaction } from "@/hooks/useTransactions";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  currency: string;
  currentBtcPrice: number; // Novo, para "Utilizar o mercado"
}

export default function AddTransactionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  currency,
  currentBtcPrice
}: AddTransactionModalProps) {
  const [activeTab, setActiveTab] = useState<"Comprar" | "Vender" | "Transferência">("Comprar");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    price: "",
    quantity: "",
    totalSpent: "",
    pricePerCoin: "",
    market: currency,
    feesAndNotes: "", // Unificado
    date: new Date().toISOString().slice(0, 16)
  });

  const resetForm = () => {
    setFormData({
      price: "",
      quantity: "",
      totalSpent: "",
      pricePerCoin: "",
      market: currency,
      feesAndNotes: "",
      date: new Date().toISOString().slice(0, 16)
    });
    setActiveTab("Comprar");
    setIsAdvancedOpen(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const calculateMissingValues = () => {
    const { price, quantity, totalSpent, pricePerCoin } = formData;
    const updatedData = { ...formData };

    if (quantity && pricePerCoin && !totalSpent) {
      updatedData.totalSpent = (parseFloat(quantity) * parseFloat(pricePerCoin)).toString();
    } else if (totalSpent && quantity && !pricePerCoin) {
      updatedData.pricePerCoin = (parseFloat(totalSpent) / parseFloat(quantity)).toString();
    } else if (totalSpent && pricePerCoin && !quantity) {
      updatedData.quantity = (parseFloat(totalSpent) / parseFloat(pricePerCoin)).toString();
    }

    if (pricePerCoin === "" && !price) {
      updatedData.pricePerCoin = currentBtcPrice.toString(); // "Utilizar o mercado"
    } else if (pricePerCoin && !price) {
      updatedData.price = pricePerCoin;
    }

    setFormData(updatedData);
  };

  useEffect(() => {
    calculateMissingValues();
  }, [currentBtcPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const [fees, ...notes] = formData.feesAndNotes.split('|').map(s => s.trim());
      const transactionData = {
        type: activeTab,
        price: parseFloat(formData.price || formData.pricePerCoin),
        quantity: parseFloat(formData.quantity),
        total_spent: parseFloat(formData.totalSpent),
        price_per_coin: parseFloat(formData.pricePerCoin || formData.price),
        market: formData.market,
        fees: fees ? parseFloat(fees) : 0,
        notes: notes.join(' ') || "",
        date: formData.date
      };

      if (transactionData.quantity <= 0 || transactionData.total_spent <= 0) {
        throw new Error("Quantidade e custo devem ser positivos.");
      }

      await onSubmit(transactionData);
      handleClose();
    } catch (error) {
      console.error("Error submitting transaction:", error);
      // Adicionar toast aqui
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[90%] md:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Adicionar Transação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="Comprar">Comprar</TabsTrigger>
              <TabsTrigger value="Vender">Vender</TabsTrigger>
              <TabsTrigger value="Transferência">Transferência</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="market">Moeda</Label>
                  <Select value={formData.market} onValueChange={(value) => setFormData(prev => ({ ...prev, market: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a moeda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="BRL">BRL</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="SATS">SATS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalSpent">Gasto Total</Label>
                  <Input
                    id="totalSpent"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.totalSpent}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalSpent: e.target.value }))}
                    onBlur={calculateMissingValues}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.00000001"
                    placeholder="0.00000000"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    onBlur={calculateMissingValues}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerCoin">Preço por Moeda</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pricePerCoin"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.pricePerCoin}
                      onChange={(e) => setFormData(prev => ({ ...prev, pricePerCoin: e.target.value }))}
                      onBlur={calculateMissingValues}
                      required
                    />
                    <Button variant="outline" onClick={() => setFormData(prev => ({ ...prev, pricePerCoin: currentBtcPrice.toString() }))}>
                      Utilizar Mercado
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data e Hora</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                  Opções Avançadas
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="feesAndNotes">Taxas e Notas (ex.: 5|Nota)</Label>
                    <Textarea
                      id="feesAndNotes"
                      placeholder="Ex.: 5 USD | Compra via Binance"
                      value={formData.feesAndNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, feesAndNotes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="bitcoin" disabled={isLoading} className="flex-1">
              {isLoading ? "Adicionando..." : "Adicionar Transação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}