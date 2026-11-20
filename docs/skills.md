# Skills Matrix

Each row points to concrete evidence in this repository.

## Front-end
| Skill | Evidence |
|---|---|
| React 19 & Next.js 16 (App Router, Server Components, Route Handlers, `proxy.ts`) | [Architecture](architecture.md), [Challenges #6](challenges.md) |
| Strict TypeScript, discriminated unions, and generics | [`plan-api-flow.ts`](../code-samples/typescript/plan-api-flow.ts), [`llm-output-guards.ts`](../code-samples/typescript/llm-output-guards.ts) |
| Component design & accessibility (labels, empty states, focus, `aria-*`) | [`AttachedFiles.tsx`](../code-samples/react/AttachedFiles.tsx) |
| Tailwind CSS v4 & design tokens | [`design-tokens.css`](../code-samples/css/design-tokens.css) |
| Advanced responsive layout (single-screen, container query units) | [Decisions #8](decisions.md) |
| Multi-step wizard with client and server validation | Screenshots 04, 05, and 06 in [README](../README.md) |
| Client-side file processing (XML, binary FIT, ZIP) | [`gpx-parser.ts`](../code-samples/typescript/gpx-parser.ts) |

## Back-end & APIs
| Skill | Evidence |
|---|---|
| REST API design with Zod validation, HTTP status codes, and clear errors | [`plan-api-flow.ts`](../code-samples/typescript/plan-api-flow.ts) |
| Passwordless authentication, sessions, and cookies | [`remember-me-cookies.ts`](../code-samples/typescript/remember-me-cookies.ts), [Security](security.md) |
| Dependency injection & testable architecture | [`plan-api-flow.test.ts`](../code-samples/typescript/__tests__/plan-api-flow.test.ts) |
| Resilience: timeouts, `AbortSignal`, fallback, and feedback-driven retries | [`llm-fallback.ts`](../code-samples/typescript/llm-fallback.ts) |

## Data & Databases
| Skill | Evidence |
|---|---|
| Relational modeling, `jsonb`, indexes, and triggers | [`quota-and-rls.sql`](../code-samples/sql/quota-and-rls.sql) |
| Row Level Security & role-based privileges | [`quota-and-rls.sql`](../code-samples/sql/quota-and-rls.sql), [Security](security.md) |
| Atomic operations & concurrency control | [`quota-and-rls.test.ts`](../code-samples/sql/quota-and-rls.test.ts) |
| Testing SQL against real embedded PostgreSQL | [Testing](testing.md) |

## Applied AI
| Skill | Evidence |
|---|---|
| Hybrid architecture (deterministic algorithms + LLM) & rule-constrained prompting | [AI vs. code](ai-and-scripts.md) |
| LLM output validation & self-repair | [`llm-output-guards.ts`](../code-samples/typescript/llm-output-guards.ts) |
| Multi-model / multi-provider integration & cost optimization | [`llm-fallback.ts`](../code-samples/typescript/llm-fallback.ts) |
| Prompt injection mitigation | [Security](security.md) |

## Algorithms & Domain Modeling
| Skill | Evidence |
|---|---|
| Implementing published scientific models (VDOT) and verifying against reference tables | [`pace-zones.ts`](../code-samples/typescript/pace-zones.ts) |
| Periodization modeling (progressive overload, cutback weeks, tapering) | [`training-skeleton.ts`](../code-samples/typescript/training-skeleton.ts) |
| Geospatial basics (Haversine, GPS noise filtering) | [`gpx-parser.ts`](../code-samples/typescript/gpx-parser.ts) |

## Quality & DevOps
| Skill | Evidence |
|---|---|
| Unit, property-based, integration, and database tests | [Testing](testing.md) |
| Automated visual QA | [Testing](testing.md) |
| Deployments, custom domain, DNS, environment variables, and secrets | [Architecture](architecture.md), [Decisions #9](decisions.md) |
| Build and environment troubleshooting | [Challenges #7 & #8](challenges.md) |

## Product, UX & Security
| Skill | Evidence |
|---|---|
| Lean UX flows, error/empty states, and clear messaging | [README](../README.md) (screenshots) |
| Privacy by design & LGPD compliance | [Security](security.md) |
| Documented trade-offs and architectural decisions | [Decisions](decisions.md) |
