// vault page entry
import { Navbar } from "@/components/layout/Navbar";
import { VaultDashboard } from "@/pages/Vault";
import { Footer } from "@/components/landing/Footer";

const VaultPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar only shown on desktop — mobile uses BottomNav inside VaultDashboard */}
      <div className="hidden md:block">
        <Navbar />
      </div>
      <VaultDashboard />
      <Footer />
    </div>
  );
};

export default VaultPage;
