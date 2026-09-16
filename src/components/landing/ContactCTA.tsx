"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Phone, MessageCircle, MapPin, Calendar, Mail, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { submitLead } from "@/lib/crm"
import { openInquiryForm } from "@/components/landing/InquiryDialog"
import type { WebsiteContent } from "@/lib/website-content"

export const ContactCTA = ({ contact }: { contact?: WebsiteContent["contact"] }) => {
  const phone1 = contact?.phone1 || "0204 473 577"
  const phone2 = contact?.phone2 || "0545 477 777"
  const whatsapp = contact?.whatsapp || "233204473577"
  const email = contact?.email || "info@bayviewvillageltd.com"
  const address = contact?.address || "Atomic Junction, Accra, Ghana"
  const cleanPhone1 = phone1.replace(/\s+/g, "")
  const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, "")

  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "General Inquiry",
    message: "",
  })

  const handleChange = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const result = await submitLead({
      name: form.name,
      email: form.email,
      phone: form.phone,
      service: form.service,
      message: form.message,
    })
    setSubmitting(false)

    if (result.ok) {
      toast({
        title: "Inquiry received!",
        description: "Thank you. Our team will contact you shortly.",
      })
      setForm({ name: "", email: "", phone: "", service: "General Inquiry", message: "" })
    } else {
      toast({
        title: "Submission failed",
        description: result.error || "Please try again or reach out via WhatsApp.",
        variant: "destructive",
      })
    }
  }

  return (
    <section className="py-16 md:py-24 bg-zinc-50 dark:bg-zinc-900/60" id="contact">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-white mb-4">
            Ready to Host Your Perfect Event?
          </h2>
          <p className="text-sm md:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Let&apos;s bring your vision to life. Contact us today to start planning your unforgettable experience at Bayview Village.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border border-zinc-200/80 dark:border-white/10 shadow-sm hover:shadow-lg transition-all rounded-2xl bg-white dark:bg-zinc-900">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Call Us Directly</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Speak with our reservations team</p>
              <a href={`tel:${cleanPhone1}`}>
                <Button
                  variant="outline"
                  className="border-amber-500 text-amber-700 dark:text-amber-400 hover:bg-amber-50 rounded-xl"
                >
                  {phone1}
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200/80 dark:border-white/10 shadow-sm hover:shadow-lg transition-all rounded-2xl bg-white dark:bg-zinc-900">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">WhatsApp Chat</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Instant quotes and inquiries</p>
              <a href={`https://wa.me/${cleanWhatsapp}`} target="_blank" rel="noopener noreferrer">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                  Message on WhatsApp
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200/80 dark:border-white/10 shadow-sm hover:shadow-lg transition-all rounded-2xl bg-white dark:bg-zinc-900">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Book Online</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Reserve rooms or venues quickly</p>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl"
                onClick={() => openInquiryForm("Book Online")}
              >
                Open Booking Form
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Direct CRM Inquiry Form */}
        <Card className="border border-zinc-200/80 dark:border-white/10 shadow-xl mb-12 rounded-2xl bg-white dark:bg-zinc-900">
          <CardContent className="p-6 md:p-10">
            <h3 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white mb-2 text-center">
              Send Us an Instant Inquiry
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-8">
              Submissions connect directly to our management team.
            </p>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
              <div className="space-y-2">
                <Label htmlFor="ctct-name">Full Name *</Label>
                <Input
                  id="ctct-name"
                  required
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctct-phone">Phone Number *</Label>
                <Input
                  id="ctct-phone"
                  required
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="024 000 0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctct-email">Email Address</Label>
                <Input
                  id="ctct-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctct-service">Service Interested In</Label>
                <select
                  id="ctct-service"
                  value={form.service}
                  onChange={(e) => handleChange("service", e.target.value)}
                  className="w-full h-8 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Hotel Accommodation">Hotel Accommodation</option>
                  <option value="Wedding Reception">Wedding Reception</option>
                  <option value="Corporate Event">Corporate Event</option>
                  <option value="Birthday Party">Birthday Party</option>
                  <option value="Pool Event">Pool Event</option>
                  <option value="Special Package">Special Package</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ctct-message">Your Message</Label>
                <Textarea
                  id="ctct-message"
                  rows={3}
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder="Tell us about your dates, number of guests, or special requests..."
                />
              </div>
              <div className="md:col-span-2 pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-12 rounded-xl text-base"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting Inquiry...
                    </>
                  ) : (
                    "Submit Inquiry to Bayview"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Location & Directions Card */}
        <div className="rounded-2xl p-8 md:p-10 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white shadow-xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">Visit Bayview Village</h3>
              <div className="space-y-3 text-sm text-zinc-300">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-3 text-amber-400 shrink-0" />
                  <span>{address}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-amber-400 shrink-0" />
                  <span>{phone1}{phone2 ? ` / ${phone2}` : ""}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-3 text-amber-400 shrink-0" />
                  <span>{email}</span>
                </div>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-zinc-300 mb-5">
                Open daily for accommodation, dining, events, and relaxation.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-end">
                <a
                  href="https://maps.google.com/?q=Bayview+Village+Atomic+Junction+Accra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-amber-500 text-black font-bold rounded-xl text-sm hover:bg-amber-400 transition-colors"
                >
                  <MapPin className="mr-1.5 h-4 w-4" /> Get Directions
                </a>
                <button
                  onClick={() => openInquiryForm("Visit Schedule")}
                  className="inline-flex items-center justify-center px-5 py-2.5 border border-white/20 text-white rounded-xl text-sm hover:bg-white/10 transition-colors"
                >
                  Schedule a Visit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
