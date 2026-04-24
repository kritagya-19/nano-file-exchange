import { Features } from "../components/Features";
import { Process } from "../components/Process";
import { ForWhom } from "../components/ForWhom";
import { Pricing } from "../components/Pricing";
import { CTA } from "../components/CTA";
import { Footer } from "../components/Footer";
import { Header } from "@/components/ui/header-3";
import { HeroSection } from "@/components/ui/hero-3";

export function Landing() {
  return (
    <div className="flex w-full flex-col min-h-screen">
      <Header />
      <main className="grow">
        <HeroSection />
        <Features />
        <Process />
        <ForWhom />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

