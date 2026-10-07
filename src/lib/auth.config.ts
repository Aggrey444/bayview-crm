import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW = 15 * 60 * 1000;
const LOGIN_MAX = 10;
const LOCKOUT_MAX_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function checkLoginRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(identifier, { count: 1, resetAt: now + LOGIN_WINDOW });
    return true;
  }

  if (entry.count >= LOGIN_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

declare module "next-auth" {
  interface User {
    id: string;
    role?: {
      id: string;
      name: string;
      viewAllData: boolean;
    } | null;
    permissions?: string[];
  }
  interface Session {
    user: {
      id: string;
      role: {
        id: string;
        name: string;
        viewAllData: boolean;
      } | null;
      permissions: string[];
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roleId?: string;
    roleName?: string;
    viewAllData?: boolean;
    permissions?: string[];
    id?: string;
  }
}

export default {
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;

        if (!checkLoginRateLimit(email)) {
          console.warn(`Rate limit exceeded for: ${email}`);
          return null;
        }

        const { default: bcrypt } = await import("bcryptjs");
        const { db } = await import("@/lib/prisma");

        const user = await db.user.findUnique({
          where: { email },
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        // Persistent per-account lockout (survives restarts and works across instances)
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          console.warn(`Account locked for: ${email}`);
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          const nextAttempts = (user.failedLoginAttempts ?? 0) + 1;
          await db.user.update({
            where: { id: user.id },
            data:
              nextAttempts >= LOCKOUT_MAX_ATTEMPTS
                ? {
                    failedLoginAttempts: 0,
                    lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
                  }
                : { failedLoginAttempts: nextAttempts },
          });
          console.warn(`Failed login for: ${email} (${nextAttempts} attempts)`);
          return null;
        }

        // Successful login resets the lockout state
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await db.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        let permissions = user.role?.permissions.map(
          (rp) => rp.permission.key
        ) ?? [];

        // If newly created or role has no permissions, grant default operational permissions so user is never locked out
        if (permissions.length === 0) {
          permissions = [
            "leads.view", "leads.create", "leads.edit",
            "customers.view", "customers.create", "customers.edit",
            "bookings.view", "bookings.create", "bookings.edit",
            "payments.view", "payments.create", "payments.edit",
            "followUps.view", "followUps.create", "followUps.edit",
            "activities.view", "activities.create", "activities.edit",
            "tasks.view", "tasks.create", "tasks.edit",
            "messages.view", "messages.create",
            "settings.view",
          ];
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
            ? {
                id: user.role.id,
                name: user.role.name,
                viewAllData: true, // Always global
              }
            : {
                id: "staff-role",
                name: "Staff",
                viewAllData: true,
              },
          permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const role = user.role as
          | { id: string; name: string; viewAllData: boolean }
          | null
          | undefined;
        token.roleId = role?.id || "staff-role";
        token.roleName = role?.name || "Staff";
        token.viewAllData = true; // Always global across all team members
        token.permissions = (user.permissions && user.permissions.length > 0)
          ? user.permissions
          : [
              "leads.view", "leads.create", "leads.edit",
              "customers.view", "customers.create", "customers.edit",
              "bookings.view", "bookings.create", "bookings.edit",
              "payments.view", "payments.create", "payments.edit",
              "followUps.view", "followUps.create", "followUps.edit",
              "activities.view", "activities.create", "activities.edit",
              "tasks.view", "tasks.create", "tasks.edit",
              "messages.view", "messages.create",
              "settings.view",
            ];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = {
          id: (token.roleId as string) || "staff-role",
          name: (token.roleName as string) || "Staff",
          viewAllData: true, // Always global
        };
        session.user.permissions = (token.permissions as string[]) ?? [];
      }
      return session;
    },
    async authorized({ auth, request }) {
      return true;
    },
  },
} satisfies NextAuthConfig;
