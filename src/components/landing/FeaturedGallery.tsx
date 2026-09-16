"use client"

import { Card } from "@/components/ui/card"
import { openInquiryForm } from "@/components/landing/InquiryDialog"
import { Camera, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GalleryItem } from "@/lib/website-content"

const featuredImages = [
  {
    src: "/lovable-uploads/bc5f1b0b-e44b-49cb-b2cc-c2d52a586b0c.png",
    title: "Pool & Recreation",
    category: "Venues",
  },
  {
    src: "/lovable-uploads/6b548797-ebbb-4409-a4e9-093bee371898.png",
    title: "Grand Forecourt",
    category: "Events",
  },
  {
    src: "/lovable-uploads/71a1b072-04d6-4b2a-b1aa-f1d4402f5563.png",
    title: "Hotel Suites",
    category: "Accommodation",
  },
  {
    src: "/lovable-uploads/31f3683b-3848-44dd-8571-6f66fba2f2cc.png",
    title: "Gourmet Dining",
    category: "Cuisine",
  },
  {
    src: "/lovable-uploads/c4be8697-d7ca-46dd-994c-127d9cceddaf.png",
    title: "Premium Bar",
    category: "Beverages",
  },
  {
    src: "/lovable-uploads/2a8a35b6-2291-4ae8-a49f-6df42e7095a6.png",
    title: "Live Entertainment",
    category: "Events",
  },
  {
    src: "/lovable-uploads/1287ed52-2c9c-4eaa-b93a-8af2c591fe5b.png",
    title: "Wedding Ceremonies",
    category: "Weddings",
  },
  {
    src: "/lovable-uploads/120f67a8-1aa9-4798-8cbd-92e6d160d8af.png",
    title: "Birthday Celebrations",
    category: "Parties",
  },
  {
    src: "/lovable-uploads/d8df34eb-246d-436a-a217-1d2dd0da08f6.png",
    title: "Corporate Events",
    category: "Business",
  },
]

export const FeaturedGallery = ({ gallery }: { gallery?: GalleryItem[] }) => {
  const displayItems = gallery && gallery.length > 0 ? gallery : featuredImages

  return (
    <section className="py-16 md:py-24 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-3">
            <Camera className="h-3.5 w-3.5" />
            Visual Tour
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-white mb-4">
            See Bayview Village
          </h2>
          <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Take a glimpse into our world-class facilities and experience the hospitality awaiting you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {displayItems.map((image, index) => (
            <Card
              key={index}
              className="group overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-2xl bg-zinc-900"
            >
              <div className="relative h-64 md:h-72 overflow-hidden">
                <img
                  src={image.src}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-1">
                    {image.category}
                  </div>
                  <h3 className="text-lg font-bold">{image.title}</h3>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={() => openInquiryForm("Facility Visit Request")}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-5 rounded-xl text-base shadow-lg"
          >
            Schedule a Facility Visit
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
