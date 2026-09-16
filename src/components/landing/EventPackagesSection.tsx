"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { openInquiryForm } from "@/components/landing/InquiryDialog"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Star, Phone } from "lucide-react"
import type { PackageItem } from "@/lib/website-content"

const defaultPackages = [
  {
    id: 1,
    name: "Essential Package",
    price: "GH₵4,000",
    duration: "Full Day Event",
    image: "/lovable-uploads/120f67a8-1aa9-4798-8cbd-92e6d160d8af.png",
    features: [
      "Full event access till 02:00",
      "Light refreshments setup",
      "Ambient lighting system",
      "DJ service - 4 hours",
      "Spacious parking space",
    ],
  },
  {
    id: 2,
    name: "Premium Package (Weddings & Parties)",
    price: "GH₵35,000",
    duration: "Full Day Event",
    image: "/lovable-uploads/1287ed52-2c9c-4eaa-b93a-8af2c591fe5b.png",
    popular: true,
    features: [
      "Grand entrance with MC (up to 300 guests)",
      "Photography & videography coverage",
      "Bridal suite access & changing room",
      "Professional sound and stage lighting",
      "DJ service - 6 hours",
      "20 banquet tables and chairs",
      "Floral & theme decoration",
      "Secured parking & on-site security personnel",
    ],
  },
  {
    id: 3,
    name: "Luxury VIP Package",
    price: "GH₵65,000",
    duration: "Full Day + Overnight Suite",
    image: "/lovable-uploads/bc5f1b0b-e44b-49cb-b2cc-c2d52a586b0c.png",
    features: [
      "Overnight Luxury Suite included",
      "Pool venue rental & night illumination",
      "Full luxury decor & centerpiece setup",
      "Complimentary VIP English breakfast",
      "Full sound, DJ & lighting rigging",
      "Dedicated event manager & team",
      "Full security & valet support",
    ],
  },
]

interface EventPackagesSectionProps {
  packages?: PackageItem[]
}

export const EventPackagesSection = ({ packages: customPackages }: EventPackagesSectionProps) => {
  const items = customPackages && customPackages.length > 0 ? customPackages : defaultPackages

  const additionalServices = [
    { name: "Custom Packages", description: "Tailored to your specific guest count and needs" },
    { name: "Event Planning", description: "Professional coordination and day-of management" },
    { name: "Flexible Timing", description: "Extended late-night hours available on request" },
    { name: "Catering Support", description: "Custom buffet or plated menus for your guests" },
  ]

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-3">
            <Star className="h-3.5 w-3.5 fill-current" />
            Curated Event Packages
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-white mb-4">
            Choose Your Perfect <span className="text-amber-500">Celebration</span>
          </h2>
          <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Carefully crafted packages to suit every celebration, from intimate parties to grand wedding receptions.
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {items.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative overflow-hidden shadow-lg border rounded-2xl group transition-all duration-300 hover:shadow-2xl ${
                pkg.popular
                  ? "border-amber-500 ring-2 ring-amber-500/30 dark:bg-zinc-900"
                  : "border-zinc-200/80 dark:border-white/10 dark:bg-zinc-900"
              }`}
            >
              {pkg.popular && (
                <Badge className="absolute top-4 right-4 z-10 bg-amber-500 text-black font-bold">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Most Popular
                </Badge>
              )}

              <div className="relative h-48 overflow-hidden">
                <img
                  src={pkg.image}
                  alt={pkg.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold">{pkg.name}</CardTitle>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{pkg.price}</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{pkg.duration}</p>
              </CardHeader>

              <CardContent className="pt-2">
                <ul className="space-y-2 mb-6 min-h-[160px]">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full rounded-xl font-semibold ${
                    pkg.popular
                      ? "bg-amber-500 hover:bg-amber-600 text-black"
                      : "bg-zinc-900 hover:bg-black text-white dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  }`}
                  onClick={() => openInquiryForm(`${pkg.name}`)}
                >
                  Select This Package
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Services */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          {additionalServices.map((service, index) => (
            <div
              key={index}
              className="text-center p-5 rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/50"
            >
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">{service.name}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{service.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 rounded-2xl p-8 md:p-10 border border-amber-500/20">
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
            Ready to Plan Your Event at Bayview?
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 max-w-xl mx-auto">
            Every celebration is unique. Tell us your date, expected guests, and requirements for a custom proposal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl"
              onClick={() => openInquiryForm("Custom Event Quote")}
            >
              Get Custom Quote
            </Button>
            <a href="tel:0204473577">
              <Button size="lg" variant="outline" className="rounded-xl border-zinc-300 dark:border-zinc-700">
                <Phone className="w-4 h-4 mr-2" />
                Call Directly: 0204 473 577
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
