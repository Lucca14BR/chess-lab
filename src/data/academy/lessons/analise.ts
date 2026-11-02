import type { Lesson } from '../types';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const analise: Lesson[] = [
  {
    id: 'ana-1',
    trackId: 'trilha-analise',
    category: 'analise',
    title: 'Como analisar suas partidas',
    description:
      'A análise das próprias partidas é a forma de treino mais personalizada que existe. Aprenda um método: primeiro sem motor, depois com ele, sempre buscando os momentos críticos.',
    level: 'intermediario',
    minutes: 16,
    requires: ['tat-1'],
    keyPoints: [
      'Analise logo depois da partida, enquanto ainda lembra o que pensou em cada lance.',
      'Faça a primeira análise sem motor: o objetivo é entender o seu raciocínio, não só o resultado.',
      'Concentre-se nos momentos críticos: as decisões que mudaram a avaliação da partida.',
      'Registre as conclusões em poucas frases; é delas que nasce o seu plano de treino.',
    ],
    sections: [
      {
        heading: 'Primeiro sem o motor',
        paragraphs: [
          'Logo depois da partida, a memória do que você pensou ainda está fresca. É o melhor momento para anotar os planos que considerou, as variantes que calculou e os lances que temeu. Esse material é insubstituível: o motor mostra o lance certo, mas não mostra por que você não o encontrou.',
          'Percorra a partida lance a lance e marque os momentos em que hesitou, gastou muito tempo ou sentiu que a posição mudou. Tente encontrar melhorias por conta própria antes de consultar qualquer ferramenta.',
          'A Partida da Ópera, de Morphy, é um bom modelo de leitura: cada lance branco desenvolve uma peça com uma ameaça. Ao analisar, pergunte em cada momento qual era a ideia, e não apenas qual era o lance.',
        ],
        example: {
          title: 'Partida da Ópera: desenvolvimento com ameaças',
          fen: START,
          moves: ['e4', 'e5', 'Nf3', 'd6', 'd4', 'Bg4', 'dxe5', 'Bxf3', 'Qxf3', 'dxe5', 'Bc4', 'Nf6', 'Qb3'],
          caption: 'Depois de trocar o bispo pelo cavalo, as pretas ficaram atrasadas. Qb3 ataca f7 e b7 ao mesmo tempo.',
          arrows: [
            { from: 'b3', to: 'f7', brush: 'red' },
            { from: 'b3', to: 'b7', brush: 'red' },
          ],
        },
      },
      {
        heading: 'Encontrar os momentos críticos',
        paragraphs: [
          'Nem todos os lances merecem a mesma atenção. Os momentos críticos são aqueles em que havia uma decisão importante: uma troca que mudava a estrutura, uma oportunidade tática, a escolha de um plano ou de um final.',
          'Sinais de um momento crítico: a posição passa de equilibrada a vantajosa (ou o contrário), há um sacrifício possível, ou você gastou muito tempo de relógio. Quase sempre uma partida é decidida em dois ou três desses momentos.',
          'Na Ópera, o momento crítico chega depois de 9...b5: as pretas têm o rei no centro e as peças sem coordenação, e Morphy encontra o sacrifício que abre as linhas.',
        ],
        example: {
          title: 'Partida da Ópera depois de 12...Rd8',
          fen: '3rkb1r/p2nqppp/5n2/1B2p1B1/4P3/1Q6/PPP2PPP/2KR3R w k - 3 13',
          caption: 'O cavalo de d7 está cravado duas vezes e o rei preto não fez o roque. Todas as peças brancas estão em jogo.',
        },
      },
      {
        heading: 'Anotar com clareza',
        paragraphs: [
          'Use os símbolos tradicionais para organizar a análise: ! para um bom lance, ? para um erro, ?? para um erro grave, !? para um lance interessante e ?! para um lance duvidoso. Eles ajudam a encontrar rapidamente os pontos importantes quando você revisar a partida no futuro.',
          'Mais importante que os símbolos são os comentários em palavras. Uma frase como "não vi que o cavalo de f6 era o único defensor de h7" vale mais que uma longa variante sem explicação.',
          'Ao final, resuma a partida em duas ou três conclusões: o que decidiu o resultado, qual foi o erro principal e o que você faria diferente.',
        ],
      },
      {
        heading: 'Só então, o motor',
        paragraphs: [
          'Depois da análise própria, use o motor para conferir. Compare as suas conclusões com as dele: onde você acertou, onde errou e, principalmente, onde não viu nada.',
          'Os erros que o motor revela e que você não tinha percebido são os mais valiosos, porque mostram pontos cegos. Se eles se repetem em várias partidas, você encontrou um tema de treino.',
        ],
      },
    ],
    exercises: [
      {
        id: 'ana-1-ex1',
        prompt:
          'Partida da Ópera, momento crítico: o rei preto está no centro e as pretas acabaram de jogar ...b5. Brancas jogam e abrem linhas com um sacrifício de peça.',
        fen: 'rn2kb1r/p3qppp/2p2n2/1p2p1B1/2B1P3/1QN5/PPP2PPP/R3K2R w KQkq - 0 10',
        solution: ['Nxb5'],
        explanation:
          'Morphy jogou 10.Nxb5!. Depois de 10...cxb5 11.Bxb5+ Nbd7 12.O-O-O, todas as peças brancas atacam o cavalo cravado de d7 e o rei preto, que não consegue fazer o roque. Recuar o bispo seria lento e daria tempo para as pretas se organizarem.',
      },
      {
        id: 'ana-1-ex2',
        prompt: 'O final da Partida da Ópera. Brancas jogam e dão mate em 2.',
        fen: '4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 16',
        solution: ['Qb8+', 'Nxb8', 'Rd8#'],
        checkmate: true,
        explanation:
          'Qb8+! desvia o cavalo de d7, o único defensor da casa d8. Depois de Nxb8, Rd8 é mate: o bispo de g5 protege a torre e controla e7, a casa d7 fica na linha da torre, e f7 e f8 estão ocupadas pelas próprias peças pretas.',
      },
    ],
  },
  {
    id: 'ana-2',
    trackId: 'trilha-analise',
    category: 'analise',
    title: 'Uso do motor com critério',
    description:
      'O motor é o melhor analista do mundo, mas só ajuda quem sabe perguntar. Entenda o que significa a avaliação, como evitar a dependência e como aprender com lances que parecem "de máquina".',
    level: 'avancado',
    minutes: 18,
    requires: ['ana-1'],
    keyPoints: [
      'A avaliação numérica é uma estimativa em peões; o que importa é a tendência e a linha principal, não o número exato.',
      'Use o motor depois da sua própria análise, nunca antes.',
      'Quando o motor sugere um lance surpreendente, procure a ideia por trás dele até conseguir explicá-la em palavras.',
      'Compare várias linhas (multi-PV): se várias têm avaliação parecida, a escolha prática depende do seu estilo.',
    ],
    sections: [
      {
        heading: 'O que significa a avaliação',
        paragraphs: [
          'A avaliação do motor é expressa em peões: +1,0 significa que as brancas estão melhor por cerca de um peão. Valores pequenos (entre -0,5 e +0,5) indicam equilíbrio; acima de +2 a vantagem costuma ser decisiva com jogo correto.',
          'O número não é o material. Uma posição com peça a mais pode valer 0,00 se for uma fortaleza, e uma posição com material igual pode valer +5 se houver um ataque imparável. A avaliação resume tudo o que o motor viu na profundidade calculada.',
          'Por isso a linha principal é mais útil que o número. Ela mostra como a vantagem se concretiza e permite que você entenda o caminho, e não apenas o destino.',
        ],
        example: {
          title: 'Peça a mais, avaliação 0,00',
          fen: '7k/8/6K1/7P/8/3B4/8/8 w - - 0 1',
          caption: 'O bispo de casas claras não controla h8, casa escura de promoção do peão de torre. O rei preto no canto não pode ser expulso: empate.',
        },
      },
      {
        heading: 'Primeiro você, depois o motor',
        paragraphs: [
          'Ligar o motor desde o primeiro lance transforma a análise num exercício passivo: você aceita as sugestões sem entender por que as suas ideias estavam erradas. O aprendizado acontece quando há confronto entre o que você pensou e o que é verdade.',
          'Uma rotina eficiente: analise sozinho, anote as suas avaliações nos momentos críticos e só então abra o motor. Para cada divergência grande, pergunte: o que eu não vi? Foi uma tática, uma avaliação estratégica ou um erro de cálculo?',
        ],
      },
      {
        heading: 'Lances "de máquina"',
        paragraphs: [
          'Às vezes o motor aponta lances que um humano raramente consideraria: retiradas, sacrifícios silenciosos, lances de rei no meio de um final. Eles costumam esconder uma ideia geométrica precisa.',
          'Não aceite o lance sem explicação. Jogue a linha do motor no tabuleiro, procure a ameaça que ele cria e tente descrevê-la em uma frase. Se não conseguir, peça ao motor a refutação do lance que você queria jogar: muitas vezes é aí que a ideia aparece.',
          'O estudo de Réti é o exemplo clássico. O rei branco parece incapaz de alcançar o peão preto, mas, ao avançar pela diagonal, ameaça duas coisas ao mesmo tempo e salva a partida. O motor mostra 0,00 desde o primeiro lance; entender por que é o verdadeiro aprendizado.',
        ],
      },
      {
        heading: 'Várias linhas e profundidade',
        paragraphs: [
          'Ativar várias linhas (multi-PV) mostra as alternativas e a diferença entre elas. Se o melhor lance vale +0,3 e o segundo +0,2, a escolha é de estilo; se o segundo vale -1,5, existe um lance único que você precisava encontrar.',
          'Desconfie de avaliações em profundidade baixa em posições táticas: elas podem mudar bastante quando o motor calcula mais. Em posições críticas, deixe o motor pensar e observe se a avaliação se estabiliza.',
        ],
      },
    ],
    exercises: [
      {
        id: 'ana-2-ex1',
        prompt:
          'O motor indica vantagem decisiva, embora a torre preta pareça segurar o peão. Brancas jogam e ganham com um espeto: liberem a casa de promoção.',
        fen: 'R7/P4k2/8/8/8/8/r7/6K1 w - - 0 1',
        solution: ['Rh8', 'Rxa7', 'Rh7+', 'Ke6', 'Rxa7'],
        explanation:
          'Rh8! ameaça a8=Q. Se a torre preta captura o peão, Rh7+ é um espeto ao longo da sétima fileira e a torre de a7 cai. O truque só funciona porque o rei preto está na sétima fileira e longe de g7 e h7; com o rei nessas casas, a posição seria empate.',
      },
      {
        id: 'ana-2-ex2',
        prompt:
          'Estudo de Réti. O motor mostra 0,00. Brancas jogam e empatam: avancem o rei pela diagonal, ameaçando ao mesmo tempo alcançar o peão preto e apoiar o peão branco.',
        fen: '7K/8/k1P5/7p/8/8/8/8 w - - 0 1',
        solution: ['Kg7', 'h4', 'Kf6', 'Kb6', 'Ke5'],
        explanation:
          'Cada lance de rei pela diagonal h8-a1 aproxima o rei branco dos dois peões. Depois de Ke5, se 3...h3, vem 4.Kd6 e o peão c promove junto com o preto; se 3...Kxc6, 4.Kf4 alcança o peão h. O rei percorre dois caminhos ao mesmo tempo.',
      },
    ],
  },
  {
    id: 'ana-3',
    trackId: 'trilha-analise',
    category: 'analise',
    title: 'Padrões de erro e plano de treino',
    description:
      'Os seus erros não são aleatórios. Aprenda a classificá-los, a encontrar os que se repetem e a transformar cada padrão num exercício concreto.',
    level: 'avancado',
    minutes: 18,
    requires: ['ana-2'],
    practiceTheme: 'defesa',
    keyPoints: [
      'Classifique cada erro: tático, estratégico, de abertura, de final ou de gestão do tempo.',
      'Peças soltas e ameaças do adversário ignoradas são as causas mais frequentes de derrotas.',
      'Um erro repetido em várias partidas é um tema de treino; um erro isolado, quase nunca.',
      'Transforme o diagnóstico em prática: puzzles do tema, revisão de aberturas e partidas modelo.',
    ],
    sections: [
      {
        heading: 'Classificar os erros',
        paragraphs: [
          'Depois de analisar várias partidas, reúna os erros principais numa lista e dê a cada um uma categoria: tático (não vi uma combinação, minha ou do adversário), estratégico (plano errado, troca ruim), de abertura (saí da teoria sem entender a posição), de final (técnica) ou de relógio (pressa ou falta de tempo).',
          'A classificação revela tendências que uma partida isolada não mostra. Se metade das derrotas vem de táticas que você deixou passar, estudar estruturas de peões não é a prioridade do momento.',
        ],
      },
      {
        heading: 'Peças soltas e ameaças ignoradas',
        paragraphs: [
          'A maioria dos erros táticos em partidas amadoras tem duas origens: deixar peças sem defesa e não perguntar qual é a ameaça do adversário depois de cada lance dele.',
          'O mate do corredor é o caso típico de ameaça ignorada. O rei roqueado parece seguro atrás dos peões, mas a falta de uma casa de fuga transforma qualquer torre adversária na primeira fileira em mate. Uma janela em h3 ou g3, no momento certo, resolve o problema.',
          'O hábito que corrige esses erros é simples e precisa ser treinado até virar automático: antes de cada lance, verifique as peças soltas dos dois lados e os xeques e capturas disponíveis para o adversário.',
        ],
        example: {
          title: 'Mate do corredor sofrido',
          fen: '6k1/5ppp/8/8/8/8/1r3PPP/6K1 b - - 0 1',
          moves: ['Rb1#'],
          caption: 'O rei branco não tem casa de fuga. Um lance como h3, feito antes, teria evitado o mate.',
        },
      },
      {
        heading: 'Armadilhas de abertura',
        paragraphs: [
          'Perder repetidamente na mesma abertura indica falta de compreensão da estrutura ou desconhecimento de uma armadilha típica. A solução é revisar a linha, entender o erro e guardá-la no repertório.',
          'A Arca de Noé, na Ruy López, é uma armadilha que derruba jogadores de todos os níveis. Depois de 8.Qxd4?, as pretas jogam ...c5 e ...c4, e o bispo de b3 fica preso pelos próprios peões pretos. Quem conhece o padrão simplesmente evita a captura com a dama.',
        ],
        example: {
          title: 'A Arca de Noé',
          fen: START,
          moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'd6', 'd4', 'b5', 'Bb3', 'Nxd4', 'Nxd4', 'exd4', 'Qxd4', 'c5', 'Qd5', 'Be6', 'Qc6+', 'Bd7', 'Qd5', 'c4'],
          caption: 'Os peões de b5 e c4 aprisionam o bispo de b3. As pretas ganham uma peça.',
        },
      },
      {
        heading: 'Do diagnóstico ao treino',
        paragraphs: [
          'Cada categoria de erro tem um treino correspondente. Erros táticos pedem puzzles diários do tema que mais aparece nas suas partidas. Erros de abertura pedem revisão das linhas com repetição espaçada. Erros de final pedem o estudo das posições teóricas básicas, como Lucena e Philidor.',
          'Os erros de relógio pedem prática com o tempo que você costuma jogar e uma regra pessoal de gestão: por exemplo, nunca gastar mais de um terço do tempo nos primeiros quinze lances.',
          'Reavalie a lista a cada mês. Quando um tipo de erro desaparecer das suas partidas, troque a prioridade do treino. O objetivo não é estudar tudo, e sim estudar o que está custando pontos agora.',
        ],
      },
    ],
    exercises: [
      {
        id: 'ana-3-ex1',
        prompt: 'O bispo preto em h4 está solto. Brancas jogam e ganham-no com um xeque duplo da dama.',
        fen: 'rnb1k2r/ppp2ppp/8/8/7b/2P5/PP3PPP/R1BQK2R w KQkq - 0 1',
        solution: ['Qa4+', 'Bd7', 'Qxh4'],
        explanation:
          'Qa4+ dá xeque pela diagonal a4-e8 e ataca o bispo de h4 pela quarta fileira. As pretas bloqueiam o xeque, mas não conseguem proteger o bispo. É o padrão "peça solta cai": sempre que houver uma peça sem defesa, procure um xeque que a ataque ao mesmo tempo.',
      },
      {
        id: 'ana-3-ex2',
        prompt:
          'As brancas caíram na Arca de Noé com Qxd4. Pretas jogam: ameacem a dama com o peão c e, depois que ela se retirar, prendam o bispo de b3.',
        fen: 'r1bqkbnr/2p2ppp/p2p4/1p6/3QP3/1B6/PPP2PPP/RNB1K2R b KQkq - 0 8',
        solution: ['c5', 'Qc3', 'c4'],
        explanation:
          '8...c5 ataca a dama e ganha o tempo necessário. Depois de 9.Qc3, 9...c4 fecha a gaiola: o bispo de b3 não tem casas: a2 e c2 estão ocupadas pelos peões brancos, a4 é controlada pelo peão de b5, e capturar em c4 entrega o bispo por um peão. As pretas ganham uma peça.',
      },
    ],
  },
];
