import type { Lesson } from '../types';

export const finais: Lesson[] = [
  {
    id: 'fin-1',
    trackId: 'trilha-finais',
    category: 'finais',
    title: 'Mates básicos: dama e torre',
    description:
      'Dar mate com dama ou torre contra o rei sozinho é uma técnica obrigatória. Aprenda o método, a coordenação com o rei e como evitar o afogamento.',
    level: 'iniciante',
    minutes: 15,
    requires: ['fund-3'],
    practiceTheme: 'xequeMate',
    keyPoints: [
      'O rei adversário precisa ser empurrado para a borda; o mate só acontece lá.',
      'Com a dama, encurrale o rei a um salto de cavalo de distância e depois traga o seu rei.',
      'Com a torre, use o rei em oposição e a torre na fileira ou coluna de corte; lances de espera com a torre resolvem a paridade.',
      'Com duas torres, a "escada" empurra o rei fileira por fileira sem precisar do rei.',
    ],
    sections: [
      {
        heading: 'O mate de dama',
        paragraphs: [
          'A dama sozinha não dá mate: ela precisa da ajuda do rei. O método mais seguro é usar a dama para reduzir o espaço do rei adversário, colocando-a a um salto de cavalo dele e acompanhando cada movimento. Assim o rei vai sendo empurrado até a borda sem receber xeques inúteis.',
          'Quando o rei adversário estiver preso na borda, pare de mexer a dama e traga o seu rei. O mate acontece quando a dama dá xeque na borda e o seu rei cobre as casas de fuga, ou quando a dama fica colada ao rei inimigo, protegida pelo seu.',
          'O perigo constante é o afogamento: a dama tira muitas casas ao mesmo tempo. Sempre que o rei adversário tiver apenas uma ou duas casas, confira se depois do seu lance ainda lhe resta algum movimento.',
        ],
        example: {
          title: 'O mate final com a dama',
          fen: 'k7/8/1K6/8/8/8/7Q/8 w - - 0 1',
          moves: ['Qh8#'],
          caption: 'O rei branco cobre a7 e b7; a dama dá xeque na oitava fileira e controla b8.',
        },
      },
      {
        heading: 'O mate de torre',
        paragraphs: [
          'Com a torre o método exige mais paciência. A torre corta o rei adversário numa fileira ou coluna, e o seu rei se aproxima até ficar em oposição, isto é, de frente para o rei inimigo com uma casa entre eles. Nesse momento, um xeque de torre na borda é mate.',
          'Quando o rei adversário foge da oposição, você não deve persegui-lo com xeques. Em vez disso, faça um lance de espera com a torre, mantendo o corte. O rei inimigo é obrigado a voltar para a frente do seu, e o mate chega.',
          'Na prática, o mate de torre leva no máximo cerca de dezesseis lances a partir de qualquer posição. Treine-o até conseguir fazê-lo sem pensar.',
        ],
        example: {
          title: 'Rei em oposição e xeque na borda',
          fen: '4k3/8/4K3/8/8/8/8/R7 w - - 0 1',
          moves: ['Ra8#'],
          caption: 'O rei de e6 cobre d7, e7 e f7. A torre dá xeque na oitava fileira e controla d8 e f8.',
        },
      },
      {
        heading: 'A escada de duas torres',
        paragraphs: [
          'Com duas torres (ou dama e torre), o rei não é necessário. Uma torre corta uma fileira e a outra dá xeque na fileira seguinte; depois elas trocam de função, e o rei adversário desce um degrau a cada par de lances.',
          'Se o rei inimigo se aproximar de uma das torres, leve-a para o outro lado do tabuleiro, longe dele, e continue a escada. A técnica é mecânica e não deixa chance de afogamento se for aplicada com cuidado.',
        ],
        example: {
          title: 'O último degrau',
          fen: '6k1/R7/8/8/8/8/8/1R4K1 w - - 0 1',
          moves: ['Rb8#'],
          caption: 'A torre de a7 corta a sétima fileira e a torre de b8 dá o mate na oitava.',
        },
      },
      {
        heading: 'Cuidado com o afogamento',
        paragraphs: [
          'O afogamento é o erro mais caro dos mates básicos, porque transforma uma vitória em empate num único lance. Ele acontece sobretudo quando o rei adversário está num canto e a dama ou a torre tiram as últimas casas sem dar xeque.',
          'O hábito que evita o problema é contar as casas do rei inimigo depois de cada lance seu. Se não sobrar nenhuma e não houver xeque, procure outro lance: sempre existe uma alternativa que mantém a vitória.',
        ],
        example: {
          title: 'Afogamento no canto',
          fen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1',
          caption: 'As pretas jogam, não estão em xeque e não têm lances: empate. Com o rei branco em g6, a dama em g7 ou em f8 daria mate.',
        },
      },
    ],
    exercises: [
      {
        id: 'fin-1-ex1',
        prompt: 'Os reis estão em oposição. Brancas jogam e dão mate em 1.',
        fen: '2k5/8/2K5/8/8/8/8/7R w - - 0 1',
        solution: ['Rh8#'],
        checkmate: true,
        explanation:
          'O rei de c6 cobre b7, c7 e d7. Rh8 dá xeque na oitava fileira e controla b8 e d8. É exatamente a posição de mate que o método da torre procura.',
      },
      {
        id: 'fin-1-ex2',
        prompt: 'Brancas jogam e dão mate em 2. Não persiga o rei com xeques: use um lance de corte.',
        fen: '3k4/8/2K5/8/8/8/8/7R w - - 0 1',
        solution: ['Re1', 'Kc8', 'Re8#'],
        checkmate: true,
        explanation:
          'Re1 corta a coluna e e tira do rei preto as casas e7 e e8. A única casa restante é c8, de frente para o rei branco, e Re8 é mate. Um xeque imediato em h8 apenas empurraria o rei para e7.',
      },
    ],
  },
  {
    id: 'fin-2',
    trackId: 'trilha-finais',
    category: 'finais',
    title: 'Rei e peão: oposição e regra do quadrado',
    description:
      'Os finais de rei e peão são a base de todos os outros. Aprenda a regra do quadrado, a oposição e as exceções do peão de torre.',
    level: 'intermediario',
    minutes: 18,
    requires: ['fin-1'],
    keyPoints: [
      'Regra do quadrado: se o rei entra no quadrado do peão, consegue alcançá-lo.',
      'Oposição: reis de frente com uma casa entre eles; quem não tem a vez de jogar "tem a oposição".',
      'Com o rei à frente do peão e a oposição, o lado mais forte ganha; com o rei defensor à frente do peão, em geral é empate.',
      'O peão de torre empata com frequência, porque o rei defensor no canto não pode ser expulso.',
    ],
    sections: [
      {
        heading: 'A regra do quadrado',
        paragraphs: [
          'Para saber se um rei alcança um peão passado sem precisar calcular lance a lance, desenhe mentalmente um quadrado: um lado vai do peão até a casa de promoção, e o quadrado se completa em direção ao rei. Se o rei estiver dentro do quadrado (ou puder entrar nele no lance que lhe cabe), alcança o peão.',
          'A regra vale quando o peão está sozinho, sem ajuda do próprio rei. Lembre-se de que o peão em sua casa inicial pode avançar duas casas: nesse caso, conte o quadrado a partir da terceira fileira.',
        ],
        example: {
          title: 'O rei entra no quadrado',
          fen: '8/8/8/5k2/1P6/8/8/K7 b - - 0 1',
          moves: ['Ke6', 'b5', 'Kd6', 'b6', 'Kc6', 'b7', 'Kxb7'],
          caption: 'O quadrado do peão b4 vai de b4 a f8. O rei em f5 está dentro dele e alcança o peão.',
        },
      },
      {
        heading: 'A oposição',
        paragraphs: [
          'Dois reis nunca podem ficar em casas vizinhas. Quando estão de frente, numa mesma coluna ou fileira com uma casa entre eles, o jogador que precisa mover é obrigado a ceder terreno. Dizemos que o outro tem a oposição.',
          'No final de rei e peão contra rei, ganhar a oposição permite ao rei atacante chegar às casas-chave à frente do peão. Com o rei na sexta fileira à frente do peão, o atacante vence em qualquer caso; com o rei na quinta, depende de quem tem a oposição.',
          'No exemplo, o rei branco está na quinta fileira à frente do peão e as pretas são obrigadas a jogar. Elas cedem passagem, o rei branco chega à sexta fileira e escolta o peão até a promoção.',
        ],
        example: {
          title: 'Quem joga, cede',
          fen: '8/4k3/8/4K3/4P3/8/8/8 b - - 0 1',
          moves: ['Kd7', 'Kf6', 'Kd6', 'e5+', 'Kd7', 'Kf7', 'Kd8', 'e6', 'Kc7', 'e7', 'Kb6', 'e8=Q'],
          caption: 'Com as pretas na vez, as brancas têm a oposição: o rei preto cede, o branco ocupa f6 e o peão promove. Com as brancas na vez, seria empate.',
        },
      },
      {
        heading: 'O peão de torre',
        paragraphs: [
          'O peão de torre é a grande exceção. O rei defensor que chega ao canto de promoção não pode ser expulso: o rei atacante só consegue tirar-lhe casas à custa de afogá-lo.',
          'Por isso, num final de rei e peão de torre contra rei, basta ao defensor alcançar o canto. Essa regra vale também para alguns finais com peças, como o de bispo e peão de torre quando o bispo não controla a casa de promoção.',
        ],
        example: {
          title: 'Empate no canto',
          fen: 'k7/8/1K6/P7/8/8/8/8 w - - 0 1',
          moves: ['a6', 'Kb8', 'a7+', 'Ka8', 'Ka6'],
          caption: 'O rei preto não está em xeque e não tem lances: afogamento. O peão de torre não consegue promover.',
        },
      },
    ],
    exercises: [
      {
        id: 'fin-2-ex1',
        prompt: 'Brancas jogam e ganham. Encontre o único lance que conquista a oposição.',
        fen: '8/8/3k4/8/8/3PK3/8/8 w - - 0 1',
        solution: ['Kd4'],
        explanation:
          'Kd4 coloca os reis frente a frente na coluna d, com as pretas na vez. Elas precisam ceder, e o rei branco avança para a quinta fileira à frente do peão. O peão de d3 ainda guarda um lance de espera para recuperar a oposição quando for preciso. Lances como Ke4 ou Kf4 deixam a oposição com as pretas e empatam.',
      },
      {
        id: 'fin-2-ex2',
        prompt: 'Pretas jogam e empatam: entrem no quadrado do peão e alcancem-no.',
        fen: '8/8/8/8/P7/5k2/8/7K b - - 0 1',
        solution: ['Ke4', 'a5', 'Kd5', 'a6', 'Kc6', 'a7', 'Kb7'],
        explanation:
          'O quadrado do peão a4 vai de a4 a e8. De f3, a única casa dentro dele é e4. A partir daí o rei segue na diagonal, sempre dentro do quadrado, e chega a b7 a tempo. Qualquer outro primeiro lance perde.',
      },
    ],
  },
  {
    id: 'fin-3',
    trackId: 'trilha-finais',
    category: 'finais',
    title: 'Finais de torre: Lucena e Philidor',
    description:
      'Os finais de torre são os mais frequentes na prática. Duas posições teóricas resolvem a maior parte deles: Lucena para ganhar e Philidor para empatar.',
    level: 'avancado',
    minutes: 25,
    requires: ['fin-2'],
    keyPoints: [
      'Philidor: o defensor mantém a torre na terceira fileira contada do seu lado até o peão avançar; então dá xeques por trás.',
      'Lucena: com o peão na sétima e o rei à frente dele, o atacante constrói uma "ponte" com a torre na quarta fileira.',
      'Torre ativa vale mais que um peão: uma torre passiva costuma perder.',
      'A torre fica melhor atrás do peão passado, seja o seu ou o do adversário.',
    ],
    sections: [
      {
        heading: 'A defesa de Philidor',
        paragraphs: [
          'Quando o rei defensor está na frente do peão adversário, existe um método simples de empate. A torre se coloca na terceira fileira a partir do seu lado (a sexta, quando o defensor é das pretas) e impede que o rei atacante avance para essa fileira.',
          'Enquanto o peão não chega à sexta, o rei atacante não consegue apoiá-lo. Se o peão avança para a sexta, ele já não oferece abrigo ao seu rei, e a torre defensora vai imediatamente para a primeira fileira e passa a dar xeques por trás. O rei atacante não tem onde se esconder.',
          'O erro típico do defensor é colocar a torre passivamente na última fileira cedo demais. Nesse caso o rei atacante chega à sexta e a posição geralmente se perde.',
        ],
        example: {
          title: 'Philidor: sexta fileira, depois xeques por trás',
          fen: '4k3/7R/r7/4PK2/8/8/8/8 b - - 0 1',
          moves: ['Rb6', 'e6', 'Rb1', 'Kf6', 'Rf1+'],
          caption: 'Enquanto o peão estava em e5, a torre segurava a sexta. Com o peão em e6, ela desce e começa os xeques.',
        },
      },
      {
        heading: 'A posição de Lucena',
        paragraphs: [
          'A Lucena é a posição vencedora mais importante dos finais de torre: o peão está na sétima fileira, o rei atacante está à frente dele e o rei defensor está cortado a pelo menos uma coluna de distância. O problema é tirar o rei do caminho do peão sem levar xeques infinitos.',
          'A solução é "construir uma ponte". Primeiro, um xeque de torre afasta ainda mais o rei defensor. Depois, a torre vai para a quarta fileira. O rei sai na direção da torre inimiga, que dá xeques; quando o rei chega à quinta fileira, a torre se interpõe na quarta, e os xeques acabam.',
          'Memorize a ideia, não os lances: xeque para cortar, torre na quarta, rei sai em zigue-zague e a torre bloqueia.',
        ],
        example: {
          title: 'Construindo a ponte',
          fen: '1K6/1P1k4/8/8/8/8/r7/2R5 w - - 0 1',
          moves: ['Rd1+', 'Ke7', 'Rd4', 'Ra1', 'Kc7', 'Rc1+', 'Kb6', 'Rb1+', 'Kc6', 'Rc1+', 'Kb5', 'Rb1+', 'Rb4'],
          caption: 'Depois de Rb4 os xeques acabam, e o peão promove.',
        },
      },
      {
        heading: 'Princípios gerais dos finais de torre',
        paragraphs: [
          'A atividade é o fator mais importante. Uma torre ativa, que ataca peões e limita o rei adversário, costuma compensar um peão a menos. Uma torre passiva, presa à defesa, frequentemente perde mesmo com material igual.',
          'A regra de Tarrasch vale aqui com força total: a torre deve ficar atrás dos peões passados. Atrás do seu, ela ganha alcance a cada avanço; atrás do adversário, ela o vigia sem se tornar passiva.',
          'Por fim, o rei deve participar. Nos finais de torre, o rei cortado a duas ou mais colunas do peão adversário geralmente chega tarde demais para defender.',
        ],
      },
    ],
    exercises: [
      {
        id: 'fin-3-ex1',
        prompt:
          'Posição de Lucena, depois do xeque que afastou o rei preto. Brancas jogam: construam a ponte com a torre na quarta fileira e, depois, saiam com o rei por c7.',
        fen: '1K6/1P2k3/8/8/8/8/r7/3R4 w - - 0 1',
        solution: ['Rd4', 'Ke6', 'Kc7'],
        explanation:
          'Rd4 prepara o bloqueio dos xeques. Depois de Kc7, se as pretas derem xeques pela coluna c, o rei branco vai a b6, c6 e b5 e a torre se interpõe em c4 ou b4. Sem xeques, o peão promove.',
      },
      {
        id: 'fin-3-ex2',
        prompt:
          'Pretas jogam e empatam pelo método de Philidor: levem a torre à sexta fileira e, quando o peão avançar para e6, desçam para a primeira para dar xeques por trás.',
        fen: 'r3k3/7R/8/4PK2/8/8/8/8 b - - 0 1',
        solution: ['Ra6', 'e6', 'Ra1'],
        explanation:
          'Ra6 impede Kf6 e Ke6. Se as brancas avançam com e6, o rei branco perde o abrigo do peão, e Ra1 prepara xeques intermináveis por trás. A posição é empate.',
      },
    ],
  },
];
