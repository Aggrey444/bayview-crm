import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Registration is disabled. Please contact an administrator." },
    { status: 403 }
  );
}
