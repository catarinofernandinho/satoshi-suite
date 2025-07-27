import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as Papa from "papaparse";

interface ExportButtonProps {
  data: any[];
  filename: string;
  type: "transactions" | "futures";
}

export default function ExportButton({ data, filename, type }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const formatDataForExport = (items: any[]) => {
    if (type === "transactions") {
      return items.map(item => ({
        "Data": new Date(item.date).toLocaleDateString('pt-BR'),
        "Tipo": item.type,
        "Preço (USD)": item.price,
        "Quantidade (BTC)": item.quantity,
        "Total Gasto": item.total_spent,
        "Preço por Moeda": item.price_per_coin,
        "Mercado": item.market,
        "Taxas": item.fees || 0,
        "Observações": item.notes || ""
      }));
    } else {
      return items.map(item => ({
        "Direção": item.direction,
        "Status": item.status,
        "Preço Entrada": item.entry_price,
        "Preço Saída": item.exit_price || "",
        "Preço Alvo": item.target_price || "",
        "Quantidade USD": item.quantity_usd,
        "Alavancagem": item.leverage,
        "Data": new Date(item.buy_date).toLocaleDateString('pt-BR')
      }));
    }
  };

  const exportToCSV = async () => {
    setLoading(true);
    try {
      const formattedData = formatDataForExport(data);
      const csv = Papa.unparse(formattedData as any);
      
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Exportação concluída",
        description: `Dados exportados para ${filename}.csv`
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToJSON = async () => {
    setLoading(true);
    try {
      const formattedData = formatDataForExport(data);
      const json = JSON.stringify(formattedData, null, 2);
      
      const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
      const link = document.createElement("a");
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.json`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Exportação concluída",
        description: `Dados exportados para ${filename}.json`
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (data.length === 0) {
    return (
      <Button variant="outline" disabled>
        <Download className="h-4 w-4 mr-2" />
        Exportar
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          <Download className="h-4 w-4 mr-2" />
          {loading ? "Exportando..." : "Exportar"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}