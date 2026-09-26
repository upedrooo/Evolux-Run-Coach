# Estratégia de testes

## Visão geral

**83 testes automatizados** no aplicativo (mais 1 teste "ao vivo" opcional contra a IA real), organizados por risco. Os exemplos deste repositório trazem uma amostra com **40 testes** que rodam sem nenhuma conta ou serviço externo.

| Camada | O que cobre | Ferramentas |
|---|---|---|
| **Parsers de arquivos** | GPX, TCX, FIT, CSV (Strava e Runkeeper), ZIP, GZ; esportes ignorados; duplicatas; arquivos inválidos; saltos de GPS e pausas | Vitest; arquivos **sintéticos**, inclusive FIT gerado por um codificador |
| **Algoritmos do treino** | VDOT contra tabelas publicadas, progressão de volume, recuperação e polimento, tetos, avisos calculados | Vitest, propriedades (ex.: "nunca sobe mais que X%") |
| **Validação da IA** | Cada regra de segurança, normalização, prompt (inclusive texto do usuário como dado), tentativa de correção | Vitest com uma "IA obediente" e "IA rebelde" simuladas |
| **Cliente de LLM** | Formato da requisição, fallback entre modelos, prazo por modelo, tratamento de 429/503/404/500 | Vitest com `fetch` simulado |
| **Banco de dados** | Limite atômico, devolução de vaga, gatilho de perfil, permissões e RLS | **PGlite** (PostgreSQL real em WebAssembly), papéis do Supabase simulados |
| **Fluxo ponta a ponta** | Login por código, assistente de 3 passos, geração da ficha, limite de 3, devolução de vaga em falhas | Servidor simulado de Supabase e Gemini + navegador real |
| **QA visual** | Capturas automatizadas de todas as telas em vários tamanhos; medição de rolagem e overflow | Puppeteer com Chrome |

## Práticas que valem destacar

- **Testar o SQL como código:** as políticas RLS, permissões e funções de cota rodam num PostgreSQL embutido, incluindo o cenário em que um usuário logado tenta chamar a função de devolução de vaga e é bloqueado.
- **Dados de teste realistas sem dados reais:** GPX gerados com pausas e saltos de GPS, CSVs com o cabeçalho duplicado do Strava, FIT montado com o codificador da própria biblioteca.
- **Simular o pior comportamento da IA:** respostas com JSON em blocos de markdown, semanas faltando, dias indisponíveis, volume fora da meta, e uma IA que erra a primeira tentativa e acerta a segunda.
- **Testes de propriedade em algoritmos:** em vez de só comparar um número, verificar invariantes ("o volume nunca ultrapassa o teto", "a semana de recuperação é menor que a anterior").
- **Injeção de dependências** no fluxo da API, para testar todos os desvios (sem login, limite, IA ocupada, falha ao salvar) sem rede nem banco.
- **QA visual automatizado:** as capturas de tela do portfólio são geradas por script, e o próprio processo já apontou um defeito real de interface (o tempo-alvo aparecia como "0h 55min" no resumo).

## Como rodar os exemplos

```bash
npm install
npm test
```

Veja o mapa completo em [`code-samples/README.md`](../code-samples/README.md).
