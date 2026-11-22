import AboutSection from "@/components/AboutSection"
import Footer from "@/components/Footer"
import Navbar from "@/components/Navbar"

const AboutPage = () => {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <div>
        <AboutSection />
      </div>
      <Footer />
    </div>
  )
}

export default AboutPage
