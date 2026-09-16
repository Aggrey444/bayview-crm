import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Dynamic import to avoid crashing at build time if DATABASE_URL is missing
    const { db } = await import("@/lib/prisma");
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "degraded",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
