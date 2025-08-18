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
      <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted/20 rounded-lg">
        <TabsTrigger 
          value="all" 
          className="flex items-center justify-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <span>Todas</span>
          <Badge variant="secondary" className="h-5 px-2 py-0 text-xs font-medium bg-muted-foreground/20">
            {allOrders.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger 
          value="open" 
          className="flex items-center justify-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <span>Abertas</span>
          <Badge variant="default" className="h-5 px-2 py-0 text-xs font-medium bg-bitcoin/20 text-bitcoin border-bitcoin/30">
            {openOrders.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger 
          value="closed" 
          className="flex items-center justify-center gap-2 text-sm font-medium px-3 py-2 rounded-md transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <span>Fechadas</span>
          <Badge variant="outline" className="h-5 px-2 py-0 text-xs font-medium border-border/50">
            {closedOrders.length}
          </Badge>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value={activeTab} className="mt-6">
        {children(getFilteredOrders(activeTab))}
      </TabsContent>
    </Tabs>
  );
}