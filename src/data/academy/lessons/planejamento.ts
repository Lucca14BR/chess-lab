import type { Lesson } from '../types';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const planejamento: Lesson[] = [
  {
    id: 'pla-1',
    trackId: 'trilha-planejamento',
    category: 'planejamento',
    title: 'Avaliar a posição',
    description:
      'Antes de escolher um lance, entenda a posição. Quatro critérios organizam a avaliação: material, atividade das peças, segurança do rei e estrutura de peões.',
    level: 'intermediario',
    minutes: 16,
    requires: ['est-1'],
    keyPoints: [
      'Material: conte, mas pergunte também se o lado com menos material tem compensação concreta.',
      'Atividade: peças que controlam casas centrais e linhas abertas valem mais do que os números indicam.',
      'Segurança do rei: um rei exposto pode decidir a partida antes que o material importe.',
      'Estrutura: fraquezas de peões são permanentes; as vantagens de atividade são temporárias e precisam ser usadas.',
    ],
    sections: [
      {
        heading: 'Material e compensação',
        paragraphs: [
          'O primeiro passo da avaliação é contar o material. Uma peça a mais costuma decidir a partida; um peão a mais é uma vantagem séria, mas nem sempre suficiente.',
          'A pergunta seguinte é se existe compensação. No Ataque Marshall da Ruy López, as pretas entregam um peão para ganhar tempo, abrir linhas e lançar as peças contra o rei branco. A avaliação objetiva é de equilíbrio, embora o material diga o contrário.',
          'Compensação precisa ser concreta: peças mais ativas, rei adversário exposto, iniciativa que obrigue o outro lado a reagir. Se você não consegue apontar o que recebeu em troca, provavelmente apenas perdeu material.',
        ],
        example: {
          title: 'Ataque Marshall',
          fen: START,
          moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'O-O', 'c3', 'd5', 'exd5', 'Nxd5', 'Nxe5', 'Nxe5', 'Rxe5', 'c6'],
          caption: 'Um peão a menos para as pretas, mas desenvolvimento rápido e peças apontadas para o rei branco.',
        },
      },
      {
        heading: 'Atividade das peças',
        paragraphs: [
          'Uma peça ativa controla casas importantes, participa do plano e tem para onde ir. Uma peça passiva apenas defende. Compare as peças dos dois lados uma a uma: quem tem as melhores?',
          'Na Catalã, o bispo de g2 domina a grande diagonal até a8. Mesmo quando as pretas mantêm o peão a mais de c4 por alguns lances, a pressão do bispo e o desenvolvimento das brancas compensam. A atividade, porém, é uma vantagem temporária: se não for usada, o adversário completa o desenvolvimento e ela desaparece.',
        ],
        example: {
          title: 'O bispo da Catalã',
          fen: START,
          moves: ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2', 'Be7', 'Nf3', 'O-O', 'O-O', 'dxc4', 'Qc2', 'a6', 'Qxc4', 'b5', 'Qc2', 'Bb7'],
          caption: 'Os dois bispos de casas claras disputam a grande diagonal. O de g2 pressiona a8 e o flanco da dama preta.',
          arrows: [{ from: 'g2', to: 'a8', brush: 'blue' }],
        },
      },
      {
        heading: 'Segurança do rei',
        paragraphs: [
          'Um rei exposto é um fator que pode sobrepor-se a todos os outros. Se o rei adversário está no centro com colunas abertas, ou se os peões do roque foram enfraquecidos, os lances forçantes ganham valor e o material pode ser sacrificado.',
          'A Defesa Damiano (2...f6) mostra o perigo. Depois de 3.Nxe5 fxe5? 4.Qh5+, o rei preto é arrastado para o centro e recebe xeques de todas as peças brancas. O material igual não significa nada nessa posição.',
        ],
        example: {
          title: 'O rei arrastado ao centro',
          fen: START,
          moves: ['e4', 'e5', 'Nf3', 'f6', 'Nxe5', 'fxe5', 'Qh5+', 'Ke7', 'Qxe5+', 'Kf7', 'Bc4+'],
          caption: 'O rei preto não tem abrigo e cada lance branco chega com xeque.',
        },
      },
      {
        heading: 'Estrutura de peões',
        paragraphs: [
          'A estrutura muda devagar e, por isso, define os planos de longo prazo. Peões isolados, dobrados ou atrasados, casas fracas e maiorias de peões são fatores que permanecem por muitos lances.',
          'Na Variante das Trocas da Ruy López, as pretas aceitam peões dobrados na coluna c em troca do par de bispos. Quando o peão d branco for trocado pelo peão e preto, as brancas terão uma maioria sadia de quatro contra três no flanco do rei, capaz de criar um peão passado; a maioria preta no flanco da dama, com peões dobrados, não consegue fazer o mesmo. A avaliação depende de quem consegue impor o seu tipo de jogo: as brancas querem simplificar, as pretas querem manter as peças e usar os bispos.',
          'Ao final da avaliação, junte os quatro critérios numa frase: "as brancas estão melhor porque..." Essa frase é o ponto de partida do plano.',
        ],
        example: {
          title: 'Ruy López, Variante das Trocas',
          fen: START,
          moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6', 'dxc6', 'O-O', 'f6'],
          caption: 'Maioria de peões sadia para as brancas no flanco do rei; par de bispos para as pretas.',
        },
      },
    ],
    exercises: [
      {
        id: 'pla-1-ex1',
        prompt:
          'Petrov: as pretas recuaram o cavalo para f6, deixando o rei na coluna e aberta diante da dama branca. Brancas jogam e ganham a dama com um xeque descoberto.',
        fen: 'rnbqkb1r/pppp1ppp/5n2/4N3/8/8/PPPPQPPP/RNB1KB1R w KQkq - 2 5',
        solution: ['Nc6+', 'Be7', 'Nxd8'],
        explanation:
          'O rei preto na coluna e é o fator decisivo da avaliação. Nc6+ revela o xeque da dama de e2 e ataca a dama de d8. As pretas precisam cuidar do xeque e perdem a dama. O correto, no lance anterior, era 4...Qe7.',
      },
      {
        id: 'pla-1-ex2',
        prompt:
          'Dois Cavalos: o cavalo branco ataca f7. Pretas jogam: em vez de defender passivamente, golpeiem o centro para fechar a diagonal do bispo e, depois de exd5, ataquem o bispo com o cavalo.',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p1N1/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 5 4',
        solution: ['d5', 'exd5', 'Na5'],
        explanation:
          'A avaliação correta pesa tempo e segurança do rei acima do peão. 4...d5 fecha a diagonal c4-f7; depois de 5.exd5, 5...Na5 ataca o bispo e evita 5...Nxd5?, que permitiria o sacrifício Nxf7. As pretas entregam um peão, mas ganham tempo e desenvolvimento.',
      },
    ],
  },
  {
    id: 'pla-2',
    trackId: 'trilha-planejamento',
    category: 'planejamento',
    title: 'Formular planos',
    description:
      'Um plano nasce da avaliação. Aprenda a escolher o flanco certo, a usar as rupturas típicas de cada estrutura e a prevenir os planos do adversário.',
    level: 'avancado',
    minutes: 20,
    requires: ['pla-1', 'est-2'],
    keyPoints: [
      'Jogue no flanco para onde apontam os seus peões centrais: é ali que você tem espaço.',
      'Cada estrutura tem rupturas típicas; elas são o motor do plano.',
      'Princípio das duas fraquezas: uma fraqueza pode ser defendida, duas raramente.',
      'Profilaxia: antes de executar o seu plano, pergunte o que o adversário quer fazer e se vale a pena impedi-lo.',
    ],
    sections: [
      {
        heading: 'Do desequilíbrio ao plano',
        paragraphs: [
          'A avaliação identifica as diferenças entre as posições dos dois lados: estrutura, atividade, segurança dos reis. O plano é a resposta à pergunta "como transformar essas diferenças em algo concreto?".',
          'Na Índia do Rei Clássica, depois de 8.d5, o centro fica fechado e os peões apontam para flancos diferentes. Os peões brancos em d5 e e4 apontam para o flanco da dama, onde as brancas ganham espaço com c5. Os peões pretos em d6 e e5 apontam para o flanco do rei, onde as pretas atacam com ...f5 e ...f4.',
          'A regra prática é jogar no flanco para onde a cadeia de peões aponta, porque é lá que você tem espaço para manobrar as peças.',
        ],
        example: {
          title: 'Índia do Rei: centro fechado',
          fen: START,
          moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5', 'O-O', 'Nc6', 'd5', 'Ne7'],
          caption: 'As brancas jogarão no flanco da dama com c5; as pretas, no flanco do rei com ...f5.',
          arrows: [
            { from: 'c4', to: 'c5', brush: 'blue' },
            { from: 'f7', to: 'f5', brush: 'red' },
          ],
        },
      },
      {
        heading: 'Planos típicos por estrutura',
        paragraphs: [
          'Estruturas semelhantes geram planos semelhantes. Por isso o estudo de estruturas rende tanto: o mesmo conhecimento serve em dezenas de aberturas diferentes.',
          'No Maroczy, as brancas colocam peões em c4 e e4 e controlam d5, restringindo as rupturas pretas ...b5 e ...d5. O plano branco é manter o controle e avançar com calma; o plano preto é trocar peças para aliviar o espaço, pressionar c4 e preparar uma das rupturas.',
          'Outros exemplos já vistos: o ataque de minoria na estrutura Carlsbad, o ataque à base da cadeia na Francesa e o bloqueio do peão isolado. Em todos, o plano começa por uma ruptura de peão ou pelo controle de uma casa-chave.',
        ],
        example: {
          title: 'O Maroczy',
          fen: START,
          moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'g6', 'c4', 'Bg7', 'Be3', 'Nf6', 'Nc3', 'O-O', 'Be2', 'd6', 'O-O'],
          caption: 'Os peões de c4 e e4 dominam d5 e dificultam as rupturas pretas.',
          arrows: [
            { from: 'c4', to: 'd5', brush: 'green' },
            { from: 'e4', to: 'd5', brush: 'green' },
          ],
        },
      },
      {
        heading: 'O princípio das duas fraquezas',
        paragraphs: [
          'Contra um bom defensor, uma única fraqueza raramente basta: ele concentra as peças em volta dela e a posição se torna sólida. O plano clássico é criar uma segunda fraqueza, de preferência no outro flanco.',
          'Com duas fraquezas distantes, as peças defensoras precisam se dividir ou alternar entre elas, e em algum momento chegam tarde. Esse princípio é especialmente forte nos finais, quando o rei atacante pode ir de um flanco ao outro mais rápido que as peças defensoras.',
        ],
      },
      {
        heading: 'Profilaxia',
        paragraphs: [
          'Profilaxia é impedir o plano do adversário antes que ele aconteça. Nimzowitsch a considerava tão importante quanto executar os próprios planos.',
          'Na Ruy López Fechada, o lance h3 é profilático: impede ...Bg4, que cravaria o cavalo de f3 e enfraqueceria o controle branco de d4. Só depois desse lance as brancas jogam d4 com segurança.',
          'Antes de cada plano, faça a pergunta: o que o meu adversário quer jogar se eu não fizer nada? Se a resposta for perigosa, um lance profilático pode valer mais do que um lance ativo.',
        ],
        example: {
          title: 'h3 na Ruy López Fechada',
          fen: START,
          moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3'],
          caption: 'h3 tira a casa g4 do bispo preto e prepara d4.',
          arrows: [{ from: 'c8', to: 'g4', brush: 'red' }],
        },
      },
    ],
    exercises: [
      {
        id: 'pla-2-ex1',
        prompt:
          'Índia do Rei com o centro fechado: os peões pretos apontam para o flanco do rei. Pretas jogam e iniciam o plano típico com a ruptura de peão nesse flanco.',
        fen: 'r1bq1rk1/pppnnpbp/3p2p1/3Pp3/2P1P3/2NN4/PP2BPPP/R1BQ1RK1 b - - 4 10',
        solution: ['f5'],
        explanation:
          '10...f5 ataca a cadeia branca e abre caminho para o avanço ...f4, ...g5 e ...g4 contra o rei branco. As brancas responderão no flanco da dama com c5. A partida se transforma numa corrida, e a manobra Nf6-d7 preparou exatamente este lance.',
      },
      {
        id: 'pla-2-ex2',
        prompt: 'Estrutura Carlsbad. Brancas jogam e iniciam o ataque de minoria.',
        fen: 'r1bqr1k1/pp2bppp/2p2nn1/3p2B1/3P4/2NBPN2/PPQ2PPP/1R3RK1 w - - 11 12',
        solution: ['b4'],
        explanation:
          '12.b4 prepara b5 para trocar o peão b pelo peão c6. Depois da troca, as pretas ficam com um peão atrasado em c6 ou um isolado em d5, alvos para as torres brancas na coluna c. A torre em b1 apoia o avanço.',
      },
    ],
  },
  {
    id: 'pla-3',
    trackId: 'trilha-planejamento',
    category: 'planejamento',
    title: 'Método de cálculo: candidatos e lances forçados',
    description:
      'Calcular bem é calcular com ordem. Aprenda a listar lances candidatos, a priorizar xeques, capturas e ameaças e a verificar a posição final antes de jogar.',
    level: 'avancado',
    minutes: 22,
    requires: ['pla-2', 'tat-3'],
    practiceTheme: 'combinacao',
    keyPoints: [
      'Liste os candidatos antes de calcular qualquer um deles; não se apaixone pelo primeiro lance que viu.',
      'Comece pelos lances forçantes: xeques, capturas e ameaças, nessa ordem.',
      'Calcule as melhores respostas do adversário, não as que você gostaria que ele jogasse.',
      'Ao final de cada linha, avalie a posição e verifique se não deixou nenhuma peça ou casa vulnerável.',
    ],
    sections: [
      {
        heading: 'Lances candidatos',
        paragraphs: [
          'Lances candidatos são os lances que merecem ser calculados. O método proposto por Kotov é simples: antes de aprofundar qualquer variante, faça a lista completa dos candidatos. Isso evita o erro comum de calcular vinte lances de uma linha e descobrir depois que havia algo melhor.',
          'A lista costuma ter de dois a quatro lances. Para montá-la, use a avaliação da posição: onde estão as fraquezas do adversário, quais peças suas estão mal colocadas, que ameaças existem dos dois lados.',
          'Na Defesa dos Dois Cavalos, depois de 4.Ng5 d5 5.exd5 Nxd5?!, os candidatos naturais das brancas são o sacrifício Nxf7, o lance central d4 e o xeque Bb5+. Cada um leva a um tipo de jogo diferente.',
        ],
        example: {
          title: 'Três candidatos',
          fen: START,
          moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5'],
          caption: 'Nxf7, d4 e Bb5+ são os candidatos principais das brancas.',
          arrows: [
            { from: 'g5', to: 'f7', brush: 'red' },
            { from: 'd2', to: 'd4', brush: 'blue' },
            { from: 'c4', to: 'b5', brush: 'yellow' },
          ],
        },
      },
      {
        heading: 'Lances forçantes primeiro',
        paragraphs: [
          'Xeques, capturas e ameaças limitam as respostas do adversário. Quanto menos respostas, menor a árvore de variantes e mais confiável o cálculo. Por isso eles devem ser examinados primeiro, mesmo quando parecem absurdos, como um sacrifício de dama.',
          'O mate de Philidor é o exemplo perfeito: todos os lances brancos são xeques e todas as respostas pretas são forçadas. Um cálculo de sete meios-lances torna-se simples porque não há ramificações.',
          'Quando nenhum lance forçante funciona, procure um lance silencioso que crie uma ameaça impossível de defender. Mas faça isso depois de descartar os forçantes.',
        ],
        example: {
          title: 'O mate de Philidor',
          fen: '4r2k/6pp/8/6N1/2Q5/8/5PPP/6K1 w - - 0 1',
          moves: ['Nf7+', 'Kg8', 'Nh6+', 'Kh8', 'Qg8+', 'Rxg8', 'Nf7#'],
          caption: 'Xeque, xeque duplo, sacrifício de dama e mate sufocado. Se 2...Kf8, Qf7 é mate.',
        },
      },
      {
        heading: 'Visualização e verificação',
        paragraphs: [
          'Calcular é ver o tabuleiro alguns lances adiante sem mover as peças. O erro mais comum não está nos lances longos, e sim nos curtos: esquecer que uma peça se moveu e que a casa que ela defendia ficou vazia.',
          'Ao final de cada variante, pare e reconstrua mentalmente a posição: onde está cada peça, quem ataca o quê, há xeques disponíveis para o adversário? Só então avalie o resultado.',
          'Antes de jogar o lance escolhido, faça uma última verificação de segurança: este lance deixa alguma peça sem defesa, abre alguma linha para o meu rei ou permite um xeque perigoso? Essa checagem de poucos segundos evita a maior parte das derrotas por descuido.',
        ],
      },
      {
        heading: 'Quando parar de calcular',
        paragraphs: [
          'Não é possível calcular tudo até o fim. A variante deve parar numa posição calma, sem capturas ou xeques pendentes, que você consiga avaliar com os critérios de material, atividade, segurança do rei e estrutura.',
          'Se duas linhas levam a posições avaliadas de forma parecida, escolha a mais simples ou a que você entende melhor. Economizar tempo de relógio também faz parte de um bom cálculo.',
        ],
      },
    ],
    exercises: [
      {
        id: 'pla-3-ex1',
        prompt: 'Comece pelos lances forçantes. Brancas jogam e dão mate em 2.',
        fen: '4r2k/6pp/7N/8/2Q5/8/5PPP/6K1 w - - 0 1',
        solution: ['Qg8+', 'Rxg8', 'Nf7#'],
        checkmate: true,
        explanation:
          'Qg8+ é um sacrifício forçante: o rei não pode capturar porque o cavalo de h6 protege g8, e a torre é obrigada a tomar. Nf7 é o mate sufocado, porque o rei está cercado pelas próprias peças.',
      },
      {
        id: 'pla-3-ex2',
        prompt: 'Calcule a sequência forçada até o fim. Brancas jogam e dão mate em 4.',
        fen: '5rk1/ppp2ppp/8/q2N3Q/8/5R2/PPP3PP/6K1 w - - 0 1',
        solution: ['Ne7+', 'Kh8', 'Qxh7+', 'Kxh7', 'Rh3+', 'Qh5', 'Rxh5#'],
        checkmate: true,
        explanation:
          'É o mate de Anastasia. Ne7+ força Kh8; Qxh7+ entrega a dama para abrir a coluna h; depois de Kxh7, Rh3+ dá xeque e o cavalo de e7 cobre g6 e g8. A dama preta só consegue se interpor em h5 e é capturada com mate.',
      },
    ],
  },
];
