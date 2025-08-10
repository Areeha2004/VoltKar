/* eslint-disable no-unused-vars */
import NextAuth, { NextAuthOptions }  from "next-auth";
import CredentialsProvider            from "next-auth/providers/credentials";
import GoogleProvider                 from "next-auth/providers/google";
import FacebookProvider               from "next-auth/providers/facebook";
import { PrismaAdapter }              from "@next-auth/prisma-adapter";
import prisma                         from "@/lib/prisma";
import bcrypt                         from "bcrypt";

/* ------------------------------------------------------------------ */
/*  MAIN CONFIG                                                        */
/* ------------------------------------------------------------------ */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
    maxAge:   60 * 60 * 24, // 1 day
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  providers: [
    /* ────────────────────────────────────────────────────────────────
       1️⃣ CREDENTIALS
    ──────────────────────────────────────────────────────────────────*/
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "text"     },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!valid) return null;

        return {
          id:       user.id,
          name:     user.name ?? null,
          email:    user.email ?? null,
          image:    user.image ?? null,
         
        };
      },
    }),

    /* ────────────────────────────────────────────────────────────────
       2️⃣ GOOGLE OAUTH
    ──────────────────────────────────────────────────────────────────*/
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id:       profile.sub,
          name:     profile.name,
          email:    profile.email,
          image:    profile.picture,
          
        };
      },
      authorization: {
        params: {
          scope:         "openid email profile",
          prompt:        "consent",
          access_type:   "offline",
          response_type: "code",
        },
      },
    }),

    /* ────────────────────────────────────────────────────────────────
       3️⃣ FACEBOOK OAUTH
    ──────────────────────────────────────────────────────────────────*/
    FacebookProvider({
      clientId:     process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],

  /* -----------------------------------------------------------------
     CALLBACKS
  ------------------------------------------------------------------ */
  callbacks: {
    /* ────────────────────────────────────────────────────────────────
       A. signIn — safest-possible linking logic
    ──────────────────────────────────────────────────────────────────*/
    async signIn({ user, account }) {
      /* 👉 extra null-guard so TypeScript never sees undefined */
      if (!account || account.provider === "credentials") return true;

      /* A-1: exact (provider, providerAccountId) match? */
      const linked = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider:          account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        select: { userId: true },
      });

      if (linked) {
        user.id = linked.userId; // legit re-login
        return true;
      }

      /* A-2: fallback to email if that email exists */
      if (user.email) {
        const byEmail = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true },
        });

        if (byEmail) {
          await prisma.account.create({
            data: {
              userId:            byEmail.id,
              provider:          account.provider,
              providerAccountId: account.providerAccountId,
              type:              account.type,
            },
          });
          user.id = byEmail.id;
        }
      }

      /* If no match, PrismaAdapter will create new User + Account */
      return true;
    },

    /* ────────────────────────────────────────────────────────────────
       B. jwt — persist user + provider info
    ──────────────────────────────────────────────────────────────────*/
    async jwt({ token, user, account }) {
      if (user) {
        token.id      = user.id;
        token.picture = user.image ?? null;
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },

    /* ────────────────────────────────────────────────────────────────
       C. session — expose to client
    ──────────────────────────────────────────────────────────────────*/
    async session({ session, token }) {
      if (session.user) {
        session.user.id       = token.id as string;
        session.user.image    = token.picture as string;
        session.user.provider = token.provider as string;
      }
      return session;
    },

    /* ────────────────────────────────────────────────────────────────
       D. redirect — only same-origin
    ──────────────────────────────────────────────────────────────────*/
     async redirect({ url, baseUrl }) {
    if (url.includes("/dashboard")) return "/dashboard";
    return url.startsWith(baseUrl) ? url : baseUrl;
  },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug:  process.env.NODE_ENV === "development",
};

/* ------------------------------------------------------------------ */
/*  EXPORT HANDLER                                                    */
/* ------------------------------------------------------------------ */
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
