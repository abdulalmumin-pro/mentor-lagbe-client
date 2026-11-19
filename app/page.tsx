import Hero from "@/components/Hero"
import AboutSection from "@/components/AboutSection";
import PricingSection from "@/components/PricingSection"
import SubjectsStatsSection from "@/components/SubjectStatusSection"

export default function Page() {
  return (
    <div>
      <Hero />
      <AboutSection/>
      <SubjectsStatsSection/>
      <PricingSection />
    </div>
  )
}
