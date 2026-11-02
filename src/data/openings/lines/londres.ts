import type { Opening } from '../types';

export const londres: Opening = {
  id: 'londres',
  name: 'Sistema Londres',
  eco: ['D00', 'D02', 'A46', 'A48'],
  side: 'white',
  mainLine: 'd4 d5 Bf4 Nf6 e3 e6 Nf3 c5 c3 Nc6 Nbd2 Bd6 Bg3 O-O',
  summary:
    'Um sistema mais do que uma abertura: as brancas montam quase sempre a mesma formação, com d4, Bf4, e3, Nf3, c3 e Nbd2, independentemente do que as pretas façam. O bispo de casas escuras sai antes de e3, e o resultado é uma posição sólida, fácil de aprender e com planos de ataque bem definidos.',
  ideas: [
    'O bispo de c1 é desenvolvido para f4 antes de e3, evitando o problema do bispo preso que aparece em sistemas como o Colle.',
    'A pirâmide de peões c3, d4 e e3 é extremamente sólida: o centro dificilmente é derrubado e as brancas podem jogar com calma.',
    'Como a formação se repete, o estudo se concentra em planos e não em lances decorados: Ne5, f4, Qf3-h3 ou a ruptura e3-e4.',
    'O retiro Bg3, com h3 preparado quando necessário, preserva o bispo de casas escuras diante de ...Bd6 ou ...Nh5.',
  ],
  plansWhite: [
    'Instalar um cavalo em e5, apoiado por f4 se necessário (formação Stonewall), e atacar na ala do rei com Qf3-h3, g4 ou Rf3.',
    'Preparar a ruptura e3-e4 com Bd3, Qe2 e O-O, abrindo o centro quando as peças estiverem melhores posicionadas.',
    'Manter o bispo de casas escuras com Bg3 e h3, evitando trocas que aliviem a posição preta.',
    'Contra ...Qb6, defender b2 com Qb3 ou Qc1, ou entregar o peão em troca de desenvolvimento quando houver garantias táticas.',
  ],
  plansBlack: [
    'Atacar o centro com ...c5 e pressionar b2 e d4 com ...Qb6 e ...Nc6, aproveitando a ausência do bispo de c1 na defesa da ala da dama.',
    'Trocar o bispo de f4 com ...Bd6 ou ...Nh5, eliminando a peça mais ativa da formação branca.',
    'Ganhar espaço na ala da dama com ...c4, ...b5 e ...b4, quando as brancas tiverem rocado pequeno.',
    'Montar uma formação com ...g6 e ...Bg7, preparando ...c5 ou ...e5 para atacar o centro.',
  ],
  suitability:
    'Indicada para quem quer um repertório de brancas com pouca teoria e planos repetíveis, ideal para quem joga partidas rápidas ou dispõe de pouco tempo para estudar. É sólida e prática, mas menos ambiciosa que os sistemas com c4: contra uma defesa precisa, a vantagem de abertura é pequena e a partida é decidida no meio-jogo. Exige atenção especial às linhas com ...c5 e ...Qb6, que atacam o ponto fraco b2.',
  lines: [
    {
      name: 'Linha clássica com ...c5 e ...Bd6',
      moves: 'd4 d5 Bf4 Nf6 e3 e6 Nf3 c5 c3 Nc6 Nbd2 Bd6 Bg3 O-O Bd3 b6 Ne5 Bb7 f4',
      comment:
        'A formação típica do Londres. Diante de ...Bd6, o bispo recua para g3 para manter a estrutura. Com Ne5 e f4, as brancas montam uma espécie de Stonewall e preparam Qf3-h3 e Rf3 para atacar o rei preto.',
    },
    {
      name: 'Pressão em b2: ...Qb6',
      moves: 'd4 d5 Bf4 Nf6 e3 c5 c3 Nc6 Nd2 Qb6 Qb3 c4 Qc2 Bf5 Qc1 e6 Ngf3',
      comment:
        'As pretas exploram a ausência do bispo de c1 e atacam b2. A defesa com Qb3 seguida de Qc2 e Qc1 mantém as damas no tabuleiro e evita abrir a coluna a. As pretas ganham espaço com ...c4 e, em seguida, preparam ...b5-b4.',
    },
    {
      name: 'Defesa simétrica com ...Bf5',
      moves: 'd4 d5 Bf4 Bf5 e3 e6 c4 Bb4+ Nc3 Nf6 Qb3',
      comment:
        'Quando as pretas copiam o desenvolvimento do bispo, a ala da dama fica sem defensor. O avanço c4 seguido de Qb3 aproveita a fraqueza de b7 e d5. É um dos poucos casos em que o Londres muda de estrutura com c4.',
    },
    {
      name: 'Formação com fianchetto do rei',
      moves: 'd4 d5 Bf4 Nf6 e3 g6 Nf3 Bg7 h3 O-O Be2 c5 c3 b6 O-O Bb7',
      comment:
        'Contra o fianchetto, o bispo de g7 neutraliza parte da pressão branca. As brancas mantêm a estrutura com h3, que garante a retirada Bh2, e buscam Nbd2, a4 ou Ne5. A partida tende a ser de manobras.',
    },
    {
      name: 'Londres Jobava (2.Nc3)',
      moves: 'd4 d5 Nc3 Nf6 Bf4 e6 Nb5 Na6 e3',
      comment:
        'Versão agressiva do sistema: o cavalo vai a c3 em vez de d2 e ameaça Nb5 contra c7. É menos sólida, mas leva a posições desequilibradas e pouco estudadas, interessantes para quem quer surpreender.',
    },
  ],
  traps: [
    {
      name: 'Truque Nb5 contra ...Qxb2',
      moves: 'd4 d5 Bf4 c5 e3 Qb6 Nc3 Qxb2 Nb5',
      beneficiary: 'white',
      explanation:
        'Contra 3...Qb6, o lance 4.Nc3 parece entregar b2. Depois de 4...Qxb2?, vem 5.Nb5!, ameaçando Nc7+ com garfo no rei e na torre, enquanto Rb1 pode prender a dama. As pretas precisam de 5...Na6 e, mesmo assim, ficam com desvantagem clara: a dama fica exposta e o desenvolvimento atrasado. Contra 4.Nc3, o melhor é 4...e6 ou 4...Nf6.',
    },
    {
      name: 'Caça à dama depois de ...Qxb2',
      moves: 'd4 d5 Bf4 c5 e3 Nc6 Nf3 Qb6 Nbd2 Qxb2 Rb1 Qc3 Bb5',
      beneficiary: 'white',
      explanation:
        'Com o cavalo em d2, o peão b2 pode ser entregue. Depois de 5...Qxb2? 6.Rb1 Qc3 7.Bb5, a dama preta está fora de jogo, o cavalo de c6 está cravado e as brancas ameaçam Rb3 e O-O com Ne5, ganhando tempo atrás de tempo. A compensação é mais do que suficiente, e a vantagem branca é clara: as pretas passam muitos lances apenas salvando a dama.',
    },
  ],
  mistakes: [
    {
      title: 'Jogar Bd3 antes de Bg3 e permitir ...Bxf4',
      moves: 'd4 d5 Bf4 Nf6 e3 e6 Nf3 c5 c3 Nc6 Nbd2 Bd6 Bd3 Bxf4 exf4',
      explanation:
        'Depois de ...Bd6, deixar o bispo em f4 permite a troca. A recaptura exf4 dobra os peões e deixa a casa e4 sem controle, e as pretas ganham uma posição confortável com ...Qc7 e ...Qb6. O padrão é responder a ...Bd6 com Bg3 (ou Bxd6) antes de continuar o desenvolvimento.',
    },
    {
      title: 'Trocar as damas em b6 sem necessidade',
      moves: 'd4 d5 Bf4 Nf6 e3 c5 c3 Nc6 Nd2 Qb6 Qb3 c4 Qxb6 axb6',
      explanation:
        'A troca em b6 parece simplificar, mas abre a coluna a para a torre preta, que passa a pressionar a2, e os peões dobrados em b6 controlam casas importantes como c5 e a5. As pretas ficam com um final confortável. Prefira 7.Qc2 e manter as damas.',
    },
    {
      title: 'Esquecer h3 diante de ...Nh5',
      explanation:
        'Sem o peão em h3, o bispo de g3 não tem a casa h2 para fugir de ...Nh5, e as pretas conquistam o par de bispos. Jogar h3 no momento certo é parte essencial do sistema.',
    },
    {
      title: 'Jogar no automático contra qualquer defesa',
      explanation:
        'O Londres é um sistema, mas não dispensa atenção: contra ...c5 e ...Qb6, contra ...Bf5 e contra o fianchetto, os planos mudam. Repetir sempre os mesmos lances sem olhar para b2, e4 e e5 leva a posições passivas e sem objetivo.',
    },
  ],
  keyPositions: [
    {
      title: 'Formação completa do Londres',
      moves: 'd4 d5 Bf4 Nf6 e3 e6 Nf3 c5 c3 Nc6 Nbd2 Bd6 Bg3 O-O',
      explanation:
        'As brancas decidem entre Bd3 com Ne5 e ataque na ala do rei, ou Bd3, O-O e a ruptura e4. As pretas buscam ...b6 e ...Bb7, ...Qe7 com ...e5, ou ...Re8 com ...e5. Observe a diagonal b8-h2 e a casa e5, foco de toda a posição.',
    },
    {
      title: 'Ataque com Ne5 e f4',
      moves: 'd4 d5 Bf4 Nf6 e3 e6 Nf3 c5 c3 Nc6 Nbd2 Bd6 Bg3 O-O Bd3 b6 Ne5 Bb7 f4',
      explanation:
        'O cavalo de e5, apoiado por f4, é o centro do ataque. As brancas planejam Qf3-h3, Rf3 e g4 para abrir a ala do rei. As pretas devem trocar o cavalo de e5 ou desafiá-lo com ...Ne7-f5 e ...Nd7, e contra-atacar com ...c4 e ...b5.',
    },
  ],
};
