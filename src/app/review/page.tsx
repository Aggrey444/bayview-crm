"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Star,
  Sparkles,
  CheckCircle2,
  Hotel,
  Waves,
  UtensilsCrossed,
  PartyPopper,
  Building2,
  Trophy,
  CalendarCheck,
  Wine,
  ThumbsUp,
  MessageSquare,
  Gift,
  ShieldCheck,
  ArrowRight,
  Heart,
  Smile,
} from "lucide-react";

const SERVICES_LIST = [
  { id: "Pool Facilities", name: "Pool & Leisure Passes", icon: Waves, desc: "Swimming pool, cabanas & poolside lounge" },
  { id: "Hotel Accommodation", name: "Hotel Rooms & Suites", icon: Hotel, desc: "Overnight stays & room comfort" },
  { id: "Food & Dining", name: "Restaurant & Dining", icon: UtensilsCrossed, desc: "Meals, buffet & culinary quality" },
  { id: "Bar & Lounge", name: "Bar & Drinks", icon: Wine, desc: "Cocktails, drinks & bar service" },
  { id: "Event Venue Rental", name: "Event & Wedding Grounds", icon: PartyPopper, desc: "Outdoor gardens & event spaces" },
  { id: "Conference Facilities", name: "Conferences & Meetings", icon: Building2, desc: "Meeting rooms & business facilities" },
  { id: "Birthday & Private Parties", name: "Private Parties", icon: CalendarCheck, desc: "Party hosting & celebrations" },
  { id: "Live Sports Entertainment", name: "Live Sports & Entertainment", icon: Trophy, desc: "Screenings & live performances" },
];

const RATING_DESCRIPTIONS: Record<number, { text: string; sub: string; color: string }> = {
  5: { text: "Outstanding & Luxurious! ⭐⭐⭐⭐⭐", sub: "We exceeded your expectations!", color: "text-emerald-600 dark:text-emerald-400" },
  4: { text: "Very Good Experience! ⭐⭐⭐⭐", sub: "A wonderful stay and visit.", color: "text-blue-600 dark:text-blue-400" },
  3: { text: "Satisfactory / Good ⭐⭐⭐", sub: "Met expectations with room to improve.", color: "text-amber-600 dark:text-amber-400" },
  2: { text: "Could Be Better ⭐⭐", sub: "We're sorry we fell short in some areas.", color: "text-orange-600 dark:text-orange-400" },
  1: { text: "Disappointing ⭐", sub: "Please let us know how we can make this right.", color: "text-red-600 dark:text-red-400" },
};

