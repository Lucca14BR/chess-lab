import type { Lesson } from '../types';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const estrategia: Lesson[] = [
  {
    id: 'est-1',
    trackId: 'trilha-estrategia',
    category: 'estrategia',
    title: 'Peças boas e peças ruins',
    description:
      'O valor de uma peça depende da posição. Entenda o bispo bom e o bispo ruim, por que um cavalo num posto forte pode superar um bispo e como melhorar a sua pior peça.',
    level: 'intermediario',
    minutes: 18,
    requires: ['fund-3'],
    keyPoints: [
      'Bispo ruim é o que tem os próprios peões centrais fixos em casas da sua cor.',
      'Um cavalo em casa central que nenhum peão pode atacar costuma ser mais forte que um bispo ruim.',
      'Pergunte sempre qual é a sua pior peça e como melhorá-la; em posições calmas, esse é muitas vezes o plano.',
      'Troque as suas peças ruins e preserve as boas; faça o contrário com as do adversário.',
    ],
    sections: [
      {
        heading: 'Bispo bom e bispo ruim',
        paragraphs: [
          'O bispo fica preso a uma cor. Se os seus peões centrais estão fixos em casas dessa mesma cor, eles bloqueiam as diagonais do bispo, que passa a defender peões em vez de atacar. Esse é o bispo ruim.',
          'Na Defesa Francesa, depois de 3.e5, os peões pretos em e6 e d5 estão em casas claras. O bispo de c8, de casas claras, fica atrás deles com pouco espaço: é o problema estrutural clássico da abertura. O bispo de casas escuras, ao contrário, tem diagonais livres.',
          '"Ruim" não significa inútil. Um bispo ruim pode defender bem os próprios peões e, às vezes, ganhar vida quando a estrutura muda. Mas, num final, o bispo ruim contra um cavalo bem colocado costuma ser uma desvantagem séria.',
        ],
        example: {
          title: 'O bispo de c8 na Francesa',
          fen: START,
          moves: ['e4', 'e6', 'd4', 'd5', 'e5'],
          caption: 'Os peões de e6 e d5 bloqueiam as diagonais do bispo de c8.',
          arrows: [
            { from: 'c8', to: 'd7', brush: 'red' },
            { from: 'd7', to: 'e6', brush: 'red' },
          ],
        },
      },
      {
        heading: 'Cavalo forte contra bispo ruim',
        paragraphs: [
          'Um posto avançado é uma casa no campo adversário que não pode ser atacada por peões inimigos. Um cavalo instalado ali é estável, controla casas importantes e não pode ser expulso.',
          'No exemplo, os peões pretos do centro e da ala da dama estão em casas escuras (a5, c5, d6, e5, f6), a mesma cor do bispo de e7. O cavalo branco em d5, casa clara, nunca poderá ser desafiado pelo bispo, e as pretas não têm peões que o expulsem. Quase todos os peões brancos estão em casas claras, fora do alcance do bispo.',
          'Nesse tipo de posição o lado com o cavalo pode manobrar com calma, levar o rei para o centro e criar uma segunda fraqueza, enquanto o bispo apenas observa.',
        ],
        example: {
          title: 'Cavalo em d5, bispo preso',
          fen: '8/4bkpp/3p1p2/p1pNp3/P1P1P3/5P2/5KPP/8 w - - 0 1',
          caption: 'O cavalo domina e o bispo de e7 está cercado pelos próprios peões.',
          arrows: [
            { from: 'd5', to: 'e7', brush: 'green' },
            { from: 'd5', to: 'c7', brush: 'green' },
            { from: 'd5', to: 'f4', brush: 'green' },
            { from: 'd5', to: 'b6', brush: 'green' },
          ],
        },
      },
      {
        heading: 'Melhorar a pior peça',
        paragraphs: [
          'Em posições fechadas, sem táticas imediatas, uma das perguntas mais úteis é: qual é a minha pior peça? Melhorá-la é um plano simples e quase sempre correto, porque aumenta a força do conjunto.',
          'A manobra clássica da Ruy López ilustra a ideia. O cavalo de b1 não tem uma boa casa em c3, porque o peão c3 a ocupa. Por isso as brancas o levam por d2 e f1 até g3, de onde ele apoia o flanco do rei e mira f5.',
          'As pretas, na Variante Breyer, fazem o mesmo raciocínio: o cavalo volta de c6 para b8 e reaparece em d7, liberando o peão c e apoiando e5. São manobras lentas, mas cada lance melhora uma peça.',
        ],
        example: {
          title: 'Variante Breyer da Ruy López',
          fen: START,
          moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3', 'Nb8', 'd4', 'Nbd7', 'Nbd2', 'Bb7', 'Bc2', 'Re8', 'Nf1', 'Bf8', 'Ng3'],
          caption: 'Os dois lados reposicionaram os cavalos: Nb1-d2-f1-g3 para as brancas, Nc6-b8-d7 para as pretas.',
        },
      },
      {
        heading: 'Trocas: o que entregar e o que manter',
        paragraphs: [
          'Toda troca muda o equilíbrio entre peças boas e ruins. Trocar a sua peça ruim pela peça boa do adversário é um ganho estratégico, mesmo que o material continue igual.',
          'Na Francesa Avanço, as pretas podem jogar ...b6 e ...Ba6 para oferecer a troca do bispo ruim de c8 pelo bom bispo branco de f1. Depois dessa troca, as fraquezas de casas claras das pretas pesam muito menos.',
          'O inverso também vale: evite trocas que deixam você com a peça ruim. Antes de capturar, pergunte que peça vai sobrar no tabuleiro.',
        ],
        example: {
          title: 'Trocar o bispo ruim',
          fen: START,
          moves: ['e4', 'e6', 'd4', 'd5', 'e5', 'b6', 'c3', 'Qd7', 'Nf3', 'Ba6', 'Bxa6', 'Nxa6'],
          caption: 'O bispo ruim de c8 foi trocado pelo bispo bom branco. O cavalo de a6 volta ao jogo por c7 ou b8.',
        },
      },
    ],
    exercises: [
      {
        id: 'est-1-ex1',
        prompt: 'Brancas jogam: levem o cavalo até o posto avançado de d5 pelo caminho mais curto.',
        fen: '8/4bkpp/3p1p2/p1p1p3/P1P1P3/5P2/5KPP/1N6 w - - 0 1',
        solution: ['Nc3', 'Ke6', 'Nd5'],
        explanation:
          'Nc3 seguido de Nd5 instala o cavalo numa casa que nenhum peão preto pode atacar. Ali ele vigia c7, e7 e b6 e não pode ser desafiado pelo bispo de casas escuras. As pretas ficam reduzidas a esperar.',
      },
      {
        id: 'est-1-ex2',
        prompt: 'Francesa Avanço. Pretas jogam: ofereçam a troca do bispo ruim de c8.',
        fen: 'rnb1kbnr/p1pq1ppp/1p2p3/3pP3/3P4/2P2N2/PP3PPP/RNBQKB1R b KQkq - 2 5',
        solution: ['Ba6'],
        explanation:
          '5...Ba6 coloca o bispo diante do bispo branco de f1. Se as brancas trocarem, as pretas se livram da sua peça mais problemática; se evitarem a troca, terão de gastar tempo, e o bispo preto ganha uma diagonal ativa.',
      },
    ],
  },
  {
    id: 'est-2',
    trackId: 'trilha-estrategia',
    category: 'estrategia',
    title: 'Estrutura de peões: isolado, dobrado e passado',
    description:
      'Os peões são a alma do xadrez, como dizia Philidor. Aprenda as forças e fraquezas do peão isolado, dos peões dobrados e do peão passado.',
    level: 'intermediario',
    minutes: 20,
    requires: ['est-1'],
    keyPoints: [
      'O peão isolado dá atividade às peças no meio-jogo, mas tende a ser fraco no final.',
      'Contra o isolado, bloqueie a casa à frente dele com uma peça, de preferência um cavalo.',
      'Peões dobrados são fracos quando estáticos, mas abrem colunas e controlam casas.',
      'Peões passados devem avançar; a torre fica melhor atrás deles, seja para apoiá-los ou detê-los.',
    ],
    sections: [
      {
        heading: 'O peão isolado',
        paragraphs: [
          'Um peão é isolado quando não há peões da mesma cor nas colunas vizinhas. Nenhum peão pode defendê-lo, e a casa à frente dele é um ótimo posto para as peças adversárias, já que nenhum peão pode expulsá-las.',
          'Por outro lado, o peão isolado em d4 garante espaço e casas centrais (e5 e c5) e abre colunas para as peças. No meio-jogo, o lado com o isolado costuma ter iniciativa e chances de ataque.',
          'Daí a estratégia de cada lado: quem tem o isolado busca atividade, ataque e, às vezes, a ruptura d4-d5. Quem joga contra bloqueia a casa d5, troca peças e leva a partida para um final, onde a fraqueza pesa mais.',
        ],
        example: {
          title: 'Isolado no Ataque Panov',
          fen: START,
          moves: ['e4', 'c6', 'd4', 'd5', 'exd5', 'cxd5', 'c4', 'Nf6', 'Nc3', 'e6', 'Nf3', 'Be7', 'cxd5', 'Nxd5'],
          caption: 'O peão de d4 está isolado. O cavalo preto já ocupa a casa de bloqueio em d5.',
          arrows: [{ from: 'd5', to: 'd4', brush: 'red' }],
        },
      },
      {
        heading: 'Peões dobrados',
        paragraphs: [
          'Peões dobrados são dois peões da mesma cor na mesma coluna. O peão de trás não protege o da frente, e os dois juntos controlam menos casas do que dois peões em colunas vizinhas.',
          'Na Nimzoíndia Sämisch, as brancas aceitam peões dobrados em c3 e c4 em troca do par de bispos e de um centro forte. O peão c4 vira alvo para ...b6, ...Ba6 e ...Nc6-a5, mas as brancas recebem compensação dinâmica.',
          'A avaliação depende do conjunto. Peões dobrados que controlam casas centrais e abrem uma coluna para as torres podem ser um preço razoável; peões dobrados isolados, num final, são quase sempre uma fraqueza séria.',
        ],
        example: {
          title: 'Nimzoíndia Sämisch',
          fen: START,
          moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'a3', 'Bxc3+', 'bxc3'],
          caption: 'Peões dobrados na coluna c, mas as brancas ganharam o par de bispos.',
        },
      },
      {
        heading: 'O peão passado',
        paragraphs: [
          'Um peão é passado quando nenhum peão adversário pode impedi-lo de avançar, nem bloqueando na mesma coluna nem capturando nas colunas vizinhas. Ele é uma ameaça permanente de promoção e obriga o adversário a usar peças para detê-lo.',
          'Nimzowitsch dizia que "o peão passado tem uma vontade irresistível de avançar". Quanto mais longe ele chega, mais força tem, e mais peças adversárias ficam presas à defesa.',
          'Um peão passado afastado, longe dos demais, é especialmente forte nos finais: o rei adversário precisa ir até ele, e enquanto isso o seu rei captura os peões do outro flanco.',
        ],
        example: {
          title: 'O passado que o rei não alcança',
          fen: '8/5kpp/8/P7/8/8/5KPP/8 w - - 0 1',
          moves: ['a6', 'Ke7', 'a7', 'Kd7', 'a8=Q'],
          caption: 'O rei preto está fora do quadrado do peão. O passado afastado promove sozinho.',
        },
      },
      {
        heading: 'Maioria de peões e ruptura',
        paragraphs: [
          'Quando um lado tem mais peões num flanco, tem uma maioria. Uma maioria sadia pode ser transformada num peão passado avançando o peão que não tem adversário à frente, apoiado pelos outros.',
          'Às vezes a criação do passado é tática: uma ruptura com sacrifício de peão abre caminho para que outro passe. A ruptura clássica de três peões contra três, mostrada no exercício desta aula, é um padrão que todo jogador deve conhecer.',
        ],
      },
    ],
    exercises: [
      {
        id: 'est-2-ex1',
        prompt: 'Brancas jogam e criam um peão passado que promove. Os reis estão longe demais para intervir.',
        fen: '7k/ppp5/8/PPP5/8/8/8/7K w - - 0 1',
        solution: ['b6', 'cxb6', 'a6', 'bxa6', 'c6'],
        explanation:
          'A ruptura b6! sacrifica um peão para abrir caminho. Se 1...cxb6, 2.a6! e, depois de 2...bxa6, 3.c6 é imparável. Se 1...axb6, a resposta seria 2.c6. Em todos os casos, um peão branco passa e promove antes que o rei preto chegue.',
      },
      {
        id: 'est-2-ex2',
        prompt: 'Brancas jogam: coloquem a torre atrás do peão passado.',
        fen: 'r7/5kpp/8/P7/8/8/5PPK/4R3 w - - 0 1',
        solution: ['Ra1'],
        explanation:
          'A regra de Tarrasch: a torre fica melhor atrás do peão passado. Em a1, ela apoia o avanço e ganha alcance a cada passo do peão, enquanto a torre preta, à frente dele, fica cada vez mais passiva.',
      },
    ],
  },
  {
    id: 'est-3',
    trackId: 'trilha-estrategia',
    category: 'estrategia',
    title: 'Casas fracas e postos avançados',
    description:
      'Casas que nenhum peão pode defender são pontos de apoio para as peças adversárias. Aprenda a identificá-las, a ocupá-las e a provocá-las.',
    level: 'avancado',
    minutes: 20,
    requires: ['est-2'],
    keyPoints: [
      'Uma casa fraca é aquela que não pode mais ser defendida por peões; avanços de peão criam fraquezas permanentes.',
      'Ocupe a casa fraca com uma peça, de preferência um cavalo, apoiado por um peão.',
      'Troque as peças que defendem as casas fracas, sobretudo o bispo da mesma cor.',
      'Fraquezas de casas em volta do rei transformam-se rapidamente em mate.',
    ],
    sections: [
      {
        heading: 'O que é uma casa fraca',
        paragraphs: [
          'Peões só andam para a frente. Por isso, quando um peão avança, as casas que ele deixava de proteger nunca mais serão protegidas por ele. Se nenhum outro peão puder cobri-las, essas casas são fracas.',
          'Na Siciliana Najdorf com ...e5, as pretas ganham espaço e controle de d4, mas a casa d5 fica permanentemente sem defesa de peões: os peões c e e já não podem protegê-la. Boa parte da luta gira em torno de d5. As brancas querem ocupá-la; as pretas querem controlá-la com peças ou liberá-la com ...d5.',
          'Avaliar um avanço de peão significa perguntar: que casas eu estou entregando? Às vezes o ganho compensa; às vezes cria uma fraqueza que dura a partida inteira.',
        ],
        example: {
          title: 'A casa d5 na Najdorf',
          fen: START,
          moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Be2', 'e5', 'Nb3', 'Be7', 'O-O', 'O-O', 'Be3', 'Be6'],
          caption: 'As pretas controlam d5 com o bispo e o cavalo; as brancas querem dominar a casa com peças.',
          arrows: [
            { from: 'c3', to: 'd5', brush: 'green' },
            { from: 'e6', to: 'd5', brush: 'red' },
            { from: 'f6', to: 'd5', brush: 'red' },
          ],
        },
      },
      {
        heading: 'O posto avançado',
        paragraphs: [
          'Um posto avançado é uma casa fraca do adversário, em geral na quarta, quinta ou sexta fileira (do ponto de vista de quem a ocupa), protegida por um peão próprio. O cavalo é a peça ideal para ocupá-lo, porque tem alcance curto e precisa de casas centrais estáveis.',
          'Na Holandesa Stonewall, as pretas jogam ...f5, ...e6 e ...d5. A casa e5 fica sem defesa de peões pretos e as brancas instalam um cavalo ali. As pretas, por sua vez, usam e4 da mesma forma. As duas estruturas são simétricas em ideia.',
          'Se o adversário só pode desafiar o cavalo com uma peça menor, cada troca deve ser avaliada: muitas vezes recapturar com um peão transforma o posto num peão passado protegido.',
        ],
        example: {
          title: 'O cavalo em e5 contra a Stonewall',
          fen: START,
          moves: ['d4', 'f5', 'g3', 'Nf6', 'Bg2', 'e6', 'Nf3', 'd5', 'O-O', 'Bd6', 'c4', 'c6', 'b3', 'Qe7', 'Ne5'],
          caption: 'Nenhum peão preto pode atacar e5. As brancas planejam Bb2 ou Ba3 para trocar o bispo que defende as casas escuras.',
        },
      },
      {
        heading: 'Criar e explorar fraquezas',
        paragraphs: [
          'Fraquezas raramente aparecem sozinhas; é preciso provocá-las. Ataques a peões obrigam-nos a avançar, e trocas de peças eliminam os defensores das casas.',
          'O caso mais importante é o do bispo que defende as casas em volta do rei. Na Siciliana Dragão, o bispo de g7 é a peça-chave da defesa preta. O plano do Ataque Iugoslavo inclui Be3, Qd2 e Bh6 para trocá-lo: sem ele, as casas f6, g7 e h6 ficam fracas e a dama branca chega perto do rei.',
          'Quando o rei está cercado por casas fracas de uma cor e o adversário não tem mais o bispo dessa cor, a combinação de dama e bispo nessas casas costuma decidir a partida.',
        ],
        example: {
          title: 'Ataque Iugoslavo contra o Dragão',
          fen: START,
          moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6', 'Be3', 'Bg7', 'f3', 'O-O', 'Qd2', 'Nc6', 'Bc4', 'Bd7', 'O-O-O'],
          caption: 'A bateria Be3-Qd2 prepara Bh6 para trocar o bispo de g7, o principal defensor das casas escuras.',
          arrows: [{ from: 'e3', to: 'h6', brush: 'red' }],
        },
      },
    ],
    exercises: [
      {
        id: 'est-3-ex1',
        prompt:
          'Siciliana Sveshnikov: as pretas recapturaram com o peão em f6. Brancas jogam e ocupam o posto avançado que ficou sem defesa de peões.',
        fen: 'r1bqkb1r/5p1p/p1np1p2/1p2p3/4P3/N1N5/PPP2PPP/R2QKB1R w KQkq - 0 10',
        solution: ['Nd5'],
        explanation:
          '10.Nd5 instala o cavalo em d5, casa que nenhum peão preto pode atacar. O cavalo de f6, que defendia a casa, foi trocado, e os peões pretos já não podem atacá-la. As pretas só conseguem contestar o cavalo com peças, por exemplo com ...Bg7 e ...Ne7 para trocá-lo. É a ideia central da linha principal.',
      },
      {
        id: 'est-3-ex2',
        prompt: 'O bispo de casas escuras das pretas desapareceu e as casas f6, g7 e h6 estão fracas. Brancas jogam e dão mate em 2.',
        fen: '5rk1/5p1p/5Bp1/8/8/8/3Q1PPP/6K1 w - - 0 1',
        solution: ['Qh6', 'Ra8', 'Qg7#'],
        checkmate: true,
        explanation:
          'Qh6 ameaça Qg7, protegida pelo bispo de f6. As pretas não têm como defender g7 nem como dar xeque, e qualquer resposta permite Qg7#. As casas escuras em volta do rei preto viraram uma rede de mate.',
      },
    ],
  },
];
