# A11ai — AI-Assisted Accessibility Audit & Remediation Platform

A11ai is a full-stack web application designed for scanning, auditing, and remediating web accessibility (WCAG 2.1 A/AA) violations across single pages and multi-page domain crawls.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the Express API server (port 5000)
- `pnpm --filter @workspace/a11ai run dev` — run the React Vite frontend app
- `node --experimental-strip-types --test artifacts/api-server/src/lib/url-validator.test.ts artifacts/api-server/src/lib/wcag-scanner.test.ts` — run native backend unit tests
- `pnpm run typecheck` — full TypeScript check across all packages
- `pnpm run build` — build all packages for deployment
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from `lib/api-spec/openapi.yaml`
- `pnpm --filter @workspace/db run push` — push Drizzle ORM database schema changes (dev mode)

### Required Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/a11ai`)
- `SESSION_SECRET` — Secret string for signing authentication JWT cookies (**Mandatory** in production)
- `PORT` — API server port (defaults to `5000`)
- `NODE_ENV` — `development` or `production`

## Stack

- **Monorepo**: pnpm workspaces, Node.js 22+, TypeScript 5.9
- **Frontend**: React 18, Vite, Wouter routing, TailwindCSS, Lucide icons
- **API Server**: Express 5, Pino logging, JWT cookie session auth, bcrypt password hashing
- **Database**: PostgreSQL, Drizzle ORM, `drizzle-zod`
- **Scanner Engine**: Cheerio DOM parser, custom WCAG 2.1 A/AA rule evaluator with automated remediation snippet generation
- **Security**: SSRF protection validator (`url-validator.ts`), CORS, cookie security
- **API Spec & Codegen**: OpenAPI 3.1 (`lib/api-spec/openapi.yaml`), Orval client generator

## Where Things Live

- `artifacts/a11ai/` — Main React frontend application (Dashboard, Studio, Reports, Audit, Preferences)
- `artifacts/api-server/` — Express API backend server (Auth, Scans, Audits, Proxy, API Keys)
- `lib/api-spec/` — Source-of-truth OpenAPI 3.1 specification (`openapi.yaml`) and Orval config
- `lib/db/` — Database schemas (`users.ts`, `scans.ts`, `audits.ts`, `api-keys.ts`, `preferences.ts`) and Drizzle client

## Architecture Decisions

1. **SSRF Guarding**: All outbound URL fetches (proxy, single scans, site crawler) must be validated via `validateScanUrl` before making network requests to block loopback, private IP ranges (`10.x`, `192.168.x`), and cloud metadata APIs (`169.254.169.254`).
2. **Automated Code Remediation**: The WCAG scanner engine generates concrete HTML fix examples (`remediation`) and element snippets (`elementSnippet`) alongside every detected issue so developers can instantly apply code fixes.
3. **Fail-Fast Production Safeguards**: The server refuses to boot in `production` mode if `SESSION_SECRET` is unset or uses the default development placeholder key.

## Product Capabilities

- **Single Page Scanner**: Instant WCAG 2.1 score calculation and breakdown of critical, high, medium, and low severity issues.
- **Site Auditor**: Multi-page website crawling with Server-Sent Events (SSE) live progress updates.
- **Vision & Contrast Studio**: Interactive proxy simulator testing custom contrast filters, font scaling, dyslexia font overrides, and color blindness modes (deuteranopia, protanopia, tritanopia).
- **Developer API Keys**: SHA-256 hashed API key management for programmatic scanning.

## Unit Testing

- Run native backend unit tests using Node 22+:
  ```bash
  node --experimental-strip-types --test artifacts/api-server/src/lib/url-validator.test.ts artifacts/api-server/src/lib/wcag-scanner.test.ts
  ```
