"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left visual panel */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,oklch(0.68_0.15_75/0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,oklch(0.68_0.15_75/0.08),transparent_50%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div>
            <Image
              src="/logo.png"
              alt="Bayview Village"
              width={180}
              height={60}
              className="h-12 w-auto object-contain brightness-110"
              priority
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              Welcome to<br />
              <span className="text-gold-gradient">Bayview Village</span><br />
              CRM Portal
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
              Manage your guests, bookings, and hotel operations from one elegant dashboard. Built for hospitality teams who value excellence.
            </p>
            <div className="mt-8 flex gap-8">
              <div>
                <p className="text-2xl font-bold text-white">500+</p>
                <p className="text-xs text-zinc-500 mt-0.5">Happy Guests</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">98%</p>
                <p className="text-xs text-zinc-500 mt-0.5">Satisfaction</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">24/7</p>
                <p className="text-xs text-zinc-500 mt-0.5">Service</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Image
              src="/logo.png"
              alt="Bayview Village Logo"
              width={160}
              height={56}
              className="h-14 w-auto object-contain mx-auto"
              priority
            />
          </div>

          <div className="mb-8">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Sign in to your account
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Enter your credentials to access the CRM
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="h-11 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 text-sm focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                className="h-11 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-4 text-sm focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50"
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
            Bayview Village Ltd. &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
