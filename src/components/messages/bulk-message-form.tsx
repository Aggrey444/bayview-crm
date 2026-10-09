"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Send,
  MessageSquare,
  Key,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Phone,
  Mail,
} from "lucide-react";

type Service = { id: string; name: string };

interface ArkeselInitialConfig {
  apiKey: string;
  senderId: string;
  sandbox: boolean;
  isConfigured: boolean;
}

interface BulkMessageFormProps {
  services: Service[];
  initialConfig?: ArkeselInitialConfig;
}

export function BulkMessageForm({ services, initialConfig }: BulkMessageFormProps) {
  const router = useRouter();
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Form states
  const [targetType, setTargetType] = useState<"all_customers" | "service" | "leads" | "custom">("all_customers");
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || "");
  const [customRecipients, setCustomRecipients] = useState("");
  const [channel, setChannel] = useState<"SMS" | "EMAIL">("SMS");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [senderIdOverride, setSenderIdOverride] = useState(initialConfig?.senderId || "Bayview");

  // Arkesel Quick Config Section
  const [isConfigOpen, setIsConfigOpen] = useState(!initialConfig?.isConfigured);
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || "");
  const [configSenderId, setConfigSenderId] = useState(initialConfig?.senderId || "Bayview");
  const [sandbox, setSandbox] = useState(initialConfig?.sandbox || false);
  const [isConfigured, setIsConfigured] = useState(initialConfig?.isConfigured || false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configFeedback, setConfigFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [balance, setBalance] = useState<{ smsBalance?: string | number; mainBalance?: string | number } | null>(null);

  // Recipient Count state
  const [counts, setCounts] = useState<{ total: number; withPhone: number; withEmail: number } | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    sent: number;
    total: number;
    validPhones?: number;
    provider?: string;
    message?: string;
  } | null>(null);

  // Check balance on initial mount if configured
  useEffect(() => {
    if (isConfigured) {
      fetch("/api/sms")
        .then((res) => res.json())
        .then((data) => {
          if (data.configured && data.success) {
            setBalance({ smsBalance: data.smsBalance, mainBalance: data.mainBalance });
          }
        })
        .catch(() => null);
    }
  }, [isConfigured]);

  // Fetch recipient counts when target changes
  useEffect(() => {
    if (targetType === "custom") {
      const parsed = customRecipients
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      setCounts({
        total: parsed.length,
        withPhone: parsed.length,
        withEmail: parsed.filter((s) => s.includes("@")).length,
      });
      return;
    }

    setCountLoading(true);
    const params = new URLSearchParams({ targetType });
    if (targetType === "service" && selectedServiceId) {
      params.set("serviceId", selectedServiceId);
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/messages/bulk?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setCounts({
            total: data.total,
            withPhone: data.withPhone,
            withEmail: data.withEmail,
          });
        }
      } catch {
        // Fallback
      } finally {
        setCountLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [targetType, selectedServiceId, customRecipients]);

  // Handle saving Arkesel API config directly inside this page
  async function handleSaveArkeselConfig() {
    if (!apiKey.trim()) {
      setConfigFeedback({ success: false, message: "Please provide an Arkesel API Key." });
      return;
    }

    setSavingConfig(true);
    setConfigFeedback(null);

    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_quick_config",
          apiKey: apiKey.trim(),
          senderId: configSenderId.trim().slice(0, 11) || "Bayview",
          sandbox,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsConfigured(true);
        setSenderIdOverride(data.senderId || configSenderId);
        if (data.balance?.smsBalance !== undefined) {
          setBalance({
            smsBalance: data.balance.smsBalance,
            mainBalance: data.balance.mainBalance,
          });
        }
        setConfigFeedback({
          success: true,
          message: "Arkesel API configured and verified successfully!",
        });
        setTimeout(() => setIsConfigOpen(false), 2000);
      } else {
        setConfigFeedback({
          success: false,
          message: data.error || data.message || "Failed to save Arkesel config.",
        });
      }
    } catch {
      setConfigFeedback({
        success: false,
        message: "Network error while saving Arkesel configuration.",
      });
    } finally {
      setSavingConfig(false);
    }
  }

  // Insert tag helper into body
  function insertTag(tag: string) {
    if (!bodyTextareaRef.current) {
      setBody((prev) => prev + tag);
      return;
    }
    const start = bodyTextareaRef.current.selectionStart;
    const end = bodyTextareaRef.current.selectionEnd;
    const newBody = body.substring(0, start) + tag + body.substring(end);
    setBody(newBody);
    setTimeout(() => {
      if (bodyTextareaRef.current) {
        bodyTextareaRef.current.focus();
        bodyTextareaRef.current.setSelectionRange(start + tag.length, start + tag.length);
      }
    }, 0);
  }

  // Calculate SMS parts (160 characters for 1 part, 153 for multi-part concatenated)
  const charCount = body.length;
  const smsPages = charCount <= 160 ? 1 : Math.ceil(charCount / 153);
  const eligibleRecipients =
    channel === "SMS"
      ? counts?.withPhone ?? 0
      : counts?.withEmail ?? counts?.total ?? 0;
  const totalSmsCredits = eligibleRecipients * smsPages;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    if (channel === "SMS" && !isConfigured && !apiKey.trim()) {
      setError("Please add your Arkesel API key above before sending SMS.");
      setIsConfigOpen(true);
      setLoading(false);
      return;
    }

    const payload = {
      targetType,
      serviceId: targetType === "service" ? selectedServiceId : undefined,
      customRecipients: targetType === "custom" ? customRecipients : undefined,
      channel,
      subject: subject.trim() || undefined,
      body: body.trim(),
      senderId: senderIdOverride.trim().slice(0, 11) || undefined,
    };

    try {
      const res = await fetch("/api/messages/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to dispatch bulk messages.");
        setLoading(false);
        return;
      }

      setSuccess({
        sent: data.sent,
        total: data.total,
        validPhones: data.validPhones,
        provider: data.provider || (channel === "SMS" ? "Arkesel" : "System"),
        message: data.message,
      });
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card className="border-emerald-200 shadow-lg dark:border-emerald-900/60">
        <CardContent className="flex flex-col items-center py-12 space-y-4">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Bulk Broadcast Dispatched Successfully!
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
              {success.message || `Dispatched ${success.sent} message${success.sent !== 1 ? "s" : ""} via ${success.provider || "Arkesel"}.`}
            </p>
          </div>

          <div className="flex items-center gap-3 py-2">
            <Badge variant="outline" className="px-3 py-1 bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
              {success.sent} Delivered / Queued
            </Badge>
            {success.provider && (
              <Badge variant="secondary" className="px-3 py-1">
                Provider: {success.provider}
              </Badge>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setSuccess(null);
                setBody("");
                setSubject("");
              }}
              className="rounded-xl"
            >
              Compose Another Message
            </Button>
            <Button
              onClick={() => router.push("/dashboard/messages")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              View Sent Messages
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          PORTION TO ADD / CONFIGURE ARKESEL SMS API
          ───────────────────────────────────────────────────────────── */}
      <Card className="border-emerald-200 dark:border-emerald-900/50 shadow-sm overflow-hidden">
        <div
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="flex items-center justify-between p-4 bg-emerald-50/60 dark:bg-emerald-950/30 cursor-pointer select-none border-b border-emerald-100 dark:border-emerald-900/40"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Arkesel SMS API Configuration (Ghana)
                </span>
                {isConfigured ? (
                  <Badge className="bg-emerald-600 text-white text-[11px] font-semibold">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[11px]">
                    API Key Needed
                  </Badge>
                )}
                {balance?.smsBalance !== undefined && (
                  <Badge variant="outline" className="text-[11px] border-emerald-300 text-emerald-700 dark:text-emerald-300">
                    Units: {balance.smsBalance}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isConfigured
                  ? `Active Sender ID: ${configSenderId || "Bayview"} • Click to view or edit API key`
                  : "Click here to add your Arkesel API key to send live SMS"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hidden sm:inline">
              {isConfigOpen ? "Hide Settings" : "Configure API"}
            </span>
            {isConfigOpen ? (
              <ChevronUp className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            )}
          </div>
        </div>

        {isConfigOpen && (
          <CardContent className="p-5 space-y-4 bg-white dark:bg-zinc-900/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span>
                Enter your credentials from{" "}
                <a
                  href="https://arkesel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-600 underline inline-flex items-center gap-0.5"
                >
                  arkesel.com <ExternalLink className="h-3 w-3" />
                </a>
              </span>
              <span className="text-zinc-400">
                Supports all Ghana telecom networks (MTN, Telecel, AT)
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="apiKey" className="text-xs font-semibold">
                    Arkesel API Key <span className="text-red-500">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 inline-flex items-center gap-1"
                  >
                    {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                </div>
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your Arkesel API key here..."
                  className="h-9 rounded-lg font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="configSenderId" className="text-xs font-semibold">
                  Sender ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="configSenderId"
                  value={configSenderId}
                  onChange={(e) => setConfigSenderId(e.target.value.slice(0, 11))}
                  maxLength={11}
                  placeholder="Bayview"
                  className="h-9 rounded-lg font-mono uppercase text-xs"
                />
                <p className="text-[11px] text-zinc-400">
                  Max 11 alphanumeric characters (must be registered on Arkesel).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between py-1 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <div>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Sandbox Mode</span>
                <p className="text-[11px] text-zinc-500">Test API requests without sending actual SMS</p>
              </div>
              <Switch checked={sandbox} onCheckedChange={setSandbox} className="data-[state=checked]:bg-emerald-600" />
            </div>

            {configFeedback && (
              <div
                className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                  configFeedback.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                    : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300"
                }`}
              >
                {configFeedback.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <span>{configFeedback.message}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                onClick={handleSaveArkeselConfig}
                disabled={savingConfig || !apiKey.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${savingConfig ? "animate-spin" : ""}`} />
                {savingConfig ? "Verifying..." : "Save & Verify API Key"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          MAIN BULK MESSAGE COMPOSER FORM
          ───────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit}>
        <Card className="shadow-md border-zinc-200 dark:border-zinc-800">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Compose Bulk Broadcast</CardTitle>
                <CardDescription>
                  Send promotions, announcements, and alerts to multiple recipients simultaneously.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={channel === "SMS" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChannel("SMS")}
                  className={`rounded-xl text-xs ${
                    channel === "SMS"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : ""
                  }`}
                >
                  <Phone className="mr-1.5 h-3.5 w-3.5" />
                  SMS (Arkesel)
                </Button>
                <Button
                  type="button"
                  variant={channel === "EMAIL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChannel("EMAIL")}
                  className="rounded-xl text-xs"
                >
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  Email
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-6">
            {error && (
              <div className="rounded-xl bg-red-50 p-3.5 text-sm font-medium text-red-600 dark:bg-red-950/50 dark:text-red-400 flex items-center gap-2 border border-red-200 dark:border-red-900">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Target Audience Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Recipient Audience <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTargetType("all_customers")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    targetType === "all_customers"
                      ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <p className="text-xs font-bold">All Customers</p>
                  <p className="text-[11px] text-zinc-500">Every customer profile</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType("service")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    targetType === "service"
                      ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <p className="text-xs font-bold">Service Group</p>
                  <p className="text-[11px] text-zinc-500">Subscribed customers</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType("leads")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    targetType === "leads"
                      ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <p className="text-xs font-bold">Leads & Inquiries</p>
                  <p className="text-[11px] text-zinc-500">Prospective clients</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType("custom")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    targetType === "custom"
                      ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <p className="text-xs font-bold">Custom Numbers</p>
                  <p className="text-[11px] text-zinc-500">Paste phone numbers</p>
                </button>
              </div>
            </div>

            {/* Target Options Details */}
            {targetType === "service" && (
              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="serviceSelect" className="text-xs font-semibold">
                  Select Service Group
                </Label>
                <select
                  id="serviceSelect"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === "custom" && (
              <div className="space-y-1.5">
                <Label htmlFor="customRecipients" className="text-xs font-semibold">
                  Paste Phone Numbers (Ghana or International)
                </Label>
                <textarea
                  id="customRecipients"
                  value={customRecipients}
                  onChange={(e) => setCustomRecipients(e.target.value)}
                  rows={3}
                  placeholder="e.g. 0244123456, 0501234567, 0209876543 or paste one number per line..."
                  className="flex w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 font-mono text-xs"
                />
                <p className="text-[11px] text-zinc-400">
                  Accepts Ghanaian formats (024..., 050..., +233...) separated by commas, semicolons, or line breaks.
                </p>
              </div>
            )}

            {/* Live Recipient Count Summary Banner */}
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 p-3.5 border border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {countLoading ? "Calculating recipients..." : `${eligibleRecipients} eligible recipient${eligibleRecipients !== 1 ? "s" : ""}`}
                </span>
                {channel === "SMS" && counts && (
                  <span className="text-zinc-400">
                    ({counts.withPhone} with phone numbers out of {counts.total} total)
                  </span>
                )}
              </div>

              {channel === "SMS" && eligibleRecipients > 0 && (
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                  <span>
                    Est. SMS Credits: <strong>{totalSmsCredits}</strong> ({smsPages} page{smsPages !== 1 ? "s" : ""} / recipient)
                  </span>
                </div>
              )}
            </div>

            {/* Sender ID / Subject row */}
            <div className="grid gap-4 sm:grid-cols-2">
              {channel === "SMS" && (
                <div className="space-y-1.5">
                  <Label htmlFor="senderIdOverride" className="text-xs font-semibold">
                    Sender ID (From)
                  </Label>
                  <Input
                    id="senderIdOverride"
                    value={senderIdOverride}
                    onChange={(e) => setSenderIdOverride(e.target.value.slice(0, 11))}
                    maxLength={11}
                    placeholder="Bayview"
                    className="h-10 rounded-xl uppercase font-mono text-sm"
                  />
                  <p className="text-[11px] text-zinc-400">
                    Will appear as the sender on guests&apos; phones.
                  </p>
                </div>
              )}

              <div className={`space-y-1.5 ${channel === "SMS" ? "" : "sm:col-span-2"}`}>
                <Label htmlFor="subject" className="text-xs font-semibold">
                  Subject {channel === "SMS" ? "(Optional Reference)" : <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={channel === "SMS" ? "e.g. Weekend Villa Special Offer" : "Email Subject..."}
                  maxLength={200}
                  className="h-10 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="body" className="text-xs font-semibold">
                  Message Body <span className="text-red-500">*</span>
                </Label>

                {/* Personalization Tag Chips */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-400 mr-1 hidden sm:inline">Personalize:</span>
                  <button
                    type="button"
                    onClick={() => insertTag("{name}")}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono transition-colors"
                  >
                    + {"{name}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTag("{first_name}")}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono transition-colors"
                  >
                    + {"{first_name}"}
                  </button>
                </div>
              </div>

              <textarea
                ref={bodyTextareaRef}
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                required
                maxLength={channel === "SMS" ? 1600 : 10000}
                placeholder={
                  channel === "SMS"
                    ? "Hello {first_name}, enjoy our exclusive weekend getaway rates at Bayview Hotel! Book directly at bayview.com or call 0244000000."
                    : "Write your email message..."
                }
                className="flex w-full rounded-xl border border-zinc-200 bg-transparent px-3.5 py-2.5 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
              />

              {channel === "SMS" && (
                <div className="flex items-center justify-between text-xs text-zinc-500 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono ${charCount > 160 ? "text-amber-600 font-semibold" : ""}`}>
                      {charCount} / {smsPages * (smsPages > 1 ? 153 : 160)} chars
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {smsPages} SMS page{smsPages !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Standard GSM SMS = 160 chars
                  </span>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t px-6 py-4 bg-zinc-50/50 dark:bg-zinc-900/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="rounded-xl"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading || eligibleRecipients === 0 || !body.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-xl shadow-md shadow-emerald-600/20"
            >
              <Send className={`mr-2 h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
              {loading
                ? "Sending Broadcast..."
                : `Send Bulk ${channel} (${eligibleRecipients})`}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
