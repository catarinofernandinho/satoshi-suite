import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useFutures } from "@/hooks/useFutures";
import { useToast } from "@/hooks/use-toast";

export default function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const { syncLocalOrdersToBackend, refreshFutures, clearLocalCache } = useFutures();
  const { toast } = useToast();

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncLocalOrdersToBackend();
      await refreshFutures();
      clearLocalCache();
      
      toast({
        title: "Sincronização concluída",
        description: "Todas as ordens foram sincronizadas com o servidor!"
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Erro na sincronização",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={syncing}
      className="flex items-center gap-2"
    >
      {syncing ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Wifi className="h-4 w-4" />
      )}
      {syncing ? "Sincronizando..." : "Sincronizar"}
    </Button>
  );
}