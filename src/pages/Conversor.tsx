import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load components for better performance
const CurrencyConverter = lazy(() => import("@/components/conversor/CurrencyConverter"));
const ConversorExplanation = lazy(() => import("@/components/conversor/ConversorExplanation"));
export default function Conversor() {
  return <div className="w-full px-0 sm:px-2 md:px-4 lg:px-6 lg:container lg:mx-auto lg:p-6 space-y-6 mx-0">
      
      
      <Suspense fallback={<Skeleton className="h-96 w-full max-w-md mx-auto" />}>
        <CurrencyConverter />
      </Suspense>
      
      <Suspense fallback={<Skeleton className="h-24 w-full max-w-3xl mx-auto" />}>
        <ConversorExplanation />
      </Suspense>
    </div>;
}