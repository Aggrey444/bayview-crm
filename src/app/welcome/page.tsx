"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  CheckCircle2,
  Star,
  Hotel,
  Waves,
  PartyPopper,
  UtensilsCrossed,
  Building2,
  Trophy,
  CalendarCheck,
  ArrowRight,
  ShieldCheck,
  Gift,
} from "lucide-react";

const AVAILABLE_SERVICES = [
  { id: "Hotel Accommodation", name: "Hotel Accommodation", icon: Hotel, desc: "Luxury rooms & weekend getaways" },
  { id: "Pool Facilities", name: "Pool & Leisure Passes", icon: Waves, desc: "Pool access, cabanas & day relaxation" },
  { id: "Event Venue Rental", name: "Event & Wedding Venue", icon: PartyPopper, desc: "Outdoor grounds & celebration spaces" },
  { id: "Food & Dining", name: "Restaurant & Dining", icon: UtensilsCrossed, desc: "Fine cuisine, buffet & private dinners" },
  { id: "Conference Facilities", name: "Conferences & Meetings", icon: Building2, desc: "Corporate retreats & boardrooms" },
  { id: "Birthday & Private Parties", name: "Birthday Parties", icon: CalendarCheck, desc: "Exclusive private parties & milestones" },
  { id: "Live Sports Entertainment", name: "Live Sports & Entertainment", icon: Trophy, desc: "Game screenings & live events" },
];

const VISIT_PURPOSES = [
  "Attending an Event / Wedding / Programme",
  "Pool & Leisure Visit",
  "Food & Drinks / Dining",
  "Visiting a Hotel Guest / Friend",
  "Conference / Business Meeting",
  "Exploring Venue for a Future Event",
  "General Visit / First-Time Discovery",
];

export default function WelcomeGuestPage() {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [visitPurpose, setVisitPurpose] = useState<string>(VISIT_PURPOSES[0]);
  const [eventName, setEventName] = useState<string>("");
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voucher, setVoucher] = useState<{ code: string; name: string } | null>(null);

  function toggleService(serviceId: string) {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (selectedServices.length === 0) {
      setError("Please select at least one service you are interested in.");
      return;
    }

    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string)?.trim();
    const phone = (fd.get("phone") as string)?.trim();
    const email = (fd.get("email") as string)?.trim();
    const _honeypot = fd.get("_honeypot") as string;

    const payload = {
      name,
      phone,
      email: email || undefined,
      visitPurpose,
      eventName: eventName.trim() || undefined,
      interestedServices: selectedServices,
      rating,
      feedback: feedback.trim() || undefined,
      _honeypot,
    };

    try {
      const res = await fetch("/api/public/guest-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please check your information.");
        setLoading(false);
        return;
      }

      setVoucher({ code: data.voucherCode, name });
      setLoading(false);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/70 via-zinc-50 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto w-full">
        {/* Brand Header */}
        <header className="text-center mb-6 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Guest Welcome & Rewards
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-zinc-900 dark:text-white">
            Welcome to Bayview Village
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
            Scan & check in today! Complete this quick registration and select what you’re interested in to unlock an <strong>exclusive discount</strong> on your next visit or reservation.
          </p>
        </header>

        {voucher ? (
          /* VIP Discount Voucher Card (Success Screen) */
          <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-background to-amber-500/5 p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400">
                Registration Successful
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif mt-1">
                Your Exclusive Discount Pass
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2">
                Thank you for visiting us, <strong>{voucher.name}</strong>! Your special welcome discount has been registered in our system.
              </p>
            </div>

            {/* Voucher Badge */}
            <div className="relative mx-auto max-w-sm rounded-xl border border-dashed border-amber-500/60 bg-white/80 p-5 shadow-inner dark:bg-zinc-900/80 backdrop-blur-xs">
              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                <Gift className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Discount Voucher Code</span>
              </div>
              <p className="font-mono text-2xl font-black tracking-widest text-zinc-900 dark:text-amber-300 select-all">
                {voucher.code}
              </p>
              <p className="text-[11px] text-zinc-500 mt-2">
                Show this code or your phone number to our front desk, bar, or reservation team.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              >
                Save / Print Pass
              </button>
              <button
                type="button"
                onClick={() => setVoucher(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs shadow-md transition-colors"
              >
                Register Another Guest
              </button>
            </div>
          </div>
        ) : (
          /* Check-In Form */
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-amber-900/10 bg-white/90 p-5 sm:p-7 shadow-xl dark:border-zinc-800 dark:bg-zinc-950/80 backdrop-blur-xs space-y-6"
          >
            {error && (
              <div className="rounded-xl bg-red-50 p-3.5 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}

            {/* Honeypot field for bot protection */}
            <input type="text" name="_honeypot" className="hidden" tabIndex={-1} autoComplete="off" />

            {/* Contact Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                1. Your Details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Kwame Mensah"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Phone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="e.g. 024 123 4567"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Email Address <span className="text-zinc-400 font-normal">(Optional for discounts)</span>
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="kwame@example.com"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>
            </div>

            {/* Purpose of Visit */}
            <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                2. What brings you to Bayview today?
              </h3>
              <div className="space-y-2">
                <select
                  value={visitPurpose}
                  onChange={(e) => setVisitPurpose(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {VISIT_PURPOSES.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>

                {visitPurpose.includes("Event") && (
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Event or Host Name (e.g. Mensah Wedding, Tech Summit)"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="w-full rounded-xl border border-amber-500/30 bg-amber-50/40 px-3.5 py-2 text-xs outline-hidden focus:border-amber-500 dark:border-amber-500/30 dark:bg-amber-950/20"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Interested Services Selection */}
            <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  3. What Bayview services are you interested in?
                </h3>
                <span className="text-[11px] text-zinc-500">Pick any that apply</span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {AVAILABLE_SERVICES.map((item) => {
                  const isChecked = selectedServices.includes(item.id);
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleService(item.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/30 shadow-xs"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 rounded-sm border-zinc-300 text-amber-600 focus:ring-amber-500"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {item.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Arrival Experience Rating */}
            <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  4. Arrival Experience (Optional)
                </h3>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-zinc-300 dark:text-zinc-700"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={2}
                placeholder="Any quick thoughts or message for our team? (Optional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                "Activating Discount..."
              ) : (
                <>
                  <span>Claim Discount & Register</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 text-center">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Your information is strictly protected and saved to Bayview Village CRM.</span>
            </div>
          </form>
        )}
      </div>

      <footer className="text-center text-[11px] text-zinc-400 dark:text-zinc-600 mt-8">
        &copy; {new Date().getFullYear()} Bayview Village Ltd. Kokrobite, Accra, Ghana.
      </footer>
    </div>
  );
}
