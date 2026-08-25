import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";
import { z } from "zod";
import bcrypt from "bcryptjs";

const userSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  roleId: true,
  image: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: { id: true, name: true },
  },
};

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(200).optional().nullable(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("users.view");
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const roleId = searchParams.get("roleId") || "";
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (roleId) {
    where.roleId = roleId;
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: userSelect,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission("users.create");
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const validated = createUserSchema.parse(body);

    if (validated.roleId) {
      const roleExists = await db.role.findUnique({ where: { id: validated.roleId } });
      if (!roleExists) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
    }

    const existing = await db.user.findUnique({ where: { email: validated.email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(validated.password, 12);

    const user = await db.user.create({
      data: {
        name: validated.name || null,
        email: validated.email,
        passwordHash,
        roleId: validated.roleId || null,
      },
      select: userSelect,
    });

    await auditLog({
      userId: authResult.user.id,
      action: "USER_CREATED",
      entity: "User",
      entityId: user.id,
      newValues: { name: user.name, email: user.email, roleId: user.roleId },
      request,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
