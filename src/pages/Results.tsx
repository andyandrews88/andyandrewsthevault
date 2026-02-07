import { Navbar } from "@/components/layout/Navbar";
import { ResultsPage } from "@/components/audit/ResultsPage";
import { Footer } from "@/components/landing/Footer";

const Results = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ResultsPage />
      <Footer />
    </div>
  );
};

export default Results;
