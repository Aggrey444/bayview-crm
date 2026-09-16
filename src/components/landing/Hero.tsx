"use client"

import { Button } from "@/components/ui/button"
import { openInquiryForm } from "@/components/landing/InquiryDialog"
import { Phone, MessageCircle, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"

const heroImages = [
  "/lovable-uploads/valentines-single.jpg",
  "/lovable-uploads/valentines-couple.jpg",
  "/lovable-uploads/valentines-share.jpg",
  "/lovable-uploads/bc5f1b0b-e44b-49cb-b2cc-c2d52a586b0c.png",
  "/lovable-uploads/9fc66a82-86aa-49af-b5d0-fc00907aeaf8.png",
  "/lovable-uploads/9a6b974b-e7c5-442d-8ce9-af2ea29bfab8.png",
  "/lovable-uploads/c4be8697-d7ca-46dd-994c-127d9cceddaf.png",
  "/lovable-uploads/9921387a-aaa7-46ec-8f5d-b3de8d0089de.png",
  "/lovable-uploads/0727c477-1203-4e01-b294-d5fa76822bb5.png",
  "/lovable-uploads/9b546d19-2c65-4d97-afec-45e7b80a748a.png",
  "/lovable-uploads/778bd79a-be65-492c-bfa0-3b810e0d634f.png",
  "/lovable-uploads/58842caf-a39a-4c3a-87ab-5132b49327b8.png",
]

import { type WebsiteContent } from "@/lib/website-content"

interface HeroProps {
  data?: WebsiteContent["hero"]
}

export const Hero = ({ data }: HeroProps) => {
  const images = data?.images && data.images.length > 0 ? data.images : heroImages
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [images.length])

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image Carousel */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={image}
              alt={`Bayview Village ${index + 1}`}
              className="w-full h-full object-cover object-center"
              loading={index === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/75" />
          </div>
        ))}
      </div>

      {/* Carousel Controls */}
      <button
        onClick={prevImage}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 text-white"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextImage}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 text-white"
        aria-label="Next image"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Image Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-wrap justify-center gap-1.5 max-w-[80%]">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentImageIndex ? "bg-amber-400 scale-125" : "bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center py-16">
        <div className="mb-8">
          <img
            src="/lovable-uploads/467913b5-a456-4cec-9507-b2e659698739.png"
            alt="Bayview Village Logo"
            className="mx-auto h-20 md:h-28 w-auto mb-5 drop-shadow-2xl object-contain"
          />
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
            {data?.title || "BAYVIEW VILLAGE"}
          </h1>
          <p className="text-base md:text-xl lg:text-2xl text-amber-300 font-semibold tracking-wide uppercase mb-3">
            {data?.subtitle || "Accra's Premier Event Destination & Luxury Stay"}
          </p>
          <p className="text-sm md:text-base text-zinc-200 max-w-2xl mx-auto leading-relaxed">
            {data?.description || "Hotel Accommodation • Event Venues • Fine Dining • Pool Facilities • Live Sports"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center mb-8 px-2">
          <Button
            size="lg"
            onClick={() => openInquiryForm("Booking Request")}
            className="bg-amber-500 hover:bg-amber-600 text-black px-8 py-6 text-base font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all rounded-xl"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Book / Enquire Now
          </Button>
          <a href="tel:0204473577">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/80 text-white hover:bg-white hover:text-black px-7 py-6 text-base font-semibold backdrop-blur-md bg-white/10 shadow-xl rounded-xl transition-all"
            >
              <Phone className="mr-2 h-5 w-5" />
              Call: 0204 473 577
            </Button>
          </a>
          <a href="https://wa.me/233204473577" target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-6 text-base font-semibold shadow-xl rounded-xl transition-all"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              WhatsApp Us
            </Button>
          </a>
        </div>

        <div className="text-white/90">
          <p className="text-sm md:text-base font-medium drop-shadow-md">
            📍 Atomic Junction, Accra, Ghana
          </p>
        </div>
      </div>
    </section>
  )
}
