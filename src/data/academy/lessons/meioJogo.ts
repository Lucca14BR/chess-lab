import type { Lesson } from '../types';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const YUGOSLAVO = ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6', 'Be3', 'Bg7', 'f3', 'O-O', 'Qd2', 'Nc6', 'Bc4', 'Bd7', 'O-O-O', 'Rc8', 'Bb3', 'Ne5', 'h4'];

export const meioJogo: Lesson[] = [
  {
    id: 'mei-1',
    trackId: 'trilha-meio-jogo',
    category: 'meio-jogo',
    title: 'Colunas abertas e torres',
    description:
      'As torres precisam de linhas abertas para trabalhar. Aprenda a ocupar e disputar colunas abertas, dobrar torres e invadir a sétima fileira.',
    level: 'intermediario',
    minutes: 18,
    requires: ['est-1', 'tat-1'],
    practiceTheme: 'combinacao',
    keyPoints: [
      'Coluna aberta é a que não tem peões; semiaberta é a que tem apenas peões adversários.',
      'Ocupe a coluna aberta primeiro e, se possível, dobre as torres para dominá-la.',
      'O objetivo da coluna é a invasão: a sétima fileira (ou a segunda, para as pretas) é o alvo natural.',
      'Torres dobradas na sétima fileira costumam decidir a partida contra um rei roqueado.',
    ],
    sections: [
      {
        heading: 'Ocupar a coluna aberta',
        paragraphs: [
          'A torre é uma peça de linhas: atrás dos peões ela não faz nada. Por isso, depois do desenvolvimento das peças menores, a primeira pergunta é onde estão as colunas abertas ou que podem se abrir.',
          'Ocupar primeiro uma coluna aberta dá controle sobre as casas de entrada no campo adversário. Se o adversário contestar com a sua própria torre, quem tem mais peças apoiando a coluna, ou quem pode recapturar melhor, costuma ficar com ela.',
          'Escolha qual torre levar pensando no futuro: a torre que deixa a outra livre para uma segunda coluna, ou que mantém o rei protegido, geralmente é a correta.',
        ],
        example: {
          title: 'A luta pela coluna d',
          fen: 'r4rk1/pp3ppp/2p1bn2/8/8/2N1BN2/PPP2PPP/R4RK1 w - - 0 1',
          moves: ['Rad1', 'Rfd8'],
          caption: 'As colunas d e e estão abertas. Os dois lados levam uma torre para a coluna d.',
        },
      },
      {
        heading: 'Dobrar as torres',
        paragraphs: [
          'Duas torres na mesma coluna se protegem e multiplicam a pressão. Se o adversário disputa a coluna com uma única torre, a troca deixa você com a coluna; se não disputa, a invasão fica muito mais fácil.',
          'A dama também pode participar da bateria. Uma dama atrás de duas torres numa coluna aberta é uma das formações mais fortes do meio-jogo.',
        ],
        example: {
          title: 'Dobrando na coluna d',
          fen: '2r2rk1/pp3ppp/2p1bn2/8/8/2N1BN2/PPP2PPP/R4RK1 w - - 0 1',
          moves: ['Rad1', 'Rfe8', 'Rd2', 'Kf8', 'Rfd1'],
          caption: 'As brancas dobram as torres na única coluna aberta que as pretas não contestaram.',
        },
      },
      {
        heading: 'A sétima fileira',
        paragraphs: [
          'A coluna aberta é o caminho; a sétima fileira é o destino. Uma torre na sétima ataca os peões que ainda estão na posição inicial e confina o rei adversário à última fileira.',
          'Com duas torres na sétima, a ameaça muda de natureza: elas se protegem mutuamente, capturam peões com xeque e frequentemente dão mate. Os jogadores chamam essas torres de "porcos" porque comem tudo o que encontram.',
          'Ao planejar a invasão, verifique a segurança da sua própria última fileira. Uma torre que vai para a sétima deixa de defender a primeira, e o mate do corredor contra você pode vir antes.',
        ],
        example: {
          title: 'Torre na sétima',
          fen: '1r4k1/R4ppp/8/8/8/7P/5PP1/6K1 w - - 0 1',
          caption: 'A torre de a7 ataca f7 e prende o rei preto na última fileira. O peão em h3 dá ao rei branco uma janela contra ...Rb1+.',
          arrows: [{ from: 'a7', to: 'f7', brush: 'red' }],
        },
      },
      {
        heading: 'Abrir colunas com rupturas',
        paragraphs: [
          'Quando não há colunas abertas, você pode criá-las. Uma ruptura de peão, como c4-c5 ou b4-b5, troca peões e abre uma linha para as torres. O lado que preparou a ruptura, com as torres já posicionadas atrás do peão, colhe os frutos.',
          'O ataque de minoria da estrutura Carlsbad é o exemplo clássico: b4-b5 abre a coluna b ou c para as torres brancas, que então atacam a fraqueza criada em c6.',
        ],
      },
    ],
    exercises: [
      {
        id: 'mei-1-ex1',
        prompt: 'Brancas jogam: aproveitem a coluna d aberta e levem a torre à sétima fileira.',
        fen: '2r3k1/pp3ppp/8/8/8/7P/PP3PP1/3R2K1 w - - 0 1',
        solution: ['Rd7'],
        explanation:
          'Rd7 ocupa a sétima, ataca b7 e prende o rei preto. Repare na casa h3: graças a ela, a resposta ...Rc1+ não é mate, porque o rei tem a fuga h2. Sem esse cuidado, a invasão seria um desastre.',
      },
      {
        id: 'mei-1-ex2',
        prompt: 'Duas torres na sétima. Brancas jogam e dão mate em 3.',
        fen: '5rk1/1RR3pp/8/8/8/8/5PPP/6K1 w - - 0 1',
        solution: ['Rxg7+', 'Kh8', 'Rxh7+', 'Kg8', 'Rbg7#'],
        checkmate: true,
        explanation:
          'Rxg7+ força Kh8, porque a torre de g7 está protegida pela de b7 e f8 está ocupada. Rxh7+ devolve o rei a g8, e Rbg7 é mate: as torres em g7 e h7 se protegem e cobrem todas as casas de fuga.',
      },
    ],
  },
  {
    id: 'mei-2',
    trackId: 'trilha-meio-jogo',
    category: 'meio-jogo',
    title: 'Ataque ao rei',
    description:
      'Quando atacar, como abrir linhas e quais padrões de mate procurar. Inclui o sacrifício clássico em h7 e o mate de Boden.',
    level: 'avancado',
    minutes: 22,
    requires: ['mei-1', 'tat-2'],
    practiceTheme: 'sacrificio',
    keyPoints: [
      'Ataque quando tiver mais peças perto do rei adversário do que ele tem para defender, e com o centro estável.',
      'Com roques opostos, o ataque com peões é rápido: cada tempo conta.',
      'Troque os defensores-chave do rei, em especial o cavalo de f6 e o bispo do fianqueto.',
      'O sacrifício em h7 exige bispo em d3, cavalo que chegue a g5 e dama que chegue a h5, sem defensor em f6.',
    ],
    sections: [
      {
        heading: 'Condições para o ataque',
        paragraphs: [
          'Um ataque ao rei não nasce da vontade, e sim da posição. As condições típicas são: superioridade de peças na região do rei, um centro fechado ou controlado (para que o adversário não contra-ataque pelo meio) e alguma fraqueza na proteção do rei.',
          'Com roques em lados opostos, a situação muda: avançar os peões contra o rei adversário não expõe o seu próprio rei. O Ataque Iugoslavo contra o Dragão é o modelo. As brancas fazem o roque grande e lançam h4-h5 e g4, enquanto as pretas contra-atacam na coluna c. Quem chegar primeiro geralmente vence.',
        ],
        example: {
          title: 'Iugoslavo: começa a corrida',
          fen: START,
          moves: YUGOSLAVO,
          caption: 'h4 inicia o avanço contra o rei preto; as pretas responderão na coluna c e com ...Nc4.',
          arrows: [{ from: 'h4', to: 'h5', brush: 'red' }],
        },
      },
      {
        heading: 'Abrir linhas e eliminar defensores',
        paragraphs: [
          'Os peões de ataque servem para abrir colunas: o objetivo de h4-h5 é trocar o peão g6 e abrir a coluna h para a torre e a dama. Por isso o defensor costuma responder ...h5, segurando o avanço, como na Variante Soltis.',
          'Em paralelo, é preciso enfraquecer os defensores. Bg5 ou Bh6 buscam trocar o cavalo de f6 e o bispo de g7. Sem eles, as casas em volta do rei ficam sem proteção e as peças pesadas entram.',
          'Um ataque bem-sucedido é uma soma de pequenos ganhos: uma coluna aberta, um defensor trocado, uma peça a mais na região. Só então chega a hora do golpe tático.',
        ],
        example: {
          title: 'Variante Soltis',
          fen: START,
          moves: [...YUGOSLAVO, 'h5', 'Bg5', 'Rc5', 'Kb1', 'b5'],
          caption: '...h5 freia o avanço branco. Bg5 mira o cavalo de f6, defensor-chave do rei.',
        },
      },
      {
        heading: 'Padrões de mate e o sacrifício em h7',
        paragraphs: [
          'Conhecer padrões de mate acelera o cálculo: você reconhece o desenho antes de calcular cada lance. O mais básico é dama e cavalo contra h7: o cavalo em g5 protege a dama, que dá mate quando o rei não tem casas.',
          'O "presente grego", Bxh7+, é a forma de chegar a esse padrão quando o peão h7 ainda está no lugar. Depois de Kxh7, Ng5+ e Qh5 trazem duas peças com tempo para cima do rei. Funciona quando não há cavalo em f6 para defender h7 e quando as pretas não conseguem eliminar o cavalo de g5 com facilidade.',
          'Outro padrão clássico é o mate de Boden: dois bispos em diagonais cruzadas contra um rei roqueado na ala da dama, muitas vezes depois de um sacrifício de dama que abre a diagonal.',
        ],
        example: {
          title: 'Dama e cavalo contra h7',
          fen: 'r4rk1/ppp2ppp/8/6N1/8/3Q4/PPP2PPP/R5K1 w - - 0 1',
          moves: ['Qxh7#'],
          caption: 'A dama captura em h7 protegida pelo cavalo. As casas f7, g7 e f8 estão ocupadas pelas próprias peças pretas.',
        },
      },
      {
        heading: 'Quando não atacar',
        paragraphs: [
          'Um ataque sem as condições necessárias entrega material e enfraquece a sua própria posição. Se o centro está aberto e móvel, o adversário contra-ataca pelo meio enquanto as suas peças estão longe.',
          'Antes de lançar peões contra o rei, compare: quantas peças minhas podem chegar à região em dois ou três lances, e quantas o adversário consegue trazer para defender? Se a resposta não for claramente favorável, melhore a posição primeiro.',
        ],
      },
    ],
    exercises: [
      {
        id: 'mei-2-ex1',
        prompt:
          'O cavalo de f6 foi expulso e o bispo preto está longe de g5. Brancas jogam: façam o sacrifício em h7, deem xeque com o cavalo e tragam a dama para h5.',
        fen: 'r1bq1rk1/pppn1ppp/2n1p3/3pP3/1b1P4/2NB1N2/PPP2PPP/R1BQ1RK1 w - - 0 1',
        solution: ['Bxh7+', 'Kxh7', 'Ng5+', 'Kg8', 'Qh5'],
        explanation:
          'Bxh7+ arranca o peão que protegia o rei; Ng5+ obriga o rei a voltar para g8; Qh5 ameaça Qh7#. As pretas precisam entregar a dama com ...Qxg5 ou aceitar um ataque decisivo. Se 2...Kg6, a dama entra com Qd3+ ou Qg4, e se 3...Kh6, Nxe6+ descobre o ataque do bispo de c1.',
      },
      {
        id: 'mei-2-ex2',
        prompt: 'Encontre o mate em 2.',
        fen: '2kr3r/pp1nqppp/2n5/8/5B2/5Q2/PPP1BPPP/R5K1 w - - 0 1',
        solution: ['Qxc6+', 'bxc6', 'Ba6#'],
        checkmate: true,
        explanation:
          'Qxc6+ entrega a dama para abrir a diagonal a6-c8. Depois de bxc6, forçado, Ba6 é o mate de Boden: o bispo de a6 dá xeque e cobre b7, o bispo de f4 controla b8 e c7, e d7 e d8 estão ocupadas pelas peças pretas.',
      },
    ],
  },
  {
    id: 'mei-3',
    trackId: 'trilha-meio-jogo',
    category: 'meio-jogo',
    title: 'Transição para o final',
    description:
      'Saber quando trocar peças é tão importante quanto saber atacar. Aprenda a converter vantagens simplificando para finais ganhos.',
    level: 'avancado',
    minutes: 18,
    requires: ['mei-2', 'fin-2'],
    keyPoints: [
      'Com vantagem material, troque peças, não peões: quanto menos material, mais pesa a vantagem.',
      'Antes de trocar para um final de peões, conte os tempos: esses finais não perdoam erros.',
      'O peão passado afastado e o rei ativo são as vantagens mais importantes nos finais.',
      'Quem está pior deve evitar trocas e manter peças que criem complicações.',
    ],
    sections: [
      {
        heading: 'Quando trocar',
        paragraphs: [
          'A regra geral é simples: quem tem vantagem material quer trocar peças, quem está atrás quer evitar trocas. Com uma peça a mais e poucas peças no tabuleiro, o adversário não tem como criar contrajogo.',
          'Troque peças, não peões. Cada peão trocado aproxima a posição do empate, porque reduz o material com que você pode promover. O ideal é chegar a um final em que a sua peça extra atua contra peões e o rei adversário não consegue defender tudo.',
          'Uma troca de torres com xeque, por exemplo, pode transformar uma vitória técnica longa numa vitória simples: cavalo e rei contra peões, sem nenhuma peça pesada para incomodar.',
        ],
        example: {
          title: 'Simplificar com uma peça a mais',
          fen: '3rk3/5ppp/8/8/8/2N5/5PPP/3R2K1 w - - 0 1',
          moves: ['Rxd8+', 'Kxd8'],
          caption: 'Depois da troca de torres, as pretas não têm peças para criar contrajogo contra o cavalo a mais.',
        },
      },
      {
        heading: 'Finais de peões: conte os tempos',
        paragraphs: [
          'O final de peões é o mais concreto de todos. Não existem peças para corrigir erros, e um único tempo decide entre vitória e empate. Por isso, antes de trocar a última peça, calcule a corrida dos reis e dos peões.',
          'O fator mais importante costuma ser o peão passado afastado. Ele atrai o rei adversário para um flanco, enquanto o seu rei vai ao outro lado capturar os peões que ficaram sem proteção.',
          'O segundo fator é a atividade do rei. Num final de peões o rei é uma peça de ataque: quem centraliza primeiro costuma ditar o resultado.',
        ],
        example: {
          title: 'O peão afastado desvia o rei',
          fen: '8/1k3ppp/8/P7/8/8/5PPP/6K1 w - - 0 1',
          caption: 'O rei preto precisa vigiar o peão a; o rei branco fica livre para atacar os peões do flanco do rei.',
          arrows: [
            { from: 'g1', to: 'f2', brush: 'green' },
            { from: 'b7', to: 'a6', brush: 'yellow' },
          ],
        },
      },
      {
        heading: 'Avaliar o final antes de entrar nele',
        paragraphs: [
          'Nem todo final com material a mais é ganho. Finais de bispos de cores opostas, de torre com um peão a mais no mesmo flanco ou de peão de torre com o bispo da cor errada são frequentemente empatados.',
          'Antes de simplificar, pergunte: o final resultante está entre os que eu sei ganhar? Se a resposta for duvidosa, talvez seja melhor manter as peças e aumentar a vantagem no meio-jogo.',
          'Para o lado que defende, vale o raciocínio inverso: buscar justamente esses finais teóricos de empate, ou manter peças suficientes para criar ameaças e complicações.',
        ],
      },
    ],
    exercises: [
      {
        id: 'mei-3-ex1',
        prompt: 'Brancas jogam: troquem as torres para entrar num final de peões ganho e, em seguida, ativem o rei.',
        fen: '3rk3/5ppp/8/8/P7/8/5PPP/3R1K2 w - - 0 1',
        solution: ['Rxd8+', 'Kxd8', 'Ke2'],
        explanation:
          'Com as torres, o peão extra exigiria uma técnica longa. Depois de Rxd8+ Kxd8, o peão a passado e afastado decide: o rei preto precisa correr para a ala da dama e o rei branco, centralizado com Ke2 e Kd3, invade pelo outro lado.',
      },
      {
        id: 'mei-3-ex2',
        prompt: 'As brancas têm um cavalo a mais. Brancas jogam: troquem as damas e depois aproximem o rei do centro.',
        fen: '6k1/5pp1/4p2p/3q4/8/1Q3N2/5PPP/6K1 w - - 0 1',
        solution: ['Qxd5', 'exd5', 'Kf1'],
        explanation:
          'Sem as damas, as pretas perdem toda chance de xeques perpétuos ou ataques ao rei branco. O final de cavalo contra peões é técnica simples: o rei vai ao centro com Kf1 e Ke2, e o cavalo ataca os peões pretos.',
      },
    ],
  },
];
