import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { eq } from "drizzle-orm"
import { whitelisted_users, users, accounts, sessions, verificationTokens } from "@/db/schema"

const authSecret = process.env.AUTH_SECRET || process.env.SESSION_SECRET
if (!authSecret) {
  throw new Error("AUTH_SECRET is not set. Generate one with `openssl rand -base64 32`.")
}

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
if (!googleClientId || !googleClientSecret) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set.")
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;
        
        // Check if the user is whitelisted
        const whitelistedUser = await db.query.whitelisted_users.findFirst({
          where: eq(whitelisted_users.email, email),
        });

        if (!whitelistedUser) {
          // Returning false will redirect to the error page or we can throw an error
          return "/login?error=Your Google account is not authorized to access this system.";
        }
        
        return true;
      }
      return true;
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },
})
