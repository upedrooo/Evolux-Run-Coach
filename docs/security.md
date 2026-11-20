# Security and Privacy

## Implemented Controls

| Area | Control |
|---|---|
| **Authentication** | Passwordless login (email OTP and Google) via Supabase Auth. Code verification runs on the server; session cookies use `SameSite=Lax` and `Secure` in production. |
| **Authorization** | Routes guarded in `proxy.ts` (optimistic check) **plus** session revalidation in every API route. True data access enforcement lives in PostgreSQL (RLS). |
| **Data isolation** | RLS on `profiles` and `plans`: each user can only read their own rows. Authenticated users have no direct write privileges. |
| **Usage quota** | `SECURITY DEFINER` SQL functions with a fixed `search_path`, executable only by `service_role`; atomic reservation. See [`quota-and-rls.sql`](../code-samples/sql/quota-and-rls.sql). |
| **Secrets** | Database service-role key and AI API key exist only on the server (never `NEXT_PUBLIC_`), marked sensitive in hosting config. `.env*` files excluded from Git and deploy uploads. |
| **Input validation** | Zod schemas on all routes with body-size caps, workout count limits, and plausible ranges (distance, pace, age, weight). |
| **Prompt injection** | User free-text is delimited as data with explicit instructions to ignore it as commands; AI output is checked by schema and business rules, so injected prompts cannot relax safety limits. |
| **Workout privacy** | Files are parsed in the browser; GPS coordinates are never transmitted or stored. |
| **HTTP headers** | `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`; HSTS provided by the platform. |
| **Indexing** | `robots.txt` blocks authenticated areas and API routes; sitemap lists public pages only. |
| **Error handling** | User-facing messages never leak provider internals; technical details stay in server logs. |

## Known Risks and Next Steps

- **Privacy policy (LGPD — Brazil's data protection law):** the form collects age, weight, sex, and optionally health notes (sensitive data). Explicit consent is collected in the flow, while a dedicated full privacy policy page is on the roadmap.
- **Free-tier AI provider:** some providers may use submitted prompts to improve products. Current mitigation: explicit user consent in the form and sending only compact summaries; next step is moving to a zero-retention provider tier.
- **Multi-account abuse:** quotas are currently per account; CAPTCHA and IP rate limiting are planned.
- **Key rotation:** formal schedule to periodically rotate service and AI API keys.
