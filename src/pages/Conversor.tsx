import CurrencyConverter from "@/components/conversor/CurrencyConverter";
import ConversorExplanation from "@/components/conversor/ConversorExplanation";

export default function Conversor() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Conversor de Moedas</h1>
        <p className="text-muted-foreground">
          Converta entre Bitcoin, Satoshis, USD e BRL em tempo real
        </p>
      </div>
      
      <CurrencyConverter />
      <ConversorExplanation />
    </div>
  );
}