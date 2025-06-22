import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import ClientManager from "./pages/ClientManager";
import NewChat from "./pages/NewChat";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import PremiumRoute from "@/components/PremiumRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-canceled" element={<PaymentCanceled />} />
          
          {/* Rotas autenticadas (requer login) */}
          <Route path="/dashboard" element={
            <SignedIn>
              <Dashboard />
            </SignedIn>
          } />
          
          {/* Rotas que requerem autenticação */}
          <Route path="/chat" element={
            <SignedIn>
              <Chat />
            </SignedIn>
          } />
          
          {/* Rotas premium (requer assinatura) */}
          <Route path="/new-chat" element={
            <SignedIn>
              <PremiumRoute>
                <NewChat />
              </PremiumRoute>
            </SignedIn>
          } />
          
          <Route path="/client/:clientId" element={
            <SignedIn>
              <PremiumRoute>
                <ClientManager />
              </PremiumRoute>
            </SignedIn>
          } />
          
          {/* Redirecionar para login se não estiver autenticado */}
          <Route path="/login/*" element={<RedirectToSignIn />} />
          
          {/* Rota de fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
