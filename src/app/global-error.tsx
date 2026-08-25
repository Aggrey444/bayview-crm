"use client";

import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="flex items-center justify-center py-16">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="mt-4 text-lg">Application Error</CardTitle>
              <CardDescription>
                A critical error occurred. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {error.digest && (
                <p className="text-xs text-zinc-500">Error ID: {error.digest}</p>
              )}
            </CardContent>
            <CardFooter className="justify-center">
              <button onClick={retry} className={buttonVariants({ variant: "outline" })}>
                Try again
              </button>
            </CardFooter>
          </Card>
        </div>
      </body>
    </html>
  );
}
