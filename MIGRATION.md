# Database Migration Guide

This project uses **Drizzle ORM** with **Neon Serverless Postgres**.

## Standard Migration Workflow

### 1. Update Schema
Edit tables or relations directly in `db/schema.ts`.

### 2. Push Changes (Development)
To apply schema changes directly to your Neon database during local development:

```bash
npx drizzle-kit push
```

### 3. Generate SQL Migrations (Production/CI)
To generate versioned migration files under `drizzle/`:

```bash
npx drizzle-kit generate
```

## Troubleshooting & Schema Inconsistencies

If your database becomes out of sync with `db/schema.ts`, do NOT run manual SQL scripts in the console. Always prefer `npx drizzle-kit push` or generate a formal Drizzle migration file to maintain type safety and history.
