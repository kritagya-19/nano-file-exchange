
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

