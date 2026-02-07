import { Navbar } from "@/components/layout/Navbar";
import { AuditForm } from "@/components/audit/AuditForm";
import { Footer } from "@/components/landing/Footer";

const Audit = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AuditForm />
      <Footer />
    </div>
  );
};

export default Audit;
