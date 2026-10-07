"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Users,
  Smartphone,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface RecentGuest {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  service: string | null;
  createdAt: string;
  notes: string | null;
}

interface GuestQrClientProps {
  initialGuests: RecentGuest[];
  totalScans: number;
}

export function GuestQrClient({ initialGuests, totalScans }: GuestQrClientProps) {
  const [eventTag, setEventTag] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const fullUrl = `${origin || "http://localhost:3000"}/welcome${
    eventTag.trim() ? `?event=${encodeURIComponent(eventTag.trim())}` : ""
  }`;

  useEffect(() => {
    if (fullUrl) {
      QRCode.toDataURL(fullUrl, {
        width: 380,
        margin: 2,
        color: {
          dark: "#1c1917", // zinc-900
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating QR code:", err));
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
    a.download = `bayview-entrance-qr${eventTag ? `-${eventTag}` : ""}.png`;
    a.click();
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Top action cards */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Controls & Link */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-amber-500" />
                Entrance QR Setup
              </CardTitle>
              <CardDescription>
                Place this QR code at your entrance gate, front desk, or event banners.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventTag">Campaign / Event Tag (Optional)</Label>
                <Input
                  id="eventTag"
                  placeholder="e.g. Wedding, PoolParty, Summit"
                  value={eventTag}
                  onChange={(e) => setEventTag(e.target.value)}
                />
                <p className="text-[11px] text-zinc-500">
                  Optional: tags registrations so you know which specific event they attended.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Destination Link</Label>
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
                  Print Stand Poster
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

              {/* Stats Box */}
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-50/50 p-4 dark:bg-amber-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-semibold">Total Scans & Registrations</span>
                  </div>
                  <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                    {totalScans}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Every scan automatically logs a prospect lead into your CRM database for marketing.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Printable Poster Preview */}
        <div className="lg:col-span-7">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Entrance Stand Poster Preview (A4/A5 Ready)
                </span>
                <Badge variant="outline" className="text-[10px]">
                  High Resolution
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-zinc-100 dark:bg-zinc-950 flex justify-center">
              {/* Stand Poster Element (Target for Print) */}
              <div
                ref={printRef}
                id="printable-stand"
                className="w-full max-w-sm rounded-2xl border-4 border-amber-500/80 bg-white p-6 shadow-xl text-center text-zinc-900 space-y-4"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 text-amber-600" />
                  Bayview Village Resort & Event Centre
                </div>

                <div>
                  <h2 className="text-2xl font-black font-serif tracking-tight text-zinc-950">
                    Welcome to Bayview Village!
                  </h2>
                  <p className="text-xs text-zinc-600 mt-1 font-medium">
                    Scan with your phone camera below to register & unlock an{" "}
                    <strong className="text-amber-700">exclusive discount</strong> on your next visit!
                  </p>
                </div>

                {/* QR Code Graphic */}
                <div className="relative mx-auto flex items-center justify-center p-3 bg-white rounded-xl border-2 border-zinc-900 shadow-inner max-w-[240px]">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Bayview Village Entrance QR Code"
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
                    <span>Point your mobile camera to scan</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Accommodation • Pool Passes • Event Grounds • Dining • Live Sports
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-200 text-[9px] text-zinc-400 font-mono">
                  Kokrobite, Accra, Ghana • Powered by Bayview CRM
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom: Recent Leads Captured via Entrance QR */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Entrance Guest Registrations</CardTitle>
              <CardDescription>
                Guests who scanned the QR code upon entering Bayview Village.
              </CardDescription>
            </div>
            <Link
              href="/dashboard/leads"
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              <span>View All Leads</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {initialGuests.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No entrance scans recorded yet. Print the poster and display it at your entrance or reception desk!
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialGuests.map((guest) => (
                <div key={guest.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        {guest.name}
                      </span>
                      <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Entrance QR
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-1">
                      {guest.phone && <span>📞 {guest.phone}</span>}
                      {guest.email && <span>✉️ {guest.email}</span>}
                      <span>🕒 {new Date(guest.createdAt).toLocaleDateString()}</span>
                    </div>
                    {guest.service && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                        <strong>Interested in:</strong> {guest.service}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/leads`}
                    className="self-end sm:self-auto text-xs font-medium text-amber-600 hover:underline"
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
          #printable-stand,
          #printable-stand * {
            visibility: visible;
          }
          #printable-stand {
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
