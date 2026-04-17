// vault page entry
import { Navbar } from "@/components/layout/Navbar";
import { VaultDashboard } from "@/pages/Vault";

const VaultPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar only shown on desktop — mobile uses BottomNav inside VaultDashboard */}
      <div className="hidden md:block">
        <Navbar />
      </div>
      <VaultDashboard />
      {/* Footer intentionally omitted — landing-page element, not for in-app */}
    </div>
  );
};

export default VaultPage;
