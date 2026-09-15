import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const sources = await db.leadSource.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return NextResponse.json({ sources }, { headers: corsHeaders });
  } catch (error) {
    console.error("GET /api/public/sources error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500, headers: corsHeaders }
    );
  }
}
