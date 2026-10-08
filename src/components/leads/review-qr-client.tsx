"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  Star,
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Users,
  Smartphone,
  Eye,
  Heart,
  TrendingUp,
  ThumbsUp,
  MessageSquare,
  Waves,
  Hotel,
  UtensilsCrossed,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export interface RecentReview {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  service: string | null;
  createdAt: string;
  notes: string | null;
  rating?: number;
  comments?: string;
}

interface ReviewQrClientProps {
  initialReviews: RecentReview[];
  totalReviews: number;
  averageRating: number;
  ratingCounts: { [key: number]: number };
}

const SERVICE_OPTIONS = [
  { value: "", label: "General (Customer selects on phone)" },
  { value: "Pool Facilities", label: "Pool & Leisure Passes" },
  { value: "Hotel Accommodation", label: "Hotel Accommodation" },
  { value: "Food & Dining", label: "Restaurant & Dining" },
  { value: "Bar & Lounge", label: "Bar & Drinks" },
  { value: "Event Venue Rental", label: "Event Venue Grounds" },
  { value: "Conference Facilities", label: "Conferences & Meetings" },
];

export function ReviewQrClient({
  initialReviews,
  totalReviews,
  averageRating,
  ratingCounts,
}: ReviewQrClientProps) {
  const [selectedService, setSelectedService] = useState("");
  const [tableOrLocation, setTableOrLocation] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const queryParams = new URLSearchParams();
  if (selectedService) queryParams.set("service", selectedService);
  if (tableOrLocation.trim()) queryParams.set("loc", tableOrLocation.trim());
  const queryString = queryParams.toString();

  const fullUrl = `${origin || "http://localhost:3000"}/review${
    queryString ? `?${queryString}` : ""
  }`;

  useEffect(() => {
    if (fullUrl) {
      QRCode.toDataURL(fullUrl, {
        width: 380,
        margin: 2,
        color: {
          dark: "#09090b", // zinc-950
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating Review QR:", err));
    }
  }, [fullUrl]);

  function handleCopy() {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `bayview-service-review-qr${selectedService ? `-${selectedService.toLowerCase().replace(/\s+/g, "-")}` : ""}.png`;
    a.click();
  }

  function handlePrint() {
    window.print();
  }

  const recCount = (ratingCounts[5] || 0) + (ratingCounts[4] || 0);
  const recPercent = totalReviews > 0 ? Math.round((recCount / totalReviews) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top action cards */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Controls & Link */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
                Service Review QR Setup
              </CardTitle>
              <CardDescription>
                Place this QR code at checkout counters, table tents, reception desk, or pool bar to collect reviews after customers finish using your services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceSelect">Service Focus (Optional)</Label>
                <select
                  id="serviceSelect"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                >
                  {SERVICE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-500">
                  Select a specific department or leave generic for all services.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationTag">Desk / Table Number (Optional)</Label>
                <Input
                  id="locationTag"
                  placeholder="e.g. Pool Bar, Table 5, Room 104, Front Desk"
                  value={tableOrLocation}
                  onChange={(e) => setTableOrLocation(e.target.value)}
                />
                <p className="text-[11px] text-zinc-500">
                  Allows tracking where the review was scanned from.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Destination Review URL</Label>
                <div className="flex items-center gap-2">
                  <Input value={fullUrl} readOnly className="font-mono text-xs bg-zinc-50 dark:bg-zinc-900" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handlePrint}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs"
                >
                  <Printer className="mr-1.5 h-4 w-4" />
                  Print Review Stand
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleDownload} className="text-xs">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download PNG
                </Button>
                <Link
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Test Form
                </Link>
              </div>

              {/* Review Performance Stats */}
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-50/50 p-4 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <span className="text-xs font-semibold">Average Customer Rating</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-zinc-400">/ 5.0</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-500/10">
                  <span className="text-zinc-500">Total Reviews Received</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{totalReviews}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Positive Recommendation</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{recPercent}%</span>
                </div>

                {/* Rating Distribution */}
                <div className="pt-2 border-t border-amber-500/10 space-y-1">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = ratingCounts[stars] || 0;
                    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-2 text-[10px]">
                        <span className="w-6 text-zinc-500 flex items-center gap-0.5">
                          {stars} <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 inline" />
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-5 text-right font-mono text-zinc-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Printable Table Tent / Checkout Stand Preview */}
        <div className="lg:col-span-7">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Table Tent &amp; Checkout Stand Poster (A4/A5 Ready)
                </span>
                <Badge variant="outline" className="text-[10px]">
                  Post-Service Feedback
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-zinc-100 dark:bg-zinc-950 flex justify-center">
              {/* Printable Stand (Target for window.print) */}
              <div
                ref={printRef}
                id="printable-review-stand"
                className="w-full max-w-sm rounded-2xl border-4 border-amber-500 bg-white p-6 shadow-xl text-center text-zinc-900 space-y-4"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 text-amber-600" />
                  Bayview Village Resort &amp; Leisure
                </div>

                <div>
                  <h2 className="text-2xl font-black font-serif tracking-tight text-zinc-950">
                    How Was Your Experience?
                  </h2>
                  <p className="text-xs text-zinc-600 mt-1 font-medium">
                    Scan below with your phone camera to rate our service &amp; claim an{" "}
                    <strong className="text-amber-700">instant VIP return reward!</strong>
                  </p>
                </div>

                {/* Stars Graphic */}
                <div className="flex items-center justify-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* QR Code Graphic */}
                <div className="relative mx-auto flex items-center justify-center p-3 bg-white rounded-xl border-2 border-zinc-900 shadow-inner max-w-[240px]">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Bayview Village Service Review QR Code"
                      className="w-full h-auto rounded-lg"
                    />
                  ) : (
                    <div className="h-48 w-48 flex items-center justify-center text-zinc-400">
                      Generating QR...
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-800">
                    <Smartphone className="h-3.5 w-3.5 text-amber-600" />
                    <span>Point your camera to leave your review</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    {selectedService || "Pool • Rooms • Dining • Events • Bar"}
                    {tableOrLocation ? ` • ${tableOrLocation}` : ""}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-200 text-[9px] text-zinc-400 font-mono">
                  Your feedback elevates our service • Kokrobite, Accra, Ghana
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom: Recent Reviews Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Customer Reviews &amp; Feedback</CardTitle>
              <CardDescription>
                Live reviews submitted by guests after utilizing Bayview services.
              </CardDescription>
            </div>
            <Link
              href="/dashboard/leads"
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              <span>View In CRM Leads</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {initialReviews.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No reviews recorded yet. Print the Service Review Stand poster and display it at tables or the checkout counter to start collecting reviews!
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialReviews.map((rev) => (
                <div key={rev.id} className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        {rev.name}
                      </span>
                      {rev.service && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {rev.service}
                        </Badge>
                      )}
                      {rev.rating && (
                        <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          ))}
                          <span className="ml-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                            ({rev.rating}/5)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      {rev.phone && <span>📞 {rev.phone}</span>}
                      {rev.email && <span>✉️ {rev.email}</span>}
                      <span>🕒 {new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                    {rev.comments && (
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800 mt-1 italic">
                        &ldquo;{rev.comments}&rdquo;
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/leads`}
                    className="self-end sm:self-auto text-xs font-medium text-amber-600 hover:underline shrink-0"
                  >
                    View in CRM &rarr;
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print-specific CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-review-stand,
          #printable-review-stand * {
            visibility: visible;
          }
          #printable-review-stand {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 85%;
            max-width: 500px;
            box-shadow: none !important;
            border-width: 6px !important;
          }
        }
      `}</style>
    </div>
  );
}
