import { Navbar } from "@/components/layout/Navbar";
import { VaultDashboard } from "@/pages/Vault";
import { Footer } from "@/components/landing/Footer";

const VaultPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <VaultDashboard />
      <Footer />
    </div>
  );
};

export default VaultPage;
