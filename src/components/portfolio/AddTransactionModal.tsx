import { useState } from "react";
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
import { useTransactions } from "@/hooks/useTransactions";
import { useTimezone } from "@/contexts/TimezoneContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { calculateInterlinkedValues, formatFiatValue, validateDecimalInput, normalizeDecimalInput, getInputPlaceholder } from "@/utils/numberUtils";
interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  currency: string;
  editingTransaction?: Transaction | null;
  availableBtc?: number;
  btcCurrentPrice?: number;
}
export default function AddTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  currency,
  editingTransaction,
  availableBtc: propAvailableBtc,
  btcCurrentPrice
}: AddTransactionModalProps) {
  const [activeTab, setActiveTab] = useState<"Comprar" | "Vender" | "Transferência">("Comprar");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quantityUnit, setQuantityUnit] = useState<"BTC" | "SATS">("BTC");
  const [transferType, setTransferType] = useState<"entrada" | "saida">("entrada");
  const { getPortfolioStats, transactions } = useTransactions();
  const { getCurrentTime, convertToUserTime, convertToUTC } = useTimezone();
  
  // Use provided BTC balance
  const availableBtc = propAvailableBtc || 0;
  
  const [formData, setFormData] = useState({
    price: "",
    quantity: "",
    totalSpent: "",
    pricePerCoin: "",
    market: currency,
    fees: "",
    notes: "",
    date: getCurrentTime().toISOString(), // Use user's timezone current time
    transferType: "entrada"
  });
  const resetForm = () => {
    setFormData({
      price: "",
      quantity: "",
      totalSpent: "",
      pricePerCoin: "",
      market: currency,
      fees: "",
      notes: "",
      date: getCurrentTime().toISOString(),
      transferType: "entrada"
    });
    setActiveTab("Comprar");
    setIsAdvancedOpen(false);
    setQuantityUnit("BTC");
    setTransferType("entrada");
  };
  const handleClose = () => {
    resetForm();
    onClose();
  };
  const handleFieldChange = (changedField: 'totalSpent' | 'quantity' | 'pricePerCoin', newValue: string) => {
    // Update the changed field first
    const updatedData = { ...formData, [changedField]: newValue };
    
    // Calculate interlinked values
    const calculatedValues = calculateInterlinkedValues(
      changedField,
      updatedData.totalSpent,
      updatedData.quantity, 
      updatedData.pricePerCoin,
      quantityUnit
    );
    
    // Apply calculated values
    updatedData.totalSpent = calculatedValues.totalSpent;
    updatedData.quantity = calculatedValues.quantity;
    updatedData.pricePerCoin = calculatedValues.pricePerCoin;
    updatedData.price = calculatedValues.pricePerCoin;
    
    setFormData(updatedData);
  };

  const setMaxQuantity = () => {
    setFormData(prev => ({
      ...prev,
      quantity: availableBtc.toString()
    }));
  };

  const useMarketPrice = () => {
    if (btcCurrentPrice) {
      const updatedData = {
        ...formData,
        pricePerCoin: btcCurrentPrice.toString(),
        price: btcCurrentPrice.toString()
      };
      
      // Auto-calculate total spent if quantity is filled
      if (formData.quantity) {
        let quantityInBtc = parseFloat(formData.quantity);
        if (quantityUnit === "SATS") {
          quantityInBtc = quantityInBtc / 100000000;
        }
        updatedData.totalSpent = (quantityInBtc * btcCurrentPrice).toString();
      }
      
      setFormData(updatedData);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for selling more than available
    if (activeTab === "Vender" && parseFloat(formData.quantity) > availableBtc) {
      alert(`Você não pode vender mais do que possui. Saldo disponível: ${availableBtc.toFixed(8)} BTC`);
      return;
    }
    
    setIsLoading(true);
    try {
      let transactionData: any = {
        type: activeTab,
        price: parseFloat(formData.price || formData.pricePerCoin) || 0,
        quantity: parseFloat(formData.quantity),
        market: formData.market,
        fees: formData.fees ? parseFloat(formData.fees) : 0,
        notes: formData.notes,
        date: formData.date
      };

      if (activeTab === "Transferência") {
        transactionData.total_spent = 0;
        transactionData.price_per_coin = 0;
        transactionData.transfer_type = transferType;
      } else {
        transactionData.total_spent = parseFloat(formData.totalSpent);
        transactionData.price_per_coin = parseFloat(formData.pricePerCoin || formData.price);
        if (activeTab === "Vender") {
          transactionData.revenue = parseFloat(formData.totalSpent);
        }
      }

      await onSubmit(transactionData);
      handleClose();
    } catch (error) {
      console.error("Error submitting transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Adicionar Transação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={value => setActiveTab(value as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="Comprar">Comprar</TabsTrigger>
              <TabsTrigger value="Vender">Vender</TabsTrigger>
              <TabsTrigger value="Transferência">Transferência</TabsTrigger>
            </TabsList>

            {/* Comprar Tab */}
            <TabsContent value="Comprar" className="space-y-5 mt-6">
              <div className="space-y-2">
                <Label htmlFor="totalSpent" className="text-sm font-medium">Total Gasto</Label>
                <div className="relative">
                  <Input 
                    id="totalSpent" 
                    type="text"
                    placeholder={getInputPlaceholder("fiat", formData.market)} 
                    value={formData.totalSpent} 
                    onChange={e => {
                      const value = e.target.value;
                      if (validateDecimalInput(value, formData.market)) {
                        setFormData(prev => ({ ...prev, totalSpent: value }));
                        const normalizedValue = normalizeDecimalInput(value, formData.market);
                        if (normalizedValue && !isNaN(parseFloat(normalizedValue))) {
                          handleFieldChange('totalSpent', normalizedValue);
                        }
                      }
                    }}
                    className="pr-16 h-12"
                    required 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Select value={formData.market} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      market: value
                    }))}>
                      <SelectTrigger className="border-0 bg-transparent w-16 h-auto p-0 focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="BRL">BRL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium">Quantidade</Label>
                <div className="relative">
                  <Input 
                    id="quantity" 
                    type="number" 
                    step={quantityUnit === "BTC" ? "0.00000001" : "1"}
                    placeholder={quantityUnit === "BTC" ? "0.00000000" : "0"} 
                    value={formData.quantity} 
                    onChange={e => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, quantity: value }));
                      if (value) {
                        handleFieldChange('quantity', value);
                      }
                    }}
                    className="pr-20 h-12"
                    required 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Select value={quantityUnit} onValueChange={(value: "BTC" | "SATS") => setQuantityUnit(value)}>
                      <SelectTrigger className="border-0 bg-transparent w-16 h-auto p-0 focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">BTC</SelectItem>
                        <SelectItem value="SATS">SATS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerCoin" className="text-sm font-medium">
                  Preço por Moeda
                  <span 
                    className="text-xs text-primary ml-2 cursor-pointer hover:underline"
                    onClick={useMarketPrice}
                  >
                    Utilizar o mercado
                  </span>
                </Label>
                <div className="relative">
                  <Input 
                    id="pricePerCoin" 
                    type="text"
                    placeholder={getInputPlaceholder("fiat", formData.market)} 
                    value={formData.pricePerCoin} 
                    onChange={e => {
                      const value = e.target.value;
                      if (validateDecimalInput(value, formData.market)) {
                        setFormData(prev => ({ ...prev, pricePerCoin: value }));
                        const normalizedValue = normalizeDecimalInput(value, formData.market);
                        if (normalizedValue && !isNaN(parseFloat(normalizedValue))) {
                          handleFieldChange('pricePerCoin', normalizedValue);
                        }
                      }
                    }}
                    className="pr-16 h-12"
                    required 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {formData.market}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
  <Label htmlFor="date" className="text-sm font-medium">Data e Hora</Label>
  <DatePicker
    selected={convertToUserTime(formData.date)}
    onChange={date => {
      const utcDate = convertToUTC(date);
      setFormData(prev => ({
        ...prev,
        date: utcDate.toISOString()
      }));
    }}
    dateFormat="dd/MM/yyyy HH:mm"
    showTimeSelect
    timeFormat="HH:mm"
    timeIntervals={5}
    className="h-12 w-full border rounded px-3"
    placeholderText="DD/MM/AAAA HH:mm"
    locale="pt-BR"
  />
