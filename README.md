# A11ai — AI-Assisted Accessibility Audit & Remediation Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.0-lightgrey.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![WCAG](https://img.shields.io/badge/WCAG-2.1%20A%2FAA-purple.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)

**A11ai** is a full-stack, enterprise-ready web accessibility platform built for automated WCAG 2.1 A/AA auditing, real-time single-page scanning, multi-page site crawling, and automated code remediation snippet generation.

---

## ✨ Features

- 🔍 **High-Precision WCAG 2.1 Engine**: Scans HTML for 20+ accessibility rule violations (ARIA roles, missing image alt text, label associations, iframe titles, duplicate IDs, table headers, touch target sizes, focus rings, autocomplete attributes).
- 💡 **Automated Code Fixes (`remediation`)**: Every detected violation generates ready-to-copy HTML code snippets illustrating the exact recommended fix.
- 🛡️ **SSRF Security Protection**: Built-in URL validation engine preventing Server-Side Request Forgery against loopback addresses, private subnets (`10.x`, `192.168.x`), and cloud metadata APIs.
- 🕷️ **Site Auditor & Crawler**: Multi-page domain crawling with live Server-Sent Events (SSE) progress streaming.
- 🎨 **Vision & Contrast Studio**: Interactive visual simulator for testing custom contrast filters, font scaling, dyslexia font overrides, and color blindness modes (Deuteranopia, Protanopia, Tritanopia).
- 📜 **OpenAPI 3.1 & Type Safety**: End-to-end type safety powered by OpenAPI 3.1 (`lib/api-spec/openapi.yaml`) and Orval React Query code generation.

---

## 🚀 Quick Start Guide

### Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/)
- PostgreSQL database instance

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/A11ai.git
cd A11ai
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and set your credentials:

```bash
cp .env.example .env
```

### 3. Run Development Servers

Start the Express API server (Port `5000`):
```bash
pnpm --filter @workspace/api-server run dev
```

Start the React Vite frontend application:
```bash
pnpm --filter @workspace/a11ai run dev
```

### 4. Run Unit Tests

Execute the native backend security and scanner unit tests:
```bash
node --experimental-strip-types --test artifacts/api-server/src/lib/url-validator.test.ts artifacts/api-server/src/lib/wcag-scanner.test.ts
```

---

## 📁 Repository Structure

```
.
├── artifacts/
│   ├── a11ai/                # React Vite Frontend Application
│   └── api-server/           # Express API Server & WCAG Scanner Engine
├── lib/
│   ├── api-spec/             # OpenAPI 3.1 Spec & Orval Codegen Configuration
│   ├── api-zod/              # Generated Zod Validation Schemas
│   ├── api-client-react/     # Generated React Query Hooks
│   └── db/                   # Drizzle ORM Database Schemas & Client
├── replit.md                 # Architecture & Operations Guide
└── package.json              # Workspace root configuration
```

---

## 🔐 Security & License

- **Security**: For vulnerability reporting, see `url-validator.ts` security boundaries.
- **License**: MIT License.
