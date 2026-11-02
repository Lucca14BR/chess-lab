# Tutor de IA — Design

Data: 2026-11-02 · Status: aprovado em conversa, aguardando revisão do documento

## Objetivo

Um tutor que **explica** xadrez em português usando a IA do Gemini (Google), sem nunca calcular lances por conta própria. Duas frentes:

- **(A) Revisão de partida** — depois da análise do Stockfish, comenta os 3 a 5 momentos decisivos dos lances do usuário: o que aconteceu, por quê e o que considerar.
- **(B) Conversa no Tabuleiro** — perguntas livres ou rápidas sobre a posição atual, respondidas com base no que o motor calculou.

Critério de sucesso: toda resposta cita apenas lances verificados (ou os marca como não confirmados), gasta 1 pedido à API por resposta (2 só quando o modelo reserva entra) e fica salva para não ser pedida de novo.

## Decisões tomadas

| Tema | Decisão |
| --- | --- |
| Provedor | Gemini, plano gratuito, chave do próprio usuário colada em Configurações |
| Modelos | Lista consultada na API (`GET /v1beta/models`), filtrada por `generateContent`; o usuário escolhe um **principal** e um **reserva** |
| Abordagem | "Ficha de fatos": o app calcula (chess.js + Stockfish), a IA só explica; 1 pedido por resposta |
| Revisão (A) | Momentos decisivos, gerados em um único pedido com resposta estruturada |
| Fora desta versão | Orientação de estudo, outros provedores, tutor em Puzzles/Academia, voz |

## Estrutura

Unidades novas, cada uma com uma função:

### `src/lib/ai/gemini.ts` — cliente da API (não sabe nada de xadrez)

- `listModels(key)`: `GET https://generativelanguage.googleapis.com/v1beta/models`, percorre `nextPageToken`, devolve só modelos cujo `supportedGenerationMethods` inclui `generateContent` (`name`, `displayName`, `inputTokenLimit`, `outputTokenLimit`).
- `generate(key, { primary, fallback }, request)`: `POST /v1beta/{model}:generateContent`. Aceita `responseSchema` (JSON) para a revisão. Devolve `{ text | json, model }` — o modelo que de fato respondeu.
- A chave vai sempre no cabeçalho `x-goog-api-key`, nunca na URL.
- Timeout de 60 s por tentativa (`AbortController`).
- **Reserva:** refaz o mesmo pedido no modelo reserva quando o principal responde 429, 404 (modelo indisponível), 5xx ou estoura o tempo. **Não** usa a reserva em 400/401/403 (pedido ou chave inválidos — a reserva falharia igual).
- Erros tipados (`GeminiError` com `kind`: `no-key`, `invalid-key`, `rate-limit`, `offline`, `blocked`, `empty`, `server`, `timeout`) e `retryAfterSeconds` quando o Google informar (`RetryInfo` no corpo ou cabeçalho `Retry-After`).

### `src/lib/tutor/facts.ts` — ficha de fatos (sem IA, testável)

Entrada: FEN e, quando houver, o lance jogado e a análise do motor. Saída: objeto `PositionFacts` serializável:

- lado a jogar, material de cada lado, xeque, lances legais (contagem);
- 3 melhores linhas do Stockfish em SAN com avaliação (`formatEval`);
- lance jogado (na revisão, o lance do momento; no Tabuleiro, o último lance que levou à posição atual, avaliando também a posição anterior), avaliação antes/depois, perda de chance de vitória (`winLoss`) e classificação existentes (`AnalyzedMove`);
- perigos via chess.js: peças atacadas e não defendidas (para os dois lados), capturas e xeques disponíveis, mate em 1 se existir;
- lances citados na pergunta do usuário, cada um com a avaliação do Stockfish depois dele.

### `src/lib/tutor/moves.ts` — leitura de lances em texto

