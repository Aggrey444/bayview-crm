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

const updateUserSchema = z.object({
  name: z.string().min(1).max(200).optional().nullable(),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  roleId: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission("users.view");
  if (authResult.error) return authResult.error;

  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      ...userSelect,
      _count: {
        select: { assignedLeads: true, activities: true, bookings: true, assignedBookings: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateUserSchema.parse(body);
    const { name, email, password, roleId } = validated;

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const roleChanging = roleId && roleId !== existing.roleId;

    const authResult = await requirePermission("users.edit");
    if (authResult.error) return authResult.error;

    if (email && email !== existing.email) {
      const emailTaken = await db.user.findUnique({ where: { email } });
      if (emailTaken) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }
    }

    if (roleId) {
      const roleExists = await db.role.findUnique({ where: { id: roleId } });
      if (!roleExists) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name || null;
    if (email) updateData.email = email;
    if (roleId) updateData.roleId = roleId;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });

    if (roleChanging) {
      await auditLog({
        userId: authResult.user.id,
        action: "USER_ROLE_CHANGED",
        entity: "User",
        entityId: id,
        oldValues: { roleId: existing.roleId },
        newValues: { roleId: user.roleId },
        request,
      });
    } else {
      await auditLog({
        userId: authResult.user.id,
        action: "USER_UPDATED",
        entity: "User",
        entityId: id,
        oldValues: { name: existing.name, email: existing.email },
        newValues: { name: user.name, email: user.email },
        request,
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Failed to update user:", error);
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
    const authResult = await requirePermission("users.delete");
    if (authResult.error) return authResult.error;

    const { id } = await params;

    const existing = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        _count: { select: { assignedLeads: true, assignedBookings: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (existing._count.assignedLeads > 0 || existing._count.assignedBookings > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete user with assigned leads or bookings. Reassign them first.",
        },
        { status: 400 }
      );
    }

    await db.user.delete({ where: { id } });

    await auditLog({
      userId: authResult.user.id,
      action: "USER_DELETED",
      entity: "User",
      entityId: id,
      oldValues: existing,
      request,
    });

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Foreign key constraint")
    ) {
      return NextResponse.json(
        { error: "Cannot delete this user because they have associated records." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