</div>

              {/* Advanced Options */}
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full justify-between text-sm font-medium py-3 border-t border-border">
                  <span>Taxas e observações (Opcional)</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="fees" className="text-sm font-medium">Taxas</Label>
                    <div className="relative">
                      <Input 
                        id="fees" 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={formData.fees} 
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          fees: e.target.value
                        }))} 
                        className="pr-16 h-12"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {formData.market}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">Observações</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Adicione observações sobre esta transação..." 
                      value={formData.notes} 
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))} 
                      className="min-h-[80px] resize-none"
                      rows={3} 
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>

            {/* Vender Tab */}
            <TabsContent value="Vender" className="space-y-5 mt-6">
              <div className="bg-muted/50 p-3 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">
                  Saldo: <span className="font-medium text-foreground">{availableBtc.toFixed(8)} BTC</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalReceived" className="text-sm font-medium">Total Recebido</Label>
                <div className="relative">
                  <Input 
                    id="totalReceived" 
                    type="text"
                    placeholder={getInputPlaceholder("fiat", formData.market)} 
                    value={formData.totalSpent} 
                    onChange={e => {
                      const value = e.target.value;
                      if (validateDecimalInput(value, formData.market)) {
                        setFormData(prev => ({ ...prev, totalSpent: value }));
                        const normalizedValue = normalizeDecimalInput(value, formData.market);
                        if (normalizedValue && !isNaN(parseFloat(normalizedValue))) {
                          handleFieldChange('totalSpent', normalizedValue);
                        }
                      }
                    }}
                    className="pr-16 h-12"
                    required 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Select value={formData.market} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      market: value
                    }))}>
                      <SelectTrigger className="border-0 bg-transparent w-16 h-auto p-0 focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="BRL">BRL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium">Quantidade</Label>
                <div className="relative">
                  <Input 
                    id="quantity" 
                    type="number" 
                    step={quantityUnit === "BTC" ? "0.00000001" : "1"}
                    placeholder={quantityUnit === "BTC" ? "0.00000000" : "0"} 
                    value={formData.quantity} 
                    onChange={e => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, quantity: value }));
                      if (value) {
                        handleFieldChange('quantity', value);
                      }
                    }}
                    className="pr-24 h-12"
                    required 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={setMaxQuantity} 
                      className="h-7 px-2 text-xs font-medium bg-green-500/10 border-green-500/20 text-green-600 hover:bg-green-500/20"
                    >
                      MÁXIMO
                    </Button>
                    <Select value={quantityUnit} onValueChange={(value: "BTC" | "SATS") => setQuantityUnit(value)}>
                      <SelectTrigger className="border-0 bg-transparent w-16 h-auto p-0 focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">BTC</SelectItem>
                        <SelectItem value="SATS">SATS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerCoin" className="text-sm font-medium">
                  Preço por Moeda
                  <span 
                    className="text-xs text-primary ml-2 cursor-pointer hover:underline"
                    onClick={useMarketPrice}
                  >
                    Utilizar o mercado
                  </span>
                </Label>
                <div className="relative">
                  <Input 
                    id="pricePerCoin" 
                    type="text"
                    placeholder={getInputPlaceholder("fiat", formData.market)} 
                    value={formData.pricePerCoin} 
                    onChange={e => {
                      const value = e.target.value;
                      if (validateDecimalInput(value, formData.market)) {
                        setFormData(prev => ({ ...prev, pricePerCoin: value }));
                        const normalizedValue = normalizeDecimalInput(value, formData.market);
                        if (normalizedValue && !isNaN(parseFloat(normalizedValue))) {
                          handleFieldChange('pricePerCoin', normalizedValue);
                        }
                      }
                    }}
                    className="pr-16 h-12"
                    required 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {formData.market}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Data e Hora</Label>
                <Input 
                  id="date" 
                  type="datetime-local" 
                  value={convertToUserTime(formData.date).toISOString().slice(0, 16)}
                  onChange={e => {
                    const userTimeDate = new Date(e.target.value);
                    const utcDate = convertToUTC(userTimeDate);
                    setFormData(prev => ({
                      ...prev,
                      date: utcDate.toISOString()
                    }));
                  }} 
                  className="h-12"
                  required 
                />
              </div>

              {/* Advanced Options */}
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                  Opções Avançadas
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="fees">Taxas (opcional)</Label>
                    <Input 
                      id="fees" 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={formData.fees} 
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        fees: e.target.value
                      }))} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Adicione observações sobre esta transação..." 
                      value={formData.notes} 
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))} 
                      rows={3} 
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>

            {/* Transferência Tab */}
            <TabsContent value="Transferência" className="space-y-5 mt-6">
              <div className="space-y-2">
                <Label htmlFor="transferType" className="text-sm font-medium">Tipo de Transferência</Label>
                <Select value={transferType} onValueChange={(value: "entrada" | "saida") => setTransferType(value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Transferência de Entrada</SelectItem>
                    <SelectItem value="saida">Transferência de Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium">Quantidade</Label>
                <div className="relative">
                  <Input 
                    id="quantity" 
                    type="number" 
                    step={quantityUnit === "BTC" ? "0.00000001" : "1"}
                    placeholder={quantityUnit === "BTC" ? "0.00000000" : "0"} 
                    value={formData.quantity} 
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      quantity: e.target.value
                    }))} 
                    className="pr-20 h-12"
                    required 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Select value={quantityUnit} onValueChange={(value: "BTC" | "SATS") => setQuantityUnit(value)}>
                      <SelectTrigger className="border-0 bg-transparent w-16 h-auto p-0 focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">BTC</SelectItem>
                        <SelectItem value="SATS">SATS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Data e Hora</Label>
                <Input 
                  id="date" 
                  type="datetime-local" 
                  value={convertToUserTime(formData.date).toISOString().slice(0, 16)} 
                  onChange={e => {
                    const userTimeDate = new Date(e.target.value);
                    const utcDate = convertToUTC(userTimeDate);
                    setFormData(prev => ({
                      ...prev,
                      date: utcDate.toISOString()
                    }));
                  }} 
                  className="h-12"
                  required 
                />
              </div>

              {/* Advanced Options */}
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                  Opções Avançadas
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="fees">Taxas (opcional)</Label>
                    <Input 
                      id="fees" 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={formData.fees} 
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        fees: e.target.value
                      }))} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Adicione observações sobre esta transação..." 
                      value={formData.notes} 
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))} 
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
    </Dialog>;
}