import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import type { Future } from "@/hooks/useFutures";

interface ImportLNMarketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  addFuture?: (data: any) => Promise<any>;
}

interface LNMarketsCSVRow {
  side: string; // "b" for buy (LONG), "s" for sell (SHORT)
  entryPrice?: string;
  price?: string;
  exitPrice?: string;
  takeprofit?: string;
  margin?: string;
  quantity?: string;
  closed?: string;
  cancelled?: string;
  creationTs?: string;
  openingFee?: string;
  closingFee?: string;
  fundingFee?: string;
  pl?: string;
  [key: string]: any;
}

function csvRowToFuture(row: LNMarketsCSVRow): Omit<Future, 'id' | 'created_at' | 'updated_at'> | null {
  try {
    // Only process closed orders (not cancelled or open)
    if (row.closed !== "true" || row.cancelled === "true") {
      return null;
    }

    const entryPrice = Number(row.entryPrice || row.price);
    const exitPrice = Number(row.exitPrice || row.takeprofit);
    const margin = Number(row.margin || row.quantity || 0);
    const openingFee = Number(row.openingFee || 0);
    const closingFee = Number(row.closingFee || 0);
    const fundingFee = Number(row.fundingFee || 0);
    const pl = Number(row.pl || 0);
    
    // Skip if essential data is missing
    if (!entryPrice || !exitPrice || !margin) {
      return null;
    }

    const totalFees = openingFee + closingFee + fundingFee;
    const percentGain = ((exitPrice - entryPrice) / entryPrice) * 100;
    
    if (row.side === "s") {
      // For short positions, invert the gain calculation
      const shortPercentGain = ((entryPrice - exitPrice) / entryPrice) * 100;
    }

    return {
      direction: row.side === "b" ? "LONG" : "SHORT",
      entry_price: entryPrice,
      exit_price: exitPrice,
      target_price: exitPrice,
      quantity_usd: margin,
      status: "CLOSED",
      buy_date: row.creationTs ? new Date(Number(row.creationTs)).toISOString() : new Date().toISOString(),
      close_date: new Date().toISOString(),
      percent_gain: row.side === "b" ? percentGain : ((entryPrice - exitPrice) / entryPrice) * 100,
      percent_fee: (totalFees / margin) * 100,
      fees_paid: totalFees,
      net_pl_sats: pl,
      pl_sats: pl + totalFees // Gross PL
    };
  } catch (error) {
    console.error("Error converting CSV row:", error);
    return null;
  }
}

export default function ImportLNMarketsModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  addFuture 
}: ImportLNMarketsModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const orders: any[] = [];
        const errors: string[] = [];
        let skipped = 0;

        for (const [index, row] of results.data.entries()) {
          try {
            const future = csvRowToFuture(row as LNMarketsCSVRow);
            if (future) {
              orders.push(future);
            } else {
              skipped++;
            }
          } catch (error) {
            errors.push(`Linha ${index + 2}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
        }

        // Import orders
        let imported = 0;
        if (orders.length > 0 && addFuture) {
          for (const order of orders) {
            try {
              await addFuture(order);
              imported++;
            } catch (error) {
              errors.push(`Erro ao importar ordem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            }
          }
        }

        setImportResults({ imported, skipped, errors });
        setIsProcessing(false);

        if (imported > 0) {
          toast({
            title: "Importação concluída",
            description: `${imported} ordem(ns) importada(s) com sucesso.`,
          });
          onSuccess();
        }
      },
      error: (error) => {
        setIsProcessing(false);
        toast({
          title: "Erro ao processar arquivo",
          description: error.message,
          variant: "destructive"
        });
      }
    });

    // Reset input
    event.target.value = '';
  };

  const resetModal = () => {
    setImportResults(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Ordens da LNmarkets
          </DialogTitle>
          <DialogDescription>
            Importe suas ordens fechadas da LNmarkets através de um arquivo CSV exportado da plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Como exportar da LNmarkets:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Acesse sua conta na LNmarkets</li>
              <li>Vá para a seção de histórico de trades/ordens</li>
              <li>Exporte os dados em formato CSV</li>
              <li>Faça upload do arquivo aqui</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>Nota:</strong> Apenas ordens fechadas serão importadas. Ordens canceladas ou abertas serão ignoradas.
            </p>
          </div>

          {/* File Upload */}
          {!importResults && (
            <div className="border-2 border-dashed border-border rounded-lg p-8">
              <div className="text-center space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Selecione o arquivo CSV</h4>
                  <p className="text-sm text-muted-foreground">
                    Arquivo exportado da LNmarkets (.csv)
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload">
                    <Button asChild disabled={isProcessing}>
                      <span>
                        {isProcessing ? "Processando..." : "Escolher Arquivo"}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {importResults && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Resultado da Importação:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Importadas: {importResults.imported}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>Ignoradas: {importResults.skipped}</span>
                  </div>
                </div>
                
                {importResults.errors.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-destructive mb-2">Erros encontrados:</h5>
                    <div className="max-h-32 overflow-y-auto">
                      {importResults.errors.map((error, index) => (
                        <p key={index} className="text-xs text-destructive">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={resetModal} variant="outline">
                  Importar Outro Arquivo
                </Button>
                <Button onClick={handleClose}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}