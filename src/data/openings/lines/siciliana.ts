import type { Opening } from '../types';

export const siciliana: Opening = {
  id: 'siciliana',
  name: 'Defesa Siciliana',
  eco: ['B20', 'B21', 'B22', 'B23', 'B33', 'B40', 'B46', 'B48', 'B70', 'B76', 'B90', 'B94', 'B96'],
  side: 'black',
  mainLine: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6',
  summary:
    'A resposta mais combativa a 1.e4. Ao jogar 1...c5, as pretas controlam d4 sem simetria e, depois da troca do peão c pelo peão d, ficam com dois peões centrais contra um. O resultado são posições desequilibradas, em que as brancas costumam atacar o rei e as pretas contra-atacam na ala da dama.',
  ideas: [
    'A troca ...cxd4 entrega às pretas uma maioria central (peões d e e contra apenas o peão e branco), uma vantagem estrutural de longo prazo.',
    'A coluna c semiaberta é a avenida natural do contra-jogo preto: torre em c8, dama em c7 ou a5 e sacrifícios típicos como ...Rxc3.',
    'O desequilíbrio é intencional: as brancas ganham desenvolvimento e espaço, as pretas ganham estrutura e jogo dinâmico. Isso cria chances reais de vitória com as peças pretas.',
    'O sistema escolhido pelas pretas (Najdorf, Dragão, Sveshnikov, Taimanov) define a estrutura e, portanto, os planos; vale estudar um deles a fundo em vez de vários superficialmente.',
  ],
  plansWhite: [
    'Rocar grande e lançar os peões da ala do rei com f3, g4, h4 e g5 (Ataque Inglês e Ataque Iugoslavo), abrindo linhas contra o rei preto.',
    'Ocupar e explorar a casa d5 com Nd5 e Bc4 ou Be2-f3, principalmente quando as pretas jogarem ...e5.',
    'Contra o Dragão, trocar o bispo de g7 com Be3, Qd2 e Bh6, eliminando o principal defensor do rei preto.',
    'Nos sistemas anti-sicilianos (Alapin, Fechada, Smith-Morra), evitar a teoria principal e jogar por um centro forte ou por desenvolvimento rápido.',
  ],
  plansBlack: [
    'Expandir na ala da dama com ...a6, ...b5 e ...b4, expulsando o cavalo de c3 e enfraquecendo o apoio a e4.',
    'Usar a coluna c: ...Rc8, ...Qc7 ou ...Qa5 e, quando houver chance, o sacrifício de qualidade ...Rxc3 para destruir a estrutura do roque grande branco.',
    'Na estrutura com ...e5, controlar d5 com ...Be6, ...Nbd7-b6 e ...Rc8, e preparar a ruptura libertadora ...d5.',
    'No Dragão, ocupar a grande diagonal com o bispo de g7 e combinar ...Ne5-c4 com o avanço ...b5.',
    'Na estrutura Scheveningen (...e6 e ...d6), manter a solidez e preparar as rupturas ...d5 ou ...e5 no momento certo.',
  ],
  suitability:
    'Indicada para quem joga para ganhar com as pretas e aceita posições agudas e desequilibradas. É a defesa que mais exige estudo: a teoria das linhas principais é extensa e muda com frequência, e as brancas têm muitos sistemas alternativos. Em compensação, ensina iniciativa, contra-ataque e cálculo. Quem prefere estruturas estáveis e menos teoria tende a se sentir melhor com a Caro-Kann ou a Francesa.',
  lines: [
    {
      name: 'Najdorf: 6.Bg5',
      moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 e6 f4 Be7 Qf3 Qc7 O-O-O Nbd7',
      comment:
        'Uma das linhas mais agudas da Siciliana. As brancas rocam grande e preparam e5 ou f5 para abrir o centro contra o rei preto. As pretas mantêm o rei no centro por alguns lances, preparam ...b5 e ...Bb7 e usam a coluna c. Exige cálculo concreto de ambos os lados.',
    },
    {
      name: 'Dragão: Ataque Iugoslavo',
      moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O Qd2 Nc6 Bc4 Bd7 O-O-O',
      comment:
        'Uma corrida de ataques em alas opostas. As brancas planejam Bh6, h4-h5 e a abertura da coluna h; as pretas respondem com ...Rc8, ...Ne5-c4 e o sacrifício de qualidade em c3. Um tempo perdido decide a partida.',
    },
    {
      name: 'Sveshnikov',
      moves: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6 Bg5 a6 Na3 b5 Bxf6 gxf6 Nd5 f5',
      comment:
        'As pretas aceitam o buraco em d5 e peões dobrados em troca do par de bispos, peões centrais móveis e atividade. O cavalo branco de a3 está fora de jogo, e as pretas buscam ...f5 e ...Bg7 para pressionar o centro. As brancas tentam dominar d5 e reativar o cavalo por c2-e3.',
    },
    {
      name: 'Taimanov',
      moves: 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7 Be3 a6 Qd2 Nf6 O-O-O',
      comment:
        'Sistema flexível, com a dama em c7 e o desenvolvimento adiado para não oferecer alvos. As pretas podem escolher entre ...Bb4, ...Be7 e ...d6 conforme a configuração branca. A Variante Kan (4...a6) segue a mesma filosofia, mas mantém o cavalo de b8 em casa por mais tempo.',
    },
    {
      name: 'Variante Alapin (2.c3)',
      moves: 'e4 c5 c3 Nf6 e5 Nd5 d4 cxd4 Nf3 Nc6 cxd4 d6 Bc4 Nb6 Bb5 dxe5 Nxe5 Bd7',
      comment:
        'As brancas preparam d4 com o peão c para ter um centro de peões e evitar a teoria da Siciliana Aberta. As pretas atacam o peão e5 com o cavalo e com ...d6, e a posição costuma levar a um peão isolado branco em d4 ou a um jogo de peças equilibrado.',
    },
    {
      name: 'Siciliana Fechada',
      moves: 'e4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7 d3 d6 f4 e6 Nf3 Nge7 O-O O-O',
      comment:
        'As brancas mantêm o centro fechado e preparam o ataque na ala do rei com f4-f5, Be3 e Qd2. As pretas expandem na ala da dama com ...Rb8, ...b5 e ...b4. O Ataque Grand Prix (2.Nc3 seguido de 3.f4 e Bb5 ou Bc4) segue a mesma ideia com jogo mais direto.',
    },
    {
      name: 'Gambito Smith-Morra',
      moves: 'e4 c5 d4 cxd4 c3 dxc3 Nxc3 Nc6 Nf3 d6 Bc4 e6 O-O Nf6 Qe2 Be7 Rd1',
      comment:
        'As brancas entregam um peão por desenvolvimento rápido e colunas abertas, com as torres em c1 e d1. As pretas precisam desenvolver com cuidado, evitar abrir o jogo cedo demais e devolver o peão no momento certo. Na prática, é uma arma perigosa para quem não conhece as defesas.',
    },
  ],
  traps: [
    {
      name: 'Armadilha Siberiana (Smith-Morra)',
      moves: 'e4 c5 d4 cxd4 c3 dxc3 Nxc3 Nc6 Nf3 e6 Bc4 Qc7 O-O Nf6 Qe2 Ng4 h3 Nd4 Nxd4 Qh2#',
      beneficiary: 'black',
      explanation:
        'Com a dama preta em c7 apontando para h2 e o cavalo em g4, o natural 9.h3?? é um erro fatal. Depois de 9...Nd4!, a dama branca é atacada; se 10.Nxd4, o cavalo de f3 abandona a defesa de h2 e 10...Qh2# é mate. O correto é 9.Rd1, ocupando a coluna d e só depois expulsando o cavalo com h3, quando a casa d4 já estiver controlada.',
    },
    {
      name: 'Armadilha de Magnus Smith',
      moves: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 d6 Bc4 g6 Nxc6 bxc6 e5 dxe5 Bxf7+ Kxf7 Qxd8',
      beneficiary: 'white',
      explanation:
        'No Dragão Clássico com o bispo branco em c4, o avanço 8.e5 ataca o cavalo de f6. Se as pretas capturarem 8...dxe5?, a coluna d se abre e 9.Bxf7+! desvia o rei: depois de 9...Kxf7, 10.Qxd8 ganha a dama. As defesas corretas são 8...Ng4 ou 8...Nd7.',
    },
  ],
  mistakes: [
    {
      title: 'Jogar ...e5 sem controlar a casa d5',
      explanation:
        'O avanço ...e5 ganha tempo sobre o cavalo de d4, mas cria um buraco permanente em d5. Sem ...Be6, ...Nbd7-b6 ou ...Rc8 para disputar essa casa, as brancas instalam um cavalo em d5 e ficam com vantagem estratégica duradoura.',
    },
    {
      title: 'Rocar automaticamente diante de um ataque de peões',
      explanation:
        'Nas linhas em que as brancas rocam grande e avançam g4-g5, rocar pequeno cedo demais oferece um alvo fixo. Muitas vezes é melhor atrasar o roque, iniciar o contra-ataque com ...b5 primeiro ou manter o rei no centro até que a posição se defina.',
    },
    {
      title: 'Trocar o cavalo em d4 sem necessidade',
      explanation:
        'A troca ...Nxd4 traz a dama branca para uma casa central dominante com ganho de tempo. Ela só é útil quando há um motivo concreto, como ...b5 ou ...e5 em seguida; feita por hábito, apenas acelera o desenvolvimento branco.',
    },
    {
      title: 'Responder a um anti-siciliano como se fosse a Siciliana Aberta',
      explanation:
        'Contra a Alapin, a Fechada ou o Smith-Morra, os planos são outros: na Alapin a luta é contra o centro de peões, na Fechada o perigo está em f4-f5, e no Morra é preciso desenvolver antes de tentar manter o peão. Ter um esquema preparado contra cada um evita surpresas logo na abertura.',
    },
  ],
  keyPositions: [
    {
      title: 'Najdorf com ...e5 contra o Ataque Inglês',
      moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3 Be7 Qd2 O-O O-O-O Nbd7 g4 b5',
      explanation:
        'Roques em alas opostas: quem chegar primeiro decide. As brancas avançam g5 e h4-h5 e querem dominar d5; as pretas empurram ...b4 para expulsar o cavalo de c3, abrem a coluna c e procuram ...d5 para liberar o jogo. Cada tempo conta.',
    },
    {
      title: 'Dragão Iugoslavo',
      moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O Qd2 Nc6 Bc4 Bd7 O-O-O Rc8 Bb3 Ne5',
      explanation:
        'As brancas querem Bh6 para trocar o bispo de g7 e depois h4-h5. As pretas centralizam o cavalo em e5 rumo a c4, preparam ...Rxc3 e ...b5. O bispo de g7 é a peça-chave: sem ele, o rei preto fica muito vulnerável.',
    },
    {
      title: 'Estrutura da Sveshnikov',
      moves: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6 Bg5 a6 Na3 b5 Bxf6 gxf6 Nd5 f5',
      explanation:
        'As pretas têm o par de bispos e peões centrais móveis; as brancas têm a casa d5 e uma estrutura mais sã. Brancas: c3, Nc2-e3 e a4 para abrir a ala da dama. Pretas: ...Bg7, ...O-O, ...Be6 e ...f4 ou ...fxe4 para ativar os bispos.',
    },
  ],
};
