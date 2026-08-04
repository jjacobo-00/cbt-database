# CBT Church Member Directory

A modern, fast, and secure church member management portal built with Next.js 16 App Router, Neon Serverless Postgres, and Drizzle ORM.

## Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
- **Database**: [Neon Serverless Postgres](https://neon.tech/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [NextAuth.js v5 (Beta)](https://authjs.dev/) with Google OAuth & Email OTP
- **Styling**: Tailwind CSS + Radix UI Primitives (shadcn/ui design tokens)
- **Email**: Dual-provider system via Resend API (Primary) and Gmail SMTP (Fallback)

## Features

- 👥 **Member Directory**: Advanced table filtering, demographic tags, search, and CSV export.
- 📋 **8-Step Member Onboarding**: Complete wizard for personal, spiritual, family, and education info.
- 📊 **Analytics & Reports**: Interactive charts for age, gender, marital status, and ministry participation.
- 🤝 **Commitment Tracking**: Manage annual pledge commitments and recommitment tracking.
- 🛡️ **Role-Based Access**: Role separation between Admins (full access) and Members (self-service profile).
- 🔗 **Self-Service Invites**: Tokenized single-use links for members to update their own profiles securely.

## Getting Started Locally

### 1. Clone the repository

```bash
git clone <repository-url>
cd cbt-database
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the required variables (see `.env.example` for details on obtaining each key).

### 4. Database Setup & Migrations

Push the schema directly to your Neon Postgres instance using Drizzle Kit:

```bash
npx drizzle-kit push
```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                  # Next.js App Router pages & server actions
│   ├── (auth)/           # Authentication pages (login)
│   ├── (dashboard)/      # Protected dashboard routes & sub-features
│   ├── actions/          # Global server actions
│   ├── api/              # API route handlers
│   └── invite/           # Self-service token registration routes
├── components/           # UI components (dashboard, members, UI primitives)
├── db/                   # Database instance and Drizzle schema definition
├── lib/                  # Utilities, constants, session management, email service
├── middleware.ts         # Global NextAuth route protection middleware
├── proxy.ts              # Authentication proxy definition
└── types/                # TypeScript type augmentations
```

## Migration Workflow

Always modify database schema in `db/schema.ts` and apply updates via Drizzle Kit:

```bash
# Generate migration SQL
npx drizzle-kit generate

# Apply schema directly to remote Postgres
npx drizzle-kit push
```

## License

Private repository — For church administrative use only.
