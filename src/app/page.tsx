import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import ProductShowcase from "@/components/landing/ProductShowcase";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Hero />
      <HowItWorks />
      <ProductShowcase />
      <Footer />
    </main>
  );
}