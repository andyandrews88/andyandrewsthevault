import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { TrialExpiredModal } from "./TrialExpiredModal";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { 
    isAuthenticated, 
    isLoading, 
    isInitialized,
    isTrialActive, 
    hasActiveSubscription,
    subscription
  } = useAuthStore();
  
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);

  useEffect(() => {
    // Check if trial has expired and user doesn't have active subscription
    if (isInitialized && isAuthenticated && subscription) {
      const needsSubscription = !isTrialActive && !hasActiveSubscription;
      setShowTrialExpiredModal(needsSubscription);
    }
  }, [isInitialized, isAuthenticated, subscription, isTrialActive, hasActiveSubscription]);

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Show trial expired modal if needed
  if (showTrialExpiredModal) {
    return (
      <>
        <div className="min-h-screen bg-background opacity-50 pointer-events-none">
          {children}
        </div>
        <TrialExpiredModal 
          open={showTrialExpiredModal} 
          onOpenChange={setShowTrialExpiredModal} 
        />
      </>
    );
  }

  // User has access - either trial active or has subscription
  return <>{children}</>;
}
