"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { openInquiryForm } from "@/components/landing/InquiryDialog"
import {
  Hotel,
  Utensils,
  Waves,
  Calendar,
  Users,
  Tv,
  ArrowRight,
} from "lucide-react"
import type { ServiceItem } from "@/lib/website-content"

const services = [
  {
    icon: Hotel,
    title: "Hotel Rooms",
    description: "Comfortable accommodation with modern amenities, AC, and breakfast.",
    price: "Starting at GH₵800",
    features: ["Wi-Fi", "DSTV", "Air Conditioning", "Complimentary Breakfast"],
    image: "/lovable-uploads/71a1b072-04d6-4b2a-b1aa-f1d4402f5563.png",
  },
  {
    icon: Calendar,
    title: "Event Venues",
    description: "Perfect spaces for weddings, corporate events & celebrations.",
    price: "From GH₵2,000",
    features: ["Forecourt (800 capacity)", "Cold Rooms (50-70 capacity)", "Conference Hall (150 capacity)"],
    image: "/lovable-uploads/6b548797-ebbb-4409-a4e9-093bee371898.png",
  },
  {
    icon: Waves,
    title: "Pool Area",
    description: "Relaxing pool facilities for daytime leisure and private night parties.",
    price: "GH₵4,000 - GH₵7,000",
    features: ["200 capacity", "8 hours rental", "Swimming pool", "Pool beds available"],
    image: "/lovable-uploads/bc5f1b0b-e44b-49cb-b2cc-c2d52a586b0c.png",
  },
  {
    icon: Utensils,
    title: "Dining & Menu",
    description: "Exquisite local and international cuisine prepared by culinary chefs.",
    price: "À la carte & Buffets",
    features: ["Sunday Special: Omo-Tuo/Fufu", "Local delicacies", "International dishes", "Beverages & cocktails"],
    image: "/lovable-uploads/31f3683b-3848-44dd-8571-6f66fba2f2cc.png",
  },
  {
    icon: Tv,
    title: "Live Sports",
    description: "Watch Premier League, Champions League and El Clasico in style.",
    price: "Special game packages",
    features: ["Giant screens", "Surround audio", "Ice-cold drinks", "Barbecue & bites"],
    image: "/lovable-uploads/8c01461a-e118-4d6c-9a1b-e4335a38e460.png",
  },
  {
    icon: Users,
    title: "Event Planning",
    description: "End-to-end event setup, sound, lighting, decor, and MC management.",
    price: "Custom quotes",
    features: ["Weddings", "Birthday parties", "Corporate retreats", "Full service planning"],
    image: "/lovable-uploads/2a8a35b6-2291-4ae8-a49f-6df42e7095a6.png",
  },
]

interface ServicesHighlightProps {
  services?: ServiceItem[]
}

export const ServicesHighlight = ({ services: customServices }: ServicesHighlightProps) => {
  const items = customServices && customServices.length > 0 ? customServices : services

  return (
    <section className="py-16 md:py-24 bg-zinc-50 dark:bg-zinc-900/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-white mb-4">
            Our Premium Services
          </h2>
          <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            From luxurious accommodation to unforgettable events, Bayview Village offers comprehensive hospitality services for all your needs.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {items.map((service, index) => (
            <Card
              key={index}
              className="border border-zinc-200/80 dark:border-white/10 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl"
            >
              <div className="relative h-48 md:h-52 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-full p-2.5 shadow-md">
                  {("icon" in service && service.icon) ? (
                    // @ts-ignore
                    <service.icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Hotel className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div className="absolute bottom-3 left-4 text-white">
                  <span className="text-xs uppercase font-bold tracking-wider text-amber-400">Bayview Facility</span>
                  <h3 className="text-xl font-bold">{service.title}</h3>
                </div>
              </div>

              <CardHeader className="pb-2 pt-4">
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">{service.description}</p>
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {service.price}
                </div>
              </CardHeader>

              <CardContent className="pt-2">
                <ul className="space-y-1.5 mb-5 text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => openInquiryForm(service.title)}
                  className="w-full bg-zinc-900 hover:bg-black text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white rounded-xl font-medium text-sm transition-all"
                >
                  Book / Enquire About {service.title}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            onClick={() => openInquiryForm("All Services Inquiry")}
            className="bg-amber-500 hover:bg-amber-600 text-black px-8 py-5 text-base font-bold shadow-lg rounded-xl"
          >
            Inquire About All Services
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
