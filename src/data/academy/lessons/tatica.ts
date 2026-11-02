import type { Lesson } from '../types';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const tatica: Lesson[] = [
  {
    id: 'tat-1',
    trackId: 'trilha-tatica',
    category: 'tatica',
    title: 'Garfos e ataques duplos',
    description:
      'Uma peça atacando dois alvos ao mesmo tempo: o motivo tático mais comum do xadrez. Veja os garfos de cavalo, de peão e de dama, e como preparar um garfo com um sacrifício.',
    level: 'iniciante',
    minutes: 15,
    requires: ['fund-2'],
    practiceTheme: 'garfo',
    keyPoints: [
      'Um ataque duplo funciona porque o adversário só pode responder a uma ameaça por lance.',
      'Garfos com xeque são os mais fortes: o rei precisa sair e a outra peça cai.',
      'Peças soltas (sem defesa) e reis e damas em casas da mesma cor de cavalo são alvos naturais.',
      'Quando o garfo ainda não existe, procure um xeque ou sacrifício que leve a peça inimiga para a casa certa.',
    ],
    sections: [
      {
        heading: 'O princípio do ataque duplo',
        paragraphs: [
          'Um ataque duplo acontece quando um lance cria duas ameaças ao mesmo tempo. Como o adversário só joga um lance, ele normalmente consegue resolver apenas uma delas. O garfo é o caso em que uma única peça ataca dois alvos.',
          'O cavalo é o especialista em garfos. Ele ataca em todas as direções, salta sobre as peças e não pode ser bloqueado. Quando o rei e a torre, ou o rei e a dama, estão a um salto de cavalo de uma mesma casa, vale a pena olhar com atenção.',
          'O garfo com xeque é o mais devastador: o adversário é obrigado a cuidar do rei, e a segunda peça cai no lance seguinte.',
        ],
        example: {
          title: 'Garfo de cavalo em c7',
          fen: 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1',
          moves: ['Nc7+', 'Kd7', 'Nxa8'],
          caption: 'De c7, o cavalo ataca o rei em e8 e a torre em a8. O rei foge e a torre cai.',
          arrows: [
            { from: 'c7', to: 'e8', brush: 'red' },
            { from: 'c7', to: 'a8', brush: 'red' },
          ],
        },
      },
      {
        heading: 'O garfo de peão',
        paragraphs: [
          'O peão é a peça de menor valor, e por isso o seu garfo é tão eficiente: qualquer peça atacada por ele vale mais do que ele. Um peão que avança e ataca duas peças em diagonal quase sempre ganha material.',
          'Um truque clássico de abertura é o "truque do garfo". Na Italiana, depois de 4.Nc3 Nxe4! 5.Nxe4 d5, as pretas recuperam a peça: o peão de d5 ataca o bispo de c4 e o cavalo de e4 ao mesmo tempo.',
          'Ao planejar um garfo de peão, verifique se a casa de destino está protegida e se o adversário pode responder com uma contra-ameaça, como um xeque ou a captura de outra peça.',
        ],
        example: {
          title: 'O truque do garfo',
          fen: START,
          moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Nc3', 'Nxe4', 'Nxe4', 'd5'],
          caption: 'O peão de d5 ataca o bispo e o cavalo. As pretas recuperam a peça entregue em e4.',
          arrows: [
            { from: 'd5', to: 'c4', brush: 'red' },
            { from: 'd5', to: 'e4', brush: 'red' },
          ],
        },
      },
      {
        heading: 'O ataque duplo da dama',
        paragraphs: [
          'A dama ataca em oito direções e é a peça que mais cria ataques duplos. O caso típico é um xeque que, na mesma linha ou em outra direção, ataca uma peça solta.',
          'O ditado em inglês "loose pieces drop off" resume a ideia: peças sem defesa caem. Uma peça desprotegida no canto do tabuleiro, como um bispo em h4, é um convite a um xeque duplo da dama.',
        ],
        example: {
          title: 'Xeque e ataque à peça solta',
          fen: '4k3/pp3ppp/8/8/7b/8/PP3PPP/3QK3 w - - 0 1',
          moves: ['Qa4+', 'Kf8', 'Qxh4'],
          caption: 'Qa4+ dá xeque pela diagonal e ataca o bispo de h4 pela quarta fileira.',
          arrows: [
            { from: 'a4', to: 'e8', brush: 'red' },
            { from: 'a4', to: 'h4', brush: 'red' },
          ],
        },
      },
      {
        heading: 'Preparar o garfo',
        paragraphs: [
          'Muitas vezes o garfo não está disponível de imediato, mas pode ser criado. A ferramenta mais comum é a atração: um sacrifício que obriga o rei ou a dama adversária a ir para a casa onde o garfo funciona.',
          'O raciocínio é inverso. Primeiro identifique a casa de garfo e as peças que você quer atacar; depois pergunte que xeque ou captura coloca o alvo nessa casa. Se o sacrifício for forçado e o garfo recuperar mais material do que você entregou, a combinação funciona.',
          'No último exercício desta aula, uma torre é entregue para levar o rei a d8, onde ele e a dama ficam ao alcance de um cavalo.',
        ],
      },
    ],
    exercises: [
      {
        id: 'tat-1-ex1',
        prompt: 'Brancas jogam e ganham a dama com um garfo de cavalo.',
        fen: '2q3k1/5ppp/8/3N4/8/7P/5PP1/6K1 w - - 0 1',
        solution: ['Ne7+', 'Kf8', 'Nxc8'],
        explanation:
          'De e7, o cavalo dá xeque ao rei de g8 e ataca a dama de c8. Depois que o rei se move, Nxc8 ganha a dama. Antes do garfo as brancas estavam perdidas; depois dele, ficam com uma peça a mais.',
      },
      {
        id: 'tat-1-ex2',
        prompt: 'Brancas jogam e ganham material com um garfo de peão.',
        fen: '6k1/pp3ppp/2r1n3/8/3P4/4P3/P4PPP/3R1BK1 w - - 0 1',
        solution: ['d5', 'Rc2', 'dxe6'],
        explanation:
          'd5 ataca a torre de c6 e o cavalo de e6, e o peão está protegido pela torre de d1. As pretas salvam a torre com contra-ataque (...Rc2), mas o cavalo cai: dxe6 ganha uma peça.',
      },
      {
        id: 'tat-1-ex3',
        prompt: 'Brancas jogam e ganham a dama: atraiam o rei para a casa do garfo.',
        fen: '4k3/4pp2/7q/4N3/8/8/5PPP/3R2K1 w - - 0 1',
        solution: ['Rd8+', 'Kxd8', 'Nxf7+', 'Kd7', 'Nxh6'],
        explanation:
          'Rd8+ obriga Kxd8: d7 e f8 continuam sob o controle da torre, e e7 e f7 têm peões pretos. Agora Nxf7+ dá xeque ao rei de d8 e ataca a dama de h6. Depois que o rei se move, Nxh6 deixa as brancas com cavalo e peões contra peões.',
      },
    ],
  },
  {
    id: 'tat-2',
    trackId: 'trilha-tatica',
    category: 'tatica',
    title: 'Cravadas e espetos',
    description:
      'Duas táticas de linha: a cravada imobiliza uma peça diante de outra mais valiosa; o espeto ataca a peça valiosa primeiro e captura a que está atrás.',
    level: 'intermediario',
    minutes: 18,
    requires: ['tat-1'],
    practiceTheme: 'cravada',
    keyPoints: [
      'Cravada absoluta: a peça cravada protege o rei e não pode se mover. Cravada relativa: pode, mas perde material.',
      'Ataque a peça cravada com uma peça de menor valor, especialmente um peão.',
      'Espeto: o xeque ou a ameaça à peça da frente obriga-a a sair e expõe a de trás.',
      'Uma cravada relativa pode ser ilusória: verifique se a peça "cravada" não pode se mover com uma ameaça maior.',
    ],
    sections: [
      {
        heading: 'Cravada absoluta e relativa',
        paragraphs: [
          'A cravada é feita por uma peça de longo alcance (bispo, torre ou dama) contra duas peças adversárias alinhadas. A peça da frente fica presa, porque mover-se exporia a peça de trás.',
          'Se a peça de trás é o rei, a cravada é absoluta: a peça da frente legalmente não pode sair da linha. Se é uma dama ou uma torre, a cravada é relativa: o movimento é possível, mas custa material.',
          'Na Defesa Nimzoíndia, o bispo de b4 crava o cavalo de c3 contra o rei branco. O cavalo não pode se mover, e por isso não controla e4 enquanto a cravada existir.',
        ],
        example: {
          title: 'Cravada absoluta na Nimzoíndia',
          fen: START,
          moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'],
          caption: 'O cavalo de c3 está cravado contra o rei de e1.',
          arrows: [{ from: 'b4', to: 'e1', brush: 'red' }],
        },
      },
      {
        heading: 'Explorar a cravada',
        paragraphs: [
          'Uma peça cravada é uma peça que não se defende bem. A forma mais direta de explorá-la é atacá-la de novo, de preferência com uma peça de menor valor. Um peão que avança contra uma peça cravada costuma ganhá-la.',
          'Outra forma é acumular atacantes sobre a peça cravada: se ela é atacada mais vezes do que defendida, cairá. E uma terceira é usar o fato de que ela não cumpre suas funções de defesa, como no caso do cavalo cravado que deixa uma casa importante desprotegida.',
          'A cravada relativa de Bg5 sobre um cavalo em f6, comum no Gambito da Dama, pode se transformar em perda de material se o cavalo for atacado mais uma vez, por exemplo com e4-e5.',
        ],
        example: {
          title: 'Cravada relativa em f6',
          fen: START,
          moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5'],
          caption: 'O cavalo pode se mover, mas a dama de d8 ficaria exposta ao bispo.',
          arrows: [{ from: 'g5', to: 'd8', brush: 'red' }],
        },
      },
      {
        heading: 'O espeto',
        paragraphs: [
          'O espeto é a cravada invertida: a peça mais valiosa está na frente. Ela é atacada, precisa sair da linha, e a peça que estava atrás fica exposta à captura.',
          'O espeto mais comum é um xeque que atravessa o rei e atinge a dama ou uma torre. Nos finais, os espetos de torre ao longo das fileiras e colunas são armas frequentes contra reis e torres alinhados.',
          'Para encontrar espetos, observe peças inimigas alinhadas numa mesma linha com uma casa livre de onde você possa atacá-las.',
        ],
        example: {
          title: 'Espeto de torre na coluna d',
          fen: '3q4/8/8/3k4/8/8/8/R3K3 w - - 0 1',
          moves: ['Rd1+', 'Ke6', 'Rxd8'],
          caption: 'O xeque obriga o rei a sair da coluna d e a dama de d8 fica sem proteção.',
          arrows: [{ from: 'd1', to: 'd8', brush: 'red' }],
        },
      },
      {
        heading: 'A cravada ilusória',
        paragraphs: [
          'Nem toda cravada relativa é real. Se a peça "cravada" pode sair com uma ameaça ainda maior, como um xeque ou um contragolpe que recupera o material, a cravada não segura nada.',
          'A Armadilha do Elefante, no Gambito da Dama, é o exemplo clássico. As brancas capturam um peão em d5 contando com a cravada em f6, mas o cavalo de f6 captura mesmo assim. Se Bxd8, vem Bb4+ e as pretas recuperam a dama com uma peça a mais.',
          'A lição é verificar sempre a resposta mais forçante do adversário antes de confiar numa cravada.',
        ],
        example: {
          title: 'A Armadilha do Elefante',
          fen: START,
          moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Nbd7', 'cxd5', 'exd5', 'Nxd5', 'Nxd5', 'Bxd8', 'Bb4+', 'Qd2', 'Bxd2+', 'Kxd2', 'Kxd8'],
          caption: 'Depois de toda a sequência, as pretas terminam com uma peça a mais.',
        },
      },
    ],
    exercises: [
      {
        id: 'tat-2-ex1',
        prompt: 'O cavalo de e5 está cravado contra o rei. Brancas jogam e ganham a peça cravada.',
        fen: 'r1b1k2r/ppp2ppp/3p4/4n3/8/2N5/PPP2PPP/R1B1R1K1 w - - 0 1',
        solution: ['f4', 'f6', 'fxe5'],
        explanation:
          'f4 ataca o cavalo cravado com um peão. Ele não pode sair da coluna e, e a defesa com ...f6 não impede a captura: fxe5 ganha uma peça por um peão. Rxe5+ direto seria um erro, porque o cavalo está defendido pelo peão de d6.',
      },
      {
        id: 'tat-2-ex2',
        prompt: 'Brancas jogam e ganham a dama com um espeto.',
        fen: '6q1/pp6/4k3/8/8/8/5PPP/5BK1 w - - 0 1',
        solution: ['Bc4+', 'Ke7', 'Bxg8'],
        explanation:
          'Bc4+ dá xeque na diagonal c4-g8. O rei precisa sair da diagonal e a dama de g8, que estava atrás dele, é capturada. Repare que nenhuma peça preta pode se interpor em d5.',
      },
      {
        id: 'tat-2-ex3',
        prompt:
          'As brancas capturaram em d5 confiando na cravada do cavalo de f6. Pretas jogam: capturem mesmo assim e, depois de Bxd8, recuperem a dama com xeque.',
        fen: 'r1bqkb1r/pppn1ppp/5n2/3N2B1/3P4/8/PP2PPPP/R2QKBNR b KQkq - 0 6',
        solution: ['Nxd5', 'Bxd8', 'Bb4+'],
        explanation:
          '6...Nxd5! entrega a dama, mas 7.Bxd8 permite 7...Bb4+. A única defesa é 8.Qd2, e depois de 8...Bxd2+ 9.Kxd2 Kxd8 as pretas ficam com uma peça a mais. A cravada em f6 era apenas relativa.',
      },
    ],
  },
  {
    id: 'tat-3',
    trackId: 'trilha-tatica',
    category: 'tatica',
    title: 'Ataques descobertos, sobrecarga e sacrifícios',
    description:
      'Táticas de segundo nível: a peça que sai revela um ataque escondido, o defensor que não consegue cumprir duas tarefas e o sacrifício que abre o caminho até o rei.',
    level: 'avancado',
    minutes: 22,
    requires: ['tat-2'],
    practiceTheme: 'ataqueDescoberto',
    keyPoints: [
      'No ataque descoberto, a peça que se move cria a sua própria ameaça e revela outra atrás dela.',
      'O xeque descoberto é quase sempre decisivo: o adversário cuida do rei e perde a outra peça.',
      'Um defensor sobrecarregado protege duas coisas ao mesmo tempo; eliminá-lo ou desviá-lo derruba a defesa.',
      'Um sacrifício só é correto se a continuação for forçada ou se a compensação for concreta e verificável.',
    ],
    sections: [
      {
        heading: 'Ataque descoberto e xeque descoberto',
        paragraphs: [
          'Num ataque descoberto, uma peça está na frente de outra de longo alcance. Quando a da frente se move, a de trás passa a atacar. Se a peça que se moveu também cria uma ameaça, o adversário enfrenta dois ataques num único lance.',
          'O caso mais forte é o xeque descoberto: a peça de trás dá xeque ao rei e a peça que saiu pode ir a qualquer casa, inclusive atacar a dama ou capturar algo. O adversário é obrigado a responder ao xeque e não tem tempo para salvar o resto.',
          'Para encontrar essas oportunidades, procure linhas onde uma peça sua está entre uma peça de longo alcance e um alvo valioso, especialmente o rei adversário numa coluna ou diagonal semiaberta.',
        ],
        example: {
          title: 'Xeque descoberto na coluna e',
          fen: '3qk3/8/8/4N3/8/8/5PPP/4R1K1 w - - 0 1',
          moves: ['Nc6+', 'Kd7', 'Nxd8'],
          caption: 'O cavalo sai de e5 com ataque à dama, e a torre de e1 dá xeque. A dama cai.',
          arrows: [
            { from: 'e1', to: 'e8', brush: 'red' },
            { from: 'c6', to: 'd8', brush: 'red' },
          ],
        },
      },
      {
        heading: 'Sobrecarga e eliminação do defensor',
        paragraphs: [
          'Uma peça está sobrecarregada quando precisa defender duas coisas ao mesmo tempo. Basta atacar uma delas para que a outra fique sem proteção. O exemplo mais comum é a peça que protege a última fileira e também outra peça.',
          'Uma variante é a eliminação do defensor: capturar ou trocar a peça que sustenta a defesa, mesmo que isso custe material. Se a dama preta é a única que defende a torre da última fileira, uma troca forçada de damas deixa o rei sem proteção contra o mate do corredor.',
          'O desvio é a mesma ideia com outra forma: um xeque ou uma ameaça obriga o defensor a abandonar a casa que ele guardava.',
        ],
      },
      {
        heading: 'Sacrifícios de ataque',
        paragraphs: [
          'Um sacrifício entrega material de propósito em troca de algo maior: mate, recuperação do material com juros ou um ataque que o adversário não consegue conter. Os sacrifícios contra o rei funcionam quando muitas peças atacantes estão próximas e poucas defensoras conseguem ajudar.',
          'No ataque Fegatello (ou Fried Liver), as brancas entregam o cavalo em f7 para arrancar o rei preto da sua proteção. O rei vai para o centro, onde é perseguido pela dama e pelas peças que entram com tempo.',
          'Antes de sacrificar, calcule as respostas forçadas do adversário. Quanto mais lances de xeque e de captura houver na sequência, mais confiável é o cálculo.',
        ],
        example: {
          title: 'O ataque Fegatello',
          fen: START,
          moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5', 'Nxf7', 'Kxf7', 'Qf3+', 'Ke6', 'Nc3'],
          caption: 'O rei preto foi para e6 e o cavalo de d5, cravado, é atacado três vezes. As brancas têm um ataque perigoso por uma peça.',
        },
      },
      {
        heading: 'Como encontrar a combinação',
        paragraphs: [
          'Combinações nascem de fraquezas concretas: um rei com poucas casas, peças soltas, peças alinhadas, uma última fileira sem janela. Quando você enxerga uma dessas fraquezas, vale a pena gastar tempo procurando um golpe tático.',
          'Analise primeiro os lances forçantes: xeques, capturas e ameaças, nessa ordem. Eles reduzem as respostas do adversário e tornam o cálculo administrável. Um lance silencioso pode ser o mais forte, mas só depois de verificar que nenhum lance forçante resolve a posição.',
        ],
      },
    ],
    exercises: [
      {
        id: 'tat-3-ex1',
        prompt: 'Brancas jogam e ganham a dama com um xeque descoberto.',
        fen: 'r3k2r/ppp2ppp/3p4/4N1B1/8/qP6/P1P2PPP/R3R1K1 w - - 0 1',
        solution: ['Nc4+', 'Kf8', 'Nxa3'],
        explanation:
          'O cavalo é a única peça entre a torre de e1 e o rei de e8. Nc4+ revela o xeque e ataca a dama de a3. As pretas não têm como interpor (o peão de d6 bloqueia a dama em e7) e precisam mover o rei; Nxa3 ganha a dama.',
      },
      {
        id: 'tat-3-ex2',
        prompt: 'Encontre o mate em 2.',
        fen: '3qr1k1/5ppp/8/8/8/8/4QPPP/4R1K1 w - - 0 1',
        solution: ['Qxe8+', 'Qxe8', 'Rxe8#'],
        checkmate: true,
        explanation:
          'A dama de d8 é o único defensor da torre de e8 e da última fileira. Qxe8+ a obriga a recapturar, e Rxe8 é mate do corredor. É a eliminação do defensor: a troca tira da defesa a única peça que guardava a fileira.',
      },
    ],
  },
];
