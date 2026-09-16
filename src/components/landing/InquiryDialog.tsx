"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { submitLead } from "@/lib/crm"

const EVENT_NAME = "bayview:open-inquiry"

export const openInquiryForm = (service?: string) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { service } }))
  }
}

const emptyForm = { name: "", email: "", phone: "", message: "" }

export const InquiryDialog = () => {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [service, setService] = useState("General Inquiry")
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { service?: string } | undefined
      setService(detail?.service || "General Inquiry")
      setOpen(true)
    }
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  }, [])

  const handleChange = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const result = await submitLead({ ...form, service })
    setSubmitting(false)

    if (result.ok) {
      toast({
        title: "Inquiry received!",
        description: "Thank you. Our team will contact you shortly.",
      })
      setForm(emptyForm)
      setOpen(false)
    } else {
      toast({
        title: "Submission failed",
        description: result.error || "Please try again or reach out via WhatsApp.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book / Enquire</DialogTitle>
          <DialogDescription>
            {service} — fill in your details and our team will contact you shortly.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="iq-name">Full name *</Label>
            <Input
              id="iq-name"
              required
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iq-phone">Phone *</Label>
            <Input
              id="iq-phone"
              required
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="024 000 0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iq-email">Email</Label>
            <Input
              id="iq-email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iq-message">Message</Label>
            <Textarea
              id="iq-message"
              rows={3}
              value={form.message}
              onChange={(e) => handleChange("message", e.target.value)}
              placeholder="Tell us about your event, date and number of guests"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold h-11 transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
              </>
            ) : (
              "Send Inquiry"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default InquiryDialog
