import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { PermissionKey } from "@/lib/permissions";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: {
    id: string;
    name: string;
    viewAllData: boolean;
  } | null;
  permissions: string[];
}

export async function requireAuth(): Promise<
  { user: AuthUser; error?: never } | { user?: never; error: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }
  return { user: session.user as AuthUser };
}

export async function requirePermission(permission: PermissionKey): Promise<
  { user: AuthUser; error?: never } | { user?: never; error: NextResponse }
> {
  const result = await requireAuth();
  if (result.error) return result;
  if (!result.user.permissions.includes(permission)) {
    return {
      error: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      ),
    };
  }
  return result;
}

export async function requireAdmin(): Promise<
  { user: AuthUser; error?: never } | { user?: never; error: NextResponse }
> {
  const result = await requireAuth();
  if (result.error) return result;
  if (result.user.role?.name !== "Admin") {
    return {
      error: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      ),
    };
  }
  return result;
}
