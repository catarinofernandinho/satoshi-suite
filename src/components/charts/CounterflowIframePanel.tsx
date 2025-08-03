import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CounterflowIframePanelProps {
  url: string;
  title: string;
  height?: number;
}

export default function CounterflowIframePanel({
  url,
  title,
  height = 1300,
}: CounterflowIframePanelProps) {
  return (
    <Card className="w-full mx-0 sm:mx-auto lg:max-w-3xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden bg-black w-full">
          <iframe
            src={url}
            width="100%"
            height={height}
            frameBorder="0"
            title={title}
            className="w-full"
            style={{ minHeight: height }}
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