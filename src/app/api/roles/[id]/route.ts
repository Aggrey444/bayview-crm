import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { auditLog } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("roles.view");
  if (authResult.error) return authResult.error;

  const { id } = await params;

  const role = await db.role.findUnique({
    where: { id },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  return NextResponse.json(role);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission("roles.edit");
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const body = await request.json();
    const { name, description, permissionIds, viewAllData } = body;

    const existing = await db.role.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (existing.isSystem && name && name !== existing.name) {
      return NextResponse.json(
        { error: "Cannot rename system roles" },
        { status: 400 }
      );
    }

    if (name && name !== existing.name) {
      const nameTaken = await db.role.findUnique({ where: { name } });
      if (nameTaken) {
        return NextResponse.json(
          { error: "A role with this name already exists" },
          { status: 409 }
        );
      }
    }

    // Update role and replace permissions
    const role = await db.$transaction(async (tx) => {
      // Update basic fields
      const updated = await tx.role.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description: description || null }),
          ...(viewAllData !== undefined && { viewAllData }),
        },
      });

      // Replace permissions if provided
      if (permissionIds !== undefined) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permId: string) => ({
              roleId: id,
              permissionId: permId,
            })),
          });
        }
      }

      return tx.role.findUnique({
        where: { id },
        include: {
          permissions: { include: { permission: true } },
        },
      });
    });

    await auditLog({
      userId: authResult.user.id,
      action: "ROLE_UPDATED",
      entity: "Role",
      entityId: id,
      oldValues: { name: existing.name },
      newValues: { name: role?.name },
      request,
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error("PUT /api/roles/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission("roles.delete");
    if (authResult.error) return authResult.error;

    const { id } = await params;

    const existing = await db.role.findUnique({
      where: { id },
      select: { id: true, name: true, isSystem: true, _count: { select: { users: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (existing.isSystem) {
      return NextResponse.json(
        { error: "Cannot delete system roles" },
        { status: 400 }
      );
    }

    if (existing._count.users > 0) {
      return NextResponse.json(
        { error: "Cannot delete role with assigned users. Reassign them first." },
        { status: 400 }
      );
    }

    await db.role.delete({ where: { id } });

    await auditLog({
      userId: authResult.user.id,
      action: "ROLE_DELETED",
      entity: "Role",
      entityId: id,
      oldValues: { name: existing.name },
      request,
    });

    return NextResponse.json({ message: "Role deleted" });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Foreign key constraint")
    ) {
      return NextResponse.json(
        { error: "Cannot delete this role because it has associated records." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
