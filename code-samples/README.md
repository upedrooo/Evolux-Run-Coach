# Code Samples

**Real, lean, annotated excerpts** from Evolux. This is not the full application: constants and business rules are simplified to spotlight the core logic and engineering patterns. Every sample includes tests that run with zero external accounts or services.

| File | Language | Concept | Test |
|---|---|---|---|
| [`typescript/pace-zones.ts`](typescript/pace-zones.ts) | TypeScript | Scientific model (VDOT), inverted quadratic equation, pace zones | [`pace-zones.test.ts`](typescript/__tests__/pace-zones.test.ts) |
| [`typescript/training-skeleton.ts`](typescript/training-skeleton.ts) | TypeScript | Periodization: progressive overload, cutbacks, tapering; linear interpolation | [`training-skeleton.test.ts`](typescript/__tests__/training-skeleton.test.ts) |
| [`typescript/llm-output-guards.ts`](typescript/llm-output-guards.ts) | TypeScript | Never trusting AI output: rule validation and normalization | [`llm-output-guards.test.ts`](typescript/__tests__/llm-output-guards.test.ts) |
| [`typescript/llm-fallback.ts`](typescript/llm-fallback.ts) | TypeScript | Resilience: per-model timeouts, `AbortSignal.any`, typed errors | [`llm-fallback.test.ts`](typescript/__tests__/llm-fallback.test.ts) |
| [`typescript/gpx-parser.ts`](typescript/gpx-parser.ts) | TypeScript | XML parsing, Haversine distance, GPS noise filtering, privacy | [`gpx-parser.test.ts`](typescript/__tests__/gpx-parser.test.ts) |
| [`typescript/remember-me-cookies.ts`](typescript/remember-me-cookies.ts) | TypeScript | Persistent vs. session cookies controlled server-side | [`remember-me-cookies.test.ts`](typescript/__tests__/remember-me-cookies.test.ts) |
| [`typescript/plan-api-flow.ts`](typescript/plan-api-flow.ts) | TypeScript | Dependency-injected orchestration, atomic quota, and `finally` refund | [`plan-api-flow.test.ts`](typescript/__tests__/plan-api-flow.test.ts) |
| [`sql/quota-and-rls.sql`](sql/quota-and-rls.sql) | SQL (PostgreSQL) | RLS, atomic updates, `SECURITY DEFINER`, role privileges, triggers | [`quota-and-rls.test.ts`](sql/quota-and-rls.test.ts) (PGlite) |
| [`react/AttachedFiles.tsx`](react/AttachedFiles.tsx) | TSX (React) | Accessible attached-files list with empty and populated states | typechecked |
| [`css/design-tokens.css`](css/design-tokens.css) | CSS (Tailwind v4) | Semantic tokens, measured contrast, reduced motion, print styles | n/a |

## Running

From the repository root:

```bash
npm install
npm test            # 40 tests, including SQL against embedded PostgreSQL
npm run typecheck   # tsc --noEmit across all samples
```

## Where to Start

1. [`llm-output-guards.ts`](typescript/llm-output-guards.ts): treating an LLM as an untrusted component.
2. [`quota-and-rls.sql`](sql/quota-and-rls.sql): database security and concurrency control.
3. [`plan-api-flow.ts`](typescript/plan-api-flow.ts) and its tests: testable API orchestration.