- Extrai candidatos a lance de um texto (pergunta ou resposta).
- Aceita SAN em inglês (K Q R B N) e em português (R=rei, D=dama, T=torre, B=bispo, C=cavalo), roque `O-O`/`0-0`.
- Ambiguidade (ex.: `R` = rei em PT, torre em EN): tenta as duas leituras e fica com a que for legal na posição; se as duas forem legais, prefere a leitura em português.
- Converte para SAN canônico do chess.js.

### `src/lib/tutor/prompts.ts` — instruções enviadas ao Gemini

- Instrução de sistema: responder em português do Brasil, explicar **somente** com base na ficha, não propor lances fora dela, admitir quando a ficha não basta, linguagem adequada ao nível.
- Nível: rating mais alto entre as modalidades do Chess.com conectado (iniciante < 1200, intermediário < 1800, avançado ≥ 1800); sem conta, "intermediário".
- Conversa: ficha + até as 6 últimas mensagens da mesma conversa.
- Revisão: fichas de todos os momentos em um pedido; `responseSchema` com `{ moments: [{ ply, title, explanation, whatToConsider }], summary }`.

### `src/lib/tutor/verify.ts` — conferência da resposta

- Usa `moves.ts` para achar lances citados na resposta.
- Confirmado = legal na posição relevante **e** presente na ficha (melhores linhas, lance jogado ou lances da pergunta).
- Devolve o texto em segmentos: texto comum, lance confirmado (com UCI para desenhar seta), lance **não confirmado pelo motor**.

### `src/lib/tutor/review.ts` — escolha dos momentos decisivos

- Considera só os lances do usuário. Partidas do Chess.com: cor de `ImportedGame.userColor`. Partidas próprias e do Estúdio: o usuário escolhe "Revisar como Brancas/Pretas" antes de gerar.
- Ordena por `winLoss`; pega capivaradas e erros primeiro, até 5.
- Se houver menos de 3, completa com as maiores viradas de avaliação da partida.
- Se não houver nenhum lance com `winLoss` ≥ 10, a revisão diz que a partida foi limpa e comenta só os maiores pontos de virada (sem inventar críticas).

### `src/lib/tutor/service.ts` — orquestra pergunta → fatos → IA → conferência → gravação

### Dados (Dexie, versão 2 do esquema)

- `tutorMessages` — `id, threadId, createdAt`. `threadId` = `review:${analysisId}` ou `pos:${positionKey}`. Campos: papel (`user`/`tutor`), texto, segmentos verificados, modelo usado, `factsHash`. Entra no backup e na contagem de armazenamento.
- `secrets` — `key`. Guarda a chave do Gemini. **Não** entra em `exportBackup`/`importBackup`; é apagada por `clearAllData` e por "Remover chave".
- `Settings` ganha `tutorPrimaryModel` e `tutorFallbackModel` (strings). Padrão, aplicado quando a lista é carregada e nada foi escolhido: descartar modelos cujo nome contenha `tts`, `image`, `audio`, `live` ou `embedding`; também descartar `gemma`; ignorar ids com `preview`, `exp` ou `latest` quando houver um estável; ordenar pela versão numérica, decrescente; principal = o primeiro que contenha `flash` e não `lite`; reserva = o primeiro que contenha `flash-lite`. Os padrões também são aplicados ao salvar a chave (teste automático) e, se ainda faltarem, no primeiro pedido. Se não houver, o usuário escolhe.
- `DataSource` ganha `'ai'` (etiqueta "IA", ícone de faísca, título "Explicação gerada por IA a partir da análise do motor").

## Telas

### Configurações › Tutor de IA

- Campo da chave (tipo senha), link para o Google AI Studio, botões **Testar chave** (chama `listModels`) e **Remover chave**.
- **Atualizar lista** de modelos; seletores **Modelo principal** e **Modelo reserva**.
- Avisos fixos: no plano gratuito o Google pode usar o conteúdo enviado para melhorar os produtos; o envio inclui a posição (FEN), lances, avaliações do motor, o nível estimado e o texto da pergunta e das últimas mensagens da conversa — não escreva dados pessoais nas perguntas; a chave fica legível para quem usa este navegador — crie uma só para o Chess Lab e remova em computador compartilhado; limites e modelos gratuitos mudam a critério do Google.

