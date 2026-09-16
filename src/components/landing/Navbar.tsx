"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, Phone } from "lucide-react"
import type { WebsiteContent } from "@/lib/website-content"

export const Navbar = ({ contact }: { contact?: WebsiteContent["contact"] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const phone = contact?.phone1 || "0204 473 577"
  const cleanPhone = phone.replace(/\s+/g, "")

  const navigation = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Services", href: "#services" },
    { name: "Packages", href: "#packages" },
    { name: "Gallery", href: "#gallery" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Contact", href: "#contact" },
  ]

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsOpen(false)
  }

  return (
    <nav className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-zinc-200/80 dark:border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3.5">
          {/* Logo */}
          <button onClick={() => scrollToSection("#home")} className="flex items-center text-left">
            <img
              src="/lovable-uploads/467913b5-a456-4cec-9507-b2e659698739.png"
              alt="Bayview Village"
              className="h-11 w-auto mr-3 object-contain"
            />
            <div>
              <div className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                Bayview Village
              </div>
              <div className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Hotel & Event Resort
              </div>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-7">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="text-sm font-medium text-zinc-700 hover:text-amber-600 dark:text-zinc-300 dark:hover:text-amber-400 transition-colors"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Contact Button */}
          <div className="flex items-center space-x-3">
            <a
              href={`tel:${cleanPhone}`}
              className="hidden md:inline-flex items-center px-4 py-2 border border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-xl text-sm font-medium transition-colors"
            >
              <Phone className="h-3.5 w-3.5 mr-2" />
              {phone}
            </a>

            <button
              className="lg:hidden p-2 text-zinc-700 dark:text-zinc-300"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden pb-5 border-t border-zinc-200 dark:border-zinc-800 mt-2">
            <div className="flex flex-col space-y-2 pt-3">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="text-left px-3 py-2 text-sm font-medium text-zinc-700 hover:text-amber-600 hover:bg-amber-50/50 rounded-lg dark:text-zinc-300 dark:hover:text-amber-400 dark:hover:bg-zinc-800/50"
                >
                  {item.name}
                </button>
              ))}
              <a
                href={`tel:${cleanPhone}`}
                className="mx-3 mt-2 inline-flex items-center justify-center px-4 py-2.5 border border-amber-500 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-medium"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call: {phone}
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
