"use client"

import { MessageCircle } from "lucide-react"

export const WhatsAppButton = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = "233204473577"
    const message = "Hello! I'm interested in Bayview Village services."
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank")
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={handleWhatsAppClick}
        className="flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-3.5 shadow-2xl hover:scale-110 transition-all duration-300 animate-bounce"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </button>
    </div>
  )
}
