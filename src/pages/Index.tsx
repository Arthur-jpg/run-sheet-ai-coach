
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BenefitsSection from "@/components/BenefitsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ComparisonSection from "@/components/ComparisonSection";
import FAQSection from "@/components/FAQSection";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col gap-20 pt-12">
        <HeroSection />
        <BenefitsSection />
        <TestimonialsSection />
        <ComparisonSection />
        <FAQSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
