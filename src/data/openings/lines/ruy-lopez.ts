import type { Opening } from '../types';

export const ruyLopez: Opening = {
  id: 'ruy-lopez',
  name: 'Ruy López (Abertura Espanhola)',
  eco: ['C60', 'C65', 'C67', 'C68', 'C69', 'C78', 'C80', 'C84', 'C88', 'C89', 'C92', 'C95', 'C96'],
  side: 'white',
  mainLine: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6',
  summary:
    'A abertura de 1.e4 e5 mais estudada da história. Com 3.Bb5, as brancas atacam o defensor do peão e5 e criam uma pressão indireta e duradoura sobre o centro preto, que costuma acompanhar a partida até o meio-jogo e, muitas vezes, até o final.',
  ideas: [
    '3.Bb5 ataca o cavalo que defende e5. Não há ameaça imediata, porque 4.Bxc6 dxc6 5.Nxe5 Qd4 recupera o peão, mas a pressão obriga as pretas a tomar decisões sobre o centro desde cedo.',
    'Depois do roque e de Re1, o peão e4 fica protegido e a ameaça Bxc6 seguida de Nxe5 passa a ser real; é por isso que as pretas costumam expulsar o bispo com ...b5.',
    'As brancas buscam o centro ideal com c3 e d4, preparando o avanço com h3 para impedir a cravada ...Bg4.',
    'O bispo, desviado para b3 e depois c2, continua apontado para a ala do rei e se torna peça de ataque quando o centro se fecha.',
    'A manobra Nbd2-f1-g3 leva o cavalo da dama para a ala do rei. É um dos padrões mais característicos da abertura e mostra a filosofia espanhola: melhorar as peças antes de abrir o jogo.',
  ],
  plansWhite: [
    'Montar o centro com c3, h3 e d4, sustentando e4 com Re1 e evitando a cravada ...Bg4.',
    'Redirecionar o cavalo de b1 por d2-f1-g3 e manter o bispo em c2, preparando Nf5 ou a ruptura f4 em posições fechadas.',
    'Quando o centro se fechar com d4-d5, atacar na ala do rei com Nh2, g4 e Ng3-f5, e travar a ala da dama com b3 ou a4.',
    'Pressionar a estrutura ...b5 com a4, abrindo a coluna a para as torres e fixando fraquezas na ala da dama.',
    'Na Variante das Trocas, simplificar e buscar o final: a maioria de quatro peões contra três na ala do rei é sã e pode gerar um peão passado.',
  ],
  plansBlack: [
    'Ganhar espaço com ...a6 e ...b5, afastar o bispo e contestar o centro com ...d6, ...Re8 e ...Bf8.',
    'Jogar ...Na5 e ...c5 (Variante Chigorin), ganhando espaço na ala da dama e atacando d4; depois, ...Qc7 e ...Nc6 aumentam a pressão central.',
    'Reorganizar as peças com ...Nb8-d7 (Variante Breyer) ou ...Bb7 e ...Re8 (Variante Zaitsev), reforçando e5 antes de buscar ...c5 ou ...d5.',
    'Contra-atacar com ...d5 no Ataque Marshall, sacrificando um peão em troca de ataque duradouro contra o rei branco.',
    'Na Defesa Berlim, aceitar o final sem damas com o par de bispos e uma estrutura sólida, bloqueando os peões brancos da ala do rei.',
  ],
  suitability:
    'Indicada para quem quer jogar 1.e4 com ambição de longo prazo e gosta de posições ricas em manobras. Exige estudo considerável: as pretas dispõem de várias defesas respeitáveis (Berlim, Marshall, Aberta, Breyer, Zaitsev, Chigorin) e cada uma pede um plano específico. Em troca, o jogador aprende os padrões estruturais mais importantes de 1.e4 e5, úteis por toda a vida enxadrística. Para quem busca pouca teoria, a Italiana é um caminho mais econômico.',
  lines: [
    {
      name: 'Fechada: Variante Chigorin',
      moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Na5 Bc2 c5 d4 Qc7',
      comment:
        'A espinha dorsal da Espanhola Fechada. As pretas levam o cavalo para a5 para trocar ou expulsar o bispo e ganham espaço com ...c5. As brancas mantêm o centro com d4 e seguem com Nbd2-f1-g3. A decisão central é se e quando fechar o jogo com d5 ou trocar em c5 ou e5.',
    },
    {
      name: 'Fechada: Variante Breyer',
      moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Nb8 d4 Nbd7 Nbd2 Bb7 Bc2 Re8',
      comment:
        'O recuo 9...Nb8 parece estranho, mas libera o peão c e leva o cavalo para d7, onde reforça e5. As pretas mantêm uma posição muito sólida, com ...Bf8 e ...g6 a seguir, e só depois buscam ...c5 ou ...d5. É uma das defesas preferidas no mais alto nível.',
    },
    {
      name: 'Ataque Marshall',
      moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5 exd5 Nxd5 Nxe5 Nxe5 Rxe5 c6 d4 Bd6 Re1 Qh4 g3 Qh3',
      comment:
        'As pretas rocam antes de ...d6 para responder 8.c3 com o gambito 8...d5. Depois de ganhar o peão, as brancas enfrentam um ataque perigoso contra o rei, com a dama preta em h3 e os bispos apontados para a ala do rei. Por isso, muitos jogadores de brancas evitam a linha com 8.a4 ou 8.h3 (sistemas Anti-Marshall).',
    },
    {
      name: 'Defesa Berlim',
      moves: 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5 Nf5 Qxd8+ Kxd8',
      comment:
        'A famosa Muralha de Berlim. As damas saem cedo, o rei preto perde o roque e as pretas aceitam peões dobrados, mas recebem o par de bispos e uma posição difícil de penetrar. As brancas têm a maioria na ala do rei e o peão e5 avançado; o jogo é técnico e exige paciência de ambos os lados.',
    },
    {
      name: 'Defesa Aberta',
      moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Nxe4 d4 b5 Bb3 d5 dxe5 Be6',
      comment:
        'As pretas capturam em e4 e buscam jogo ativo com peças. O cavalo de e4 fica bem posicionado, mas pode se tornar alvo; as brancas pressionam com c3, Nbd2 e Qe2, enquanto as pretas desenvolvem com ...Be7 ou ...Bc5. A linha é mais dinâmica que a Fechada e exige cálculo preciso.',
    },
    {
      name: 'Variante das Trocas',
      moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6 O-O f6 d4 exd4 Nxd4 c5 Nb3 Qxd1 Rxd1',
      comment:
        'As brancas entregam o par de bispos para estragar a estrutura preta. Com as damas trocadas, a maioria branca de quatro contra três na ala do rei pode gerar um peão passado, enquanto a maioria preta na ala da dama está dobrada. As pretas compensam com os dois bispos e devem manter peças em jogo para aproveitá-los.',
    },
  ],
  traps: [
    {
      name: 'Armadilha da Arca de Noé',
      moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 d6 d4 b5 Bb3 Nxd4 Nxd4 exd4 Qxd4 c5 Qd5 Be6 Qc6+ Bd7 Qd5 c4',
      beneficiary: 'black',
      explanation:
        'Na Defesa Steinitz Diferida, recapturar 8.Qxd4?? é um erro clássico. Com 8...c5, a dama é empurrada, e depois de 9.Qd5 Be6 10.Qc6+ Bd7 11.Qd5 vem 11...c4: o bispo de b3 fica preso pelos peões b5 e c4, sem casas de fuga, porque c2 está ocupada pelo próprio peão branco. As brancas perdem uma peça. O correto é 8.c3, oferecendo o peão em troca de desenvolvimento, ou 8.Bd5, tirando o bispo da armadilha antes de recuperar o peão.',
    },
    {
      name: 'Armadilha de Tarrasch na Aberta',
      moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Nxe4 d4 b5 Bb3 d5 dxe5 Be6 c3 Be7 Re1 O-O Nd4 Qd7 Nxe6 fxe6 Rxe4',
      beneficiary: 'white',
      explanation:
        'Na Defesa Aberta, o natural 11...Qd7? perde material. Depois de 12.Nxe6 fxe6, a torre captura em e4: se 13...dxe4, a coluna d se abre e a dama branca captura a dama de d7. As pretas ficam sem o cavalo central. A continuação correta é 11...Nxe5!, que contra-ataca e mantém o equilíbrio (12.f3 Bd6 ou 12...Bh4 com jogo ativo).',
    },
    {
      name: 'Armadilha de Mortimer',
      moves: 'e4 e5 Nf3 Nc6 Bb5 Nf6 d3 Ne7 Nxe5 c6 Ba4 Qa5+',
      beneficiary: 'black',
      explanation:
        'Contra 4.d3 na Berlim, o recuo 4...Ne7 parece entregar e5. Se as brancas capturarem com 5.Nxe5?, vem 5...c6, atacando o bispo, e depois de 6.Ba4 o xeque 6...Qa5+ ataca ao mesmo tempo o rei e o cavalo de e5 (e o bispo de a4). As pretas recuperam a peça com vantagem.',
    },
  ],
  mistakes: [
    {
      title: 'Achar que Bxc6 e Nxe5 ganham um peão logo no início',
      moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6 Nxe5 Qd4',
      explanation:
        'Com o rei branco ainda em e1 e o peão e4 sem proteção, 5.Nxe5? é respondido por 5...Qd4!, que ataca o cavalo e o peão e4 ao mesmo tempo. As pretas recuperam o material e ficam com o par de bispos. A ameaça de Bxc6 e Nxe5 só existe depois do roque e de Re1.',
    },
    {
      title: 'Pretas rocando antes de expulsar o bispo depois de Re1',
      moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 O-O Bxc6 dxc6 Nxe5',
      explanation:
        'Com a torre em e1 protegendo e4, a troca em c6 seguida de Nxe5 ganha um peão limpo: o truque ...Qd4 não funciona mais. Por isso as pretas jogam 6...b5 primeiro e só rocam depois de 7.Bb3, como no Ataque Marshall.',
    },
    {
      title: 'Jogar d4 sem h3 e permitir a cravada ...Bg4',
      moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O d4 Bg4',
      explanation:
        'Não é um erro grave, mas cede às pretas uma pressão incômoda: o cavalo de f3, que defende d4, fica cravado, e as pretas podem aumentar a pressão com ...exd4 e ...Na5. O lance 9.h3 existe justamente para que d4 possa ser jogado sem essa cravada.',
    },
    {
      title: 'Trocar no centro de forma automática na Espanhola Fechada',
      explanation:
        'Capturas como dxe5 ou dxc5 sem motivo concreto aliviam a posição preta, liberam o bispo de e7 e as casas centrais. A força da Espanhola está na tensão: as brancas devem trocar apenas quando isso abrir linhas para as próprias peças ou criar uma fraqueza clara, como uma casa d5 permanente.',
    },
  ],
  keyPositions: [
    {
      title: 'Espanhola Fechada depois de 9.h3',
      moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3',
      explanation:
        'A encruzilhada da teoria. As brancas preparam d4 sem permitir ...Bg4. As pretas escolhem o plano: ...Na5 (Chigorin), ...Nb8 (Breyer), ...Bb7 com ...Re8 (Zaitsev) ou ...Be6. Observe a diagonal do bispo de b3 até f7 e o ponto e5, que as pretas precisam manter sob controle.',
    },
    {
      title: 'Chigorin com a coluna c aberta',
      moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Na5 Bc2 c5 d4 Qc7 Nbd2 cxd4 cxd4 Nc6 Nb3 a5 Be3 a4 Nbd2',
      explanation:
        'Depois da troca em d4, a coluna c se abre e o peão d4 vira o alvo das pretas, atacado pelo cavalo de c6 e pela dama de c7. As brancas o sustentam com Be3 e o cavalo que volta a d2, e preparam Rc1, Bd3 e Nf1-g3. Fique atento ao avanço d4-d5: ele fecha o centro, expulsa o cavalo de c6 e leva o jogo para as alas, com ataque branco no flanco do rei e jogo preto com ...Nb4 ou ...Nd7-c5 na ala da dama.',
    },
    {
      title: 'Final da Berlim',
      moves: 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5 Nf5 Qxd8+ Kxd8',
      explanation:
        'Sem damas, o rei preto em d8 não corre perigo. As brancas querem avançar a maioria da ala do rei (f4, g4, f5) apoiadas pelo peão e5 e colocar as torres nas colunas d e e. As pretas devem levar o rei para c8 ou e8, usar o par de bispos e bloquear com ...h5 ou ...h6 e ...Ne7.',
    },
  ],
};
