import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { eq, and, ilike } from "drizzle-orm"
import { whitelisted_users, users, accounts, sessions, verificationTokens, members } from "@/db/schema"
export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.SESSION_SECRET || "build_fallback_secret_do_not_use_in_prod",
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      id: "otp",
      name: "Member OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
        memberId: { label: "Member ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) {
          throw new Error("Email and OTP verification code are required.")
        }

        const email = (credentials.email as string).trim().toLowerCase()
        const code = (credentials.code as string).trim()
        const rawMemberId = typeof credentials?.memberId === "string" ? credentials.memberId.trim() : null
        const validMemberId = (rawMemberId && rawMemberId !== "undefined" && rawMemberId !== "null" && rawMemberId.length > 0) ? rawMemberId : null

        // 1. Verify token in verificationTokens table
        const tokenRecords = await db
          .select()
          .from(verificationTokens)
          .where(
            and(
              eq(verificationTokens.identifier, email),
              eq(verificationTokens.token, code)
            )
          )
          .limit(1)

        if (!tokenRecords || tokenRecords.length === 0) {
          throw new Error("Invalid verification code. Please check the code and try again.")
        }

        const tokenRecord = tokenRecords[0]
        if (new Date(tokenRecord.expires) < new Date()) {
          await db
            .delete(verificationTokens)
            .where(
              and(
                eq(verificationTokens.identifier, email),
                eq(verificationTokens.token, code)
              )
            )
          throw new Error("Verification code has expired. Please request a new code.")
        }

        await db
          .delete(verificationTokens)
          .where(
            and(
              eq(verificationTokens.identifier, email),
              eq(verificationTokens.token, code)
            )
          )

        // 2. Find matching member record
        let member
        if (validMemberId) {
          member = await db.query.members.findFirst({
            where: and(eq(members.id, validMemberId), ilike(members.email, email)),
          })
        }

        if (!member) {
          member = await db.query.members.findFirst({
            where: ilike(members.email, email),
          })
        }

        if (!member) {
          throw new Error("No active member profile found associated with this email.")
        }

        // Record last login timestamp safely
        try {
          await db.update(members).set({ last_login_at: new Date() }).where(eq(members.id, member.id))
        } catch (err) {
          console.error("[auth] Non-fatal error updating member last_login_at:", err)
        }

        return {
          id: member.id,
          name: `${member.first_name} ${member.last_name}`,
          email: member.email || email,
          role: "member",
          memberId: member.id,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email
        if (!email) return false
        const cleanEmail = email.trim().toLowerCase()

        // 1. Check if user is in whitelisted_users (Admin / Staff access)
        const whitelistedUser = await db.query.whitelisted_users.findFirst({
          where: ilike(whitelisted_users.email, cleanEmail),
        })

        if (whitelistedUser) {
          try {
            await db.update(whitelisted_users).set({ last_login_at: new Date() }).where(eq(whitelisted_users.id, whitelistedUser.id))
          } catch (err) {
            console.error("[auth] Non-fatal error updating whitelisted_user last_login_at:", err)
          }
          return true
        }

        // 2. Check if user is in members table (Member self-service portal)
        const memberRecord = await db.query.members.findFirst({
          where: ilike(members.email, cleanEmail),
        })

        if (memberRecord) {
          try {
            await db.update(members).set({ last_login_at: new Date() }).where(eq(members.id, memberRecord.id))
          } catch (err) {
            console.error("[auth] Non-fatal error updating member last_login_at:", err)
          }
          return true
        }

        // 3. Unregistered account -> Deny sign in
        return `/login?error=${encodeURIComponent(
          `Your Google account (${email}) is not registered in our church member directory or authorized staff list.`
        )}`
      }
      return true
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id
      }

      // Explicit memberId passed from credentials authorize
      if (user?.memberId) {
        token.memberId = user.memberId
        token.role = "member"
      }

      // Automatically resolve role and memberId from token.email if not set
      if (token.email) {
        const cleanEmail = token.email.trim().toLowerCase()

        const whitelistedUser = await db.query.whitelisted_users.findFirst({
          where: ilike(whitelisted_users.email, cleanEmail),
        })

        if (whitelistedUser) {
          token.role = "admin"
        } else {
          const memberRecord = await db.query.members.findFirst({
            where: ilike(members.email, cleanEmail),
          })

          if (memberRecord) {
            token.role = "member"
            token.memberId = memberRecord.id
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub
      }
      if (token?.role) {
        session.user.role = token.role as "admin" | "member"
      }
      if (token?.memberId) {
        session.user.memberId = token.memberId as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
