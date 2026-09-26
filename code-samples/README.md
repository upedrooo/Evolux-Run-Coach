# Exemplos de código

Trechos **reais, enxutos e comentados** do Evolux. Não são o aplicativo completo: simplificam constantes e regras de negócio para destacar a lógica e a técnica. Cada um tem testes que rodam sem nenhuma conta ou serviço externo.

| Arquivo | Linguagem | Conceito | Teste |
|---|---|---|---|
| [`typescript/pace-zones.ts`](typescript/pace-zones.ts) | TypeScript | Modelo científico (VDOT), equação de 2º grau invertida, zonas de ritmo | [`pace-zones.test.ts`](typescript/__tests__/pace-zones.test.ts) |
| [`typescript/training-skeleton.ts`](typescript/training-skeleton.ts) | TypeScript | Periodização: sobrecarga progressiva, recuperação, polimento; interpolação linear | [`training-skeleton.test.ts`](typescript/__tests__/training-skeleton.test.ts) |
| [`typescript/llm-output-guards.ts`](typescript/llm-output-guards.ts) | TypeScript | Não confiar na saída da IA: validação por regras e normalização | [`llm-output-guards.test.ts`](typescript/__tests__/llm-output-guards.test.ts) |
| [`typescript/llm-fallback.ts`](typescript/llm-fallback.ts) | TypeScript | Resiliência: prazo por modelo, `AbortSignal.any`, erros tipados | [`llm-fallback.test.ts`](typescript/__tests__/llm-fallback.test.ts) |
| [`typescript/gpx-parser.ts`](typescript/gpx-parser.ts) | TypeScript | Parsing de XML, Haversine, filtro de ruído de GPS, privacidade | [`gpx-parser.test.ts`](typescript/__tests__/gpx-parser.test.ts) |
| [`typescript/remember-me-cookies.ts`](typescript/remember-me-cookies.ts) | TypeScript | Sessão persistente × cookie de sessão, controlada no servidor | [`remember-me-cookies.test.ts`](typescript/__tests__/remember-me-cookies.test.ts) |
| [`typescript/plan-api-flow.ts`](typescript/plan-api-flow.ts) | TypeScript | Orquestração com injeção de dependências, cota e reembolso em `finally` | [`plan-api-flow.test.ts`](typescript/__tests__/plan-api-flow.test.ts) |
| [`sql/quota-and-rls.sql`](sql/quota-and-rls.sql) | SQL (PostgreSQL) | RLS, operação atômica, `SECURITY DEFINER`, privilégios por papel, gatilhos | [`quota-and-rls.test.ts`](sql/quota-and-rls.test.ts) (PGlite) |
| [`react/AttachedFiles.tsx`](react/AttachedFiles.tsx) | TSX (React) | Componente acessível de lista de arquivos com estados vazio e cheio | verificação de tipos |
| [`css/design-tokens.css`](css/design-tokens.css) | CSS (Tailwind v4) | Tokens semânticos, contraste medido, movimento reduzido, impressão | n/a |

## Rodando

Na raiz do repositório:

```bash
npm install
npm test            # 40 testes, incluindo SQL num PostgreSQL embutido
npm run typecheck   # tsc --noEmit em todos os exemplos
```

## Por onde começar

1. [`llm-output-guards.ts`](typescript/llm-output-guards.ts): mostra como tratar uma IA como componente não confiável.
2. [`quota-and-rls.sql`](sql/quota-and-rls.sql): segurança e concorrência no banco.
3. [`plan-api-flow.ts`](typescript/plan-api-flow.ts) e seu teste: arquitetura testável.
