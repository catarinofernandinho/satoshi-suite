import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { type Future } from "@/hooks/useFutures";

interface OrderStatusTabsProps {
  futures: Future[];
  activeTab: string;
  onTabChange: (value: string) => void;
  children: (filteredFutures: Future[]) => React.ReactNode;
}

export default function OrderStatusTabs({ futures, activeTab, onTabChange, children }: OrderStatusTabsProps) {
  const openOrders = futures.filter(f => f.status.toUpperCase() === 'OPEN');
  const closedOrders = futures.filter(f => f.status.toUpperCase() === 'CLOSED');
  const allOrders = futures;

  const getFilteredOrders = (status: string) => {
    switch (status) {
      case 'open':
        return openOrders;
      case 'closed':
        return closedOrders;
      default:
        return allOrders;
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="all" className="flex items-center gap-2">
          Todas
          <Badge variant="secondary" className="ml-1">
            {allOrders.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="open" className="flex items-center gap-2">
          Abertas
          <Badge variant="default" className="ml-1">
            {openOrders.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="closed" className="flex items-center gap-2">
          Fechadas
          <Badge variant="outline" className="ml-1">
            {closedOrders.length}
          </Badge>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value={activeTab} className="mt-4">
        {children(getFilteredOrders(activeTab))}
      </TabsContent>
    </Tabs>
  );
}