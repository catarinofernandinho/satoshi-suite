import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Lista dos mini painéis (você pode adicionar/remover conforme desejar)
const miniPanelUrls = [
  "https://bitcoincounterflow.com/pt/satsails-2/painel-1-iframe/",
  "https://bitcoincounterflow.com/pt/satsails-2/painel-2-iframe/",
  "https://bitcoincounterflow.com/pt/satsails-2/painel-3-iframe/",
  "https://bitcoincounterflow.com/pt/satsails-2/painel-4-iframe/",
  "https://bitcoincounterflow.com/pt/satsails-2/painel-5-iframe/",
  "https://bitcoincounterflow.com/pt/satsails-2/painel-6-iframe/",
  "https://bitcoincounterflow.com/pt/satsails-2/painel-7-iframe/",
  "https://bitcoincounterflow.com/pt/satsails-2/painel-8-iframe/",
  "https://bitcoincounterflow.com/pt/satsails-2/painel-9-iframe/",
];

export default function MiniPanelsCounterflow() {
  return (
    <div className="grid grid-cols-1 gap-8">
      {miniPanelUrls.map((url, idx) => (
        <Card key={url}>
          <CardHeader>
            <CardTitle>{`Mini Painel #${idx + 1}`}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden bg-black">
              <iframe
                src={url}
                width="100%"
                height={400}
                frameBorder="0"
                title={`Mini Painel #${idx + 1}`}
                className="w-full"
                style={{ minHeight: 400 }}
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