### Tabuleiro › Análise da partida (A)

- Botão **Revisão do tutor**, visível só com análise pronta.
- Lista dos momentos: lance, classificação, título e explicação; clicar leva o tabuleiro ao momento e desenha a seta do melhor lance.
- Resumo da partida, modelo usado, etiqueta "IA". Revisão salva; botão **Gerar de novo**.
- Em cada momento, **Perguntar sobre este momento** abre a conversa (B) na posição depois do lance do usuário, com esse lance como "lance jogado".

### Tabuleiro › aba Tutor (B), ao lado do painel do motor

- Perguntas rápidas: "Qual é o plano aqui?", "Por que meu lance foi ruim?" (só quando há lance jogado analisado), "Quais são as ameaças?".
- Campo livre; histórico da conversa da posição; lances confirmados clicáveis (desenham seta); botão **Salvar no Caderno** em cada resposta (cria nota com FEN e o texto).
- Estado "Analisando posição…" enquanto o Stockfish roda; "Consultando o tutor…" durante o pedido.

## Fluxo de uma pergunta (B)

1. Extrair lances da pergunta (`moves.ts`).
2. Se a posição não tiver análise em cache da sessão, rodar o Stockfish (MultiPV 3, profundidade de `engineDepth`); rodar também cada lance citado.
3. Montar a ficha (`facts.ts`) e o pedido (`prompts.ts`).
4. `generate` com principal/reserva.
5. Conferir (`verify.ts`), gravar em `tutorMessages`, exibir.

Revisão (A): `review.ts` escolhe os momentos → uma ficha por momento → um pedido com `responseSchema` → conferência de cada comentário → gravação.

## Erros

| Situação | O que o usuário vê |
| --- | --- |
| Sem chave | Explicação de como ativar e botão para Configurações |
| Chave recusada (401/403, ou 400 com `API_KEY_INVALID`) | "Chave recusada pelo Google. Confira em Configurações." |
| Outro 400 (modelo recusou o pedido) | "O modelo escolhido recusou o pedido. Escolha outro em Configurações." |
| Offline | "Sem conexão. O motor continua funcionando; o tutor volta quando a internet voltar." |
| Limite (principal e reserva) | "Limite atingido. Tente de novo em X min" (X quando o Google informar) |
| Resposta vazia/bloqueada | Mensagem e **Tentar de novo** |
| JSON da revisão inválido | Uma nova tentativa automática; depois, mensagem e **Tentar de novo** |

Em qualquer erro a pergunta digitada é mantida e o resto do app segue funcionando.

## Testes

Vitest, junto com os existentes:

- `facts.ts`: posições conhecidas — peça solta, mate em 1, ameaça de captura, xeque.
- `moves.ts`: SAN PT/EN, roques, ambiguidade R, lance ilegal.
- `verify.ts`: lance confirmado, lance legal fora da ficha, lance ilegal.
- `review.ts`: muitos erros, poucos erros, partida limpa, escolha de cor.
- `gemini.ts` com `fetch` simulado: filtro e paginação de modelos; reserva em 429/404/5xx/timeout; sem reserva em 401/403; `retryAfterSeconds`; chave no cabeçalho e ausente da URL.
- `backup.ts`: exportação não contém a tabela `secrets`; `clearAllData` a apaga.

Navegador: telas testadas com respostas simuladas. O primeiro uso com a API real é feito pelo usuário com a própria chave (não é colada pelo assistente).

## Limites declarados no app

- A conferência garante os **lances**, não o raciocínio: explicações de plano podem ser fracas ou discutíveis — por isso a etiqueta "IA".
- Limites e modelos do plano gratuito mudam a critério do Google; o conteúdo enviado pode ser usado por ele.
- O tutor precisa de internet; o motor não.
