# Desafios encontrados e como foram resolvidos

Problemas reais do projeto, do sintoma à causa e à solução.

## 1. Plano gratuito de LLM instável
- **Sintoma:** a geração falhava de forma intermitente; uma requisição chegou a estourar o limite de tempo sem sequer tentar o segundo modelo.
- **Causa:** um modelo "sobrecarregado" podia levar ~40 s só para devolver um erro 503, consumindo todo o prazo compartilhado.
- **Solução:** prazo por modelo (exceto o último), passagem ao próximo em caso de ocupado, descontinuado ou lento, e modelo mais rápido primeiro. Também descobri, ao testar com a chave real, que um modelo antes padrão deixou de estar disponível para contas novas, então a lista de modelos virou configuração. → [`llm-fallback.ts`](../code-samples/typescript/llm-fallback.ts)

## 2. A IA errando regras "óbvias"
- **Sintoma:** um modelo mais leve classificava "descanso ativo" como sessão de corrida sem distância e repetia o erro mesmo depois de avisado.
- **Solução:** duas camadas: prompt mais explícito **e** normalização determinística (sessão de corrida sem distância vira cross-training) antes da validação. Lição: não dependa só de o modelo obedecer. → [`llm-output-guards.ts`](../code-samples/typescript/llm-output-guards.ts)

## 3. Limite de uso vulnerável a concorrência
- **Sintoma potencial:** duas requisições simultâneas poderiam passar do limite se o app "lesse, comparasse e gravasse".
- **Solução:** operação única e atômica no banco, com permissões que impedem o usuário de chamá-la diretamente. Testada num PostgreSQL embutido. → [`quota-and-rls.sql`](../code-samples/sql/quota-and-rls.sql)

## 4. Privacidade dos arquivos de treino
- **Problema:** GPX carrega o trajeto completo (onde a pessoa mora e treina).
- **Solução:** ler no navegador e enviar só um resumo. Também resolve o limite de tamanho de requisição da hospedagem.

## 5. "Mantenha-me conectado" com login sem senha
- **Desafio:** controlar a persistência da sessão quando a autenticação é feita por um serviço externo.
- **Solução:** verificar o código e criar a sessão em rotas do servidor, aplicando um único filtro que remove a validade dos cookies quando o usuário desmarca a opção. → [`remember-me-cookies.ts`](../code-samples/typescript/remember-me-cookies.ts)

## 6. Mudanças de versão do framework
- **Desafio:** o Next.js 16 traz mudanças que quebram o que se conhecia (arquivo `proxy.ts` no lugar de `middleware.ts`, APIs de cookies e parâmetros assíncronas, tipos de rota gerados).
- **Solução:** ler a documentação embutida da versão instalada antes de escrever código e cobrir o comportamento com testes.

## 7. Aviso de hidratação causado por extensão do navegador
- **Sintoma:** o indicador de desenvolvimento do Next mostrava "1 issue" o tempo todo.
- **Causa:** uma extensão de segurança gravava atributos próprios em todos os elementos antes de o React hidratar.
- **Solução:** um script **apenas em desenvolvimento** remove esses atributos; nada muda em produção. Diagnosticado lendo o diff que o próprio React imprime no console.

## 8. Erro de deploy por padrão de ignore
- **Sintoma:** build falhando na hospedagem com "módulo não encontrado", embora funcionasse localmente.
- **Causa:** o padrão `supabase` no arquivo de ignore excluía também `lib/supabase/`, que é código do app.
- **Solução:** ancorar os padrões na raiz (`/supabase`) e documentar o cuidado.

## 9. Formatos reais de exportação
- **Desafio:** o CSV do Strava tem colunas com o mesmo nome (`Distance` em km e em metros), datas em formato livre e as exportações vêm em ZIP com arquivos `.gz`.
- **Solução:** ler a **última** coluna duplicada, tratar `.gz` e ZIP, cair para os arquivos individuais quando o CSV não é reconhecido, e remover duplicatas quando o mesmo treino aparece em dois arquivos.

## 10. Landing de uma tela só e contraste
- **Desafio:** encaixar muitos elementos em uma tela sem rolagem em vários tamanhos, e corrigir contornos quase invisíveis.
- **Solução:** composição escalada com *container query units*, medição de rolagem em iframes de vários tamanhos e tokens de contorno em dois níveis, com contraste calculado. → [`design-tokens.css`](../code-samples/css/design-tokens.css)
