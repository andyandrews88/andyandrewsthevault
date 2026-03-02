import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuthStore } from "./stores/authStore";
import { useUserDataSync } from "./hooks/useUserDataSync";

// Lazy-loaded route components
const Index = lazy(() => import("./pages/Index"));
const Audit = lazy(() => import("./pages/Audit"));
const Results = lazy(() => import("./pages/Results"));
const VaultPage = lazy(() => import("./pages/VaultPage"));
const Nutrition = lazy(() => import("./pages/Nutrition"));
const AuthPageWrapper = lazy(() => import("./pages/AuthPageWrapper"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUserProfile = lazy(() => import("./pages/AdminUserProfile"));
const AdminWorkoutBuilderPage = lazy(() => import("./pages/AdminWorkoutBuilderPage"));
const AdminTemplates = lazy(() => import("./pages/AdminTemplates"));
const AdminClientCalendar = lazy(() => import("./pages/AdminClientCalendar"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 300_000,
    },
  },
});

function RouteLoader() {
  return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
}

function AppContent() {
  const { initialize } = useAuthStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);

  useUserDataSync();

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPageWrapper />} />
        <Route path="/results" element={<Results />} />
        <Route path="/audit" element={<ProtectedRoute><Audit /></ProtectedRoute>} />
        <Route path="/vault" element={<ProtectedRoute><VaultPage /></ProtectedRoute>} />
        <Route path="/nutrition" element={<ProtectedRoute><Nutrition /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/user/:userId" element={<ProtectedRoute><AdminUserProfile /></ProtectedRoute>} />
        <Route path="/admin/user/:userId/build-workout" element={<ProtectedRoute><AdminWorkoutBuilderPage /></ProtectedRoute>} />
        <Route path="/admin/user/:userId/calendar" element={<ProtectedRoute><AdminClientCalendar /></ProtectedRoute>} />
        <Route path="/admin/templates" element={<ProtectedRoute><AdminTemplates /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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
