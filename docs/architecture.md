# Arquitetura

## Visão geral

O Evolux é uma aplicação **Next.js (App Router)** hospedada na Vercel, com **Supabase** (PostgreSQL + Auth) como camada de dados e uma **LLM** (Google Gemini) usada apenas para redigir as sessões de treino. Todo o restante da inteligência do plano é código determinístico.

```mermaid
flowchart TB
  subgraph Cliente["Navegador"]
    UI["Interface React"]
    PARSE["Parsers de arquivo: GPX, TCX, FIT, CSV, ZIP"]
  end
  subgraph Vercel["Next.js na Vercel"]
    PROXY["proxy.ts: renova sessão e protege rotas"]
    PAGES["Server Components: painel e ficha"]
    API["Route Handlers: /api/auth/*, /api/plan"]
    CORE["Núcleo do treino: métricas, VDOT, volume, prompt, validação"]
  end
  subgraph Dados["Supabase"]
    AUTH["Auth: OTP por e-mail e Google"]
    PG[("PostgreSQL + RLS + funções de cota")]
  end
  MAIL["SMTP transacional (Resend)"]
  LLM["API do Gemini"]

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

## Ciclo de uma requisição de plano

```mermaid
sequenceDiagram
  autonumber
  participant U as Navegador
  participant A as POST /api/plan
  participant D as PostgreSQL
  participant L as LLM

  U->>A: formulário + resumo dos treinos (JSON)
  A->>A: valida sessão e esquema (zod)
  A->>A: calcula métricas, VDOT, zonas e volume semanal
  Note over A: erros até aqui não consomem cota
  A->>D: claim_plan_slot(usuário, limite)
  alt limite atingido
    D-->>A: false
    A-->>U: 403 (a IA não é chamada)
  else vaga reservada
    D-->>A: true
    A->>L: prompt com estrutura pronta
    L-->>A: JSON das sessões
    A->>A: valida regras e normaliza
    opt reprovado
      A->>L: nova tentativa com a lista de erros
    end
    A->>D: salva a ficha
    A-->>U: 200 com o id
  end
  Note over A,D: qualquer falha após a reserva chama refund_plan_slot
```

## Modelo de dados

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "1 perfil por usuário (trigger)"
  AUTH_USERS ||--o{ PLANS : "possui"
  PROFILES {
    uuid id PK
    int plans_used "0..N, contador de fichas"
    timestamptz created_at
  }
  PLANS {
    uuid id PK
    uuid user_id FK
    text goal "ex.: Correr 10 km em 55 min"
    jsonb plan "ficha completa"
    timestamptz created_at
  }
```

- **Leitura:** o usuário lê só as próprias linhas (políticas RLS).
- **Escrita:** somente pelo servidor, com a chave de serviço.
- **Cota:** funções `claim_plan_slot` e `refund_plan_slot`, executáveis apenas pelo papel de serviço.

## Camadas do código (repositório privado)

```
app/            páginas (landing, login, painel, novo plano, ficha) e rotas de API
components/     assistente de 3 passos, login, logo, ilustração de integração
lib/parsing/    leitura de GPX, TCX, FIT, CSV, ZIP e GZ (roda no navegador)
lib/coach/      métricas, VDOT/ritmos, esqueleto de volume, prompt, validações
lib/llm/        cliente de LLM com fallback de modelos e prazos
lib/supabase/   clientes (servidor, admin, proxy) e política de cookies de sessão
proxy.ts        renovação de sessão e proteção de rotas (substitui o middleware no Next 16)
supabase/       migração SQL: tabelas, RLS, gatilhos e funções
tests/          testes unitários, de SQL e servidor simulado para testes manuais
```

## Implantação

- **Hospedagem:** Vercel, com deploy de produção pela CLI e variáveis de ambiente separadas entre públicas (`NEXT_PUBLIC_*`) e secretas.
- **Domínio:** domínio próprio com HTTPS automático; `www` redireciona para o domínio principal.
- **E-mail:** códigos de acesso enviados por SMTP transacional a partir do domínio verificado.
- **Segurança em produção:** cookies `Secure`, cabeçalhos (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`), `robots.txt` e `sitemap.xml`. Detalhes em [security.md](security.md).
