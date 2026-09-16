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

        const permissions = user.role?.permissions.map(
          (rp) => rp.permission.key
        ) ?? [];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
            ? {
                id: user.role.id,
                name: user.role.name,
                viewAllData: user.role.viewAllData,
              }
            : null,
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
        if (role) {
          token.roleId = role.id;
          token.roleName = role.name;
          token.viewAllData = role.viewAllData;
        }
        token.permissions = user.permissions ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        if (token.roleId) {
          session.user.role = {
            id: token.roleId,
            name: token.roleName as string,
            viewAllData: token.viewAllData as boolean,
          };
        } else {
          session.user.role = null;
        }
        session.user.permissions = (token.permissions as string[]) ?? [];
      }
      return session;
    },
    async authorized({ auth, request }) {
      return true;
    },
  },
} satisfies NextAuthConfig;
