"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50/40 via-background to-background p-4 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <Card className="w-full max-w-md border-amber-900/15 dark:border-amber-500/25 shadow-2xl backdrop-blur-md">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="flex justify-center pb-3">
            <Image
              src="/logo.png"
              alt="Bayview Village Logo"
              width={200}
              height={70}
              className="h-16 w-auto object-contain"
              priority
            />
          </div>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 dark:bg-amber-500/20">
            <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Bayview Village CRM
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Account creation is restricted to administrators.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4 pb-8">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            New accounts must be created by an administrator. Please contact your
            admin to get access.
          </p>
          <Link
            href="/auth/login"
            className="inline-block text-sm font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:underline"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

