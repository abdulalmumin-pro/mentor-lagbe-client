import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"
import PricingSection from "@/components/PricingSection"

export default function PricingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <div>
        <PricingSection />
      </div>
      <Footer />
    </div>
  )
}
