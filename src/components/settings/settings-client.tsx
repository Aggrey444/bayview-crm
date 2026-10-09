"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/utils";
import {
  User,
  Mail,
  Shield,
  Calendar,

  Database,
  Server,
  Save,
  SlidersHorizontal,
  Bell,
  Lock,
  Globe,
  CheckCircle2,
  MessageSquare,
  Eye,
  EyeOff,
  Send,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: { id: string; name: string } | string | null;
  createdAt: Date;
}

interface SettingsClientProps {
  user: UserProfile;
  dbStatus: string;
}

const roleColors: Record<string, string> = {
  Admin: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 font-semibold border-amber-500/30",
  Manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Staff: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function SettingsClient({ user, dbStatus }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"general" | "notifications" | "security" | "system" | "sms">("system");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // System Settings State
  const [timezone, setTimezone] = useState("GMT+0 (Ghana)");
  const [currency, setCurrency] = useState("GHS");
  const [autoBackups, setAutoBackups] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Arkesel SMS State
  const [arkeselApiKey, setArkeselApiKey] = useState("");
  const [arkeselSenderId, setArkeselSenderId] = useState("Bayview");
  const [arkeselSandbox, setArkeselSandbox] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<{
    smsBalance?: string | number;
    mainBalance?: string | number;
    currency?: string;
    error?: string;
    message?: string;
  } | null>(null);

  // Quick Test SMS
  const [testPhone, setTestPhone] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Notifications State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [followUpReminders, setFollowUpReminders] = useState(true);
  const [bookingAlerts, setBookingAlerts] = useState(true);

  // Security State
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.timezone) setTimezone(data.timezone);
          if (data.currency) setCurrency(data.currency);
          setAutoBackups(data.autoBackups ?? true);
          setMaintenanceMode(data.maintenanceMode ?? false);
          setEmailAlerts(data.emailAlerts ?? true);
          setSmsAlerts(data.smsAlerts ?? true);
          setFollowUpReminders(data.followUpReminders ?? true);
          setBookingAlerts(data.bookingAlerts ?? true);
          setTwoFactor(data.twoFactor ?? false);
          if (data.sessionTimeout) setSessionTimeout(data.sessionTimeout);
          if (data.arkeselApiKey) setArkeselApiKey(data.arkeselApiKey);
          if (data.arkeselSenderId) setArkeselSenderId(data.arkeselSenderId);
          if (data.arkeselSandbox !== undefined) setArkeselSandbox(data.arkeselSandbox);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSaveSettings() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timezone,
          currency,
          autoBackups,
          maintenanceMode,
          emailAlerts,
          smsAlerts,
          followUpReminders,
          bookingAlerts,
          twoFactor,
          sessionTimeout,
          arkeselApiKey,
          arkeselSenderId,
          arkeselSandbox,
        }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckBalance() {
    setBalanceLoading(true);
    setBalanceInfo(null);
    try {
      const res = await fetch("/api/sms");
      const data = await res.json();
      if (res.ok && data.success) {
        setBalanceInfo({
          smsBalance: data.smsBalance,
          mainBalance: data.mainBalance,
          currency: data.currency || "GHS",
          message: data.message,
        });
      } else {
        setBalanceInfo({
          error: data.message || data.error || "Could not retrieve balance",
        });
      }
    } catch {
      setBalanceInfo({ error: "Failed to connect to Arkesel server." });
    } finally {
      setBalanceLoading(false);
    }
  }

  async function handleSendTestSms() {
    if (!testPhone.trim()) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_test_sms",
          phone: testPhone,
          senderId: arkeselSenderId,
          apiKey: arkeselApiKey,
          sandbox: arkeselSandbox,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || `Test SMS sent successfully to ${testPhone}!`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || data.message || "Failed to send test SMS.",
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: "Network error while sending test SMS.",
      });
    } finally {
      setTestSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Settings Tab Header Bar */}
      <div className="flex w-full items-center justify-between border-b border-zinc-200 bg-zinc-50/80 p-1.5 rounded-xl dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1">
          <button
            onClick={() => setActiveTab("system")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
              activeTab === "system"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white font-semibold"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            System
          </button>
          <button
            onClick={() => setActiveTab("sms")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
              activeTab === "sms"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white font-semibold"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            SMS (Arkesel)
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
              activeTab === "notifications"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white font-semibold"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Bell className="h-4 w-4" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
              activeTab === "security"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white font-semibold"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Lock className="h-4 w-4" />
            Security
          </button>
          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
              activeTab === "general"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white font-semibold"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <User className="h-4 w-4" />
            General
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-sm text-zinc-500 dark:text-zinc-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mr-2" />
          Loading settings...
        </div>
      )}

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Settings saved successfully!
        </div>
      )}

      {/* SYSTEM SETTINGS TAB */}
      {activeTab === "system" && (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-md">
          <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-xl font-bold tracking-tight">System Settings</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Timezone
                </Label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                >
                  <option value="GMT+0 (Ghana)">GMT+0 (Ghana)</option>
                  <option value="GMT+0 (London / UTC)">GMT+0 (London / UTC)</option>
                  <option value="EST (UTC-5 / New York)">EST (UTC-5 / New York)</option>
                  <option value="CST (UTC-6 / Chicago)">CST (UTC-6 / Chicago)</option>
                  <option value="PST (UTC-8 / Los Angeles)">PST (UTC-8 / Los Angeles)</option>
                  <option value="WAT (UTC+1 / Lagos)">WAT (UTC+1 / Lagos)</option>
                  <option value="CAT (UTC+2 / Harare)">CAT (UTC+2 / Harare)</option>
                  <option value="EAT (UTC+3 / Nairobi)">EAT (UTC+3 / Nairobi)</option>
                  <option value="GST (UTC+4 / Dubai)">GST (UTC+4 / Dubai)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Currency
                </Label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                >
                  <option value="GHS (Ghanaian Cedi)">GHS (Ghanaian Cedi)</option>
                  <option value="USD (US Dollar)">USD (US Dollar)</option>
                  <option value="EUR (Euro)">EUR (Euro)</option>
                  <option value="GBP (British Pound)">GBP (British Pound)</option>
                  <option value="NGN (Nigerian Naira)">NGN (Nigerian Naira)</option>
                  <option value="KES (Kenyan Shilling)">KES (Kenyan Shilling)</option>
                  <option value="ZAR (South African Rand)">ZAR (South African Rand)</option>
                </select>
              </div>
            </div>

            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Automatic Backups</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Enable daily automatic backups</p>
                </div>
                <Switch checked={autoBackups} onCheckedChange={setAutoBackups} className="data-[state=checked]:bg-amber-500" />
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">System Maintenance Mode</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Put system in maintenance mode</p>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} className="data-[state=checked]:bg-amber-500" />
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold px-6 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition-all"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save System Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ARKESEL SMS TAB */}
      {activeTab === "sms" && (
        <div className="space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-md">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight">Arkesel SMS Gateway (Ghana)</CardTitle>
                    <CardDescription>
                      Configure your Arkesel API credentials to power single and bulk SMS messaging.
                    </CardDescription>
                  </div>
                </div>
                <a
                  href="https://arkesel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
                >
                  Visit Arkesel Portal <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Info banner */}
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0 animate-pulse" />
                  <div className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                      Ghana SMS Integration via Arkesel v2 API
                    </p>
                    Bayview Hotel CRM connects directly to <strong className="text-emerald-700 dark:text-emerald-300">sms.arkesel.com</strong> to deliver transactional & promotional SMS messages across MTN, Telecel (Vodafone), AT, and international networks. Your Sender ID must be approved on your Arkesel dashboard.
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="arkeselApiKey" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      Arkesel API Key <span className="text-red-500">*</span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 inline-flex items-center gap-1"
                    >
                      {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showApiKey ? "Hide" : "Show"}
                    </button>
                  </div>
                  <Input
                    id="arkeselApiKey"
                    type={showApiKey ? "text" : "password"}
                    value={arkeselApiKey}
                    onChange={(e) => setArkeselApiKey(e.target.value)}
                    placeholder="Paste your Arkesel API key..."
                    className="h-11 rounded-xl"
                  />
                  <p className="text-xs text-zinc-500">
                    Found in your Arkesel dashboard under Developer API &gt; API Keys.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arkeselSenderId" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Sender ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="arkeselSenderId"
                    value={arkeselSenderId}
                    onChange={(e) => setArkeselSenderId(e.target.value.slice(0, 11))}
                    maxLength={11}
                    placeholder="Bayview"
                    className="h-11 rounded-xl uppercase"
                  />
                  <p className="text-xs text-zinc-500">
                    Max 11 alphanumeric characters (e.g. <span className="font-mono font-semibold">BAYVIEW</span>). Must match your approved Sender ID on Arkesel.
                  </p>
                </div>
              </div>

              {/* Sandbox mode */}
              <div className="flex items-center justify-between py-2 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Sandbox / Test Mode</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Simulate API calls without deducting live SMS credits or delivering messages to phones.
                  </p>
                </div>
                <Switch
                  checked={arkeselSandbox}
                  onCheckedChange={setArkeselSandbox}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/20"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save SMS Configuration"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckBalance}
                  disabled={balanceLoading || !arkeselApiKey}
                  className="rounded-xl border-zinc-300 dark:border-zinc-700"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${balanceLoading ? "animate-spin" : ""}`} />
                  {balanceLoading ? "Connecting..." : "Test Connection & Check Balance"}
                </Button>
              </div>

              {/* Balance & Status feedback */}
              {balanceInfo && (
                <div className={`p-4 rounded-xl border text-sm transition-all ${
                  balanceInfo.error
                    ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300"
                    : "bg-emerald-50/80 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                }`}>
                  {balanceInfo.error ? (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                      <span>{balanceInfo.error}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Connected to Arkesel SMS API successfully!</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-1 max-w-sm">
                        <div className="bg-white/80 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                          <p className="text-xs text-zinc-500">SMS Units</p>
                          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                            {balanceInfo.smsBalance ?? "Active"}
                          </p>
                        </div>
                        {balanceInfo.mainBalance !== null && (
                          <div className="bg-white/80 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                            <p className="text-xs text-zinc-500">Main Balance</p>
                            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                              {balanceInfo.currency || "GHS"} {balanceInfo.mainBalance}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Test SMS Box */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Send className="h-4 w-4 text-emerald-600" />
                Send a Test SMS
              </CardTitle>
              <CardDescription>
                Verify that your Arkesel Sender ID and API key can deliver live messages to a phone.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Enter phone number (e.g. 0244123456 or +233244123456)"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleSendTestSms}
                  disabled={testSending || !testPhone.trim() || !arkeselApiKey}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold px-4 rounded-xl"
                >
                  <Send className={`mr-2 h-4 w-4 ${testSending ? "animate-pulse" : ""}`} />
                  {testSending ? "Sending..." : "Send Test SMS"}
                </Button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                    testResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                      : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* GENERAL TAB */}
      {activeTab === "general" && (
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">User Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white text-xl font-bold shadow-md">
                  {(user.name || user.email)
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-base">{user.name || "Unnamed User"}</p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2.5 text-sm">
                  <User className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-zinc-500 font-medium">Name:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{user.name || "Not set"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-zinc-500 font-medium">Email:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{user.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-zinc-500 font-medium">Role:</span>
                  <Badge variant="secondary" className={`text-xs px-2.5 py-0.5 ${roleColors[typeof user.role === "object" ? user.role?.name || "" : user.role || ""] || ""}`}>
                    {typeof user.role === "object" ? user.role?.name || "No Role" : user.role || "No Role"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-zinc-500 font-medium">Joined:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatDate(user.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-sm">
                  <Server className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-zinc-500 font-medium">App Version:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">1.0.0 (Bayview CRM)</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Database className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-zinc-500 font-medium">Database Connection:</span>
                  <Badge
                    variant="secondary"
                    className={`text-xs font-semibold ${
                      dbStatus === "Connected"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                        : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400"
                    }`}
                  >
                    {dbStatus}
                  </Badge>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Globe className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-zinc-500 font-medium">Environment:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">Production Ready</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === "notifications" && (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Notification Preferences</CardTitle>
            <CardDescription>Configure how and when you receive system alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Email Notifications</p>
                <p className="text-xs text-zinc-500">Receive lead and booking summaries via email</p>
              </div>
              <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} className="data-[state=checked]:bg-amber-500" />
            </div>
            <div className="flex items-center justify-between py-2 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">SMS Alerts</p>
                <p className="text-xs text-zinc-500">Instant SMS notifications for urgent lead arrivals</p>
              </div>
              <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} className="data-[state=checked]:bg-amber-500" />
            </div>
            <div className="flex items-center justify-between py-2 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Follow-up Reminders</p>
                <p className="text-xs text-zinc-500">Receive reminders for scheduled task follow-ups</p>
              </div>
              <Switch checked={followUpReminders} onCheckedChange={setFollowUpReminders} className="data-[state=checked]:bg-amber-500" />
            </div>
            <div className="flex items-center justify-between py-2 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Booking Confirmations</p>
                <p className="text-xs text-zinc-500">Alerts when new customer bookings are confirmed</p>
              </div>
              <Switch checked={bookingAlerts} onCheckedChange={setBookingAlerts} className="data-[state=checked]:bg-amber-500" />
            </div>

              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold px-6 py-2.5 rounded-xl shadow-md shadow-amber-500/20"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Notification Preferences"}
              </Button>
          </CardContent>
        </Card>
      )}

      {/* SECURITY TAB */}
      {activeTab === "security" && (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Security Settings</CardTitle>
            <CardDescription>Manage password policy and authentication security.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-zinc-500">Add an extra layer of security to your account</p>
              </div>
              <Switch checked={twoFactor} onCheckedChange={setTwoFactor} className="data-[state=checked]:bg-amber-500" />
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Label htmlFor="sessionTimeout" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Session Idle Timeout (Minutes)
              </Label>
              <select
                id="sessionTimeout"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="flex h-11 w-full max-w-xs rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">1 Hour</option>
                <option value="120">2 Hours</option>
              </select>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold px-6 py-2.5 rounded-xl shadow-md shadow-amber-500/20"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Security Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
