import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
});
