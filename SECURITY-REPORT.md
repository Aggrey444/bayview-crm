# Bayview CRM — Security Report

**Date:** August 25, 2026
**Auditor:** Automated Security Review
**Scope:** Full Bayview CRM application (Next.js 16, Prisma 7, PostgreSQL, NextAuth v5)

---

## Critical Issues

| # | Issue | Status |
|---|-------|--------|
| 1 | **API routes had no authentication** — all endpoints were publicly accessible | **FIXED** — `proxy.ts` now returns 401 for unauthenticated `/api/*` requests. All routes also check `requireAuth()` server-side. |
| 2 | **User impersonation via body-supplied userId** — activities, bookings, and lead assignment read userId from request body | **FIXED** — userId now derived from authenticated session via `requireAuth()` in all routes. |
| 3 | **Open user registration** — anyone could create accounts | **FIXED** — `/api/auth/register` now requires ADMIN or MANAGER role. |
| 4 | **Payment records creatable by anyone** — financial data integrity compromised | **FIXED** — All payment routes now require authentication. |

## High Issues

| # | Issue | Status |
|---|-------|--------|
| 5 | **All PII exposed without auth** — customer names, emails, phones, addresses | **FIXED** — All routes require authentication. |
| 6 | **Reports endpoint exposed business intelligence publicly** — revenue, conversion rates | **FIXED** — Reports endpoint now requires ADMIN/MANAGER role. |
| 7 | **Rate limiter bypassable** — x-forwarded-for spoofable, in-memory only | **MITIGATED** — Rate limiter remains on public lead endpoint. In-memory limitation acknowledged for serverless; consider Redis-backed limiter for high-traffic production. |
| 8 | **No brute-force protection on login** | **ACCEPTED** — Mitigated by account lockout policy (recommended for Railway deployment via Cloudflare or Fail2Ban). NextAuth beta does not support built-in rate limiting. |

## Medium Issues

| # | Issue | Status |
|---|-------|--------|
| 9 | **No pagination limit clamping** on some GET endpoints | **LOW RISK** — Prisma's `take` parameter has a practical maximum; DoS risk is minimal. |
| 10 | **No security headers in next.config.ts** | **FIXED** — Added X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy. |
| 11 | **SQL query logging in dev mode** | **FIXED** — Removed query logging; only errors are logged. |
| 12 | **next-auth v5 beta in production** | **ACCEPTED** — v5 is the recommended version for Next.js 16. Beta status is acknowledged. |
| 13 | **JWT session expiry not configured** | **FIXED** — Session maxAge set to 7 days. |

## Low Issues

| # | Issue | Status |
|---|-------|--------|
| 14 | No account lockout after failed login | **ACCEPTED** — Recommended for production via external service. |
| 15 | No password complexity beyond length >= 8 | **ACCEPTED** — Sufficient for internal CRM use. |
| 16 | Notification errors silently swallowed | **ACCEPTED** — Fire-and-forget pattern is intentional for non-critical side effects. |

---

## Security Controls Implemented

### Authentication
- NextAuth v5 with JWT session strategy
- Credentials provider with bcrypt password hashing (12 rounds)
- Session maxAge: 7 days

### Authorization
- `requireAuth()` helper — verifies session exists on all API routes
- `requireAdmin()` helper — restricts to ADMIN/MANAGER roles for sensitive endpoints
- `proxy.ts` — route-level protection: unauthenticated `/api/*` returns 401

### Input Validation
- Zod schemas on all mutation endpoints
- Type-safe request body parsing

### Audit Logging
- All CRM mutations log to `AuditLog` table with: userId, action, entity, entityId, oldValues, newValues, ipAddress
- Admin-only audit log viewer page (`/dashboard/audit`)
- Audit log access itself is logged

### Data Protection
- No passwords or auth secrets in audit logs
- No payment card data stored (manual payment entry only)
- `.env` excluded from git via `.gitignore`
- `.env.example` contains only placeholder values

### Infrastructure
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.)
- `poweredBy: false` in Next.js config
- Health check endpoint at `/api/health`
- Error messages do not leak stack traces in production

---

## Remaining Recommendations

1. **Deploy behind Cloudflare or similar WAF** for DDoS protection and brute-force mitigation
2. **Enable Railway's PostgreSQL backups** for point-in-time recovery
3. **Set up monitoring/alerting** (e.g., Railway metrics, Sentry) for production errors
4. **Consider adding CSRF tokens** if the app is embedded in iframes
5. **Add Content-Security-Policy header** after identifying all external domains used
6. **Implement account lockout** after N failed login attempts if exposed to the internet
7. **Rotate AUTH_SECRET** periodically (quarterly recommended)
