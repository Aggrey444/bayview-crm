"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Plus, Check, X } from "lucide-react";

type Option = { id: string; name: string };

interface BookingFormProps {
  mode: "create" | "edit";
  defaultValues?: Record<string, unknown>;
  bookingId?: string;
  customers: Option[];
  staff: Option[];
  leads: Option[];
}

const INITIAL_SERVICES = [
  "Deluxe Room Booking",
  "Executive Suite",
  "Presidential Suite",
  "Conference Hall",
  "Event Space & Banquet",
  "Catering Service",
  "Spa & Wellness Package",
  "Wedding Package",
  "Corporate Seminar Package",
  "Airport Transfer",
];

export function BookingForm({
  mode,
  defaultValues = {},
  bookingId,
  customers,
  staff,
  leads,
}: BookingFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Service selection & custom creation state
  const [services, setServices] = useState<string[]>(INITIAL_SERVICES);
  const [selectedService, setSelectedService] = useState<string>(
    (defaultValues.service as string) || ""
  );
  const [isAddingNewService, setIsAddingNewService] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [savingService, setSavingService] = useState(false);

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch("/api/services");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const fetchedNames = data.map((s: { name: string }) => s.name);
            const combined = Array.from(new Set([...INITIAL_SERVICES, ...fetchedNames]));
            if (defaultValues.service && typeof defaultValues.service === "string" && defaultValues.service.trim()) {
              combined.push(defaultValues.service);
            }
            combined.sort();
            setServices(Array.from(new Set(combined)));
          }
        }
      } catch {
        // Fallback to initial list if fetch fails
      }
    }
    loadServices();
  }, [defaultValues.service]);

  async function handleCreateService(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!newServiceName.trim()) return;

    const nameToSave = newServiceName.trim();
    setSavingService(true);

    try {
      await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameToSave }),
      });
    } catch {
      // Continue locally even if network fails
    }

    setServices((prev) => Array.from(new Set([...prev, nameToSave])).sort());
    setSelectedService(nameToSave);
    setNewServiceName("");
    setIsAddingNewService(false);
    setSavingService(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      customerId: fd.get("customerId") as string,
      leadId: fd.get("leadId") as string,
      propertyName: fd.get("propertyName") as string,
      service: selectedService || (fd.get("service") as string) || "",
      roomNumber: fd.get("roomNumber") as string,
      checkInDate: fd.get("checkInDate") as string,
      checkOutDate: fd.get("checkOutDate") as string,
      guests: Number(fd.get("guests") as string),
      status: fd.get("status") as string,
      totalAmount: Number(fd.get("totalAmount") as string),
      notes: fd.get("notes") as string,
      assignedToId: fd.get("assignedToId") as string,
    };

    try {
      const url = mode === "edit" ? `/api/bookings/${bookingId}` : "/api/bookings";
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

      const booking = await res.json();
      router.push(`/dashboard/bookings/${booking.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-md">
        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer <span className="text-red-500">*</span></Label>
              <select id="customerId" name="customerId" defaultValue={defaultValues.customerId as string} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500" required>
                <option value="">Select customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadId">Related Lead</Label>
              <select id="leadId" name="leadId" defaultValue={defaultValues.leadId as string} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500">
                <option value="">None</option>
                {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="propertyName">Property Name <span className="text-red-500">*</span></Label>
              <Input id="propertyName" name="propertyName" defaultValue={(defaultValues.propertyName as string) || "Bayview Village"} required />
            </div>

            {/* Service dropdown selection with inline service creation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="service">Service to be Booked <span className="text-red-500">*</span></Label>
                {!isAddingNewService && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewService(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                  >
                    <Plus className="h-3 w-3" />
                    Create New Service
                  </button>
                )}
              </div>

              {isAddingNewService ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Enter new service name (e.g. VIP Chalet)"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="h-9 text-sm focus-visible:ring-amber-500"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleCreateService()}
                    disabled={savingService || !newServiceName.trim()}
                    className="h-9 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold px-3"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingNewService(false);
                      setNewServiceName("");
                    }}
                    className="h-9 px-2 text-zinc-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <select
                  id="service"
                  name="service"
                  value={selectedService}
                  onChange={(e) => {
                    if (e.target.value === "__NEW__") {
                      setIsAddingNewService(true);
                    } else {
                      setSelectedService(e.target.value);
                    }
                  }}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                  required
                >
                  <option value="">Select a service to book...</option>
                  {services.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="__NEW__" className="font-semibold text-amber-600">
                    + Create New Service...
                  </option>
                </select>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number / Suite</Label>
              <Input id="roomNumber" name="roomNumber" defaultValue={defaultValues.roomNumber as string} placeholder="e.g. 104, Villa A" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guests">Guests</Label>
              <Input id="guests" name="guests" type="number" min="1" defaultValue={(defaultValues.guests as number) || 1} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" defaultValue={(defaultValues.status as string) || "PENDING"} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500">
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="CHECKED_OUT">Checked Out</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="checkInDate">Check-in Date <span className="text-red-500">*</span></Label>
              <Input id="checkInDate" name="checkInDate" type="date" defaultValue={defaultValues.checkInDate as string} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutDate">Check-out Date <span className="text-red-500">*</span></Label>
              <Input id="checkOutDate" name="checkOutDate" type="date" defaultValue={defaultValues.checkOutDate as string} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount ($) <span className="text-red-500">*</span></Label>
              <Input id="totalAmount" name="totalAmount" type="number" step="0.01" min="0" defaultValue={defaultValues.totalAmount as string} required />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assignedToId">Assigned Staff</Label>
              <select id="assignedToId" name="assignedToId" defaultValue={defaultValues.assignedToId as string} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500">
                <option value="">Unassigned</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea id="notes" name="notes" defaultValue={defaultValues.notes as string} rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold shadow-md shadow-amber-500/20">
            {loading ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Booking"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

