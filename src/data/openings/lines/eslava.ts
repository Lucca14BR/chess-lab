import type { Opening } from '../types';

export const eslava: Opening = {
  id: 'eslava',
  name: 'Defesa Eslava',
  eco: ['D10', 'D11', 'D12', 'D13', 'D15', 'D17', 'D18', 'D43', 'D44', 'D45', 'D47'],
  side: 'black',
  mainLine: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4',
  summary:
    'Contra o Gambito da Dama, as pretas defendem d5 com o peão c, e não com o peão e. Assim mantêm aberta a diagonal do bispo de c8, que pode sair para f5 ou g4 antes de ...e6. É uma defesa sólida e ao mesmo tempo flexível, que admite tanto linhas tranquilas quanto a aguda Semi-Eslava.',
  ideas: [
    'Defender d5 com ...c6 preserva a diagonal c8-h3: o bispo de casas claras, problema clássico do Gambito da Dama Recusado, é desenvolvido antes de ...e6.',
    'A captura ...dxc4 ameaça manter o peão com ...b5. Por isso as brancas costumam jogar a4, que custa um tempo e enfraquece a casa b4, usada depois pelo bispo ou pelo cavalo preto.',
    'A estrutura com peões em c6 e e6 (o chamado Muro Eslavo) é muito difícil de quebrar e serve de base para as rupturas ...c5 e ...e5.',
    'Na Semi-Eslava (...e6 antes de ...Bf5), as pretas aceitam prender o bispo em troca de posições muito dinâmicas, como a Meran e a Botvinnik.',
  ],
  plansWhite: [
    'Recuperar o peão c4 com a4, e3 e Bxc4, e depois preparar a ruptura central e4 com Qe2, Rd1 e Nh4 ou Ne5.',
    'Na Variante das Trocas, jogar na coluna c com Rc1, Bb5 e Qb3, buscando pressão sobre c6 e b7.',
    'Contra a Semi-Eslava, ganhar espaço com e4-e5 e atacar na ala do rei, ou travar a ala da dama com a4 e b3.',
    'Contra o bispo em f5, conquistar o par de bispos com Nh4 e Nxg6, tomando cuidado com a coluna h que se abre para a torre preta.',
  ],
  plansBlack: [
    'Desenvolver o bispo para f5 ou g4 antes de ...e6 e completar o desenvolvimento com ...Bb4, ...Nbd7 e ...O-O.',
    'Usar a casa b4, enfraquecida por a4, com ...Bb4 ou ...Na6-b4, e controlar e4 para impedir a ruptura central branca.',
    'Liberar o jogo com as rupturas ...c5 ou ...e5 no momento em que as peças estiverem prontas.',
    'Na Semi-Eslava Meran, expandir na ala da dama com ...b5, ...a6 e ...c5 e atacar o centro branco com as peças.',
    'Depois de Nxg6 hxg6, usar a coluna h semiaberta com a torre de h8 e o bispo em d6 contra h2.',
  ],
  suitability:
    'Indicada para quem enfrenta 1.d4 e quer uma defesa sólida, sem bispo ruim e com bons finais. A Eslava propriamente dita exige teoria moderada; a Semi-Eslava é mais extensa e aguda, adequada a quem gosta de cálculo. Combina com jogadores posicionais que também aceitam complicações quando a posição pede. Quem quer evitar estudo intenso pode limitar-se à Eslava clássica e à Variante das Trocas.',
  lines: [
    {
      name: 'Linha principal: 4.Nc3 dxc4 5.a4 Bf5',
      moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O O-O Qe2 Nbd7',
      comment:
        'As brancas recuperam o peão e preparam e4. As pretas desenvolvem o bispo em f5 antes de ...e6, cravam o cavalo de c3 com ...Bb4 e controlam e4. A posição é equilibrada e serve de base para entender toda a defesa.',
    },
    {
      name: 'Variante das Trocas',
      moves: 'd4 d5 c4 c6 cxd5 cxd5 Nc3 Nf6 Bf4 Nc6 e3 Bf5 Nf3 e6',
      comment:
        'Estrutura simétrica e coluna c aberta. As brancas têm o tempo a mais e buscam pressão com Bb5, Qb3 e Rc1; as pretas precisam de precisão para igualar, com ...Bb4, ...Qa5 ou ...Nd7. Não é uma linha para copiar lances sem pensar.',
    },
    {
      name: 'Semi-Eslava: Variante Meran',
      moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Bd3 dxc4 Bxc4 b5 Bd3 Bb7',
      comment:
        'As pretas capturam em c4 e ganham espaço na ala da dama com ...b5, desenvolvendo o bispo em b7. O plano típico é ...a6 e ...c5. As brancas respondem com e4 e e5 ou com O-O e Qe2, e o jogo costuma ser rico em táticas.',
    },
    {
      name: 'Semi-Eslava: Variante Botvinnik',
      moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6 Bg5 dxc4 e4 b5 e5 h6 Bh4 g5 Nxg5 hxg5 Bxg5 Nbd7',
      comment:
        'Uma das linhas mais complexas da teoria. As pretas mantêm o peão c4 e seguram a ala da dama; as brancas sacrificam um cavalo para abrir a ala do rei. Só deve ser jogada com preparação profunda.',
    },
    {
      name: 'Semi-Eslava: Variante de Moscou',
      moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6 Bg5 h6 Bxf6 Qxf6 e3 Nd7 Bd3 dxc4 Bxc4 g6',
      comment:
        'Uma alternativa mais tranquila à Botvinnik: as pretas pedem logo a decisão do bispo e recebem o par de bispos. A estrutura é sólida, e o plano é ...Bg7, ...O-O e a ruptura ...e5 ou ...c5.',
    },
    {
      name: 'Variante Chebanenko (4...a6)',
      moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 a6 e3 b5 b3 Bg4',
      comment:
        'O lance ...a6 prepara ...b5 sem entregar o centro. É um sistema flexível: as pretas escolhem entre ...dxc4, ...b5 e ...Bg4 conforme a configuração branca. As brancas costumam fechar a ala da dama com c5 ou b3.',
    },
    {
      name: 'Eslava com 4.e3: Nh4 contra o bispo',
      moves: 'd4 d5 c4 c6 Nf3 Nf6 e3 Bf5 Nc3 e6 Nh4 Bg6 Nxg6 hxg6',
      comment:
        'As brancas protegem c4 com e3 e perseguem o bispo com Nh4, conquistando o par de bispos. Em troca, as pretas ganham a coluna h semiaberta e uma estrutura sólida; a torre de h8 passa a ser uma peça de ataque contra h2.',
    },
  ],
  traps: [
    {
      name: 'Sacrifício em h2 na coluna h aberta',
      moves: 'd4 d5 c4 c6 Nf3 Nf6 e3 Bf5 Nc3 e6 Nh4 Bg6 Nxg6 hxg6 Bd3 Nbd7 O-O Bd6 Qc2 Bxh2+ Kh1 Ng4',
      beneficiary: 'black',
      explanation:
        'Depois de Nxg6 hxg6, a torre de h8 mira h2. Com o bispo em d6, o natural 10.Qc2? (assim como 10.b3? ou 10.e4?) permite 10...Bxh2+! 11.Kh1, já que o rei não pode capturar o bispo defendido pela torre. Depois de 11...Ng4, o bispo ameaça sair de h2 com xeque descoberto da torre, e a dama entra por h4: as pretas ganham. As brancas precisavam de 10.g3, 10.h3 ou 10.f4 para proteger a ala do rei.',
    },
    {
      name: 'Armadilha da Cambridge Springs',
      moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6 Bg5 Nbd7 e3 Qa5 Bd3 Ne4 O-O Nxg5 Nxg5 dxc4',
      beneficiary: 'black',
      explanation:
        'Pela ordem da Semi-Eslava, as pretas podem chegar à Defesa Cambridge Springs com 6...Qa5, cravando o cavalo de c3. Depois de 7.Bd3? Ne4!, o roque 8.O-O? perde material: 8...Nxg5 9.Nxg5 dxc4 ataca o bispo de d3 e, pela quinta fileira, a dama de a5 ataca o cavalo de g5. As brancas devem preferir 7.Nd2 ou 7.cxd5.',
    },
  ],
  mistakes: [
    {
      title: 'Tentar manter o peão c4 com ...b5 depois de a4',
      moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 b5 axb5 cxb5 Nxb5',
      explanation:
        'Com o peão já em a4, 5...b5? é respondido por 6.axb5 cxb5 7.Nxb5: as brancas recuperam o peão, a coluna a se abre contra a7 e o peão c4 fica isolado e cairá em seguida. O plano correto é 5...Bf5 ou 5...Na6, usando a casa b4 enfraquecida.',
    },
    {
      title: 'Jogar ...e6 cedo sem querer a Semi-Eslava',
      explanation:
        'O principal trunfo da Eslava é desenvolver o bispo de c8 antes de ...e6. Quem joga ...e6 cedo por hábito chega a uma Semi-Eslava, com o bispo preso e teoria muito mais aguda, sem conhecer os planos dessa estrutura.',
    },
    {
      title: 'Copiar lances na Variante das Trocas',
      explanation:
        'Na estrutura simétrica, as brancas têm um tempo a mais. Copiar lances de forma automática pode levar a problemas concretos na coluna c ou na diagonal b5-e8. As pretas devem, em algum momento, quebrar a simetria com ...Bb4, ...Qb6 ou ...Nh5.',
    },
    {
      title: 'Ignorar a coluna h depois de hxg6',
      explanation:
        'Na linha com Nh4xg6, quem joga de brancas costuma esquecer que a torre de h8 pressiona h2. Rocar e continuar com lances de desenvolvimento sem g3, h3 ou f4 abre caminho para ...Bxh2+ e ataques decisivos.',
    },
  ],
  keyPositions: [
    {
      title: 'Linha principal com a casa b4',
      moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O O-O Qe2',
      explanation:
        'As brancas preparam e4, que ganharia espaço e expulsaria o bispo de f5. As pretas controlam e4 com o bispo e o cavalo e podem jogar ...Bg4, ...Nbd7 ou ...Ne4. Observe a casa b4: o bispo preto se apoia nela graças ao avanço a4.',
    },
    {
      title: 'Eslava das Trocas',
      moves: 'd4 d5 c4 c6 cxd5 cxd5 Nc3 Nf6 Bf4 Nc6 e3 Bf5 Nf3 e6',
      explanation:
        'Estrutura simétrica com coluna c aberta. As brancas buscam Bb5, Qb3 ou Qa4 e Ne5 para pressionar c6; as pretas respondem com ...Bb4, ...Nd7 ou ...Qb6. Quem controlar a coluna c e as casas c5 e c4 obtém a vantagem.',
    },
    {
      title: 'Semi-Eslava Meran',
      moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Bd3 dxc4 Bxc4 b5 Bd3 Bb7',
      explanation:
        'As pretas preparam ...a6 e ...c5, ou ...b4 seguido de ...c5, para atacar o centro. As brancas podem jogar e4-e5 para ganhar espaço e expulsar o cavalo de f6, ou O-O com e4. O bispo de b7 na grande diagonal é a peça que justifica a defesa.',
    },
  ],
};
