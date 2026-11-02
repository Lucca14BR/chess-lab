import type { Opening } from '../types';

export const gambitoDaDama: Opening = {
  id: 'gambito-da-dama',
  name: 'Gambito da Dama',
  eco: ['D06', 'D08', 'D20', 'D27', 'D32', 'D34', 'D35', 'D36', 'D37', 'D53', 'D58', 'D63'],
  side: 'white',
  mainLine: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6',
  summary:
    'Com 2.c4, as brancas oferecem o peão c para desviar o peão d5 do centro. Não é um gambito verdadeiro: se as pretas aceitarem, o peão costuma ser recuperado. A abertura gera posições sólidas e estratégicas, em que as brancas jogam com mais espaço e pressão sobre a ala da dama.',
  ideas: [
    'O peão c4 ataca d5, o pilar central preto. Se as pretas trocarem em c4, as brancas ganham o centro com e4 ou recuperam o peão com Bxc4 e desenvolvimento rápido.',
    'O cavalo em c3 e o bispo em g5 aumentam a pressão sobre d5: o bispo crava o cavalo de f6, que é um dos defensores da casa central.',
    'As brancas buscam fixar a estrutura e explorar o bispo de c8, frequentemente bloqueado pelo peão e6 no Gambito da Dama Recusado.',
    'Muitas linhas levam a estruturas bem definidas, como a Carlsbad (ataque de minoria) ou o peão isolado da dama, que permitem jogar por planos claros mesmo sem memorizar muita teoria.',
  ],
  plansWhite: [
    'Na estrutura Carlsbad (depois de cxd5 exd5), executar o ataque de minoria com Rb1, b4 e b5 para criar um peão fraco em c6 ou d5.',
    'Alternativamente, preparar a ruptura central f3 e e4 com o rei rocado do lado da dama ou com Nge2, ganhando espaço no centro.',
    'Desenvolver com Bd3, Qc2 e O-O, apontando contra h7 e procurando o ataque com Ne5 e f4 quando as pretas forem passivas.',
    'Contra o peão isolado preto (Defesa Tarrasch), bloquear d5 com peças, trocar as peças menores e pressionar o peão no final.',
    'No Gambito Aceito, ocupar o centro com e4 ou jogar com o peão isolado próprio em d4, buscando ataque com Qe2, Rd1 e d4-d5.',
  ],
  plansBlack: [
    'Liberar o jogo com as rupturas ...c5 ou ...e5, que resolvem a falta de espaço e ativam o bispo de c8.',
    'Desenvolver o bispo de c8 em b7 por meio de ...b6 (Defesa Tartakower), garantindo-lhe uma diagonal ativa.',
    'Na estrutura Carlsbad, reagir ao ataque de minoria com ...Ne4, ...f5 ou com manobras como ...Nf8-g6 e ataque na ala do rei.',
    'Trocar peças com a manobra de Capablanca (...dxc4 e ...Nd5) para aliviar a posição e preparar ...e5.',
    'No Contragambito Albin, usar o peão d4 como cunha e rocar grande para atacar com ...Bg4, ...Qd7 e ...O-O-O.',
  ],
  suitability:
    'Indicada para quem prefere jogo posicional, com estruturas claras e planos de longo prazo. Exige teoria moderada: as estruturas se repetem e é possível jogar bem entendendo poucos esquemas (Carlsbad, peão isolado, rupturas ...c5 e ...e5). Combina com jogadores pacientes, que gostam de acumular pequenas vantagens; quem busca táticas imediatas pode achar o jogo lento nas primeiras partidas.',
  lines: [
    {
      name: 'Recusado: Defesa Ortodoxa com manobra de Capablanca',
      moves: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7 Rc1 c6 Bd3 dxc4 Bxc4 Nd5 Bxe7 Qxe7 O-O Nxc3 Rxc3 e5',
      comment:
        'A defesa clássica. As pretas esperam que o bispo branco saia de f1 para só então capturar em c4, ganhando um tempo. Com 9...Nd5 trocam peças e preparam 12...e5, a ruptura que libera o bispo de c8. As brancas mantêm uma leve vantagem de espaço e jogo nas colunas abertas.',
    },
    {
      name: 'Recusado: Defesa Tartakower',
      moves: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6 Be2 Bb7 Bxf6 Bxf6 cxd5 exd5',
      comment:
        'Com ...h6 e ...b6, as pretas resolvem o problema do bispo de c8 levando-o para b7. Depois das trocas, surgem frequentemente os peões pendentes c5 e d5: são fortes enquanto apoiam o centro e fracos se forem bloqueados e atacados.',
    },
    {
      name: 'Recusado: Variante das Trocas (estrutura Carlsbad)',
      moves: 'd4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 e3 Be7 Bd3 Nbd7 Qc2 O-O Nf3 Re8 O-O',
      comment:
        'As brancas definem cedo a estrutura. A estrutura Carlsbad dá às brancas o plano do ataque de minoria (b4-b5) e, às pretas, jogo na ala do rei com ...Nf8, ...Ne4 e ...Bd6. É uma das estruturas mais instrutivas do xadrez.',
    },
    {
      name: 'Gambito da Dama Aceito',
      moves: 'd4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6',
      comment:
        'As pretas aceitam o peão, mas não tentam mantê-lo: o objetivo é atacar o centro com ...c5 e desenvolver o bispo de c8 em b7 depois de ...b5. As brancas costumam terminar com um peão isolado em d4 e jogo ativo de peças.',
    },
    {
      name: 'Contragambito Albin',
      moves: 'd4 d5 c4 e5 dxe5 d4 Nf3 Nc6 g3 Be6 Nbd2 Qd7',
      comment:
        'As pretas entregam um peão para fixar a cunha em d4, que incomoda o desenvolvimento branco. A resposta mais sólida é o fianchetto com g3 e Bg2, seguido de Nbd2 e O-O. As pretas preparam ...O-O-O e o avanço dos peões da ala do rei.',
    },
    {
      name: 'Defesa Tarrasch',
      moves: 'd4 d5 c4 e6 Nc3 c5 cxd5 exd5 Nf3 Nc6 g3 Nf6 Bg2 Be7 O-O O-O',
      comment:
        'As pretas aceitam um peão isolado em d5 em troca de desenvolvimento livre. As brancas, com o fianchetto, pressionam d5 com o bispo de g2 e buscam trocar peças para ficar com um final favorável.',
    },
  ],
  traps: [
    {
      name: 'Armadilha do Elefante',
      moves: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Nbd7 cxd5 exd5 Nxd5 Nxd5 Bxd8 Bb4+ Qd2 Bxd2+ Kxd2 Kxd8',
      beneficiary: 'black',
      explanation:
        'O cavalo de f6 parece cravado, e 6.Nxd5?? parece ganhar um peão. Mas 6...Nxd5! desfaz a cravada: se 7.Bxd8, vem 7...Bb4+ 8.Qd2 Bxd2+ 9.Kxd2 Kxd8, e as pretas saem com uma peça a mais. A cravada sobre f6 não é absoluta, porque o que está atrás é a dama, não o rei.',
    },
    {
      name: 'Armadilha de Lasker',
      moves: 'd4 d5 c4 e5 dxe5 d4 e3 Bb4+ Bd2 dxe3 Bxb4 exf2+ Ke2 fxg1=N+',
      beneficiary: 'black',
      explanation:
        'No Contragambito Albin, o natural 4.e3? convida 4...Bb4+ 5.Bd2 dxe3!. Se as brancas capturarem o bispo com 6.Bxb4??, segue 6...exf2+ 7.Ke2 fxg1=N+!, promovendo a cavalo com xeque. Se 8.Rxg1, então 8...Bg4+ ganha a dama; se 8.Ke1, 8...Qh4+ mantém um ataque decisivo. O correto é 4.Nf3.',
    },
    {
      name: 'Peão c4 indefensável no Gambito Aceito',
      moves: 'd4 d5 c4 dxc4 e3 b5 a4 c6 axb5 cxb5 Qf3',
      beneficiary: 'white',
      explanation:
        'Tentar segurar o peão c4 com ...b5 e ...c6 abre a grande diagonal. Depois de 5.axb5 cxb5 6.Qf3!, a dama ataca a torre de a8 pela diagonal f3-a8, e as brancas ganham material. É a demonstração prática de que o Gambito da Dama não é um gambito verdadeiro.',
    },
  ],
  mistakes: [
    {
      title: 'Jogar 4.e3 no Contragambito Albin',
      moves: 'd4 d5 c4 e5 dxe5 d4 e3',
      explanation:
        'Atacar o peão d4 de imediato parece lógico, mas abre a diagonal a5-e1 e permite 4...Bb4+, com a Armadilha de Lasker no horizonte. O plano correto é 4.Nf3 com g3, Bg2 e Nbd2, isolando o peão d4 em vez de atacá-lo cedo.',
    },
    {
      title: 'Deixar o bispo de c8 sem futuro',
      explanation:
        'No Gambito da Dama Recusado, o problema estrutural das pretas é o bispo de c8, bloqueado por e6. Desenvolver todas as outras peças sem preparar ...b6, ...c5 ou ...e5 leva a posições passivas, em que as brancas avançam na ala da dama sem oposição.',
    },
    {
      title: 'Capturar cxd5 cedo demais sem um plano',
      explanation:
        'A troca em d5 libera a diagonal c8-h3 para o bispo preto. Ela é forte quando faz parte de um plano (ataque de minoria ou avanço central f3-e4), mas, jogada por hábito, apenas resolve o principal problema das pretas.',
    },
    {
      title: 'Tentar segurar o peão a qualquer custo no Gambito Aceito',
      explanation:
        'Lances como ...b5 e ...c6 para manter o peão c4 atrasam o desenvolvimento e enfraquecem a diagonal a8-h1 e a casa c6. As pretas devem devolver o peão de forma útil e concentrar-se em ...c5 e em desenvolver o bispo de c8.',
    },
  ],
  keyPositions: [
    {
      title: 'Estrutura Carlsbad',
      moves: 'd4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 e3 Be7 Bd3 Nbd7 Qc2 O-O Nf3 Re8 O-O',
      explanation:
        'Brancas: preparar Rab1, b4 e b5 para atacar c6 e criar um peão fraco; o momento de b5 é quando as pretas não podem responder com ...c5 sem problemas. Pretas: reposicionar o cavalo por f8 até g6 ou e6, buscar ...Ne4 e ataque na ala do rei, ou responder ao avanço b4 com ...a6 e ...Nb6-c4.',
    },
    {
      title: 'Peão isolado branco no Gambito Aceito',
      moves: 'd4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6 a4 Nc6 Qe2 cxd4 Rd1 Be7 exd4',
      explanation:
        'As brancas têm um peão isolado em d4 e peças ativas. O plano típico é Nc3, Bg5 ou Bf4 e o avanço d4-d5 para abrir linhas. As pretas querem bloquear d5 com um cavalo, trocar peças menores e transformar o peão isolado em fraqueza.',
    },
    {
      title: 'Peões pendentes na Tartakower',
      moves: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6 Be2 Bb7 Bxf6 Bxf6 cxd5 exd5',
      explanation:
        'Depois de ...c5 e dxc5 bxc5, surgem os peões pendentes c5 e d5. As brancas devem pressioná-los com Rc1, Qa4 ou Qb3 e a manobra Nd4, forçando um deles a avançar. As pretas os mantêm lado a lado e usam o espaço que eles concedem.',
    },
  ],
};
