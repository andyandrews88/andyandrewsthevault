import { Navbar } from "@/components/layout/Navbar";
import { AuditForm } from "@/components/audit/AuditForm";
import { ResultsPage } from "@/components/audit/ResultsPage";
import { Footer } from "@/components/landing/Footer";
import { useAuditStore } from "@/stores/auditStore";

const Audit = () => {
  const { results } = useAuditStore();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {results ? <ResultsPage /> : <AuditForm />}
      <Footer />
    </div>
  );
};

export default Audit;
