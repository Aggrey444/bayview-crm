import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import { db } from "@/lib/prisma";

const DEFAULT_SERVICES = [
  "Hotel Accommodation",
  "Event Venue Rental",
  "Pool Facilities",
  "Conference & Meeting Facilities",
  "Birthday & Private Parties",
  "Weddings & Celebrations",
  "Corporate Events & Retreats",
  "Food & Dining",
  "Live Sports Entertainment",
  "General Event Support",
];

export async function GET() {
  try {
    const authResult = await requirePermission("customers.view");
    if (authResult.error) return authResult.error;

    let dbServices: Array<{ id: string; name: string }> = [];
    try {
      dbServices = await db.service.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });
    } catch (err) {
      console.error("Failed to fetch services from database:", err);
      dbServices = [];
    }

    const existingNames = new Set(dbServices.map((s) => s.name));
    const allServices = [...dbServices];

    for (const defaultName of DEFAULT_SERVICES) {
      if (!existingNames.has(defaultName)) {
        allServices.push({ id: `default-${defaultName}`, name: defaultName });
      }
    }

    allServices.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(allServices);
  } catch (err) {
    console.error("GET /api/services error:", err);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requirePermission("customers.create");
    if (authResult.error) return authResult.error;

    const { name } = await req.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    try {
      const service = await db.service.upsert({
        where: { name: trimmedName },
        update: {},
        create: { name: trimmedName },
      });
      return NextResponse.json(service, { status: 201 });
    } catch (err) {
      console.error("Failed to upsert service:", err);
      return NextResponse.json({ id: `custom-${Date.now()}`, name: trimmedName }, { status: 201 });
    }
  } catch (err) {
    console.error("POST /api/services error:", err);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}
