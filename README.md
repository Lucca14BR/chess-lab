# Chess Lab — A arte de evoluir

Plataforma pessoal de estudo, treino e análise de xadrez. Web app local-first em português (PT-BR).

> Aplicativo independente, **sem afiliação com o Chess.com**. Usa apenas a API pública (PubAPI), somente leitura, sem senha e sem scraping.

## Como rodar

```bash
npm install        # também copia o Stockfish para public/stockfish (postinstall)
npm run dev        # http://localhost:5173
npm test           # testes (Vitest)
npm run build      # build de produção em dist/
```

Requer Node 22.15+ (o script de puzzles usa zstd nativo do Node).

## Publicar no GitHub Pages

O workflow `.github/workflows/deploy.yml` testa, gera o build e publica o site a cada push na branch `main`.

1. Crie um repositório público chamado `chess-lab` no GitHub (o Pages gratuito exige repositório público).
2. Em **Settings › Pages › Build and deployment**, escolha **Source: GitHub Actions**.
3. Envie o código:

   ```bash
   git remote add origin https://github.com/SEU_USUARIO/chess-lab.git
   git push -u origin main
   ```

4. Acompanhe em **Actions**. Ao terminar, o site fica em `https://SEU_USUARIO.github.io/chess-lab/`.

Os dados continuam no navegador de quem usa o site (IndexedDB). Para levar dados do `localhost` para o site, use **Configurações › Exportar backup** e depois **Restaurar backup** no site.

## Seções

| Página | O que faz |
| --- | --- |
| Painel Inicial | Saudação, rating real, evolução, metas da semana, atividade, último treino, próximas atividades, aulas em andamento, puzzles e recomendações. Sem conta conectada, convida a conectar e não mostra números inventados. |
| Tabuleiro | chess.js + Chessground: lances legais, arrastar e soltar, SAN/UCI, desfazer/refazer, comentários, FEN, PGN (importar/exportar, várias partidas), posições favoritas, partidas próprias, Stockfish sob demanda, análise completa de partida e **tutor de IA** (revisão da partida e conversa sobre a posição). |
| Puzzles | 1.350 puzzles reais da base CC0 da Lichess, 10 temas × 3 níveis, validação lance a lance, dica, solução, explicação por tema, pontuação, histórico, tempo, favoritos e estatísticas por tema. |
| Academia | 8 trilhas com aulas, exemplos em tabuleiro, exercícios validados, progresso e pré-requisitos. |
| Aberturas | Biblioteca (8 aberturas com ideias, planos dos dois lados, variantes, armadilhas, erros comuns, posições-chave), árvore de variantes navegável, anotações por posição e repertório próprio de brancas/pretas com importação e exportação de PGN. |
| Desempenho | Filtros por período, modalidade, cor; evolução de rating (uma modalidade por vez), V/E/D, por cor, por ritmo, por abertura, frequência, histórico mensal, lista de partidas, puzzles e tempo de estudo. |
| Caderno de Estudos | Notas com categorias, tags, FEN, partida associada, erros recorrentes, coleções, favoritos, pesquisa e salvamento automático. |
| Centro de Treino | Sessões cronometradas montáveis, modelos, sugestões baseadas nos resultados, plano semanal, calendário, metas e histórico/consistência. |
| Configurações | Conta Chess.com (conectar, atualizar, escopo, PGN do mês, desconectar), tema, imagem do cabeçalho, tabuleiro e peças, motor, tutor de IA (chave e modelos), backup/restauração e licenças. |

## Origem dos dados

A interface marca a procedência dos números:

- **Chess.com** — fornecido diretamente pela API (ratings atuais, melhores ratings, recordes, partidas).
- **Calculado** — derivado pelo Chess Lab (séries de rating, pontuação por abertura/cor, precisão do Stockfish, recomendações).
- **Manual** — registrado por você (metas manuais, sessões, notas).
- **IA** — explicação escrita pelo tutor (Gemini) a partir da análise do motor; pode conter raciocínio discutível.

## Integração com o Chess.com

- Endpoints: `/player/{u}`, `/player/{u}/stats`, `/player/{u}/games/archives`, `/player/{u}/games/{YYYY}/{MM}` e `/pgn`.
- Requisições **em série** (fila única), tratamento de **429** com `Retry-After`/backoff exponencial, 5xx com nova tentativa.
- Cache em IndexedDB: meses encerrados (24 h após o fim, considerando o atraso de até 12 h da API) não são baixados de novo; o mês atual é revalidado com `cache: 'no-cache'` (ETag).
- Sincronização automática ao abrir quando os dados têm mais de 12 h (desligável). O app funciona offline com os dados locais.

