import Hero from "@/components/Hero"
import AboutSection from "@/components/AboutSection";
import PricingSection from "@/components/PricingSection"
import SubjectsStatsSection from "@/components/SubjectStatusSection"
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeaturedTuitions from "@/components/home/FeaturedTuitions";

export default function Page() {
  return (
    <div>
      <Navbar/>
      <Hero />
      <FeaturedTuitions/>
      <AboutSection/>
      <SubjectsStatsSection/>
      <PricingSection />
      <Footer/>
    </div>
  )
}
