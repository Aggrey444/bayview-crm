import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import { db } from "@/lib/prisma";

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: number;
  requiresBooking: boolean;
}

const DEFAULT_SERVICES: Array<Omit<ServiceItem, "id">> = [
  { name: "Hotel Accommodation", category: "Accommodation", price: 450, requiresBooking: true },
  { name: "Event Venue Rental", category: "Events", price: 3500, requiresBooking: true },
  { name: "Pool Facilities", category: "Leisure", price: 50, requiresBooking: false },
  { name: "Conference & Meeting Facilities", category: "Events", price: 2000, requiresBooking: true },
  { name: "Birthday & Private Parties", category: "Events", price: 1500, requiresBooking: true },
  { name: "Weddings & Celebrations", category: "Events", price: 5000, requiresBooking: true },
  { name: "Corporate Events & Retreats", category: "Events", price: 4000, requiresBooking: true },
  { name: "Food & Dining", category: "Dining", price: 120, requiresBooking: false },
  { name: "Live Sports Entertainment", category: "Entertainment", price: 80, requiresBooking: false },
  { name: "General Event Support", category: "Services", price: 500, requiresBooking: false },
];

export async function GET() {
  try {
    const authResult = await requirePermission("customers.view");
    if (authResult.error) return authResult.error;

    let dbServices: Array<{
      id: string;
      name: string;
      category: string | null;
      price: unknown;
    }> = [];

    try {
      dbServices = await db.service.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, category: true, price: true },
      });
    } catch (err) {
      console.error("Failed to fetch services from database:", err);
      dbServices = [];
    }

    const existingByName = new Map(dbServices.map((s) => [s.name.toLowerCase(), s]));
    const defaultByName = new Map(DEFAULT_SERVICES.map((s) => [s.name.toLowerCase(), s]));

    const result: ServiceItem[] = [];

    // Map existing DB services
    for (const dbService of dbServices) {
      const def = defaultByName.get(dbService.name.toLowerCase());
      const priceNum =
        dbService.price !== null && dbService.price !== undefined
          ? Number(dbService.price)
          : def?.price ?? 0;

      result.push({
        id: dbService.id,
        name: dbService.name,
        category: dbService.category || def?.category || "General",
        price: isNaN(priceNum) ? 0 : priceNum,
        requiresBooking: def?.requiresBooking ?? (dbService.name.toLowerCase().includes("accommodation") || dbService.name.toLowerCase().includes("venue") || dbService.name.toLowerCase().includes("hall")),
      });
    }

    // Add any defaults not yet in DB
    for (const def of DEFAULT_SERVICES) {
      if (!existingByName.has(def.name.toLowerCase())) {
        result.push({
          id: `default-${def.name}`,
          name: def.name,
          category: def.category,
          price: def.price,
          requiresBooking: def.requiresBooking,
        });
      }
    }

    result.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/services error:", err);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requirePermission("customers.create");
    if (authResult.error) return authResult.error;

    const { name, price, category } = await req.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const parsedPrice = price ? parseFloat(price) : null;

    try {
      const service = await db.service.upsert({
        where: { name: trimmedName },
        update: {
          ...(parsedPrice !== null && !isNaN(parsedPrice) ? { price: parsedPrice } : {}),
          ...(category ? { category } : {}),
        },
        create: {
          name: trimmedName,
          ...(parsedPrice !== null && !isNaN(parsedPrice) ? { price: parsedPrice } : {}),
          ...(category ? { category } : {}),
        },
      });
      return NextResponse.json(service, { status: 201 });
    } catch (err) {
      console.error("Failed to upsert service:", err);
      return NextResponse.json({ id: `custom-${Date.now()}`, name: trimmedName, price: parsedPrice, category }, { status: 201 });
    }
  } catch (err) {
    console.error("POST /api/services error:", err);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}
