import AuroraBackground from "@/components/AuroraBackground";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ServicesSection from "@/components/ServicesSection";
import BookingSection from "@/components/BookingSection";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import About from "@/components/About";
import ContactFooter from "@/components/ContactFooter";

export default function Home() {
  return (
    <>
      <AuroraBackground />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <div className="section-divider mx-auto max-w-6xl" />
        <ServicesSection />
        <div className="section-divider mx-auto max-w-6xl" />
        <BookingSection />
        <div className="section-divider mx-auto max-w-6xl" />
        <Testimonials />
        <div className="section-divider mx-auto max-w-6xl" />
        <FAQ />
        <div className="section-divider mx-auto max-w-6xl" />
        <About />
      </main>
      <ContactFooter />
    </>
  );
}
