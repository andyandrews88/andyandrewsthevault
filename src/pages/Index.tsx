// Entry route ("/").
// The Vault is a closed, paid coaching platform — there is no public marketing
// homepage any more. Authenticated users go straight into the app shell,
// everyone else goes to sign-in. The legacy landing sections remain in
// src/components/landing/* (unused by active routes) and are not deleted.
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const Index = () => {
  const { isAuthenticated, isInitialized, isLoading } = useAuthStore();

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/vault" : "/auth"} replace />;
};

export default Index;
