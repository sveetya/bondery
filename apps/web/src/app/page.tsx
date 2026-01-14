import { Header, Hero, Pricing, CallToAction, Footer, Features } from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <Pricing />
      <CallToAction />
      <Footer />
    </div>
  );
}
