# Technical Decisions

Short record of the main engineering decisions in **context → decision → consequences** format.

## 1. Science in Code, Text in AI
- **Context:** an LLM on its own can generate unsafe mileage or incoherent paces, and subtle errors are hard to catch.
- **Decision:** code calculates volume, progression, pace zones, and dates; the LLM only writes the sessions inside those boundaries.
- **Consequences:** predictable, testable plans and smaller prompts (fitting on free-tier models). Trade-off: more domain code to maintain and less creative freedom for the model.

## 2. Parse Workout Files in the Browser
- **Context:** GPX files include full GPS routes that expose where a runner lives; serverless platforms also cap request payload sizes.
- **Decision:** run parsers client-side and send only date, distance, duration, and heart rate to the server.
- **Consequences:** privacy by design (LGPD), tiny payloads, and lower server cost. Trade-off: shipping parser libraries to the browser (loaded on demand).

## 3. Database-Enforced Quota with Server-Only Writes
- **Context:** a limit enforced on the front-end or checked in two steps (read then write) can be bypassed, including via concurrent requests.
- **Decision:** SQL function with an atomic conditional `UPDATE`; execute permissions restricted to `service_role`; read-only RLS for authenticated users.
- **Consequences:** the quota holds under concurrency and even if someone hits the database API directly. Slots must be refunded on any failure (handled in `finally`).

## 4. Passwordless Login with Server-Controlled Sessions
- **Context:** reduce friction and attack surface (no passwords) while keeping a "keep me signed in" toggle.
- **Decision:** 6-digit email OTP and Google sign-in; verification runs in API routes, and a central filter decides whether session cookies are persistent or session-scoped.
- **Consequences:** consistent behavior everywhere cookies are written (login, OAuth callback, and token refresh).

## 5. Provider-Agnostic LLM Client with Fallback and Per-Model Timeouts
- **Context:** free-tier LLM APIs alternate between fast responses and "high demand" errors that can take ~40 s to return.
- **Decision:** environment-configurable model list; each model (except the last) has its own deadline; providers can be swapped without changing callers.
- **Consequences:** higher availability at zero cost. Documented in [`llm-fallback.ts`](../code-samples/typescript/llm-fallback.ts).

## 6. Fail Without Charging
- **Context:** plan generation can fail for reasons outside the user's control (overloaded AI, database hiccup, validation error).
- **Decision:** reserve the quota slot before calling the AI (preventing parallel abuse) and refund it on **any** failure.
- **Consequences:** users never lose a plan credit to a system error.

## 7. Design Tokens with Measured Contrast
- **Context:** borders in the first version were barely visible against the background (~1.3:1).
- **Decision:** two border tiers—cards (~1.9:1) and interactive controls (~3.4:1)—meeting WCAG's non-text contrast guideline.
- **Consequences:** visual identity tweaks happen in one central place.

## 8. Single-Screen Landing Page
- **Context:** the landing page needed to fit completely inside the viewport with zero scrolling despite many visual elements.
- **Decision:** compose on a fixed coordinate space scaled with *container query units* (`cqw`), paired with a dedicated mobile layout and viewport-height clamping.
- **Consequences:** proportions hold at every width; verified on 1440×900, 390×844, 360×740, 375×667, and tablet viewports.

## 9. Direct CLI Deployments Without Git Integration
- **Context:** keep the project isolated from other accounts and repositories.
- **Decision:** publish using the Vercel CLI with credentials stored in a dedicated config directory.
- **Consequences:** no automatic deploy on push; every production release is an explicit command.
