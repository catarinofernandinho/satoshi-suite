import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuthIntercept } from "@/contexts/AuthInterceptContext";
import AddFutureModal from "./AddFutureModal";

interface AddFutureButtonProps {
  onSuccess?: () => void;
  addFuture?: (data: any) => Promise<any>;
}

export default function AddFutureButton({ onSuccess, addFuture }: AddFutureButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { requireAuth } = useAuthIntercept();

  const handleClick = () => {
    requireAuth(() => setIsModalOpen(true));
  };

  return (
    <>
      <Button onClick={handleClick} className="gap-2">
        <Plus className="h-4 w-4" />
        Adicionar Ordem
      </Button>
      
      <AddFutureModal 
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