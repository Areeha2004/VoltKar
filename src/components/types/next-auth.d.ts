/* eslint-disable no-unused-vars */
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      provider?: string;
    };
  }

  interface User extends DefaultUser {
    id: string;
    password?: string | null;
    provider?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;          // 👈 renamed from uid ➜ id (matches token.id in jwt() callback)
    provider?: string;
  }
}
