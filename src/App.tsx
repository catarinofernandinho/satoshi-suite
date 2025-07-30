import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthInterceptProvider } from "@/contexts/AuthInterceptContext";
import { ThemeProvider } from "@/components/settings/ThemeProvider";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { TimezoneProvider } from "@/contexts/TimezoneContext";
import AppLayout from "@/components/layout/AppLayout";
import AuthPage from "@/components/auth/AuthPage";
import Portfolio from "./pages/Portfolio";
import Futures from "./pages/Futures";
import Charts from "./pages/Charts";
import Conversor from "./pages/Conversor";
import Profile from "./pages/Profile";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <AuthInterceptProvider>
          <CurrencyProvider>
            <TimezoneProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/*" element={<AppLayout />}>
                      <Route index element={<Portfolio />} />
                      <Route path="futures" element={<Futures />} />
                      <Route path="charts" element={<Charts />} />
                      <Route path="conversor" element={<Conversor />} />
                      <Route path="profile" element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </TimezoneProvider>
          </CurrencyProvider>
        </AuthInterceptProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
