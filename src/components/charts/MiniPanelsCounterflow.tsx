import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MiniPanelsCounterflow() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mini Painéis Bitcoin Counterflow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden bg-black">
          <iframe
            src="https://bitcoincounterflow.com/pt/satsails-2/mini-paineis-iframe/"
            width="100%"
            height={1300}
            frameBorder="0"
            title="Mini Painéis Bitcoin Counterflow"
            className="w-full"
            style={{ minHeight: 1300 }}
            allowFullScreen
          />
        </div>
        <div className="text-xs text-muted-foreground pt-2 border-t mt-4">
          Fonte:&nbsp;
          <a href="https://bitcoincounterflow.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            bitcoincounterflow.com
          </a>
        </div>
      </CardContent>
    </Card>
  );
}