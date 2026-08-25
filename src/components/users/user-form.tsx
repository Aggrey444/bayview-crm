"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

type Role = { id: string; name: string };

interface UserFormProps {
  mode: "create" | "edit";
  userId?: string;
  defaultValues?: {
    name?: string;
    email?: string;
    roleId?: string | null;
  };
}

export function UserForm({
  mode,
  userId,
  defaultValues = {},
}: UserFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    fetch("/api/roles")
      .then((res) => res.json())
      .then((data) => setRoles(data.roles || []))
      .catch((err) => console.error("Failed to fetch roles", err));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body: Record<string, string> = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      roleId: formData.get("roleId") as string,
    };

    const password = formData.get("password") as string;
    if (password) {
      body.password = password;
    }

    try {
      const url =
        mode === "edit" ? `/api/users/${userId}` : "/api/users";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      const user = await res.json();
      router.push(`/dashboard/users/${user.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={defaultValues.name}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={defaultValues.email}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="roleId">
                Role <span className="text-red-500">*</span>
              </Label>
              <select
                id="roleId"
                name="roleId"
                defaultValue={defaultValues.roleId || ""}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {roles.length === 0 && (
                  <option value="">Loading roles...</option>
                )}
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {mode === "create" && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={mode === "edit" ? "Leave blank to keep current" : "Enter password"}
                required={mode === "create"}
                minLength={8}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : mode === "edit"
                ? "Save Changes"
                : "Create User"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
