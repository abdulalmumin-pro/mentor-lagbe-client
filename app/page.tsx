import Hero from "@/components/Hero"
import AboutSection from "@/components/AboutSection";
import PricingSection from "@/components/PricingSection"
import SubjectsStatsSection from "@/components/SubjectStatusSection"
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <div>
      <Navbar/>
      <Hero />
      <AboutSection/>
      <SubjectsStatsSection/>
      <PricingSection />
      <Footer/>
    </div>
  )
}
