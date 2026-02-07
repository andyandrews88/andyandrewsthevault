import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { MeetAndySection } from "@/components/landing/MeetAndySection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <MeetAndySection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
