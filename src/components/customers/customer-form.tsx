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
import { Checkbox } from "@/components/ui/checkbox";

type Service = { id: string; name: string };

interface CustomerFormProps {
  mode: "create" | "edit";
  defaultValues?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    notes?: string;
  };
  defaultServiceIds?: string[];
  customerId?: string;
}

export function CustomerForm({
  mode,
  defaultValues = {},
  defaultServiceIds = [],
  customerId,
}: CustomerFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(defaultServiceIds);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch("/api/services");
        if (res.ok) {
          const data = await res.json();
          setServices(data.filter((s: Service) => !s.id.startsWith("default-")));
        }
      } finally {
        setServicesLoading(false);
      }
    }
    fetchServices();
  }, []);

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (selectedServiceIds.length === 0) {
      setError("At least one service must be selected.");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
      address: formData.get("address") as string,
      notes: formData.get("notes") as string,
      serviceIds: selectedServiceIds,
    };

    try {
      const url =
        mode === "edit" ? `/api/customers/${customerId}` : "/api/customers";
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

      const customer = await res.json();
      router.push(`/dashboard/customers/${customer.id}`);
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
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={defaultValues.name}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={defaultValues.email}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={defaultValues.phone}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                defaultValue={defaultValues.company}
                placeholder="Acme Inc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={defaultValues.address}
              placeholder="123 Main St, City, Country"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Services <span className="text-red-500">*</span>
            </Label>
            {servicesLoading ? (
              <p className="text-sm text-zinc-500">Loading services...</p>
            ) : services.length === 0 ? (
              <p className="text-sm text-zinc-500">No services available.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 rounded-lg border p-4">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={selectedServiceIds.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <span>{service.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={defaultValues.notes}
              placeholder="Any notes about this customer..."
              rows={4}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
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
                : "Create Customer"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
