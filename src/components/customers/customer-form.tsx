"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  DollarSign,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Receipt,
  CheckCircle2,
  Clock,
} from "lucide-react";

export type Service = {
  id: string;
  name: string;
  category?: string;
  price?: number;
  requiresBooking?: boolean;
};

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
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({});
  const [servicesLoading, setServicesLoading] = useState(true);

  // Booking fields (optional)
  const [showBookingFields, setShowBookingFields] = useState(false);
  const [roomNumber, setRoomNumber] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [bookingNotes, setBookingNotes] = useState("");

  // Payment fields
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PENDING">("PAID");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "BANK_TRANSFER" | "ONLINE" | "OTHER">("CASH");
  const [customAmountPaid, setCustomAmountPaid] = useState<string>("");
  const [paymentReference, setPaymentReference] = useState("");

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch("/api/services");
        if (res.ok) {
          const data = await res.json();
          setServices(data);

          // Populate initial service prices for preselected
          const initialPrices: Record<string, number> = {};
          data.forEach((s: Service) => {
            if (defaultServiceIds.includes(s.id)) {
              initialPrices[s.id] = s.price ?? 0;
            }
          });
          setServicePrices((prev) => ({ ...initialPrices, ...prev }));
        }
      } finally {
        setServicesLoading(false);
      }
    }
    fetchServices();
  }, [defaultServiceIds]);

  function toggleService(service: Service) {
    const isSelected = selectedServiceIds.includes(service.id);
    if (isSelected) {
      setSelectedServiceIds((prev) => prev.filter((id) => id !== service.id));
    } else {
      setSelectedServiceIds((prev) => [...prev, service.id]);
      setServicePrices((prev) => ({
        ...prev,
        [service.id]: prev[service.id] !== undefined ? prev[service.id] : (service.price ?? 0),
      }));

      // Automatically open booking fields if service requires booking
      if (service.requiresBooking) {
        setShowBookingFields(true);
      }
    }
  }

  function handlePriceChange(serviceId: string, val: string) {
    const num = parseFloat(val);
    setServicePrices((prev) => ({
      ...prev,
      [serviceId]: isNaN(num) ? 0 : num,
    }));
  }

  // Calculate total price
  const totalAmount = useMemo(() => {
    return selectedServiceIds.reduce((sum, id) => {
      const price = servicePrices[id] !== undefined ? servicePrices[id] : 0;
      return sum + (typeof price === "number" ? price : 0);
    }, 0);
  }, [selectedServiceIds, servicePrices]);

  const anyRequiresBooking = useMemo(() => {
    return selectedServiceIds.some((id) => {
      const s = services.find((item) => item.id === id);
      return s?.requiresBooking;
    });
  }, [selectedServiceIds, services]);

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
    const body: Record<string, unknown> = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
      address: formData.get("address") as string,
      notes: formData.get("notes") as string,
      serviceIds: selectedServiceIds,
      servicePrices,
      bookingDetails: (showBookingFields || anyRequiresBooking) ? {
        propertyName: "Bayview Village",
        roomNumber: roomNumber.trim() || undefined,
        checkInDate: checkInDate || undefined,
        checkOutDate: checkOutDate || undefined,
        guests: Number(guests) || 1,
        notes: bookingNotes.trim() || undefined,
      } : undefined,
      paymentDetails: mode === "create" ? {
        paymentStatus,
        paymentMethod,
        amountPaid: customAmountPaid ? parseFloat(customAmountPaid) : totalAmount,
        paymentReference: paymentReference.trim() || undefined,
      } : undefined,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Primary contact and background details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                placeholder="e.g. John Doe"
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
              <Label htmlFor="phone">Phone / WhatsApp</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={defaultValues.phone}
                placeholder="+233 XX XXX XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company / Organization</Label>
              <Input
                id="company"
                name="company"
                defaultValue={defaultValues.company}
                placeholder="Optional company name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address / City</Label>
            <Input
              id="address"
              name="address"
              defaultValue={defaultValues.address}
              placeholder="e.g. Kokrobite, Accra, Ghana"
            />
          </div>
        </CardContent>
      </Card>

      {/* Services & Auto-Pricing Section */}
      <Card className="border-amber-500/20 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Services & Pricing
              </CardTitle>
              <CardDescription>
                Select services subscribed. Default prices are loaded automatically and can be edited below.
              </CardDescription>
            </div>
            {selectedServiceIds.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
                <span className="text-xs font-medium text-amber-800 dark:text-amber-300">Total Bill:</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                  GHS {totalAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {servicesLoading ? (
            <p className="text-sm text-zinc-500">Loading catalog services...</p>
          ) : services.length === 0 ? (
            <p className="text-sm text-zinc-500">No services found.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id);
                return (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-500/60 shadow-xs"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-card"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleService(service)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">
                          {service.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                          {service.category || "General"}
                        </Badge>
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          GHS {(service.price ?? 0).toFixed(2)}
                        </span>
                      </div>
                      {service.requiresBooking && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                          📅 Reservation recommended
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Services Price Customization Table */}
          {selectedServiceIds.length > 0 && (
            <div className="rounded-xl border border-amber-900/10 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Itemized Pricing & Discounts (Editable)
                </h4>
                <span className="text-xs text-zinc-500">
                  {selectedServiceIds.length} service{selectedServiceIds.length > 1 ? "s" : ""} selected
                </span>
              </div>

              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {selectedServiceIds.map((id) => {
                  const s = services.find((item) => item.id === id);
                  const price = servicePrices[id] !== undefined ? servicePrices[id] : (s?.price ?? 0);
                  return (
                    <div
                      key={id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {s?.name || id}
                        </span>
                        {s?.requiresBooking && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            Booking
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-xs text-zinc-500">Price (GHS):</span>
                        <div className="relative w-32">
                          <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={price === 0 ? "" : price}
                            placeholder="0.00"
                            onChange={(e) => handlePriceChange(id, e.target.value)}
                            className="h-8 pl-7 text-right font-semibold text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Total Customer Charge:
                </span>
                <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                  GHS {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Optional Reservation Details (Conditional / Collapsible) */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none py-4"
          onClick={() => setShowBookingFields(!showBookingFields)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-zinc-500" />
              <div>
                <CardTitle className="text-base">
                  Reservation & Room Details (Optional)
                </CardTitle>
                <CardDescription className="text-xs">
                  {anyRequiresBooking
                    ? "One of your selected services typically requires dates/room."
                    : "Not required for walk-in or single-day services (Pool, Gym, Dining)."}
                </CardDescription>
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm">
              {showBookingFields ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {showBookingFields && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="checkInDate">Check-In / Event Start Date</Label>
                <Input
                  id="checkInDate"
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOutDate">Check-Out / Event End Date</Label>
                <Input
                  id="checkOutDate"
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room / Venue Name or Number</Label>
                <Input
                  id="roomNumber"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. Room 204 or Pool Cabana B"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests">Number of Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookingNotes">Special Booking Requests</Label>
              <Input
                id="bookingNotes"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="e.g. Extra towels, dietary preferences, early check-in"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Payment at Creation Flow */}
      {mode === "create" && (
        <Card className="border-emerald-500/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-500" />
              Payment Status & Method
            </CardTitle>
            <CardDescription>
              Record an immediate counter/POS payment or save as pending invoice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div
                onClick={() => setPaymentStatus("PAID")}
                className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                  paymentStatus === "PAID"
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-500/60 shadow-xs"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                }`}
              >
                <CheckCircle2
                  className={`h-5 w-5 mt-0.5 ${
                    paymentStatus === "PAID" ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                  }`}
                />
                <div>
                  <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    Paid Now (Counter / POS)
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Customer is paying immediately via Cash, MoMo, or Card.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setPaymentStatus("PENDING")}
                className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                  paymentStatus === "PENDING"
                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-500/60 shadow-xs"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                }`}
              >
                <Clock
                  className={`h-5 w-5 mt-0.5 ${
                    paymentStatus === "PENDING" ? "text-amber-600 dark:text-amber-400" : "text-zinc-400"
                  }`}
                />
                <div>
                  <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    Bill / Pay Later
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Save as pending balance to collect upon departure or event date.
                  </p>
                </div>
              </div>
            </div>

            {paymentStatus === "PAID" && (
              <div className="rounded-xl border p-4 bg-zinc-50/60 dark:bg-zinc-900/60 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Mobile Money / MoMo</option>
                      <option value="CARD">Debit / Credit Card</option>
                      <option value="ONLINE">Bank Transfer / Wire</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount Paid (GHS)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={totalAmount.toFixed(2)}
                      value={customAmountPaid}
                      onChange={(e) => setCustomAmountPaid(e.target.value)}
                    />
                    <p className="text-[10px] text-zinc-500">
                      Leave blank to record full total (GHS {totalAmount.toFixed(2)})
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Receipt / Ref ID (Optional)</Label>
                    <Input
                      placeholder="e.g. MOMO-98213"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardContent className="pt-6 space-y-2">
          <Label htmlFor="notes">General Customer Notes</Label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={defaultValues.notes}
            placeholder="Any background notes, preferences, or special agreements..."
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
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
          <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold">
            {loading
              ? "Saving..."
              : mode === "edit"
                ? "Save Changes"
                : paymentStatus === "PAID"
                  ? `Create & Record GHS ${totalAmount.toFixed(2)}`
                  : "Create Customer & Bill Later"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
