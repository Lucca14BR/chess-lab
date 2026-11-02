import type { Opening } from '../types';

export const italiana: Opening = {
  id: 'italiana',
  name: 'Abertura Italiana',
  eco: ['C50', 'C51', 'C53', 'C54', 'C55', 'C57', 'C58'],
  side: 'white',
  mainLine: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+',
  summary:
    'Uma das aberturas mais antigas e lógicas do xadrez: as brancas desenvolvem o cavalo, atacam o peão e5 e apontam o bispo para f7, o ponto mais frágil do campo preto. Hoje é jogada tanto na forma aguda, com o centro aberto por c3 e d4, quanto na forma lenta e manobrável do Giuoco Pianissimo, preferida pela elite.',
  ideas: [
    'O bispo em c4 mira f7, casa defendida apenas pelo rei preto. Essa pressão cria motivos táticos permanentes e limita as escolhas do adversário nos primeiros lances.',
    'Desenvolvimento rápido e roque cedo: em poucos lances as brancas estão prontas para abrir o jogo com d4 no momento que lhes convier.',
    'O plano c3 seguido de d4 busca o centro clássico de peões em e4 e d4, ganhando espaço com tempo sobre o bispo de c5.',
    'Na versão com d3 (Giuoco Pianissimo), as brancas adiam o confronto central, mantêm a tensão e apostam em manobras de longo prazo, como Nbd2-f1-g3, antes da ruptura d3-d4.',
    'A estrutura é flexível: a mesma abertura pode gerar ataques diretos contra o rei ou posições posicionais de longa duração, conforme as escolhas de cada lado.',
  ],
  plansWhite: [
    'Preparar d4 com c3. Se as pretas trocarem em d4, recapturar com o peão c e manter o centro duplo; se não trocarem, considerar d4-d5 para ganhar espaço e empurrar o cavalo de c6.',
    'Executar a manobra clássica Nbd2-f1-g3 (ou e3), reforçando as casas f5 e h5 e levando mais uma peça para a ala do rei.',
    'Expandir na ala da dama com a4 e b4, ganhando espaço e preparando a retirada do bispo para a2 via b3, onde ele continua mirando f7.',
    'Cravar o cavalo de f6 com Bg5 depois do roque preto e combinar a pressão em f6 com a diagonal a2-g8.',
    'No Pianissimo, jogar h3 para impedir ...Bg4 e Re1 para sustentar e4, mantendo sempre em reserva a ruptura d3-d4.',
  ],
  plansBlack: [
    'Contestar o centro com ...d5 no momento certo: nas linhas com c3 e d4, esse golpe libera o jogo e neutraliza o peão e4.',
    'Recolher o bispo para b6 ou a7 antes que b4 ou d4 o expulsem com ganho de tempo, mantendo a pressão sobre f2 e d4.',
    'Manobrar o cavalo de c6 por e7 até g6, reforçando a ala do rei e, em certas posições, apoiando a ruptura ...f5.',
    'Responder à cravada Bg5 com ...h6 e só considerar ...g5 quando o rei estiver seguro; do contrário, desfazê-la com ...Be7 ou ...Qe7.',
    'Na Defesa dos Dois Cavalos (3...Nf6), usar o desenvolvimento superior e a iniciativa como compensação sempre que houver peão entregue.',
  ],
  suitability:
    'Indicada para quem está construindo o repertório com 1.e4 e quer aprender os princípios clássicos na prática: desenvolvimento, centro e pressão sobre f7. O Giuoco Pianissimo exige pouca teoria forçada, mas recompensa quem entende manobras e estruturas; quem prefere posições abertas e táticas encontra nas linhas com d4 e no Gambito Evans um jogo mais direto. É menos exigente em teoria que a Ruy López, embora ofereça uma pressão de longo prazo um pouco menor.',
  lines: [
    {
      name: 'Giuoco Piano: 4.c3 com 5.d4',
      moves:
        'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+ Bd2 Bxd2+ Nbxd2 d5 exd5 Nxd5 Qb3 Nce7 O-O O-O Rfe1 c6',
      comment:
        'A linha clássica. As pretas trocam o bispo e golpeiam o centro com 8...d5, e as brancas ficam com um peão isolado em d4. Em troca, têm peças ativas, pressão com Qb3 sobre d5 e b7 e a coluna e semiaberta. O jogo gira em torno de bloquear (pretas) ou dinamizar (brancas) o peão isolado.',
    },
    {
      name: 'Ataque Møller',
      moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+ Nc3 Nxe4 O-O Bxc3 d5',
      comment:
        'Em vez de 7.Bd2, as brancas entregam material por iniciativa: depois de 7...Nxe4 8.O-O Bxc3 vem 9.d5, ameaçando o cavalo de c6 e abrindo linhas contra o rei preto. A teoria considera que as pretas se defendem com 9...Bf6 10.Re1 Ne7 11.Rxe4 d6, mas a posição é muito perigosa para quem não conhece a defesa.',
    },
    {
      name: 'Giuoco Pianissimo: 4.c3 Nf6 5.d3',
      moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O a6 a4 Ba7 Re1 O-O h3',
      comment:
        'A forma moderna e mais popular entre os profissionais. As brancas não abrem o centro de imediato: jogam a4 para ganhar espaço, Re1 para apoiar e4 e h3 para impedir ...Bg4. O plano seguinte costuma ser Nbd2-f1-g3 e, só depois, a ruptura d3-d4. As pretas recuam o bispo para a7 por precaução contra b4 e d4.',
    },
    {
      name: 'Dois Cavalos: 4.Ng5',
      moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5 Bb5+ c6 dxc6 bxc6 Be2 h6 Nf3 e4 Ne5',
      comment:
        'As brancas atacam f7 diretamente. A resposta correta é 4...d5 5.exd5 Na5!, afastando o bispo da diagonal. As pretas entregam um peão, mas ganham tempo e desenvolvimento: depois de 8...h6 e 9...e4, o cavalo branco é empurrado e as pretas recebem compensação real pela iniciativa.',
    },
    {
      name: 'Dois Cavalos: 4.d4',
      moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6 d4 exd4 O-O Nxe4 Re1 d5 Bxd5 Qxd5 Nc3',
      comment:
        'As brancas abrem o centro de imediato. Depois de 5...Nxe4 6.Re1 d5, o sacrifício temporário 7.Bxd5 seguido de 8.Nc3 explora a cravada do cavalo de e4 na coluna e. O material se equilibra rapidamente, e o jogo exige precisão de ambos os lados.',
    },
    {
      name: 'Gambito Evans',
      moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O',
      comment:
        'As brancas entregam o peão b para ganhar tempo com c3 e d4 e montar um centro forte. É uma escolha agressiva e prática: as pretas precisam conhecer a defesa (devolver material no momento certo, como com ...d6 ou ...Nge7) para não serem atropeladas no desenvolvimento.',
    },
  ],
  traps: [
    {
      name: 'Mate de Légal',
      moves: 'e4 e5 Nf3 Nc6 Bc4 d6 Nc3 Bg4 h3 Bh5 Nxe5 Bxd1 Bxf7+ Ke7 Nd5#',
      beneficiary: 'white',
      explanation:
        'Com o bispo preto em h5 e o peão f7 vulnerável, 6.Nxe5 parece entregar a dama. Se as pretas aceitarem com 6...Bxd1?, seguem 7.Bxf7+ Ke7 8.Nd5#, um mate com três peças menores. A defesa correta é 6...dxe5 7.Qxh5, e mesmo assim as brancas ganham um peão, pois o bispo de h5 estava sem defesa.',
    },
    {
      name: 'Fígado Frito (Fried Liver)',
      moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7 Kxf7 Qf3+ Ke6 Nc3',
      beneficiary: 'white',
      explanation:
        'Na Defesa dos Dois Cavalos, recapturar com 5...Nxd5? permite o sacrifício 6.Nxf7! Kxf7 7.Qf3+, obrigando o rei a ir ao centro para proteger o cavalo de d5. Com 8.Nc3, as brancas acumulam pressão sobre d5 e sobre o rei exposto, e na prática a defesa é muito difícil. O lance correto para as pretas é 5...Na5.',
    },
    {
      name: 'Armadilha Blackburne Shilling',
      moves: 'e4 e5 Nf3 Nc6 Bc4 Nd4 Nxe5 Qg5 Nxf7 Qxg2 Rf1 Qxe4+ Be2 Nf3#',
      beneficiary: 'black',
      explanation:
        'O lance 3...Nd4 é objetivamente fraco, mas convida 4.Nxe5?, que parece ganhar um peão. Depois de 4...Qg5, a dama ataca o cavalo e g2 ao mesmo tempo; se as brancas insistirem com 5.Nxf7?, o rei fica cercado e termina em mate com 7...Nf3#. A resposta correta é 4.Nxd4 exd4 5.O-O ou simplesmente 4.O-O, com vantagem branca.',
    },
  ],
  mistakes: [
    {
      title: 'Atacar f7 com Ng5 sem calcular a defesa do cavalo',
      moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 Ng5 Qxg5',
      explanation:
        'Com o bispo preto já em c5, a casa e7 está livre e a dama de d8 enxerga g5 pela diagonal. O lance 4.Ng5?? simplesmente perde o cavalo. A lição vale para toda a abertura: o ataque a f7 só funciona quando o cavalo está protegido e as pretas não têm captura imediata.',
    },
    {
      title: 'Recapturar com o cavalo em d5 na Defesa dos Dois Cavalos',
      moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5',
      explanation:
        'O lance mais natural para as pretas é também o mais arriscado: ele permite 6.Nxf7 (Fígado Frito) ou 6.d4 com ataque forte. A recomendação teórica é 5...Na5, que expulsa o bispo e transforma o peão entregue em tempo de desenvolvimento.',
    },
    {
      title: 'Abrir a ala do rei com ...h6 e ...g5 antes de garantir o rei',
      explanation:
        'Contra a cravada Bg5, muitos jogadores respondem com ...h6 e ...g5 de forma automática. Se o rei preto já estiver rocado, esses avanços criam buracos em f5 e h5 e abrem a porta para sacrifícios como Nxg5 seguido de Qh5. O avanço só é sadio quando o rei ainda pode ficar no centro ou rocar do outro lado.',
    },
    {
      title: 'Abrir o centro com d4 sem estar desenvolvido',
      explanation:
        'No Pianissimo, a ruptura d3-d4 é o objetivo, mas executá-la antes de completar o roque, Re1 e Nbd2 costuma liberar as peças pretas e expor e4. O momento certo é quando o peão e4 está sustentado e a captura em d4 pode ser respondida com uma peça ou com o peão c.',
    },
  ],
  keyPositions: [
    {
      title: 'Peão isolado das brancas no Giuoco Piano',
      moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+ Bd2 Bxd2+ Nbxd2 d5 exd5 Nxd5',
      explanation:
        'As brancas têm um peão isolado em d4 e peças ativas. Para as brancas: Qb3 pressionando d5 e b7, roque e Rfe1, com ideias de Ne5 e ataque na ala do rei. Para as pretas: bloquear o peão com uma peça em d5, trocar peças menores e buscar um final em que o peão isolado seja uma fraqueza estática.',
    },
    {
      title: 'Estrutura do Giuoco Pianissimo',
      moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O a6 a4 Ba7 Re1 O-O h3',
      explanation:
        'Posição de manobras. Observe a casa d4 (alvo da ruptura branca), a diagonal a2-g8 e as casas f5 e g5. As brancas costumam seguir com Nbd2-f1-g3 e Bg5 ou Be3; as pretas, com ...h6, ...Re8, ...Be6 para trocar o bispo de c4 e ...Ne7-g6.',
    },
    {
      title: 'Compensação preta nos Dois Cavalos',
      moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5 Bb5+ c6 dxc6 bxc6 Be2 h6 Nf3 e4 Ne5 Bd6',
      explanation:
        'As pretas estão com um peão a menos, mas têm desenvolvimento superior, espaço com o peão e4 e linhas abertas para as torres. As brancas precisam consolidar com d4, f4 ou Nc4 e devolver material se necessário; as pretas devem manter a iniciativa com ...O-O, ...Qc7 e ...Rb8 antes que o peão extra pese.',
    },
  ],
};
