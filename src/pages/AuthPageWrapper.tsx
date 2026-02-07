import { Navbar } from "@/components/layout/Navbar";
import { AuthPage } from "@/pages/Auth";
import { Footer } from "@/components/landing/Footer";

const AuthPageWrapper = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AuthPage />
      <Footer />
    </div>
  );
};

export default AuthPageWrapper;
