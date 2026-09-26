# Decisões técnicas

Registro curto das principais decisões, no formato **contexto → decisão → consequências**.

## 1. Ciência no código, texto na IA
- **Contexto:** uma LLM sozinha pode gerar volumes inseguros ou ritmos incoerentes, e cada erro é difícil de detectar.
- **Decisão:** o código calcula volume, progressão, ritmos e datas; a LLM só redige as sessões dentro desses limites.
- **Consequências:** planos previsíveis e testáveis, prompt menor (cabe em modelos gratuitos). Em troca, mais código para manter e a IA perde liberdade criativa.

## 2. Ler os arquivos no navegador
- **Contexto:** um GPX contém o trajeto completo, que revela onde a pessoa mora; além disso, hospedagens serverless têm limite de corpo de requisição.
- **Decisão:** parsers rodam no cliente; ao servidor vão só data, distância, tempo e FC.
- **Consequências:** privacidade por projeto (LGPD), requisições pequenas e menos custo de servidor. O preço é enviar os parsers ao navegador (carregados sob demanda).

## 3. Cota imposta no banco, com escrita só pelo servidor
- **Contexto:** um limite guardado no front-end ou verificado em duas etapas (ler e depois gravar) pode ser burlado, inclusive por requisições simultâneas.
- **Decisão:** função SQL com `UPDATE` condicional atômico; permissão de execução só para o papel de serviço; RLS de leitura para usuários.
- **Consequências:** o limite vale mesmo sob concorrência e mesmo se alguém chamar a API do banco diretamente. É preciso devolver a vaga em qualquer falha (feito com `finally`).

## 4. Login sem senha, com sessão controlada no servidor
- **Contexto:** reduzir atrito e superfície de ataque (sem senhas), mantendo a opção "mantenha-me conectado".
- **Decisão:** código de 6 dígitos por e-mail e Google; a verificação acontece em rotas de API, e um filtro central decide se os cookies de sessão são persistentes ou de sessão.
- **Consequências:** comportamento consistente em todos os pontos que gravam cookies (login, callback e renovação de token).

## 5. Cliente de LLM independente de provedor, com fallback e prazo por modelo
- **Contexto:** planos gratuitos de LLM alternam entre respostas em segundos e erros de "alta demanda" que podem levar ~40 s para retornar.
- **Decisão:** lista de modelos configurável por variável de ambiente; cada modelo (exceto o último) tem prazo próprio; provedores trocáveis sem mudar código.
- **Consequências:** a disponibilidade aumenta e o custo continua zero. Documentado em [`llm-fallback.ts`](../code-samples/typescript/llm-fallback.ts).

## 6. Falhar sem cobrar
- **Contexto:** a geração pode falhar por motivos fora do controle do usuário (IA ocupada, banco, validação).
- **Decisão:** reservar a vaga antes de chamar a IA (para impedir uso paralelo) e devolvê-la em **qualquer** falha.
- **Consequências:** o usuário nunca perde uma ficha por erro do sistema.

## 7. Design tokens com contraste medido
- **Contexto:** os contornos da primeira versão eram quase invisíveis sobre o fundo (~1,3:1).
- **Decisão:** dois níveis de contorno: cartões (~1,9:1) e controles (~3,4:1), seguindo o critério de contraste não textual do WCAG.
- **Consequências:** ajustes de identidade passam a ser feitos em um único lugar.

## 8. Landing de uma tela só
- **Contexto:** a página inicial precisava caber inteira na janela, sem rolagem, com muitos elementos.
- **Decisão:** composição desenhada em um espaço de coordenadas fixo e escalada com *container query units* (`cqw`), com versão própria para telas pequenas e limite pela altura da janela.
- **Consequências:** proporções preservadas em qualquer largura; testado em 1440×900, 390×844, 360×740, 375×667 e tablet.

## 9. Deploy direto pela CLI, sem integração com Git
- **Contexto:** manter o projeto isolado de outras contas e repositórios.
- **Decisão:** publicação com a CLI da Vercel usando credenciais em uma pasta de configuração dedicada.
- **Consequências:** sem deploy automático a cada commit; cada publicação é um comando explícito.
