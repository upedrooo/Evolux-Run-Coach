# Architecture

## Overview

Evolux is a **Next.js (App Router)** application hosted on Vercel, backed by **Supabase** (PostgreSQL + Auth) and an **LLM** (Google Gemini) used strictly to write the training sessions. Everything else in the training engine is deterministic code.

```mermaid
flowchart TB
  subgraph Client["Browser"]
    UI["React UI"]
    PARSE["File parsers: GPX, TCX, FIT, CSV, ZIP"]
  end
  subgraph Vercel["Next.js on Vercel"]
    PROXY["proxy.ts: refreshes session & guards routes"]
    PAGES["Server Components: dashboard & plan view"]
    API["Route Handlers: /api/auth/*, /api/plan"]
    CORE["Training core: metrics, VDOT, volume, prompt, validation"]
  end
  subgraph Data["Supabase"]
    AUTH["Auth: email OTP & Google"]
    PG[("PostgreSQL + RLS + quota functions")]
  end
  MAIL["Transactional SMTP (Resend)"]
  LLM["Gemini API"]

  UI --> PARSE
  UI --> API
  UI --> PAGES
  PROXY --> AUTH
  API --> AUTH
  API --> CORE --> LLM
  API --> PG
  PAGES --> PG
  AUTH --> MAIL
```

## Plan Request Lifecycle

```mermaid
sequenceDiagram
  autonumber
  participant U as Browser
  participant A as POST /api/plan
  participant D as PostgreSQL
  participant L as LLM

  U->>A: form data + workout summary (JSON)
  A->>A: validate session & schema (zod)
  A->>A: compute metrics, VDOT, zones & weekly volume
  Note over A: errors up to this point do not consume quota
  A->>D: claim_plan_slot(user, limit)
  alt quota reached
    D-->>A: false
    A-->>U: 403 (AI is never called)
  else slot reserved
    D-->>A: true
    A->>L: prompt with precomputed skeleton
    L-->>A: sessions JSON
    A->>A: validate rules & normalize
    opt rejected
      A->>L: retry with exact error list
    end
    A->>D: save plan
    A-->>U: 200 with plan id
  end
  Note over A,D: any failure after reservation calls refund_plan_slot
```

## Data Model

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "1 profile per user (trigger)"
  AUTH_USERS ||--o{ PLANS : "owns"
  PROFILES {
    uuid id PK
    int plans_used "0..N, generated plan counter"
    timestamptz created_at
  }
  PLANS {
    uuid id PK
    uuid user_id FK
    text goal "e.g., Run 10 km in 55 min"
    jsonb plan "full training plan"
    timestamptz created_at
  }
```

- **Reads:** users can only read their own rows (RLS policies).
- **Writes:** server-only, using the service role key.
- **Quota:** `claim_plan_slot` and `refund_plan_slot` functions, executable only by `service_role`.

## Codebase Layers (Private Repository)

```
app/            pages (landing, login, dashboard, new plan, plan view) & API routes
components/     3-step wizard, login, logo, integration illustration
lib/parsing/    GPX, TCX, FIT, CSV, ZIP, and GZ parsers (runs in the browser)
lib/coach/      metrics, VDOT/paces, volume skeleton, prompt builder, validators
lib/llm/        LLM client with model fallback and timeouts
lib/supabase/   clients (server, admin, proxy) & session cookie policy
proxy.ts        session refresh & route protection (replaces middleware in Next 16)
supabase/       SQL migration: tables, RLS, triggers, and functions
tests/          unit tests, SQL tests, and mock server for manual testing
```

## Deployment

- **Hosting:** Vercel, deployed via CLI with environment variables split between public (`NEXT_PUBLIC_*`) and server-only secrets.
- **Domain:** custom domain with automatic HTTPS; `www` redirects to the apex domain.
- **Email:** sign-in codes sent over transactional SMTP from the verified domain.
- **Production hardening:** `Secure` cookies, security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`), `robots.txt`, and `sitemap.xml`. See [security.md](security.md) for details.
