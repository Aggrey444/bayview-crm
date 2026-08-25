# Bayview CRM

A production-ready CRM application for Bayview Village Ltd (hospitality/hotel management) built with Next.js 16, TypeScript, PostgreSQL, Prisma 7, Tailwind CSS, shadcn/ui, and NextAuth v5.

## Features

- **Dashboard** — Key metrics, recent leads, bookings, payments, follow-ups, lead source summary
- **Customer Management** — CRUD, search, activity history, linked bookings
- **Lead Management** — Pipeline view, status workflow, assignment, UTM tracking
- **Follow-ups & Activities** — Timeline, activity logging, follow-up scheduling with overdue tracking
- **Booking Management** — CRUD, status workflow, date filtering
- **Payment Management** — CRUD, status tracking, linked to bookings
- **Public Lead Capture** — Public form with honeypot spam protection, rate limiting, UTM extraction
- **Notifications** — Real-time bell with unread count, event-triggered notifications
- **Reports** — 9 report types with date range filtering (leads by source/campaign/service/staff, conversion rate, bookings, payments, revenue, follow-up performance)
- **Audit Logging** — Full audit trail of all CRM mutations, admin-only viewer
- **Role-Based Access** — ADMIN, MANAGER, STAFF roles

## Tech Stack

- **Framework:** Next.js 16.3.2 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** PostgreSQL via Prisma 7.9.1
- **Auth:** NextAuth v5 (JWT strategy, Credentials provider)
- **UI:** Tailwind CSS 4 + shadcn/ui (base-nova style)
- **Validation:** Zod 4
- **Password Hashing:** bcryptjs (12 rounds)

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Railway account (for deployment)

## Local Development

### 1. Clone and install

```bash
git clone <repo-url>
cd bayview-hotel
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env` with your local PostgreSQL connection string:

```
DATABASE_URL="postgresql://user:password@localhost:5432/bayview_crm?schema=public"
AUTH_SECRET="<generate-a-random-secret>"
NEXTAUTH_URL="http://localhost:3000"
```

Generate an AUTH_SECRET:

```bash
npx auth secret
# or
openssl rand -base64 32
```

### 3. Set up database

```bash
npx prisma db push
npx prisma db seed
```

### 4. Run development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Default Login

After seeding, register an admin user:

1. Navigate to `/auth/register` (requires admin approval — see below)
2. Or use `npx prisma db seed` which creates default lookup data

To create an admin user manually via Prisma Studio:

```bash
npx prisma studio
```

Create a User record with role `ADMIN` and a bcrypt-hashed password.

## Deployment to Railway

### 1. Create Railway project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init
```

### 2. Add PostgreSQL

```bash
railway add --plugin postgresql
```

This automatically sets the `DATABASE_URL` environment variable.

### 3. Set environment variables

In the Railway dashboard or via CLI:

```bash
railway variables set AUTH_SECRET="<your-generated-secret>"
railway variables set NEXTAUTH_URL="https://<your-app-name>.railway.app"
```

**Never commit `.env` files with real credentials.**

### 4. Deploy

```bash
railway up
```

Or connect your GitHub repo for automatic deployments.

### 5. Run migrations and seed

After first deploy, run in Railway's shell or via CLI:

```bash
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

### 6. Health check

The app exposes a health endpoint at `/api/health` for Railway's healthcheck configuration.

Set the healthcheck path in Railway service settings:
```
/api/health
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database (dev) |
| `npm run db:migrate` | Create migration (dev) |
| `npm run db:deploy` | Deploy migrations (production) |
| `npm run db:seed` | Seed lookup data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:generate` | Regenerate Prisma Client |

## Project Structure

```
src/
  app/
    api/           # API routes (authenticated)
      audit/       # Audit log viewer (admin-only)
      auth/        # NextAuth + registration
      bookings/    # Booking CRUD
      customers/   # Customer CRUD
      follow-ups/  # Follow-up CRUD
      health/      # Health check endpoint
      leads/       # Lead CRUD + status + assignment
      notifications/ # Notification CRUD
      payments/    # Payment CRUD
      public/      # Public endpoints (no auth)
      reports/     # Reporting endpoints (admin-only)
    auth/          # Login/register pages
    dashboard/     # Dashboard pages
    lead-capture/  # Public lead capture form
  components/      # React components
  lib/             # Shared utilities
    audit.ts       # Audit logging
    auth.ts        # NextAuth configuration
    auth.config.ts # Edge auth config
    auth-helpers.ts # requireAuth/requireAdmin
    notifications.ts # Notification helpers
    prisma.ts      # Prisma client singleton
    queries/       # Database query functions
    validations/   # Zod schemas
  proxy.ts         # Route protection middleware
prisma/
  schema.prisma    # Database schema
  seed.ts          # Seed script
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth JWT secret (min 32 chars) |
| `NEXTAUTH_URL` | Yes | Application URL (http://localhost:3000 for dev) |

## License

Private — Bayview Village Ltd.
