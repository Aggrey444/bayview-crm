"use client"

import { Phone, MapPin, Home, Users, Calendar, Camera, MessageSquare } from "lucide-react"
import type { WebsiteContent } from "@/lib/website-content"

export const Footer = ({ contact }: { contact?: WebsiteContent["contact"] }) => {
  const phone1 = contact?.phone1 || "0204 473 577"
  const phone2 = contact?.phone2 || "0545 477 777"
  const address = contact?.address || "Atomic Junction, Accra, Ghana"
  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <footer className="bg-zinc-950 text-white border-t border-white/10">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <img
                src="/lovable-uploads/467913b5-a456-4cec-9507-b2e659698739.png"
                alt="Bayview Village"
                className="h-10 w-auto mr-3 object-contain"
              />
              <div className="text-xl font-bold text-amber-400">
                Bayview Village Ltd
              </div>
            </div>
            <p className="text-zinc-400 text-sm mb-5 leading-relaxed max-w-sm">
              Host unforgettable moments at Accra&apos;s premier destination for events, luxury accommodation, dining, and recreation.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-amber-400">Navigation</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => scrollToSection("#home")}
                  className="text-zinc-400 hover:text-white transition-colors flex items-center"
                >
                  <Home className="h-3.5 w-3.5 mr-2" /> Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("#services")}
                  className="text-zinc-400 hover:text-white transition-colors flex items-center"
                >
                  <Calendar className="h-3.5 w-3.5 mr-2" /> Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("#packages")}
                  className="text-zinc-400 hover:text-white transition-colors flex items-center"
                >
                  <Users className="h-3.5 w-3.5 mr-2" /> Event Packages
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("#gallery")}
                  className="text-zinc-400 hover:text-white transition-colors flex items-center"
                >
                  <Camera className="h-3.5 w-3.5 mr-2" /> Gallery
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("#contact")}
                  className="text-zinc-400 hover:text-white transition-colors flex items-center"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-2" /> Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-amber-400">Our Amenities</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>🍽️ Restaurant & Bar</li>
              <li>🏨 Luxury Hotel Rooms</li>
              <li>🏊‍♂️ Private Pool Rentals</li>
              <li>🎉 Grand Forecourt (800 cap)</li>
              <li>🏢 Conference Hall (150 cap)</li>
              <li>📺 Live Sports Screening</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-amber-400">Contact Us</h3>
              <div className="space-y-2.5 text-xs md:text-sm text-zinc-400">
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 text-amber-400 shrink-0 mt-0.5" />
                  <span>{address}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-amber-400 shrink-0" />
                  <span>{phone1}</span>
                </div>
                {phone2 && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-amber-400 shrink-0" />
                    <span>{phone2}</span>
                  </div>
                )}
              </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-10 pt-6 text-center text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} Bayview Village Ltd. All rights reserved. | Powered by Bayview CRM
        </div>
      </div>
    </footer>
  )
}
