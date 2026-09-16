"use client"

import { Button } from "@/components/ui/button"
import { openInquiryForm } from "@/components/landing/InquiryDialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MapPin, Wine, Utensils, Flower2, BedDouble, Coffee } from "lucide-react"

export const ValentinesPromo = () => {
  const packages = [
    {
      name: "Single Rate",
      price: "GH₵350",
      image: "/lovable-uploads/valentines-single.jpg",
      features: ["Lunch & Dinner Buffet"],
    },
    {
      name: "Couple Rate",
      price: "GH₵600",
      image: "/lovable-uploads/valentines-single.jpg",
      features: ["Lunch & Dinner Buffet"],
      highlight: true,
    },
    {
      name: "Couple Overnight Package",
      price: "GH₵3,000",
      image: "/lovable-uploads/valentines-couple.jpg",
      features: [
        "One Night Stay in Bayview Village",
        "Room Decorated with Love",
        "English Breakfast",
        "Buffet / Dinner",
        "Wine, Flowers & Chocolate",
      ],
      premium: true,
    },
  ]

  const highlights = [
    { icon: BedDouble, label: "Overnight Stay" },
    { icon: Utensils, label: "Buffet Dinner" },
    { icon: Coffee, label: "English Breakfast" },
    { icon: Flower2, label: "Flowers & Chocolate" },
    { icon: Wine, label: "Wine Included" },
    { icon: Heart, label: "Decorated Room" },
  ]

  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-zinc-950 via-rose-950/40 to-zinc-950 text-white">
      {/* Decorative hearts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Heart className="absolute top-10 left-[10%] w-6 h-6 text-rose-500/20 animate-pulse" />
        <Heart className="absolute top-20 right-[15%] w-8 h-8 text-rose-400/15 animate-pulse delay-300" />
        <Heart className="absolute bottom-20 left-[20%] w-5 h-5 text-rose-500/20 animate-pulse delay-700" />
        <Heart className="absolute top-1/2 right-[8%] w-10 h-10 text-rose-400/10 animate-pulse delay-500" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <Badge className="bg-rose-600 text-white border-0 text-xs md:text-sm px-4 py-1.5 mb-4 rounded-full">
            <Heart className="w-3.5 h-3.5 mr-1.5 fill-current" />
            Special Package — Bayview Village
          </Badge>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Exclusive <span className="italic text-rose-400 font-serif">Love Affair</span>
          </h2>
          <p className="text-sm md:text-base text-rose-100/80 max-w-xl mx-auto">
            Celebrate love at Bayview Village with an unforgettable dining and overnight experience.
          </p>
        </div>

        {/* Highlight Icons */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-12">
          {highlights.map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 text-rose-200/80">
              <div className="w-11 h-11 rounded-full bg-rose-500/20 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-rose-400" />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Packages */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {packages.map((pkg, i) => (
            <Card
              key={i}
              className={`overflow-hidden border border-white/10 bg-zinc-900/80 backdrop-blur-md shadow-2xl rounded-2xl group transition-all duration-300 hover:scale-[1.02] ${
                pkg.premium ? "ring-2 ring-rose-500" : ""
              }`}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={pkg.image}
                  alt={pkg.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <p className="text-rose-300 text-xs font-medium uppercase tracking-wider">{pkg.name}</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">{pkg.price}</p>
                </div>
              </div>
              <CardContent className="p-5">
                <ul className="space-y-2.5 mb-5 min-h-[100px]">
                  {pkg.features.map((f, j) => (
                    <li key={j} className="flex items-start text-xs md:text-sm text-rose-100/90">
                      <Heart className="w-3.5 h-3.5 mr-2 mt-0.5 text-rose-500 fill-current shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl"
                  onClick={() => openInquiryForm(`Valentine's ${pkg.name}`)}
                >
                  <Heart className="w-4 h-4 mr-2 fill-current" />
                  Book This Package
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-3">
          <Button
            size="lg"
            className="bg-rose-600 hover:bg-rose-700 text-white px-8 rounded-xl"
            onClick={() => openInquiryForm("Valentine's Reservation")}
          >
            <Heart className="w-4 h-4 mr-2 fill-current" />
            Reserve Your Experience
          </Button>
          <p className="flex items-center justify-center text-rose-200/60 text-xs">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            Atomic Junction, Madina — Accra
          </p>
        </div>
      </div>
    </section>
  )
}
