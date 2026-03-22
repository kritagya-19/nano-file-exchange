import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { Process } from "../components/Process";
import { ForWhom } from "../components/ForWhom";
import { CTA } from "../components/CTA";
import { Footer } from "../components/Footer";

export function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Process />
        <ForWhom />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
