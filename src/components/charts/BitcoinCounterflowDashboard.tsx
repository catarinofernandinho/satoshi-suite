import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Lista de painéis Counterflow para exibir (você pode adicionar/alterar conforme desejar)
const dashboards = [
  {
    url: "https://bitcoincounterflow.com/pt/satsails-2/graficos-bitcoin-iframe/",
    title: "Gráficos Bitcoin Counterflow"
  },
  {
    url: "https://bitcoincounterflow.com/pt/satsails-2/mini-paineis-iframe/",
    title: "Mini Painéis"
  },
  {
    url: "https://bitcoincounterflow.com/pt/satsails-2/etf-tracker-btc-iframe",
    title: "ETF Tracker BTC"
  },
  {
    url: "https://bitcoincounterflow.com/pt/satsails-2/calculadora-de-aposentadoria-bitcoin-iframe/",
    title: "Calculadora de Aposentadoria"
  },
  {
    url: "https://bitcoincounterflow.com/pt/satsails-2/calculadora-conversora-bitcoin-iframe/",
    title: "Conversor Bitcoin"
  },
  {
    url: "https://bitcoincounterflow.com/pt/satsails-2/calculadora-dca-iframe/",
    title: "Calculadora DCA"
  },
  {
    url: "https://bitcoincounterflow.com/pt/satsails-2/estrategia-counterflow-iframe/",
    title: "Estratégia Counterflow"
  },
  {
    url: "https://bitcoincounterflow.com/pt/satsails-2/graficos-bitcoin-iframe/",
    title: "Gráficos Avançados"
  },
  {
    url: "https://bitcoincounterflow.com/pt/satsails-2/zona-de-liquidacao-iframe/",
    title: "Zona de Liquidação / Heatmap"
  }
];

export default function BitcoinCounterflowDashboard() {
  return (
    <div className="grid grid-cols-1 gap-8">
      {dashboards.map((dashboard, idx) => (
        <Card key={dashboard.url + idx}>
          <CardHeader>
            <CardTitle>{dashboard.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden bg-black">
              <iframe
                src={dashboard.url}
                width="100%"
                height="600"
                frameBorder="0"
                title={dashboard.title}
                className="w-full"
                style={{ minHeight: 600 }}
                allowFullScreen
              />
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t mt-4">
              Fonte: <a href="https://bitcoincounterflow.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">bitcoincounterflow.com</a>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}