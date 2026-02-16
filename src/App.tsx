import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Audit from "./pages/Audit";
import Results from "./pages/Results";
import VaultPage from "./pages/VaultPage";
import Nutrition from "./pages/Nutrition";
import AuthPageWrapper from "./pages/AuthPageWrapper";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuthStore } from "./stores/authStore";
import { useUserDataSync } from "./hooks/useUserDataSync";

const queryClient = new QueryClient();

function AppContent() {
  const { initialize } = useAuthStore();
  
  // Initialize auth on app load
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync user data with database
  useUserDataSync();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<AuthPageWrapper />} />
      <Route path="/audit" element={<Audit />} />
      <Route path="/results" element={<Results />} />
      <Route path="/vault" element={<VaultPage />} />
      <Route path="/nutrition" element={<Nutrition />} />
      <Route path="/admin" element={<AdminDashboard />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
