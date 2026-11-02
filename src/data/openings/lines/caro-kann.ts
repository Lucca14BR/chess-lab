import type { Opening } from '../types';

export const caroKann: Opening = {
  id: 'caro-kann',
  name: 'Defesa Caro-Kann',
  eco: ['B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B17', 'B18', 'B19'],
  side: 'black',
  mainLine: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7',
  summary:
    'Com 1...c6, as pretas preparam ...d5 sem bloquear o bispo de c8. O resultado é uma defesa muito sólida, com estrutura de peões sã e um bispo de casas claras ativo, que costuma sair para f5 ou g4 antes de ...e6. As brancas têm espaço; as pretas, uma posição sem fraquezas e bons finais.',
  ideas: [
    'O peão c6 sustenta d5, de modo que as pretas contestam o centro sem fechar a diagonal do bispo de c8, a grande diferença em relação à Francesa.',
    'O bispo de casas claras sai antes de ...e6 (para f5 ou g4), e assim as pretas resolvem cedo o problema de peça que costuma afligir as defesas fechadas.',
    'A estrutura resultante quase sempre é sã: sem peões dobrados nem isolados, as pretas chegam bem aos finais e podem jogar por vitória com paciência.',
    'A ruptura ...c5 é a principal fonte de contra-jogo, tanto na Variante do Avanço quanto nas linhas em que as brancas ganham espaço no centro.',
  ],
  plansWhite: [
    'Na Clássica, ganhar espaço com h4-h5, trocar o bispo de casas claras preto e rocar grande, avançando depois na ala do rei.',
    'Na Variante do Avanço, manter a cadeia d4-e5 e atacar o bispo de f5 com g4, Nh4 ou Nge2-f4, ou jogar de forma calma com Nf3, Be2 e O-O.',
    'No Ataque Panov, aceitar um peão isolado em d4 e usar a atividade das peças para atacar, com Bd3, O-O, Re1 e Ne5.',
    'Na Variante das Trocas, jogar com Bd3, c3, Bf4 e Qb3, explorando a pressão sobre b7 e a ala do rei.',
  ],
  plansBlack: [
    'Desenvolver o bispo para f5 ou g4 antes de ...e6 e só então completar o desenvolvimento com ...Ngf6, ...Be7 e o roque.',
    'Atacar o centro branco com ...c5, especialmente na Variante do Avanço, apoiado por ...Nc6, ...Qb6 e ...Ne7-f5.',
    'Contra o roque grande branco, considerar ...O-O-O também, ou o avanço ...c5 e ...Qa5 para gerar ataque na ala da dama.',
    'Contra o peão isolado no Panov, bloquear d5 com um cavalo, trocar peças e jogar pelo final favorável.',
    'Na estrutura com ...e6 e ...c6, preparar a ruptura ...c5 ou ...e5 para liberar a posição no momento em que as peças estiverem prontas.',
  ],
  suitability:
    'Indicada para jogadores posicionais e pacientes, que preferem segurança estrutural e gostam de finais. A teoria é razoável e as estruturas são estáveis, o que permite jogar bem conhecendo os planos. Em troca, as pretas aceitam menos espaço e menos chances de vitória rápida; quem quer contra-ataque imediato tende a preferir a Siciliana.',
  lines: [
    {
      name: 'Clássica: 4...Bf5',
      moves: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3 Bxd3 Qxd3 e6 Bd2 Ngf6 O-O-O Be7',
      comment:
        'A linha principal. As brancas ganham espaço com h4-h5, trocam o bispo preto e rocam grande. As pretas completam o desenvolvimento com ...e6, ...Ngf6 e ...Be7 e escolhem entre o roque pequeno e o grande. A estrutura é sólida, e o peão h5 pode se tornar fraco no final.',
    },
    {
      name: 'Variante do Avanço: sistema Short',
      moves: 'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 Be3 Nd7 O-O Ne7',
      comment:
        'As brancas fecham o centro e se desenvolvem com calma. As pretas golpeiam a cadeia com ...c5 e preparam ...Nc6 ou ...Nf5. Existem linhas mais agudas, como o Ataque Van der Wiel com 4.Nc3 e 5.g4, que exigem preparação específica.',
    },
    {
      name: 'Variante das Trocas',
      moves: 'e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4 Bg4 Qb3',
      comment:
        'Estrutura simétrica semelhante à Defesa Eslava das Trocas, com cores invertidas. As brancas pressionam b7 com Qb3; as pretas defendem com ...Qd7 ou ...Qc8 e buscam o ataque de minoria com ...b5-b4 na ala da dama.',
    },
    {
      name: 'Ataque Panov-Botvinnik',
      moves: 'e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Be7 cxd5 Nxd5 Bd3 Nc6 O-O O-O',
      comment:
        'As brancas jogam com peão isolado em d4, buscando ataque com Re1, Qe2 e Ne5. As pretas bloqueiam em d5, trocam peças e esperam o momento em que o peão isolado se torne uma fraqueza. É uma das estruturas mais importantes do xadrez.',
    },
    {
      name: 'Variante dos Dois Cavalos',
      moves: 'e4 c6 Nc3 d5 Nf3 Bg4 h3 Bxf3 Qxf3 Nf6 d3 e6 g3 Bb4 Bd2 Nbd7',
      comment:
        'As brancas evitam o confronto central e mantêm o par de bispos. As pretas cedem o bispo de c8 por um cavalo, mas constroem uma estrutura sólida com ...e6 e ...d5 e desenvolvem rapidamente com ...Bb4 e ...Nbd7.',
    },
    {
      name: 'Variante Fantasia',
      moves: 'e4 c6 d4 d5 f3 dxe4 fxe4 e5 Nf3 exd4 Bc4 Nf6 O-O',
      comment:
        'As brancas sustentam e4 com o peão f, aceitando enfraquecer a ala do rei em troca de centro e desenvolvimento rápido. A resposta ...e5 desafia o centro de imediato e leva a posições abertas em que a precisão é essencial.',
    },
  ],
  traps: [
    {
      name: 'Mate afogado com Nd6',
      moves: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nd7 Qe2 Ngf6 Nd6#',
      beneficiary: 'white',
      explanation:
        'Na Variante Karpov (4...Nd7), o lance 5.Qe2 crava o peão e7 contra o rei. O natural 5...Ngf6?? permite 6.Nd6#: o peão e7 não pode capturar porque está cravado, e o rei está cercado pelas próprias peças. A ordem correta é jogar ...Ngf6 apenas depois de verificar a coluna e.',
    },
    {
      name: 'Armadilha Réti-Tartakower',
      moves: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nf6 Qd3 e5 dxe5 Qa5+ Bd2 Qxe5 O-O-O Nxe4 Qd8+ Kxd8 Bg5+ Kc7 Bd8#',
      beneficiary: 'white',
      explanation:
        'Uma das miniaturas mais famosas da história (Viena, 1910). Depois de 8.O-O-O, o cavalo de e4 parece indefeso, mas 8...Nxe4?? permite 9.Qd8+!! Kxd8 10.Bg5+, xeque duplo do bispo e da torre de d1, e 10...Kc7 11.Bd8#. Se 10...Ke8, 11.Rd8#. Lição: antes de ganhar material, verifique colunas abertas e xeques duplos.',
    },
  ],
  mistakes: [
    {
      title: 'Jogar ...e6 cedo na Variante do Avanço',
      moves: 'e4 c6 d4 d5 e5 e6',
      explanation:
        'Com 3...e6, as pretas prendem o próprio bispo de c8, exatamente o problema que a Caro-Kann pretendia evitar, e ainda precisarão gastar mais um tempo para jogar ...c5. O correto é 3...Bf5 primeiro e só depois ...e6.',
    },
    {
      title: 'Esquecer ...h6 diante do avanço h4-h5',
      moves: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 Nf6 h5',
      explanation:
        'Sem ...h6, o bispo de g6 fica sem a casa h7, ocupada pelo próprio peão. As casas f5 e e4 estão controladas pelo cavalo de g3, e as pretas acabam perdendo o par de bispos ou material. O lance 6...h6 (ou 6...h5) é obrigatório nessa linha.',
    },
    {
      title: 'Ignorar a pressão sobre b7',
      explanation:
        'Como o bispo de c8 sai cedo, b7 fica sem defesa natural. Lances como Qb3 aparecem em muitas variantes (Trocas, Avanço, Panov). Antes de desenvolver o bispo, verifique se ...Qb6, ...Qc7 ou ...Qd7 estão disponíveis para proteger o peão.',
    },
    {
      title: 'Ficar passivo contra o peão isolado do Panov',
      explanation:
        'Contra o peão isolado, a passividade é perigosa: as brancas preparam d4-d5 ou o ataque com Ne5 e Qh5. As pretas devem manter um cavalo bloqueando d5, trocar peças de ataque e pressionar o peão com ...Rd8 e ...Nb4-d5.',
    },
  ],
  keyPositions: [
    {
      title: 'Clássica depois da troca dos bispos',
      moves: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3 Bxd3 Qxd3 e6',
      explanation:
        'As brancas têm espaço e o peão h5 fixando a ala do rei preta; as pretas não têm fraquezas e já resolveram o bispo de c8. Brancas: Bd2 ou Bf4, O-O-O e ataque com Ne4 ou c4 e d5. Pretas: ...Ngf6, ...Be7 ou ...Qc7, e a ruptura ...c5. O peão h5 pode virar alvo no final.',
    },
    {
      title: 'Ruptura ...c5 no Avanço',
      moves: 'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5',
      explanation:
        'As pretas atacam a base da cadeia d4. As brancas decidem entre manter o centro com c3 e Be3 ou trocar com dxc5 para conquistar a casa d4. As pretas seguem com ...Nc6, ...Qb6 e ...Ne7, como na Francesa, mas com o bispo de f5 já fora da cadeia.',
    },
    {
      title: 'Peão isolado branco no Panov',
      moves: 'e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Be7 cxd5 Nxd5 Bd3 Nc6 O-O O-O',
      explanation:
        'As brancas têm um peão isolado em d4 e peças ativas apontadas para a ala do rei. Brancas: Re1, a3, Qe2 e Ne5, buscando ataque ou d4-d5. Pretas: ...Bf6, ...Nf6 ou ...Ncb4 para controlar d5, trocar peças e jogar contra o peão no final.',
    },
  ],
};
