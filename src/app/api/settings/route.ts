import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireAuth, requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const DEFAULTS: Record<string, unknown> = {
  timezone: "GMT+0 (Ghana)",
  currency: "GHS",
  autoBackups: true,
  maintenanceMode: false,
  emailAlerts: true,
  smsAlerts: true,
  followUpReminders: true,
  bookingAlerts: true,
  twoFactor: false,
  sessionTimeout: "30",
};

const settingsSchema = z.object({
  timezone: z.string().optional(),
  currency: z.string().optional(),
  autoBackups: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  emailAlerts: z.boolean().optional(),
  smsAlerts: z.boolean().optional(),
  followUpReminders: z.boolean().optional(),
  bookingAlerts: z.boolean().optional(),
  twoFactor: z.boolean().optional(),
  sessionTimeout: z.string().optional(),
});

export async function GET() {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    const rows = await db.systemSetting.findMany();

    const settings: Record<string, unknown> = { ...DEFAULTS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requirePermission("settings.edit");
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const validated = settingsSchema.parse(body);

    const updates: { key: string; value: unknown }[] = [];
    for (const [key, value] of Object.entries(validated)) {
      if (value !== undefined) {
        updates.push({ key, value });
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No settings to update" }, { status: 400 });
    }

    await db.$transaction(
      updates.map((u) =>
        db.systemSetting.upsert({
          where: { key: u.key },
          update: { value: u.value as Prisma.InputJsonValue },
          create: { key: u.key, value: u.value as Prisma.InputJsonValue },
        })
      )
    );

    await auditLog({
      userId: authResult.user.id,
      action: "SETTINGS_UPDATED",
      entity: "SystemSetting",
      newValues: Object.fromEntries(updates.map((u) => [u.key, u.value])),
      request,
    });

    const rows = await db.systemSetting.findMany();
    const settings: Record<string, unknown> = { ...DEFAULTS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
