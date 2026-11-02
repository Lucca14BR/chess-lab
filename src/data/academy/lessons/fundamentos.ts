import type { Lesson } from '../types';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const fundamentos: Lesson[] = [
  {
    id: 'fund-1',
    trackId: 'trilha-fundamentos',
    category: 'fundamentos',
    title: 'Movimento e valor das peças',
    description:
      'Como cada peça se move, quais são os lances especiais e por que um cavalo não vale o mesmo que uma torre. A base de toda decisão no tabuleiro.',
    level: 'iniciante',
    minutes: 12,
    requires: [],
    keyPoints: [
      'A dama começa na casa da sua cor; o rei fica ao lado dela. Casa clara sempre no canto direito de cada jogador.',
      'Valores de referência: peão 1, cavalo 3, bispo 3, torre 5, dama 9. O rei não tem preço: perdê-lo é perder a partida.',
      'Roque, en passant e promoção são os três lances especiais; cada um tem condições precisas.',
      'Antes de capturar, pergunte o que você entrega e o que recebe: a troca só é boa quando o saldo é favorável.',
    ],
    sections: [
      {
        heading: 'O tabuleiro e a posição inicial',
        paragraphs: [
          'O tabuleiro tem 64 casas, organizadas em oito colunas (de a até h) e oito fileiras (de 1 até 8). Cada jogador deve ter uma casa clara no canto inferior direito; se o tabuleiro estiver girado, toda a geometria da partida fica errada, inclusive o roque.',
          'Na primeira fileira ficam as peças: torres nos cantos, cavalos ao lado, depois os bispos, e no centro a dama e o rei. A regra prática é "a dama na sua cor": a dama branca começa em d1, casa clara, e a dama preta em d8, casa escura. Na segunda fileira ficam os oito peões.',
          'Essa disposição não é arbitrária. As peças de longo alcance começam presas atrás dos peões, e por isso os primeiros lances da partida servem justamente para abrir caminho para elas. Entender a posição inicial é o primeiro passo para entender por que certos lances de abertura são bons.',
        ],
        example: {
          title: 'Posição inicial',
          fen: START,
          caption: 'Casa clara à direita de cada jogador, dama na casa da sua cor e as brancas sempre começam.',
        },
      },
      {
        heading: 'Como cada peça se move',
        paragraphs: [
          'A torre anda em linhas retas, por colunas e fileiras, quantas casas quiser, desde que o caminho esteja livre. O bispo anda nas diagonais e por isso fica preso à cor da casa onde começou: cada lado tem um bispo de casas claras e um de casas escuras. A dama combina os dois movimentos e é a peça mais poderosa.',
          'O cavalo é a única peça que salta sobre as outras. Ele se move em "L": duas casas em uma direção e uma para o lado. Um detalhe importante: a cada lance o cavalo troca a cor da casa. No centro ele alcança até oito casas; no canto, apenas duas. Daí o ditado "cavalo na borda, cavalo de mau humor".',
          'O rei anda uma casa em qualquer direção e nunca pode ir para uma casa atacada. O peão avança uma casa (ou duas, no seu primeiro lance), mas captura na diagonal, uma casa à frente. Essa diferença entre andar e capturar é a fonte de muitos motivos táticos e estruturais que você vai estudar nas próximas aulas.',
        ],
        example: {
          title: 'O alcance do cavalo centralizado',
          fen: '7k/8/8/8/3N4/8/8/K7 w - - 0 1',
          caption: 'Em d4, o cavalo controla oito casas. Leve-o para a1 e ele controla apenas duas.',
          arrows: [
            { from: 'd4', to: 'b3' },
            { from: 'd4', to: 'b5' },
            { from: 'd4', to: 'c2' },
            { from: 'd4', to: 'c6' },
            { from: 'd4', to: 'e2' },
            { from: 'd4', to: 'e6' },
            { from: 'd4', to: 'f3' },
            { from: 'd4', to: 'f5' },
          ],
        },
      },
      {
        heading: 'Lances especiais: roque, en passant e promoção',
        paragraphs: [
          'O roque é o único lance em que duas peças se movem ao mesmo tempo: o rei anda duas casas em direção à torre e a torre salta para o outro lado do rei. Só é permitido se nem o rei nem a torre se moveram antes, se não houver peças entre eles, se o rei não estiver em xeque e se ele não passar nem parar em casa atacada.',
          'O en passant ("de passagem") existe para impedir que um peão escape de uma captura avançando duas casas. Se um peão adversário avança duas casas e para ao lado do seu peão, você pode capturá-lo como se ele tivesse avançado só uma. Atenção: o direito vale apenas no lance imediatamente seguinte.',
          'A promoção acontece quando um peão chega à última fileira: ele é imediatamente trocado por uma dama, torre, bispo ou cavalo da mesma cor. Quase sempre escolhemos a dama, mas há posições em que promover a outra peça evita um afogamento ou dá um xeque decisivo.',
        ],
        example: {
          title: 'Captura en passant',
          fen: START,
          moves: ['e4', 'Nf6', 'e5', 'd5', 'exd6'],
          caption: 'As pretas avançam ...d5 ao lado do peão de e5. No lance seguinte, exd6 captura o peão como se ele estivesse em d6.',
        },
      },
      {
        heading: 'O valor relativo das peças',
        paragraphs: [
          'Para decidir trocas, usamos uma escala de referência: peão vale 1, cavalo e bispo valem 3, torre vale 5 e dama vale 9. Esses números resumem séculos de experiência sobre o que cada peça costuma fazer numa partida. Uma torre, por exemplo, vale mais que um cavalo porque controla mais casas e domina colunas abertas.',
          'Os valores são um ponto de partida, não uma lei. Um cavalo bem posicionado pode ser mais útil que uma torre presa, e um peão prestes a promover pode valer mais que uma peça. Ainda assim, quem entrega material sem receber algo concreto em troca costuma se arrepender.',
          'Antes de capturar, faça a conta completa: o que você ganha, o que pode perder na recaptura e o que sobra no final da sequência. Trocar sua torre por um bispo, por exemplo, é "perder a qualidade": você entrega 5 e recebe 3. Só faz sentido quando há compensação clara, como um ataque decisivo.',
        ],
        example: {
          title: 'Uma troca desfavorável',
          fen: '6k1/5ppp/4p3/3b4/8/8/5PPP/3R2K1 w - - 0 1',
          moves: ['Rxd5', 'exd5'],
          caption: 'O bispo de d5 está protegido pelo peão de e6. Capturar com a torre entrega 5 pontos por 3.',
        },
      },
    ],
    exercises: [
      {
        id: 'fund-1-ex1',
        prompt: 'Brancas jogam e capturam a peça indefesa de maior valor.',
        fen: '6k1/5ppp/8/3q4/8/8/5PPP/3R2K1 w - - 0 1',
        solution: ['Rxd5'],
        explanation:
          'A dama preta em d5 não tem nenhum defensor e está na mesma coluna da torre. Rxd5 ganha 9 pontos sem contrapartida. Observe também que a dama atacava a torre: deixar de capturar seria perder a torre no lance seguinte.',
      },
      {
        id: 'fund-1-ex2',
        prompt: 'Brancas jogam e ganham o máximo de material possível com o cavalo.',
        fen: '2b1k3/3n4/2r5/4N3/8/8/8/4K3 w - - 0 1',
        solution: ['Nxc6'],
        explanation:
          'O cavalo de e5 ataca a torre de c6 e o cavalo de d7. A torre vale 5 e está indefesa; o cavalo de d7 vale 3 e está protegido pelo bispo e pelo rei. Nxc6 ganha uma torre limpa, enquanto Nxd7 seria apenas uma troca de cavalos.',
      },
      {
        id: 'fund-1-ex3',
        prompt: 'O peão preto acabou de avançar de d7 para d5 dando xeque. Brancas jogam e respondem capturando en passant.',
        fen: '7k/8/2p5/3pP3/4K3/8/8/8 w - d6 0 2',
        solution: ['exd6'],
        explanation:
          'O en passant elimina o peão que dá xeque e ainda cria um peão passado em d6. O rei preto, em h8, está longe demais: depois de exd6 o peão avança até d8 sem que as pretas consigam alcançá-lo. Qualquer lance de rei deixaria o peão de d5 vivo e jogaria fora a vitória.',
      },
    ],
  },
  {
    id: 'fund-2',
    trackId: 'trilha-fundamentos',
    category: 'fundamentos',
    title: 'Xeque, xeque-mate e afogamento',
    description:
      'O objetivo do jogo é o xeque-mate. Aprenda a reconhecer o xeque, as três formas de escapar dele e a diferença crucial entre mate e afogamento.',
    level: 'iniciante',
    minutes: 14,
    requires: ['fund-1'],
    practiceTheme: 'xequeMate',
    keyPoints: [
      'Contra um xeque há só três defesas: mover o rei, capturar a peça que dá xeque ou interpor uma peça.',
      'Xeque-mate é o xeque sem nenhuma dessas três defesas. A partida termina na hora.',
      'Afogamento é quando o lado a jogar não está em xeque e não tem nenhum lance legal: é empate.',
      'Com grande vantagem material, verifique sempre se o adversário ainda tem lances antes de "apertar" o rei.',
    ],
    sections: [
      {
        heading: 'O xeque e as três respostas',
        paragraphs: [
          'Um rei está em xeque quando é atacado por uma peça adversária. O xeque não pode ser ignorado: o jogador é obrigado a resolvê-lo no lance seguinte, e todo lance que deixe o próprio rei em xeque é ilegal.',
          'Há exatamente três maneiras de sair do xeque. Fugir com o rei para uma casa não atacada; capturar a peça que dá o xeque; ou colocar uma peça entre o atacante e o rei. A interposição só é possível contra peças de longo alcance, porque o xeque de cavalo ou de peão não tem casa intermediária.',
          'Ao receber um xeque, liste mentalmente as três opções antes de jogar. Muitas derrotas acontecem porque o jogador foge com o rei por reflexo, quando interpor ou capturar seria muito mais seguro.',
        ],
        example: {
          title: 'Xeque de torre na coluna e',
          fen: '4k3/8/8/1b6/8/8/8/4R1K1 b - - 0 1',
          caption: 'O rei preto está em xeque. As pretas podem fugir (Kd7, Kf7, Kd8, Kf8) ou interpor o bispo em e2.',
          arrows: [{ from: 'e1', to: 'e8', brush: 'red' }],
        },
      },
      {
        heading: 'Xeque-mate: o mate do corredor',
        paragraphs: [
          'Xeque-mate é um xeque contra o qual não existe defesa. O rei não pode fugir, a peça atacante não pode ser capturada e não há como interpor. Nesse momento a partida termina, independentemente do material que cada lado tenha.',
          'Um dos padrões mais frequentes é o mate do corredor (ou da última fileira). O rei roqueado fica atrás dos seus próprios peões intactos; uma torre ou dama que chega à última fileira dá xeque e os peões impedem a fuga. É por isso que, em algum momento do meio-jogo, abrir uma "janela" para o rei com h3 ou g3 é tão importante.',
          'Ao procurar mates, observe as casas de fuga do rei inimigo. Se todas estão ocupadas por peças dele mesmo ou controladas pelas suas, basta encontrar um xeque que não possa ser bloqueado nem capturado.',
        ],
        example: {
          title: 'Mate do corredor',
          fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
          moves: ['Ra8#'],
          caption: 'Os peões de f7, g7 e h7 aprisionam o próprio rei. Ra8 é mate.',
        },
      },
      {
        heading: 'O mate pastor e o ponto f7',
        paragraphs: [
          'No início da partida, o ponto mais fraco das pretas é f7 (e o das brancas, f2), porque é defendido apenas pelo rei. O mate pastor explora exatamente isso: dama e bispo miram f7 juntos e, se o adversário não reagir, a dama captura com mate.',
          'O padrão é útil para entender uma ideia geral: duas peças atacando uma casa defendida só uma vez. Saber reconhecer a ameaça é mais importante do que tentar aplicá-la, porque contra uma defesa correta a dama que saiu cedo apenas perde tempo.',
        ],
        example: {
          title: 'O mate pastor',
          fen: START,
          moves: ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7#'],
          caption: 'Com 3...Nf6, as pretas atacam a dama mas esquecem f7. Qxf7 é mate, protegido pelo bispo de c4.',
          arrows: [{ from: 'c4', to: 'f7', brush: 'red' }],
        },
      },
      {
        heading: 'Afogamento: o empate inesperado',
        paragraphs: [
          'Afogamento (ou rei afogado) acontece quando o jogador da vez não está em xeque, mas não possui nenhum lance legal. A partida termina empatada, mesmo que um lado tenha uma dama a mais.',
          'O afogamento aparece sobretudo nos finais, quando o lado mais forte aperta o rei adversário sem perceber que lhe tirou todas as casas. A dama, por controlar muitas casas ao mesmo tempo, é a peça que mais causa afogamentos acidentais.',
          'A prevenção é simples: antes de cada lance num final ganho, pergunte "depois do meu lance, o adversário tem algum movimento?". Se a resposta for não e não houver xeque, procure outro lance.',
        ],
        example: {
          title: 'Uma vitória jogada fora',
          fen: 'k7/8/1K6/8/8/8/2Q5/8 w - - 0 1',
          moves: ['Qc7'],
          caption: 'Depois de Qc7, o rei preto não está em xeque e não tem casa nenhuma: afogamento. Em vez disso, Qc8 seria mate, pois o rei de b6 cobre a7 e b7 e a dama controla b8.',
        },
      },
    ],
    exercises: [
      {
        id: 'fund-2-ex1',
        prompt: 'Encontre o mate em 1.',
        fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
        solution: ['Rd8#'],
        checkmate: true,
        explanation:
          'A coluna d está aberta e o rei preto não tem casa de fuga: os próprios peões bloqueiam f7, g7 e h7. Rd8 é o mate do corredor.',
      },
      {
        id: 'fund-2-ex2',
        prompt: 'Encontre o mate em 1.',
        fen: '5rk1/5pp1/8/7Q/8/3B4/5PPP/6K1 w - - 0 1',
        solution: ['Qh7#'],
        checkmate: true,
        explanation:
          'A dama entra em h7 protegida pelo bispo de d3. O rei não pode capturá-la, f8 está ocupada pela própria torre, e f7 e g7 têm peões pretos. É um padrão clássico de dama e bispo contra o roque sem o peão h.',
      },
      {
        id: 'fund-2-ex3',
        prompt: 'Brancas jogam e dão mate em 1. Cuidado: vários lances de dama afogam o rei.',
        fen: '7k/8/5K2/6Q1/8/8/8/8 w - - 0 1',
        solution: ['Qg7#'],
        checkmate: true,
        explanation:
          'Qg7 dá xeque e está protegida pelo rei de f6, então o rei preto não pode capturá-la. Compare com Qg6, que deixaria o rei preto sem lances e sem xeque: afogamento e empate.',
      },
    ],
  },
  {
    id: 'fund-3',
    trackId: 'trilha-fundamentos',
    category: 'fundamentos',
    title: 'Princípios de abertura: centro, desenvolvimento e roque',
    description:
      'Três ideias que orientam os primeiros lances de qualquer abertura. Com elas você joga bem mesmo sem ter decorado teoria.',
    level: 'iniciante',
    minutes: 15,
    requires: ['fund-2'],
    keyPoints: [
      'Ocupe ou controle o centro (e4, d4, e5, d5): peças centralizadas alcançam os dois lados do tabuleiro.',
      'Desenvolva cavalos e bispos antes de mover a dama ou repetir lances com a mesma peça.',
      'Faça o roque cedo para proteger o rei e conectar as torres.',
      'Cada lance de abertura deve cumprir um objetivo; lances de peão laterais sem propósito custam tempo.',
    ],
    sections: [
      {
        heading: 'Por que o centro importa',
        paragraphs: [
          'As quatro casas centrais (e4, d4, e5, d5) são as mais valiosas do tabuleiro. Uma peça no centro controla mais casas e pode se deslocar rapidamente para qualquer flanco. Quem domina o centro limita a mobilidade do adversário e decide onde a batalha vai acontecer.',
          'Por isso os lances 1.e4 e 1.d4 são os mais populares: ocupam o centro e abrem diagonais para a dama e os bispos. O adversário responde disputando as mesmas casas, seja com peões (1...e5, 1...d5), seja com peças que as controlam à distância.',
          'Controlar não é o mesmo que ocupar. Um cavalo em f3 controla e5 e d4 sem estar no centro; isso também é jogar pelo centro.',
        ],
        example: {
          title: 'Disputa pelo centro',
          fen: START,
          moves: ['e4', 'e5', 'Nf3', 'Nc6'],
          caption: 'Os peões ocupam o centro e os cavalos se desenvolvem atacando e defendendo e5.',
          arrows: [
            { from: 'f3', to: 'e5', brush: 'red' },
            { from: 'c6', to: 'e5', brush: 'green' },
          ],
        },
      },
      {
        heading: 'Desenvolvimento: peças menores primeiro',
        paragraphs: [
          'Desenvolver é tirar as peças da posição inicial e colocá-las em casas ativas. Cavalos e bispos vêm primeiro porque são fáceis de mobilizar e não correm risco de ser perseguidos com ganho de tempo.',
          'A dama, por ser valiosa, é um alvo. Se ela sai cedo, o adversário a ataca com peças menores, desenvolvendo-se a cada lance enquanto você recua. Ao fim dessa sequência, ele tem várias peças em jogo e você tem apenas uma dama que andou muito.',
          'Uma regra prática: na abertura, evite mover a mesma peça duas vezes sem necessidade e evite lances de peão que não ajudam o centro nem o desenvolvimento.',
        ],
        example: {
          title: 'A dama precoce perde tempo',
          fen: START,
          moves: ['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'g6', 'Qf3', 'Nf6'],
          caption: 'A dama branca já fez dois lances e precisa de mais um para se sentir segura. As pretas desenvolveram com conforto.',
        },
      },
      {
        heading: 'Roque cedo',
        paragraphs: [
          'O rei no centro é vulnerável: quando as colunas centrais se abrem com as trocas de peões, torres e damas chegam rapidamente até ele. O roque leva o rei para um canto protegido por peões e, ao mesmo tempo, traz a torre para o centro.',
          'Depois do roque e do desenvolvimento das peças menores, as duas torres ficam "conectadas", isto é, protegem-se mutuamente na primeira fileira. Esse é um bom sinal de que a abertura terminou e de que é hora de pensar em planos de meio-jogo.',
        ],
        example: {
          title: 'Desenvolvimento harmonioso',
          fen: START,
          moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O', 'Nf6', 'd3', 'O-O'],
          caption: 'Os dois lados centralizaram, desenvolveram as peças menores e fizeram o roque em dez lances.',
        },
      },
      {
        heading: 'Erros típicos de abertura',
        paragraphs: [
          'O erro mais grave é enfraquecer o rei sem necessidade. Os peões f e g protegem o roque; movê-los cedo abre diagonais que levam direto ao rei. O exemplo extremo é o "mate do louco", o mate mais rápido possível no xadrez.',
          'Outros erros comuns: capturar peões laterais com a dama atrasando o desenvolvimento, deixar peças sem defesa e esquecer de fazer o roque quando o centro já está aberto. Antes de cada lance, verifique se ele desenvolve, disputa o centro ou protege o rei. Se não fizer nada disso, provavelmente há um lance melhor.',
        ],
        example: {
          title: 'O mate do louco',
          fen: START,
          moves: ['f3', 'e5', 'g4', 'Qh4#'],
          caption: 'f3 e g4 abriram a diagonal e1-h4. A dama preta dá mate no segundo lance.',
        },
      },
    ],
    exercises: [
      {
        id: 'fund-3-ex1',
        prompt:
          'A dama e o bispo brancos miram f7. Pretas jogam: fechem a diagonal da dama com um peão e, depois do novo ataque a f7, defendam desenvolvendo o cavalo do rei.',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3',
        solution: ['g6', 'Qf3', 'Nf6'],
        explanation:
          '3...g6 bloqueia a diagonal h5-f7 e ameaça expulsar a dama. Depois de 4.Qf3, a ameaça Qxf7 volta, mas 4...Nf6 a impede com um lance de desenvolvimento: o cavalo fecha a coluna f. As pretas ficam bem, e a dama branca já gastou três lances.',
      },
      {
        id: 'fund-3-ex2',
        prompt: 'A dama preta saiu cedo para d5. Brancas jogam: desenvolvam uma peça atacando a dama.',
        fen: 'rnb1kbnr/ppp1pppp/8/3q4/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3',
        solution: ['Nc3'],
        explanation:
          'Nc3 desenvolve o cavalo e ataca a dama ao mesmo tempo. As pretas precisam gastar mais um lance para salvá-la, e as brancas ganham um tempo de desenvolvimento. Bc4 também atacaria a dama, mas o bispo seria simplesmente capturado.',
      },
    ],
  },
];
