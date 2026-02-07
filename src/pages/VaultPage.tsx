import { Navbar } from "@/components/layout/Navbar";
import { VaultDashboard } from "@/pages/Vault";
import { Footer } from "@/components/landing/Footer";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const VaultPage = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <VaultDashboard />
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default VaultPage;
