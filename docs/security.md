# Segurança e privacidade

## Controles implementados

| Área | Controle |
|---|---|
| **Autenticação** | Login sem senha (código por e-mail e Google) via Supabase Auth. A verificação do código ocorre no servidor; cookies de sessão com `SameSite=Lax` e `Secure` em produção. |
| **Autorização** | Rotas protegidas no `proxy.ts` (checagem otimista) **e** revalidação da sessão em cada rota de API. A regra real de acesso a dados fica no banco (RLS). |
| **Isolamento de dados** | RLS em `profiles` e `plans`: cada usuário só lê as próprias linhas. Usuários logados não têm permissão de escrita. |
| **Cota de uso** | Funções SQL `SECURITY DEFINER` com `search_path` fixo, executáveis só pelo papel de serviço; reserva atômica. Ver [`quota-and-rls.sql`](../code-samples/sql/quota-and-rls.sql). |
| **Segredos** | A chave de serviço do banco e a da IA existem só no servidor (sem prefixo `NEXT_PUBLIC_`), marcadas como sensíveis na hospedagem. Arquivos `.env*` fora do Git e do upload de deploy. |
| **Validação de entrada** | Esquemas zod em todas as rotas, com limites de tamanho de corpo, de quantidade de treinos e faixas plausíveis (distância, ritmo, idade, peso). |
| **Prompt injection** | Texto livre do usuário é delimitado como dado, com instrução explícita de ignorá-lo como comando; a saída da IA passa por esquema e regras, então instruções injetadas não conseguem alterar limites de segurança. |
| **Privacidade dos treinos** | Arquivos são lidos no navegador; coordenadas GPS nunca são enviadas nem armazenadas. |
| **Cabeçalhos HTTP** | `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`; HSTS pela plataforma. |
| **Indexação** | `robots.txt` bloqueia áreas logadas e API; o sitemap lista apenas páginas públicas. |
| **Erros** | Mensagens ao usuário não vazam detalhes do provedor; detalhes técnicos ficam só nos logs do servidor. |

## Riscos conhecidos e próximos passos

- **Política de privacidade (LGPD):** o formulário coleta idade, peso, sexo e, opcionalmente, informações de saúde (dado sensível). Há consentimento explícito no fluxo, mas a página com a política completa ainda está no roadmap.
- **Provedor de IA gratuito:** alguns provedores podem usar dados enviados para melhorar produtos. Mitigação atual: consentimento no formulário e envio apenas de resumos; próximo passo é oferecer provedor sem retenção.
- **Abuso por múltiplas contas:** o limite é por conta; captcha e limite por IP estão previstos.
- **Rotação de chaves:** política para trocar periodicamente as chaves de serviço e de IA.
