import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  permissionIds: z.array(z.string()).optional(),
  viewAllData: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const authResult = await requirePermission("roles.view");
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const roles = await db.role.findMany({
    where,
    include: {
      _count: { select: { users: true, permissions: true } },
    },
    orderBy: { name: "asc" },
  });

  // Also fetch all permissions for the role form
  const allPermissions = await db.permission.findMany({
    orderBy: [{ module: "asc" }, { action: "asc" }],
  });

  return NextResponse.json({ roles, allPermissions });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission("roles.create");
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const validated = createRoleSchema.parse(body);
    const { name, description, permissionIds, viewAllData } = validated;

    const existing = await db.role.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "A role with this name already exists" },
        { status: 409 }
      );
    }

    const role = await db.role.create({
      data: {
        name,
        description: description || null,
        viewAllData: viewAllData || false,
        permissions: permissionIds?.length
          ? {
              create: permissionIds.map((id: string) => ({
                permissionId: id,
              })),
            }
          : undefined,
      },
      include: {
        permissions: { include: { permission: true } },
      },
    });

    await auditLog({
      userId: authResult.user.id,
      action: "ROLE_CREATED",
      entity: "Role",
      entityId: role.id,
      newValues: { name: role.name, description: role.description },
      request,
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Failed to create role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
