import type { Lesson } from '../types';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const aberturas: Lesson[] = [
  {
    id: 'abe-1',
    trackId: 'trilha-aberturas',
    category: 'aberturas',
    title: 'Desenvolvimento e tempos',
    description:
      'Na abertura, cada lance é um tempo. Aprenda a ganhar tempos desenvolvendo com ameaças, a reconhecer quando o adversário os desperdiça e o que um gambito realmente compra.',
    level: 'iniciante',
    minutes: 15,
    requires: ['fund-3'],
    keyPoints: [
      'Um tempo é um lance útil. Desenvolver atacando uma peça adversária ganha tempo, porque obriga o outro a reagir.',
      'A dama que sai cedo vira alvo: cada ataque a ela é um tempo de desenvolvimento para o adversário.',
      'Gambito é a troca de material por tempo e iniciativa; só funciona se o tempo for usado com energia.',
      'A abertura termina quando as peças menores estão em jogo, o rei está seguro e as torres se conectam.',
    ],
    sections: [
      {
        heading: 'O que é um tempo',
        paragraphs: [
          'Os jogadores alternam lances, e o primeiro a completar o desenvolvimento costuma ditar o rumo da partida. Por isso falamos em "tempos": cada lance que melhora a posição é um tempo bem usado; cada lance que não acrescenta nada, ou que precisa ser desfeito, é um tempo perdido.',
          'A forma mais eficiente de ganhar tempo é desenvolver uma peça com uma ameaça. Se o seu cavalo sai atacando a dama adversária, você melhorou a sua posição e, ao mesmo tempo, obrigou o adversário a gastar o lance seguinte reagindo, sem desenvolver nada.',
          'Na Defesa Escandinava, por exemplo, depois de 1.e4 d5 2.exd5 Qxd5 as brancas jogam 3.Nc3 com ataque à dama. As pretas precisam movê-la de novo, e as brancas chegam à posição seguinte com uma peça a mais desenvolvida.',
        ],
        example: {
          title: 'Ganho de tempo na Escandinava',
          fen: START,
          moves: ['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5', 'd4', 'Nf6', 'Nf3'],
          caption: 'A dama preta fez três lances; as brancas usaram esse tempo para colocar dois cavalos e um peão central em jogo.',
        },
      },
      {
        heading: 'A dama exposta como alvo',
        paragraphs: [
          'A mesma lógica funciona ao contrário. Quando o adversário captura cedo com a dama no centro, ela pode ser atacada por peças menores que se desenvolvem com tempo. A dama não pode ser trocada por um cavalo, então sempre precisa fugir.',
          'No Gambito do Centro (1.e4 e5 2.d4 exd4 3.Qxd4), as pretas respondem 3...Nc6, desenvolvendo e atacando a dama. Não é um erro grave das brancas, mas mostra o preço da dama precoce: as pretas ganham um tempo e seguem com 4...Nf6, atacando e4.',
          'A pergunta útil ao avaliar uma abertura é sempre: quem está desenvolvendo e quem está apenas reagindo?',
        ],
        example: {
          title: 'Gambito do Centro',
          fen: START,
          moves: ['e4', 'e5', 'd4', 'exd4', 'Qxd4', 'Nc6', 'Qe3', 'Nf6'],
          caption: 'As pretas desenvolvem os dois cavalos com ameaças; a dama branca já se moveu duas vezes.',
        },
      },
      {
        heading: 'Gambitos: material por tempo',
        paragraphs: [
          'Um gambito entrega material, normalmente um peão, em troca de tempo, centro ou linhas abertas. A ideia é que o adversário gaste lances capturando e defendendo o material, enquanto você mobiliza as peças e ataca.',
          'O Gambito Evans é um exemplo clássico. Depois de 4.b4 Bxb4 5.c3 Ba5 6.d4, as brancas entregaram um peão, mas ganharam tempo contra o bispo e construíram um centro forte. Se não usarem essa vantagem com energia, ficarão apenas com um peão a menos.',
          'Ao aceitar um gambito, a regra é: devolva o material se for preciso para completar o desenvolvimento e proteger o rei. Ao jogar um gambito, a regra é: cada lance deve aumentar a pressão; lances lentos dão ao adversário tempo para consolidar.',
        ],
        example: {
          title: 'Gambito Evans',
          fen: START,
          moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4', 'Bxb4', 'c3', 'Ba5', 'd4'],
          caption: 'O peão b foi entregue. Em troca, c3 atacou o bispo com tempo e d4 conquistou o centro.',
          arrows: [
            { from: 'd4', to: 'e5', brush: 'red' },
            { from: 'c4', to: 'f7', brush: 'red' },
          ],
        },
      },
      {
        heading: 'Quando a abertura termina',
        paragraphs: [
          'A abertura não termina num número fixo de lances. Ela termina quando os objetivos foram cumpridos: peças menores desenvolvidas, rei em segurança e torres conectadas. A partir daí, o jogo passa a ser decidido por planos, e não por desenvolvimento.',
          'No Gambito da Dama Ortodoxo, depois de 9.Bxc4, as brancas têm todas as peças menores ativas, mas ainda precisam fazer o roque. As pretas, já roqueadas, buscam liberar o jogo com ...Nd5 ou ...c5. Reconhecer em que fase a partida está ajuda a escolher o tipo de lance certo.',
        ],
        example: {
          title: 'Gambito da Dama Ortodoxo',
          fen: START,
          moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3', 'Nbd7', 'Rc1', 'c6', 'Bd3', 'dxc4', 'Bxc4'],
          caption: 'As brancas desenvolveram tudo com lógica. As pretas trocaram em c4 de propósito: o bispo gastou um tempo extra para recapturar.',
        },
      },
    ],
    exercises: [
      {
        id: 'abe-1-ex1',
        prompt:
          'A dama branca capturou cedo em d4. Pretas jogam: desenvolvam o cavalo da dama atacando-a e, depois da retirada, desenvolvam o cavalo do rei atacando e4.',
        fen: 'rnbqkbnr/pp1ppppp/8/8/3QP3/8/PPP2PPP/RNB1KBNR b KQkq - 0 3',
        solution: ['Nc6', 'Qd3', 'Nf6'],
        explanation:
          '3...Nc6 desenvolve com ameaça e obriga a dama a se mover de novo. Depois de 4.Qd3, 4...Nf6 desenvolve mais uma peça e pressiona e4. As pretas ganharam um tempo de desenvolvimento só por causa da dama exposta.',
      },
      {
        id: 'abe-1-ex2',
        prompt:
          'Gambito Evans: as pretas aceitaram o peão. Brancas jogam: ataquem o bispo com um peão e, depois da retirada, ocupem o centro.',
        fen: 'r1bqk1nr/pppp1ppp/2n5/4p3/1bB1P3/5N2/P1PP1PPP/RNBQK2R w KQkq - 0 5',
        solution: ['c3', 'Ba5', 'd4'],
        explanation:
          '5.c3 ganha tempo contra o bispo e prepara d4. Depois de 5...Ba5, 6.d4 ataca e5 e abre linhas para as peças brancas. Esse é o retorno pelo peão entregue: desenvolvimento acelerado e centro.',
      },
    ],
  },
  {
    id: 'abe-2',
    trackId: 'trilha-aberturas',
    category: 'aberturas',
    title: 'Estruturas centrais: as ideias de 1.e4 e 1.d4',
    description:
      'Por trás das aberturas existem estruturas de peões que definem os planos. Veja como os jogos abertos, as cadeias de peões e o centro hipermoderno orientam o meio-jogo.',
    level: 'intermediario',
    minutes: 18,
    requires: ['abe-1'],
    keyPoints: [
      '1.e4 tende a gerar posições abertas, com jogo rápido de peças e ataques diretos.',
      '1.d4 tende a gerar posições fechadas ou semiabertas, com manobras e pressão no flanco da dama.',
      'Numa cadeia de peões, ataque a base: é o ponto que sustenta toda a estrutura.',
      'No centro hipermoderno, um lado cede o centro para atacá-lo depois com peças e rupturas.',
    ],
    sections: [
      {
        heading: '1.e4 e o jogo aberto',
        paragraphs: [
          'Depois de 1.e4 e5, os dois lados têm diagonais abertas para os bispos e a luta é rápida. A Abertura Italiana mostra o plano típico das brancas: preparar d4 com c3 para construir um centro de peões em e4 e d4.',
          'Quando as pretas trocam em d4 e as brancas recapturam com o peão c, surge o centro clássico. Ele dá espaço e controle de casas, mas também pode ser alvo: as pretas atacam com ...d5 ou com xeques de bispo que forçam concessões.',
          'Em posições abertas, desenvolvimento e iniciativa valem mais do que pequenas vantagens estruturais. Um tempo perdido pode significar um ataque decisivo contra o rei.',
        ],
        example: {
          title: 'Italiana: o centro clássico',
          fen: START,
          moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4', 'exd4', 'cxd4', 'Bb4+'],
          caption: 'As brancas formaram o centro e4-d4. As pretas respondem com xeque para desorganizar o desenvolvimento antes de golpear com ...d5.',
        },
      },
      {
        heading: '1.d4 e o Gambito da Dama',
        paragraphs: [
          'Com 1.d4 d5, o peão de d4 está protegido pela dama desde o início, e o jogo costuma ser mais lento. O lance característico é 2.c4: as brancas oferecem um peão lateral para desviar o peão d5 do centro.',
          'Se as pretas mantêm o ponto d5 com ...e6, surge uma posição sólida em que as brancas pressionam d5 com Nc3 e cravam o cavalo de f6 com Bg5. As pretas precisam completar o desenvolvimento e, mais tarde, liberar o jogo com ...c5 ou ...e5.',
          'O tipo de vantagem também muda: em vez de ataques rápidos, as brancas buscam espaço, pressão na coluna c e ganhos estruturais de longo prazo.',
        ],
        example: {
          title: 'Gambito da Dama Recusado',
          fen: START,
          moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7'],
          caption: 'A pressão sobre d5 e a cravada em f6 caracterizam a posição. ...Be7 desfaz a cravada.',
        },
      },
      {
        heading: 'Cadeias de peões: ataque a base',
        paragraphs: [
          'Na Defesa Francesa Avanço, depois de 3.e5 surge uma cadeia de peões: d4 sustenta e5, que avança no flanco do rei. A cadeia divide o tabuleiro: as brancas têm espaço no flanco do rei e as pretas jogam no flanco da dama.',
          'A regra de Nimzowitsch diz que uma cadeia deve ser atacada na base. Aqui a base é d4: se ela cair, e5 perde o apoio. Por isso as pretas jogam imediatamente ...c5, seguido de ...Nc6 e ...Qb6, acumulando pressão sobre d4.',
          'As brancas defendem a base com c3 e Nf3, e muitas vezes trocam em c5 no momento certo. Entender quem ataca qual ponto da cadeia é mais útil do que decorar a ordem exata dos lances.',
        ],
        example: {
          title: 'Francesa Avanço',
          fen: START,
          moves: ['e4', 'e6', 'd4', 'd5', 'e5', 'c5', 'c3', 'Nc6', 'Nf3', 'Qb6'],
          caption: 'Peão, cavalo e dama pretos atacam d4, a base da cadeia branca.',
          arrows: [
            { from: 'c5', to: 'd4', brush: 'red' },
            { from: 'c6', to: 'd4', brush: 'red' },
            { from: 'b6', to: 'd4', brush: 'red' },
          ],
        },
      },
      {
        heading: 'O centro hipermoderno',
        paragraphs: [
          'Algumas defesas não ocupam o centro de imediato. Na Índia do Rei, as pretas deixam as brancas construírem um grande centro com c4, d4 e e4, desenvolvem o bispo em g7 e só então atacam com ...e5 ou ...c5.',
          'A ideia é que um centro grande também é uma responsabilidade: precisa ser defendido, e quando um peão avança deixa casas fracas para trás. Depois de ...e5, se as brancas fecharem com d5, a partida se divide em dois planos: as brancas atacam no flanco da dama, as pretas no flanco do rei com ...f5.',
        ],
        example: {
          title: 'Índia do Rei',
          fen: START,
          moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5'],
          caption: 'As pretas cederam o centro e agora o desafiam com ...e5, com o bispo de g7 pronto para atuar na diagonal longa.',
        },
      },
    ],
    exercises: [
      {
        id: 'abe-2-ex1',
        prompt:
          'Francesa Avanço. Pretas jogam: ataquem a base da cadeia de peões branca e, depois de c3, aumentem a pressão sobre d4 com uma peça menor.',
        fen: 'rnbqkbnr/ppp2ppp/4p3/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3',
        solution: ['c5', 'c3', 'Nc6'],
        explanation:
          '3...c5 ataca d4, a base que sustenta e5. Depois de 4.c3, 4...Nc6 acrescenta mais um atacante. As pretas costumam seguir com ...Qb6, e as brancas precisam de Nf3 e às vezes Be2 ou a3 para manter o centro.',
      },
      {
        id: 'abe-2-ex2',
        prompt:
          'Gambito da Dama. Brancas jogam: desenvolvam uma peça que pressione d5 e, em seguida, cravem o cavalo que defende d5.',
        fen: 'rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3',
        solution: ['Nc3', 'Nf6', 'Bg5'],
        explanation:
          '3.Nc3 é o terceiro atacante de d5. Depois de 3...Nf6, que defende o ponto, 4.Bg5 crava o cavalo contra a dama de d8: enquanto a cravada existir, o cavalo não defende d5 com liberdade.',
      },
      {
        id: 'abe-2-ex3',
        prompt:
          'Italiana. Brancas jogam: executem a ruptura central preparada por c3 e recapturem formando o centro de peões.',
        fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2P2N2/PP1P1PPP/RNBQK2R w KQkq - 1 5',
        solution: ['d4', 'exd4', 'cxd4'],
        explanation:
          '5.d4 ataca e5 e o bispo de c5 indiretamente. Depois de 5...exd4, 6.cxd4 forma o centro e4-d4 e ganha tempo contra o bispo. As pretas costumam responder 6...Bb4+ e depois atacar o centro com ...d5.',
      },
    ],
  },
  {
    id: 'abe-3',
    trackId: 'trilha-aberturas',
    category: 'aberturas',
    title: 'Como estudar um repertório',
    description:
      'Escolher aberturas coerentes, aprender planos em vez de sequências decoradas, conhecer as armadilhas típicas e revisar o que você estudou de forma sistemática.',
    level: 'intermediario',
    minutes: 20,
    requires: ['abe-2', 'tat-1'],
    practiceTheme: 'xequeMate',
    keyPoints: [
      'Escolha aberturas que levem a posições que você gosta de jogar, e não apenas as da moda.',
      'Para cada linha, saiba responder: qual é a estrutura, onde vão as peças e qual é o plano típico.',
      'Conheça as armadilhas da sua abertura, para aplicá-las e, principalmente, para não cair nelas.',
      'Revise com regularidade e compare suas partidas com a teoria: o repertório vive das suas próprias partidas.',
    ],
    sections: [
      {
        heading: 'Escolher pelo estilo',
        paragraphs: [
          'Um repertório é um conjunto coerente de aberturas: uma resposta para cada lance principal do adversário. A escolha deve partir do tipo de posição que você joga melhor. Quem gosta de táticas e iniciativa se sente em casa na Siciliana; quem prefere estruturas estáveis e manobras pode preferir a Caro-Kann ou o Gambito da Dama Recusado.',
          'Coerência também significa economia. Aberturas que compartilham estruturas reduzem o volume de estudo: as mesmas ideias de peões e planos aparecem em linhas diferentes, e o que você aprende numa serve para a outra.',
          'Evite trocar de repertório a cada derrota. Uma abertura só começa a render quando você acumula partidas nela e conhece as posições que surgem depois da teoria.',
        ],
        example: {
          title: 'Siciliana Najdorf: escolha combativa',
          fen: START,
          moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
          caption: 'Uma das aberturas mais ricas e teóricas. Adequada a quem aceita posições desequilibradas e muito cálculo.',
        },
      },
      {
        heading: 'Planos, não sequências',
        paragraphs: [
          'Decorar vinte lances de teoria sem entender o porquê deixa você desarmado quando o adversário sai do roteiro. O que permanece útil é o conhecimento da estrutura de peões e dos planos que ela sugere.',
          'Um bom exemplo é a estrutura Carlsbad, que surge na Variante das Trocas do Gambito da Dama. As brancas têm peões em a2, b2 e d4 contra a7, b7, c6 e d5. O plano clássico é o ataque de minoria: avançar b4-b5 para trocar o peão b pelo peão c6 e deixar as pretas com uma fraqueza em c6 ou d5.',
          'Ao estudar uma linha, registre três coisas: a estrutura típica, as casas ideais das peças e as rupturas de peão de cada lado. Com isso você consegue jogar posições que nunca viu.',
        ],
        example: {
          title: 'Estrutura Carlsbad',
          fen: START,
          moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'cxd5', 'exd5', 'Bg5', 'c6', 'e3', 'Be7', 'Bd3', 'O-O', 'Qc2', 'Nbd7', 'Nf3', 'Re8', 'O-O', 'Nf8', 'Rab1'],
          caption: 'Rab1 prepara b4-b5: o ataque de minoria. Dois peões brancos atacam três pretos para criar uma fraqueza.',
          arrows: [
            { from: 'b2', to: 'b4', brush: 'green' },
            { from: 'b4', to: 'b5', brush: 'green' },
          ],
        },
      },
      {
        heading: 'Armadilhas que você precisa conhecer',
        paragraphs: [
          'Toda abertura tem armadilhas típicas. Conhecê-las tem duas funções: aproveitar o erro do adversário quando ele acontece e, sobretudo, não cair nelas. Elas também ensinam padrões táticos que reaparecem em muitas posições.',
          'O mate de Légal é o exemplo mais famoso. As brancas parecem entregar a dama, mas o cavalo e o bispo coordenados dão mate ao rei preto, cercado pelas próprias peças. A lição geral é que capturar a dama não vale nada se o rei fica sem defesa.',
        ],
        example: {
          title: 'O mate de Légal',
          fen: START,
          moves: ['e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Bg4', 'Nc3', 'g6', 'Nxe5', 'Bxd1', 'Bxf7+', 'Ke7', 'Nd5#'],
          caption: 'Depois de 5...Bxd1?, Bxf7+ e Nd5 dão mate. O correto era 5...dxe5, ainda que as pretas percam um peão.',
        },
      },
      {
        heading: 'Construir e revisar',
        paragraphs: [
          'Organize o repertório por estrutura e por plano, não só por sequência de lances. Para cada abertura, mantenha algumas partidas modelo de jogadores fortes: elas mostram como as ideias funcionam até o final.',
          'Depois de cada partida, compare o que você jogou com a teoria e anote o ponto onde saiu do caminho. Esse é o lugar exato a estudar. A repetição espaçada ajuda a manter as linhas na memória: revise poucas linhas por dia, com frequência, em vez de longas sessões esporádicas.',
          'Por fim, seja honesto com as armadilhas da sua própria abertura. Na Caro-Kann, por exemplo, uma ordem de lances descuidada leva a um mate sufocado em seis lances.',
        ],
        example: {
          title: 'Caro-Kann: o mate em d6',
          fen: START,
          moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Nd7', 'Qe2', 'Ngf6', 'Nd6#'],
          caption: 'O peão de e7 está cravado pela dama de e2 e não pode capturar o cavalo. O rei fica sufocado pelas próprias peças.',
        },
      },
    ],
    exercises: [
      {
        id: 'abe-3-ex1',
        prompt: 'As pretas acabaram de capturar a dama em d1. Brancas jogam e dão mate em 2.',
        fen: 'rn1qkbnr/ppp2p1p/3p2p1/4N3/2B1P3/2N5/PPPP1PPP/R1BbK2R w KQkq - 0 6',
        solution: ['Bxf7+', 'Ke7', 'Nd5#'],
        checkmate: true,
        explanation:
          'Bxf7+ força Ke7, a única casa. Nd5 dá xeque e cobre f6; o cavalo de e5 controla d7 e protege o bispo de f7, que por sua vez domina e6 e e8. As casas d8, f8 e d6 estão ocupadas pelas próprias peças pretas: é mate, mesmo com a dama branca já perdida.',
      },
      {
        id: 'abe-3-ex2',
        prompt: 'Caro-Kann. As pretas acabaram de jogar ...Ngf6. Brancas jogam e dão mate em 1.',
        fen: 'r1bqkb1r/pp1npppp/2p2n2/8/3PN3/8/PPP1QPPP/R1B1KBNR w KQkq - 3 6',
        solution: ['Nd6#'],
        checkmate: true,
        explanation:
          'O peão de e7 não pode capturar em d6 porque está cravado pela dama de e2 na coluna e. O rei preto não tem casas: d7 e f8 estão ocupadas pelas próprias peças, d8 pela dama e f7 e e7 por peões.',
      },
      {
        id: 'abe-3-ex3',
        prompt:
          'Armadilha Blackburne-Shilling: as brancas capturaram tudo o que puderam e bloquearam o xeque com o bispo. Pretas jogam e dão mate em 1.',
        fen: 'r1b1kbnr/pppp1Npp/8/8/3nq3/8/PPPPBP1P/RNBQKR2 b Qkq - 1 7',
        solution: ['Nf3#'],
        checkmate: true,
        explanation:
          'Nf3 dá xeque e não pode ser capturado: o bispo de e2 está cravado pela dama de e4 e o peão g já desapareceu. O rei branco não tem casas: d1 está ocupada pela dama e f1 pela torre. É o final típico da armadilha que começa com 3...Nd4 4.Nxe5?.',
      },
    ],
  },
];