function ReviewFormContent() {
  const searchParams = useSearchParams();
  const initialService = searchParams.get("service") || "Pool Facilities";

  const [selectedService, setSelectedService] = useState(initialService);
  const [rating, setRating] = useState<number>(5);
  const [hospitalityRating, setHospitalityRating] = useState<number>(5);
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(5);
  const [recommend, setRecommend] = useState<string>("Definitely Yes! 👍");
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voucher, setVoucher] = useState<{ code: string; name: string; rating: number } | null>(null);

  useEffect(() => {
    const s = searchParams.get("service");
    if (s) {
      setSelectedService(s);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
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
      serviceUsed: selectedService,
      rating,
      staffHospitality: hospitalityRating,
      cleanliness: cleanlinessRating,
      feedback: feedback.trim() || undefined,
      recommend,
      _honeypot,
    };

    try {
      const res = await fetch("/api/public/guest-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to submit your review. Please try again.");
        setLoading(false);
        return;
      }

      setVoucher({ code: data.voucherCode, name, rating });
      setLoading(false);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Header */}
      <header className="text-center mb-6 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Heart className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          Customer Service Review
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-zinc-900 dark:text-white">
          How Was Your Visit Today?
        </h1>
        <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
          Thank you for choosing <strong>Bayview Village</strong>. Your genuine feedback helps us elevate our standards and rewards you with a VIP return pass!
        </p>
      </header>

      {voucher ? (
        /* Thank You & Reward Pass View */
        <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-background to-amber-500/5 p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/30">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400">
              Review Submitted &amp; Verified
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif mt-1">
              Thank You, {voucher.name}!
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2">
              We truly appreciate your review of our <strong>{selectedService}</strong>. Your feedback has been forwarded to our executive team.
            </p>
          </div>

          {/* Loyalty Reward Voucher */}
          <div className="relative mx-auto max-w-sm rounded-xl border border-dashed border-amber-500/60 bg-white/90 p-5 shadow-inner dark:bg-zinc-900/90 backdrop-blur-xs">
            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <Gift className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Your Return Visit Pass</span>
            </div>
            <p className="font-mono text-2xl font-black tracking-widest text-zinc-900 dark:text-amber-300 select-all">
              {voucher.code}
            </p>
            <p className="text-[11px] text-zinc-500 mt-2">
              Present this pass or your phone number on your next visit to enjoy a complimentary drink or special reservation perk!
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              Print / Save Voucher
            </button>
            <button
              type="button"
              onClick={() => setVoucher(null)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs shadow-md transition-colors"
            >
              Submit Another Review
            </button>
          </div>
        </div>
      ) : (
        /* Review Form */
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-amber-900/10 bg-white/95 p-5 sm:p-7 shadow-xl dark:border-zinc-800 dark:bg-zinc-950/90 backdrop-blur-xs space-y-6"
        >
          {error && (
            <div className="rounded-xl bg-red-50 p-3.5 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          {/* Honeypot field */}
          <input type="text" name="_honeypot" className="hidden" tabIndex={-1} autoComplete="off" />

          {/* 1. Overall Rating */}
          <div className="space-y-3 text-center py-2">
            <label className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              1. Overall Experience Rating
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 sm:p-2 hover:scale-125 transition-transform"
                  aria-label={`${star} star rating`}
                >
                  <Star
                    className={`h-9 w-9 sm:h-11 sm:w-11 transition-colors ${
                      star <= rating
                        ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                        : "text-zinc-200 dark:text-zinc-800"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-center">
              <span className={`text-sm font-bold ${RATING_DESCRIPTIONS[rating]?.color || "text-zinc-700"}`}>
                {RATING_DESCRIPTIONS[rating]?.text}
              </span>
              <p className="text-xs text-zinc-500 mt-0.5">{RATING_DESCRIPTIONS[rating]?.sub}</p>
            </div>
          </div>

          {/* 2. Service Used */}
          <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                2. Which service did you enjoy today?
              </label>
              <span className="text-[11px] text-zinc-500">Pick one</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SERVICES_LIST.map((srv) => {
                const isSelected = selectedService === srv.id || selectedService === srv.name;
                const Icon = srv.icon;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setSelectedService(srv.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 shadow-xs ring-1 ring-amber-500"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                    }`}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isSelected ? "text-amber-600 dark:text-amber-400" : "text-zinc-400"}`} />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                        {srv.name}
                      </span>
                      <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{srv.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Specific Criteria Ratings */}
          <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              3. Service Quality Criteria
            </h3>

            {/* Staff Hospitality */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
                  Staff Friendliness &amp; Hospitality
                </span>
                <span className="text-[11px] text-zinc-500">Courteous, welcoming &amp; helpful team</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setHospitalityRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= hospitalityRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-300 dark:text-zinc-700"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Cleanliness & Ambience */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">
                  Cleanliness &amp; Ambience
                </span>
                <span className="text-[11px] text-zinc-500">Hygiene, neatness &amp; resort aesthetics</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCleanlinessRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= cleanlinessRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-300 dark:text-zinc-700"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Recommendation question */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Would you recommend Bayview Village to others?
              </label>
              <div className="flex flex-wrap gap-2">
                {["Definitely Yes! 👍", "Maybe / Likely", "Needs Improvement"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setRecommend(opt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      recommend === opt
                        ? "bg-amber-500 text-zinc-950 font-bold border-amber-600"
                        : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Comments & Suggestions */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              4. Comments, Compliments or Suggestions (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Tell us what you loved or anything we can do better for your next visit..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 text-xs outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-900"
            />
          </div>

          {/* 5. Contact Details for Loyalty Reward */}
          <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                5. Your Details (For Loyalty Rewards)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                We need your contact so we can link your review and send your return visit discount voucher!
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Ama Darko"
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
                  placeholder="e.g. 054 123 4567"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Email Address <span className="text-zinc-400 font-normal">(Optional)</span>
              </label>
              <input
                name="email"
                type="email"
                placeholder="ama@example.com"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              "Submitting Review..."
            ) : (
              <>
                <span>Submit Review &amp; Claim Loyalty Pass</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 text-center">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Thank you for helping us maintain luxury service at Bayview Village.</span>
          </div>
        </form>
      )}

      <footer className="text-center text-[11px] text-zinc-400 dark:text-zinc-600 mt-8">
        &copy; {new Date().getFullYear()} Bayview Village Ltd. Kokrobite, Accra, Ghana.
      </footer>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/70 via-zinc-50 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <Suspense fallback={<div className="text-center py-20 text-zinc-400 text-sm">Loading Review Portal...</div>}>
        <ReviewFormContent />
      </Suspense>
    </div>
  );
}