## Tutor de IA

Explica a posição ou a partida em português, usando o Gemini (Google). O tutor **não calcula lances**: o chess.js e o Stockfish montam uma "ficha de fatos" e a IA só explica o que está nela.

- **Revisão da partida** — depois da análise do Stockfish, comenta até 5 momentos decisivos dos seus lances.
- **Conversa no Tabuleiro** (aba Tutor) — perguntas rápidas ou livres sobre a posição atual; as respostas ficam salvas e podem ir para o Caderno.

### Primeiro uso

1. Gere uma chave no [Google AI Studio](https://aistudio.google.com/apikey).
2. Em **Configurações › Tutor de IA**, cole a chave e clique em **Salvar chave**: ela é testada na hora e os modelos padrão são escolhidos (**Testar chave** repete o teste).
3. Em **Tabuleiro**, abra a aba **Tutor** e pergunte (ou use **Revisão do tutor** na análise de uma partida).

### Chave, privacidade e modelos

- A chave é **sua** e fica só neste navegador (IndexedDB), legível para quem o usa. Ela **não entra no backup** e é apagada por "Remover chave" e por "Apagar dados locais". Crie uma chave só para o Chess Lab e remova-a em computador compartilhado.
- No plano gratuito o Google pode usar o conteúdo enviado para melhorar os produtos dele. O envio inclui a posição (FEN), lances, avaliações do motor, seu nível estimado e o texto da pergunta e das últimas mensagens desta conversa. Não escreva dados pessoais nas perguntas.
- Há um **modelo principal** e um **modelo reserva**, escolhidos entre os que a API lista para a sua chave. Cada resposta custa normalmente 1 pedido (2 quando a reserva entra ou a revisão precisa de nova tentativa); o reserva só entra se o principal atingir o limite, ficar indisponível, falhar no servidor ou demorar demais. Chave ou pedido recusado não aciona o reserva. Se nenhum modelo foi escolhido, o tutor aplica o padrão (o flash estável mais novo e o flash-lite como reserva) na primeira pergunta. Limites e modelos gratuitos mudam a critério do Google.
- Lances citados na resposta são conferidos: os confirmados pelo motor são clicáveis e desenham a seta; os demais lances aparecem como **não confirmado pelo motor**; casas citadas na prosa ("a casa d4") ficam como texto. Todo texto do tutor leva a etiqueta **IA**.

### Limites

- A conferência garante os **lances**, não o raciocínio: explicações de plano podem ser fracas ou discutíveis.
- O tutor precisa de internet; o motor, não. Sem conexão, o resto do app segue funcionando.
- Fora desta versão: orientação de estudo, outros provedores, tutor em Puzzles/Academia e voz.

## Arquitetura

```
src/
  components/   ui/ (primitivos no estilo shadcn), layout/, board/ (Chessground), charts/ (Recharts)
  features/     uma pasta por página (dashboard, board, puzzles, academy, openings, performance, notebook, training, settings)
  lib/
    chess/      regras auxiliares, PGN (parser próprio com variações), árvore de variantes, histórico
    chesscom/   cliente da PubAPI, normalização, sincronização
    db/         esquema Dexie (IndexedDB)
    engine/     Stockfish (Web Worker/UCI) e análise de partidas
    ai/         cliente da API do Gemini (modelos, geração, modelo reserva, erros tipados)
    tutor/      ficha de fatos, leitura e conferência de lances, prompts, revisão e serviço do tutor
    stats/      estatísticas de partidas e de estudo (funções puras, testadas)
    services/   atividade, academia, recomendações, sessão de treino, backup
    puzzles/    carregamento e textos dos temas
  data/         conteúdo da Academia e da Biblioteca de Aberturas (validado por testes)
scripts/        build-puzzles.mjs (extrai puzzles da base Lichess), copy-engine.mjs
```

## Regenerar a base de puzzles

```bash
npm run build:puzzles -- 45   # 45 puzzles por tema e nível
```

O script faz streaming do arquivo `lichess_db_puzzle.csv.zst`, filtra por popularidade/número de jogadas, valida cada solução com chess.js e interrompe o download quando as cotas são preenchidas.

## Licenças de terceiros

Stockfish (GPLv3), Chessground (GPLv3), chess.js (BSD-2), puzzles Lichess (CC0), peças Cburnett e Merida (GPLv2+), Staunty (CC BY-NC-SA 4.0), Chessnut (Apache 2.0), fontes (SIL OFL).

Serviço externo opcional: Gemini API (Google), usada apenas pelo tutor de IA, com a chave do próprio usuário e sujeita aos termos do Google.
