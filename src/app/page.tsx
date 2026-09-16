import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { ValentinesPromo } from "@/components/landing/ValentinesPromo"
import { ServicesHighlight } from "@/components/landing/ServicesHighlight"
import { EventPackagesSection } from "@/components/landing/EventPackagesSection"
import { FeaturedGallery } from "@/components/landing/FeaturedGallery"
import { Testimonials } from "@/components/landing/Testimonials"
import { ContactCTA } from "@/components/landing/ContactCTA"
import { Footer } from "@/components/landing/Footer"
import { WhatsAppButton } from "@/components/landing/WhatsAppButton"
import { InquiryDialog } from "@/components/landing/InquiryDialog"
import { Toaster } from "@/components/ui/toaster"
import { getWebsiteContent } from "@/lib/website-content"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const headersList = await headers()
  const host = headersList.get("host") || ""
  if (host.startsWith("crm.")) {
    redirect("/dashboard")
  }

  const content = await getWebsiteContent()

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-amber-500 selection:text-black">
      <Navbar contact={content.contact} />
      <main>
        <section id="home">
          <Hero data={content.hero} />
        </section>
        <section id="valentines">
          <ValentinesPromo />
        </section>
        <section id="about" className="py-16 md:py-24 bg-white dark:bg-zinc-950 border-b border-zinc-200/60 dark:border-white/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-white mb-6">
              About Bayview Village
            </h2>
            <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-300 max-w-3xl mx-auto leading-relaxed">
              Located in Atomic Junction, Accra, Bayview Village offers premium event hosting, hotel accommodations, and recreational facilities with exceptional hospitality. Our versatile spaces make us the preferred destination for weddings, corporate retreats, birthday parties, and live entertainment.
            </p>
          </div>
        </section>
        <section id="services">
          <ServicesHighlight services={content.services} />
        </section>
        <section id="packages">
          <EventPackagesSection packages={content.packages} />
        </section>
        <section id="gallery">
          <FeaturedGallery gallery={content.gallery} />
        </section>
        <section id="testimonials">
          <Testimonials testimonials={content.testimonials} />
        </section>
        <section id="contact">
          <ContactCTA contact={content.contact} />
        </section>
      </main>
      <Footer contact={content.contact} />
      <WhatsAppButton />
      <InquiryDialog />
      <Toaster />
    </div>
  )
}
