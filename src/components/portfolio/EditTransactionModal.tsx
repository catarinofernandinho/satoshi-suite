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
import { useTransactions } from "@/hooks/useTransactions";

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, updates: Partial<Transaction>) => Promise<void>;
  transaction: Transaction | null;
  currency: string;
  availableBtc?: number;
}

export default function EditTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  currency,
  availableBtc: propAvailableBtc
}: EditTransactionModalProps) {
  const [activeTab, setActiveTab] = useState<"Comprar" | "Vender" | "Transferência">("Comprar");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quantityUnit, setQuantityUnit] = useState<"BTC" | "SATS">("BTC");
  const [transferType, setTransferType] = useState<"entrada" | "saida">("entrada");
  const { getPortfolioStats, transactions } = useTransactions();
  
  // Calculate current BTC balance for validation - use prop if provided, otherwise calculate
  const currentBtcPrice = 100000;
  const portfolioStats = getPortfolioStats(currentBtcPrice);
  const calculatedBtc = portfolioStats.totalBtc || 0;
  const availableBtc = propAvailableBtc !== undefined ? propAvailableBtc : calculatedBtc;
  
  // Debug logs to track changes
  console.log("EditTransactionModal - Prop BTC:", propAvailableBtc);
  console.log("EditTransactionModal - Calculated BTC:", calculatedBtc);
  console.log("EditTransactionModal - Final Available BTC:", availableBtc);
  
  const [formData, setFormData] = useState({
    price: "",
    quantity: "",
    totalSpent: "",
    pricePerCoin: "",
    market: currency,
    fees: "",
    notes: "",
    date: new Date().toISOString().slice(0, 16),
    transferType: "entrada"
  });

  // Load transaction data when modal opens
  useEffect(() => {
    if (transaction && isOpen) {
      setActiveTab(transaction.type);
      setTransferType(transaction.transfer_type || "entrada");
      
      const dateValue = new Date(transaction.date).toISOString().slice(0, 16);
      
      setFormData({
        price: transaction.price?.toString() || "",
        quantity: transaction.quantity?.toString() || "",
        totalSpent: transaction.total_spent?.toString() || "",
        pricePerCoin: transaction.price_per_coin?.toString() || "",
        market: transaction.market || currency,
        fees: transaction.fees?.toString() || "",
        notes: transaction.notes || "",
        date: dateValue,
        transferType: transaction.transfer_type || "entrada"
      });
    }
  }, [transaction, isOpen, currency]);

  const resetForm = () => {
    setFormData({
      price: "",
      quantity: "",
      totalSpent: "",
      pricePerCoin: "",
      market: currency,
      fees: "",
      notes: "",
      date: new Date().toISOString().slice(0, 16),
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

  const calculateMissingValues = () => {
    const { quantity, totalSpent, pricePerCoin } = formData;
    const updatedData = { ...formData };

    // Convert SATS to BTC if needed
    let quantityInBtc = parseFloat(quantity);
    if (quantityUnit === "SATS" && quantity) {
      quantityInBtc = parseFloat(quantity) / 100000000;
      updatedData.quantity = quantityInBtc.toString();
    }

    // Auto-calculate missing values based on what's filled
    if (quantity && pricePerCoin && !totalSpent) {
      updatedData.totalSpent = (quantityInBtc * parseFloat(pricePerCoin)).toString();
    } else if (totalSpent && quantity && !pricePerCoin) {
      updatedData.pricePerCoin = (parseFloat(totalSpent) / quantityInBtc).toString();
    } else if (totalSpent && pricePerCoin && !quantity) {
      const calcQuantity = parseFloat(totalSpent) / parseFloat(pricePerCoin);
      updatedData.quantity = calcQuantity.toString();
    }

    // Set price as price per coin
    if (pricePerCoin) {
      updatedData.price = pricePerCoin;
    }
    setFormData(updatedData);
  };

  const setMaxQuantity = () => {
    setFormData(prev => ({
      ...prev,
      quantity: availableBtc.toString()
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction) return;
    
    // Validation for selling more than available
    if (activeTab === "Vender" && parseFloat(formData.quantity) > availableBtc) {
      alert(`Você não pode vender mais do que possui. Saldo disponível: ${availableBtc.toFixed(8)} BTC`);
      return;
    }
    
    setIsLoading(true);
    try {
      let updates: any = {
        type: activeTab,
        price: parseFloat(formData.price || formData.pricePerCoin) || 0,
        quantity: parseFloat(formData.quantity),
        market: formData.market,
        fees: formData.fees ? parseFloat(formData.fees) : 0,
        notes: formData.notes,
        date: formData.date
      };

      if (activeTab === "Transferência") {
        updates.total_spent = 0;
        updates.price_per_coin = 0;
        updates.transfer_type = transferType;
      } else {
        updates.total_spent = parseFloat(formData.totalSpent);
        updates.price_per_coin = parseFloat(formData.pricePerCoin || formData.price);
        if (activeTab === "Vender") {
          updates.revenue = parseFloat(formData.totalSpent);
        }
      }

      await onSubmit(transaction.id, updates);
      handleClose();
    } catch (error) {
      console.error("Error updating transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Transação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={value => setActiveTab(value as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="Comprar">Comprar</TabsTrigger>
              <TabsTrigger value="Vender">Vender</TabsTrigger>
              <TabsTrigger value="Transferência">Transferência</TabsTrigger>
            </TabsList>

            {/* Comprar Tab */}
            <TabsContent value="Comprar" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <div className="flex gap-2">
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
                      onBlur={calculateMissingValues} 
                      required 
                    />
                    <Select value={quantityUnit} onValueChange={(value: "BTC" | "SATS") => setQuantityUnit(value)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">BTC</SelectItem>
                        <SelectItem value="SATS">SATS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalSpent">Total Gasto</Label>
                  <Input 
                    id="totalSpent" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={formData.totalSpent} 
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      totalSpent: e.target.value
                    }))} 
                    onBlur={calculateMissingValues} 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerCoin">Preço por Moeda</Label>
                  <Input 
                    id="pricePerCoin" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={formData.pricePerCoin} 
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      pricePerCoin: e.target.value
                    }))} 
                    onBlur={calculateMissingValues} 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="market">Moeda Fiat</Label>
                  <Select value={formData.market} onValueChange={value => setFormData(prev => ({
                    ...prev,
                    market: value
                  }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="BRL">BRL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data e Hora</Label>
                <Input 
                  id="date" 
                  type="datetime-local" 
                  value={formData.date} 
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    date: e.target.value
                  }))} 
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

            {/* Vender Tab */}
            <TabsContent value="Vender" className="space-y-4 mt-6">
              <div className="bg-muted/50 p-3 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">
                  Saldo disponível: <span className="font-medium text-foreground">{availableBtc.toFixed(8)} BTC</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <div className="flex gap-2">
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
                      onBlur={calculateMissingValues} 
                      required 
                    />
                    <Select value={quantityUnit} onValueChange={(value: "BTC" | "SATS") => setQuantityUnit(value)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">BTC</SelectItem>
                        <SelectItem value="SATS">SATS</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={setMaxQuantity} className="px-3">
                      MAX
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalReceived">Total Recebido</Label>
                  <Input 
                    id="totalReceived" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={formData.totalSpent} 
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      totalSpent: e.target.value
                    }))} 
                    onBlur={calculateMissingValues} 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerCoin">Preço por Moeda</Label>
                  <Input 
                    id="pricePerCoin" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={formData.pricePerCoin} 
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      pricePerCoin: e.target.value
                    }))} 
                    onBlur={calculateMissingValues} 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="market">Moeda Fiat</Label>
                  <Select value={formData.market} onValueChange={value => setFormData(prev => ({
                    ...prev,
                    market: value
                  }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="BRL">BRL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data e Hora</Label>
                <Input 
                  id="date" 
                  type="datetime-local" 
                  value={formData.date} 
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    date: e.target.value
                  }))} 
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
            <TabsContent value="Transferência" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="transferType">Tipo de Transferência</Label>
                <Select value={transferType} onValueChange={(value: "entrada" | "saida") => setTransferType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Transferência de Entrada</SelectItem>
                    <SelectItem value="saida">Transferência de Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <div className="flex gap-2">
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
                    required 
                  />
                  <Select value={quantityUnit} onValueChange={(value: "BTC" | "SATS") => setQuantityUnit(value)}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="SATS">SATS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data e Hora</Label>
                <Input 
                  id="date" 
                  type="datetime-local" 
                  value={formData.date} 
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    date: e.target.value
                  }))} 
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
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}