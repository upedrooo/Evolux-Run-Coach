# Mapa de competências

Cada linha aponta onde ver a evidência neste repositório.

## Front-end
| Competência | Evidência |
|---|---|
| React 19 e Next.js 16 (App Router, Server Components, Route Handlers, `proxy.ts`) | [Arquitetura](architecture.md), [Desafios #6](challenges.md) |
| TypeScript estrito, tipos discriminados e genéricos | [`plan-api-flow.ts`](../code-samples/typescript/plan-api-flow.ts), [`llm-output-guards.ts`](../code-samples/typescript/llm-output-guards.ts) |
| Componentização e acessibilidade (rótulos, estados vazios, foco, `aria-*`) | [`AttachedFiles.tsx`](../code-samples/react/AttachedFiles.tsx) |
| Tailwind CSS v4 e design tokens | [`design-tokens.css`](../code-samples/css/design-tokens.css) |
| Layout responsivo avançado (uma tela, container query units) | [Decisões #8](decisions.md) |
| Formulário em etapas com validação no cliente e no servidor | Telas 04, 05 e 06 no [README](../README.md) |
| Processamento de arquivos no navegador (XML, binário FIT, ZIP) | [`gpx-parser.ts`](../code-samples/typescript/gpx-parser.ts) |

## Back-end e APIs
| Competência | Evidência |
|---|---|
| Design de APIs REST com validação (zod), códigos HTTP e erros claros | [`plan-api-flow.ts`](../code-samples/typescript/plan-api-flow.ts) |
| Autenticação sem senha, sessões e cookies | [`remember-me-cookies.ts`](../code-samples/typescript/remember-me-cookies.ts), [Segurança](security.md) |
| Injeção de dependências e código testável | [`plan-api-flow.test.ts`](../code-samples/typescript/__tests__/plan-api-flow.test.ts) |
| Resiliência: timeouts, `AbortSignal`, fallback e *retries* com feedback | [`llm-fallback.ts`](../code-samples/typescript/llm-fallback.ts) |

## Dados e banco
| Competência | Evidência |
|---|---|
| Modelagem relacional, `jsonb`, índices e gatilhos | [`quota-and-rls.sql`](../code-samples/sql/quota-and-rls.sql) |
| Row Level Security e privilégios por papel | [`quota-and-rls.sql`](../code-samples/sql/quota-and-rls.sql), [Segurança](security.md) |
| Operações atômicas e concorrência | [`quota-and-rls.test.ts`](../code-samples/sql/quota-and-rls.test.ts) |
| Testar SQL com PostgreSQL real embutido | [Testes](testing.md) |

## Inteligência artificial aplicada
| Competência | Evidência |
|---|---|
| Arquitetura híbrida (algoritmos + LLM) e engenharia de prompt com regras | [IA × código](ai-and-scripts.md) |
| Validação e autocorreção da saída da LLM | [`llm-output-guards.ts`](../code-samples/typescript/llm-output-guards.ts) |
| Integração multi-modelo/multi-provedor e otimização de custo | [`llm-fallback.ts`](../code-samples/typescript/llm-fallback.ts) |
| Mitigação de *prompt injection* | [Segurança](security.md) |

## Algoritmos e domínio
| Competência | Evidência |
|---|---|
| Implementar modelos científicos publicados (VDOT) e validá-los contra tabelas | [`pace-zones.ts`](../code-samples/typescript/pace-zones.ts) |
| Modelagem de periodização (sobrecarga progressiva, recuperação, polimento) | [`training-skeleton.ts`](../code-samples/typescript/training-skeleton.ts) |
| Geoprocessamento básico (Haversine, filtragem de ruído de GPS) | [`gpx-parser.ts`](../code-samples/typescript/gpx-parser.ts) |

## Qualidade e DevOps
| Competência | Evidência |
|---|---|
| Testes unitários, de propriedade, de integração e de banco | [Testes](testing.md) |
| QA visual automatizado | [Testes](testing.md) |
| Deploy, domínio próprio, DNS, variáveis de ambiente e segredos | [Arquitetura](architecture.md), [Decisões #9](decisions.md) |
| Diagnóstico de problemas de build e ambiente | [Desafios #7 e #8](challenges.md) |

## Produto, UX e segurança
| Competência | Evidência |
|---|---|
| Fluxos de UX enxutos, estados de erro/vazio e mensagens claras | [README](../README.md) (telas) |
| Privacidade por projeto e LGPD | [Segurança](security.md) |
| Decisões documentadas com trade-offs | [Decisões](decisions.md) |
