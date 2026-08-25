"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function LeadCapturePage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});
  const [sources, setSources] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const val = params.get(key);
      if (val) utm[key] = val;
    }
    if (Object.keys(utm).length > 0) setUtmParams(utm);
  }, []);

  useEffect(() => {
    fetch("/api/public/sources")
      .then((res) => res.json())
      .then((data) => {
        if (data.sources) setSources(data.sources);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name") as string,
      phone: fd.get("phone") as string,
      email: fd.get("email") as string,
      service: fd.get("service") as string,
      message: fd.get("message") as string,
      source: fd.get("source") as string,
      campaign: fd.get("campaign") as string,
      _honeypot: fd.get("_honeypot") as string,
      utmSource: utmParams.utm_source || "",
      utmMedium: utmParams.utm_medium || "",
      utmCampaign: utmParams.utm_campaign || "",
      utmContent: utmParams.utm_content || "",
      utmTerm: utmParams.utm_term || "",
    };

    try {
      const res = await fetch("/api/public/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-background to-background flex items-center justify-center p-4 dark:from-zinc-950 dark:to-zinc-900">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-amber-900/15 bg-white p-8 shadow-xl dark:border-amber-500/25 dark:bg-zinc-950 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
              <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Thank You!</h1>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Your enquiry has been received. Our Bayview Village team will get back to you shortly.
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                const form = document.querySelector("form") as HTMLFormElement;
                form?.reset();
              }}
              className="mt-6 inline-flex items-center rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20"
            >
              Submit Another Enquiry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-background to-background flex items-center justify-center p-4 dark:from-zinc-950 dark:to-zinc-900">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-amber-900/15 bg-white p-8 shadow-2xl dark:border-amber-500/25 dark:bg-zinc-950">
          <div className="mb-6 text-center">
            <div className="flex justify-center pb-3">
              <Image
                src="/logo.png"
                alt="Bayview Village Logo"
                width={180}
                height={60}
                className="h-14 w-auto object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Bayview Village</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Send us your enquiry</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:border-red-900 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Honeypot - hidden from users, visible to bots */}
            <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
              <input type="text" name="_honeypot" tabIndex={-1} autoComplete="off" />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                placeholder="Your full name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="service" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Service / Enquiry Interest
              </label>
              <input
                id="service"
                name="service"
                type="text"
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                placeholder="e.g. Deluxe Room Booking, Event Venue"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                placeholder="Tell us about your requirements..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  How did you hear about us?
                </label>
                <select
                  id="source"
                  name="source"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                >
                  <option value="">Select source</option>
                  {sources.length > 0
                    ? sources.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))
                    : (
                      <>
                        <option value="Facebook">Facebook</option>
                        <option value="Instagram">Instagram</option>
                        <option value="TikTok">TikTok</option>
                        <option value="Google">Google</option>
                        <option value="Website">Website</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Phone">Phone</option>
                        <option value="Walk-in">Walk-in</option>
                        <option value="Referral">Referral</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                </select>
              </div>
              <div>
                <label htmlFor="campaign" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Campaign
                </label>
                <input
                  id="campaign"
                  name="campaign"
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm shadow-sm placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  placeholder="Optional campaign"
                />
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              Please provide an email or phone number so we can reach you.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-amber-500/20"
            >
              {loading ? "Submitting..." : "Submit Enquiry"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
