import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useAuthIntercept } from "@/contexts/AuthInterceptContext";
import ImportLNMarketsModal from "./ImportLNMarketsModal";

interface ImportLNMarketsButtonProps {
  onSuccess?: () => void;
  addFuture?: (data: any) => Promise<any>;
}

export default function ImportLNMarketsButton({ onSuccess, addFuture }: ImportLNMarketsButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { requireAuth } = useAuthIntercept();

  const handleClick = () => {
    requireAuth(() => setIsModalOpen(true));
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="icon"
        onClick={handleClick} 
        className="h-10 w-10"
        title="Importar ordens da LNmarkets"
      >
        <Upload className="h-4 w-4" />
      </Button>
      
      <ImportLNMarketsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          onSuccess?.();
        }}
        addFuture={addFuture}
      />
    </>
  );
}