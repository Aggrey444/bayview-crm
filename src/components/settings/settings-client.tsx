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
  const [activeTab, setActiveTab] = useState<"general" | "notifications" | "security" | "system">("system");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // System Settings State
  const [timezone, setTimezone] = useState("GMT+0 (Ghana)");
  const [currency, setCurrency] = useState("GHS");
  const [autoBackups, setAutoBackups] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Settings Tab Header Bar */}
      <div className="flex w-full items-center justify-between border-b border-zinc-200 bg-zinc-50/80 p-1.5 rounded-xl dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="grid w-full grid-cols-4 gap-1">
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
