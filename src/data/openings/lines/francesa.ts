import type { Opening } from '../types';

export const francesa: Opening = {
  id: 'francesa',
  name: 'Defesa Francesa',
  eco: ['C00', 'C01', 'C02', 'C03', 'C07', 'C11', 'C13', 'C15', 'C18', 'C19'],
  side: 'black',
  mainLine: 'e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Bxc3+ bxc3 Ne7',
  summary:
    'Com 1...e6 e 2...d5, as pretas desafiam o peão e4 a partir de uma base sólida. A abertura gera estruturas de cadeias de peões bem definidas: as brancas ganham espaço com e5 e atacam na ala do rei, enquanto as pretas atacam a base da cadeia com ...c5 e ...f6 e jogam na ala da dama.',
  ideas: [
    'O peão e6 sustenta d5 de forma sólida, de modo que as pretas contestam o centro sem entregar material e sem permitir as táticas rápidas contra f7.',
    'Quando as brancas avançam e5, formam uma cadeia d4-e5; a regra clássica é atacar a base da cadeia, e por isso ...c5 é o golpe central das pretas, complementado por ...f6.',
    'O preço é o bispo de c8, preso atrás de e6. Grande parte da estratégia preta consiste em ativá-lo (...b6 e ...Ba6, ...Bd7-b5) ou trocá-lo.',
    'Na Variante Winawer, as pretas trocam o bispo de b4 pelo cavalo de c3 e dobram os peões brancos, em troca de casas escuras enfraquecidas no próprio campo.',
  ],
  plansWhite: [
    'Manter a cadeia d4-e5 com c3, Nf3 e, se possível, f4, ganhando espaço e restringindo as peças pretas.',
    'Atacar o rei preto na ala do rei com Bd3, Qg4 ou Qh5, Nf3-g5 e o sacrifício clássico Bxh7+ quando o cavalo preto deixar f6.',
    'Na Winawer, explorar o par de bispos e as casas escuras com Qg4, a4 e Ba3, abrindo a posição para os bispos.',
    'Contra o peão isolado preto na Tarrasch, bloquear d4 com uma peça e trocar as peças menores.',
  ],
  plansBlack: [
    'Atacar a base da cadeia com ...c5 e aumentar a pressão sobre d4 com ...Nc6, ...Qb6 e ...Nge7-f5.',
    'Romper com ...f6 para atacar e5 e abrir a coluna f para a torre, especialmente depois do roque.',
    'Ativar o bispo de c8 com ...b6 e ...Ba6, trocando-o pelo bispo branco de casas claras, ou por d7 e b5.',
    'Na Winawer, fechar a ala da dama com ...c4 e jogar contra os peões dobrados com ...Qa5, ...Bd7 e ...Rb8 ou ...O-O-O.',
    'Na Variante das Trocas, desenvolver com simetria cuidadosa e buscar atividade nas colunas abertas, sem copiar lances de forma automática.',
  ],
  suitability:
    'Indicada para quem gosta de posições sólidas, estruturas definidas e contra-ataque planejado. A teoria é moderada nas linhas do Avanço e das Trocas e mais extensa na Winawer e na Clássica, mas os planos se repetem em todas elas, o que facilita o estudo. Não é a melhor escolha para quem detesta defender: as pretas costumam ceder espaço no começo e precisam de paciência para contra-atacar.',
  lines: [
    {
      name: 'Winawer: Variante do Peão Envenenado',
      moves: 'e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Bxc3+ bxc3 Ne7 Qg4 Qc7 Qxg7 Rg8 Qxh7 cxd4 Ne2 Nbc6 f4',
      comment:
        'A linha mais aguda da Francesa. As brancas capturam os peões g7 e h7, e as pretas destroem o centro branco com ...cxd4 e ...dxc3. O rei preto costuma ficar no centro ou ir para a ala da dama, e o jogo é de alto risco para os dois lados.',
    },
    {
      name: 'Clássica: 4.Bg5',
      moves: 'e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7 e5 Nfd7 Bxe7 Qxe7 f4 O-O Nf3 c5',
      comment:
        'As brancas trocam o bispo de casas escuras e reforçam e5 com f4. As pretas golpeiam o centro com ...c5 e preparam ...Nc6 e ...f6. A troca dos bispos de casas escuras tende a valorizar o bispo ruim de c8, que ganha importância defensiva.',
    },
    {
      name: 'Steinitz: 4.e5',
      moves: 'e4 e6 d4 d5 Nc3 Nf6 e5 Nfd7 f4 c5 Nf3 Nc6 Be3 cxd4 Nxd4 Bc5 Qd2 O-O',
      comment:
        'As brancas montam um centro amplo com e5 e f4 e planejam O-O-O e ataque na ala do rei. As pretas trocam em d4, centralizam o bispo em c5 e preparam ...a6, ...b5 e ...Qb6 contra o roque grande.',
    },
    {
      name: 'Variante do Avanço',
      moves: 'e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6 a3 c4 Nbd2 Na5',
      comment:
        'As brancas fecham o centro de imediato. As pretas pressionam d4 com ...Nc6 e ...Qb6; com 6.a3, as brancas preparam b4, e as pretas respondem com ...c4, fixando a ala da dama e mirando a casa b3 com o cavalo.',
    },
    {
      name: 'Variante Tarrasch',
      moves: 'e4 e6 d4 d5 Nd2 c5 exd5 exd5 Ngf3 Nc6 Bb5 Bd6 dxc5 Bxc5 O-O Nge7 Nb3 Bd6',
      comment:
        'Com 3.Nd2, as brancas evitam a cravada ...Bb4. Na linha com 3...c5, as pretas aceitam um peão isolado em d5 em troca de peças ativas. As brancas bloqueiam d4, trocam peças e jogam contra o peão.',
    },
    {
      name: 'Variante das Trocas',
      moves: 'e4 e6 d4 d5 exd5 exd5 Nf3 Nf6 Bd3 Bd6 O-O O-O Bg5 Bg4',
      comment:
        'A estrutura é simétrica e o bispo de c8 fica livre. As brancas costumam jogar com c3, Nbd2 e Re1; as pretas, com ...c6, ...Nbd7 e ...Qc7. Quem souber criar desequilíbrios, por exemplo com roques opostos, assume a iniciativa.',
    },
  ],
  traps: [
    {
      name: 'Armadilha do Avanço: ...Nxd4 e Bb5+',
      moves: 'e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6 Bd3 cxd4 cxd4 Nxd4 Nxd4 Qxd4 Bb5+',
      beneficiary: 'white',
      explanation:
        'Com o bispo branco em d3, o peão d4 parece cair. Mas depois de 7...Nxd4? 8.Nxd4 Qxd4 9.Bb5+!, o bispo dá xeque e descobre a dama de d1 contra a dama preta em d4. As pretas perdem a dama. A ordem correta é 7...Bd7 primeiro, controlando b5.',
    },
    {
      name: 'Sacrifício grego contra o roque precipitado',
      moves: 'e4 e6 d4 d5 Nc3 Nf6 e5 Nfd7 Nf3 c5 dxc5 Bxc5 Bd3 O-O Bxh7+ Kxh7 Ng5+',
      beneficiary: 'white',
      explanation:
        'Depois de ...Nfd7, o cavalo deixa de defender h7. Com o bispo branco em d3 e o cavalo em f3, o roque 7...O-O? permite 8.Bxh7+! Kxh7 9.Ng5+. Se 9...Kg8, 10.Qh5 ameaça mate em h7; se 9...Kg6, o rei fica exposto a Qd3+ e h4. É o padrão de ataque mais importante a conhecer quando se joga a Francesa.',
    },
  ],
  mistakes: [
    {
      title: 'Esquecer de atacar a cadeia de peões',
      explanation:
        'Jogar de forma passiva depois de e5, sem ...c5 nem ...f6, entrega às brancas espaço e tempo para atacar na ala do rei. A Francesa só funciona quando as pretas pressionam d4 e e5; sem isso, a falta de espaço vira uma desvantagem permanente.',
    },
    {
      title: 'Deixar o bispo de c8 preso até o final',
      explanation:
        'O bispo de c8 é o ponto fraco estrutural da defesa. Quem não planeja ativá-lo (...b6 e ...Ba6, ...Bd7-b5) ou trocá-lo chega ao final com uma peça que defende peões, mas não cria nada.',
    },
    {
      title: 'Rocar pequeno sem verificar o sacrifício em h7',
      explanation:
        'Com o cavalo preto fora de f6 e as peças brancas em d3, f3 e d1, o roque pode ser respondido com Bxh7+, Ng5+ e Qh5. Antes de rocar, confirme se h7 está protegido, se ...Nf6 é possível ou se a dama preta controla g5.',
    },
    {
      title: 'Abrir a posição na Winawer sem cuidar das casas escuras',
      explanation:
        'Depois de ...Bxc3+, as pretas não têm mais o bispo de casas escuras. Abrir o jogo cedo com ...cxd4 ou ...f6 sem preparação deixa casas como d6, f6 e g7 vulneráveis ao par de bispos branco.',
    },
  ],
  keyPositions: [
    {
      title: 'Pressão sobre d4 na Variante do Avanço',
      moves: 'e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6',
      explanation:
        'As pretas atacam d4 três vezes (peão c5, cavalo de c6 e dama de b6). As brancas defendem com c3, Nf3 e Be3 ou a3 com b4. Observe a casa b5: ela é a chave da Armadilha do Avanço, e o lance ...Bd7 a controla antes de qualquer captura em d4.',
    },
    {
      title: 'Winawer depois de 7.Qg4',
      moves: 'e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Bxc3+ bxc3 Ne7 Qg4',
      explanation:
        'A dama branca ataca g7, que ficou sem defensores depois da troca do bispo de casas escuras. As pretas escolhem: 7...Qc7 (sacrificar g7 e h7 pelo centro), 7...O-O (defesa sólida, mas exposta a Bd3) ou 7...Kf8. Note as casas escuras fracas em f6, g7 e h6.',
    },
    {
      title: 'Clássica depois de ...c5',
      moves: 'e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7 e5 Nfd7 Bxe7 Qxe7 f4 O-O Nf3 c5',
      explanation:
        'Com os bispos de casas escuras trocados, as pretas pressionam d4 com ...Nc6 e ...cxd4 e preparam ...f6. As brancas planejam Qd2, O-O-O e o ataque com h4 e Bd3, ou dxc5 para conquistar a casa d4.',
    },
  ],
};
