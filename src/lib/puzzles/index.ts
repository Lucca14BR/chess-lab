// Puzzles da base pública da Lichess (CC0), extraídos por scripts/build-puzzles.mjs.
import type { Level, PuzzleCategory } from '@/data/academy/types';

export interface Puzzle {
  id: string;
  /** Posição ANTES do lance do adversário que inicia o puzzle. */
  fen: string;
  /** UCI: moves[0] é do adversário; depois alternam aluno/adversário. */
  moves: string[];
  rating: number;
  themes: string[];
  category: PuzzleCategory;
  level: Level;
  gameUrl: string;
}

interface PuzzleFile {
  source: string;
  license: string;
  generatedAt: string;
  count: number;
  puzzles: Puzzle[];
}

let cache: Promise<PuzzleFile> | null = null;

export function loadPuzzles(): Promise<PuzzleFile> {
  if (!cache) {
    cache = fetch(`${import.meta.env.BASE_URL}data/puzzles.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<PuzzleFile>;
      })
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

export const CATEGORY_INFO: Record<PuzzleCategory, { label: string; description: string }> = {
  garfo: { label: 'Garfos', description: 'Uma peça ataca duas ou mais peças adversárias ao mesmo tempo.' },
  cravada: { label: 'Cravadas', description: 'Uma peça não pode (ou não deve) se mover porque exporia uma peça mais valiosa atrás dela.' },
  ataqueDescoberto: { label: 'Ataques descobertos', description: 'Uma peça sai da frente e revela o ataque de outra peça de longo alcance.' },
  espeto: { label: 'Espetos', description: 'Ataque a uma peça valiosa que, ao sair, deixa exposta outra peça atrás dela.' },
  desvio: { label: 'Desvios', description: 'Forçar uma peça adversária a abandonar uma função defensiva importante.' },
  ataqueDuplo: { label: 'Ataques duplos', description: 'Xeque duplo: duas peças dão xeque ao mesmo tempo e só o rei pode se mover.' },
  sacrificio: { label: 'Sacrifícios', description: 'Entregar material para obter vantagem maior: ataque, mate ou recuperação com lucro.' },
  xequeMate: { label: 'Xeque-mate', description: 'Padrões de mate forçado em um ou mais lances.' },
  combinacao: { label: 'Combinações', description: 'Sequências táticas longas (três ou mais lances seus) que exigem cálculo preciso.' },
  defesa: { label: 'Defesa', description: 'Encontrar o único lance que segura a posição diante de uma ameaça.' },
};

export const LEVEL_INFO: Record<Level, { label: string; range: string }> = {
  iniciante: { label: 'Iniciante', range: 'até 1300' },
  intermediario: { label: 'Intermediário', range: '1300–1900' },
  avancado: { label: 'Avançado', range: '1900+' },
};

/** Descrições dos temas da Lichess exibidas na explicação pós-resolução. */
export const THEME_TEXT: Record<string, string> = {
  fork: 'Garfo: uma peça ataca dois alvos simultaneamente.',
  pin: 'Cravada: a peça cravada não pode sair sem expor algo mais valioso.',
  discoveredAttack: 'Ataque descoberto: ao mover uma peça, outra peça de longo alcance passa a atacar.',
  skewer: 'Espeto: a peça mais valiosa é atacada primeiro e, ao sair, expõe a que está atrás.',
  deflection: 'Desvio: uma peça defensora é forçada a deixar sua função.',
  doubleCheck: 'Xeque duplo: duas peças dão xeque ao mesmo tempo; o rei é obrigado a se mover.',
  sacrifice: 'Sacrifício: material é entregue para obter algo maior.',
  mate: 'Xeque-mate forçado.',
  mateIn1: 'Mate em 1.',
  mateIn2: 'Mate em 2.',
  mateIn3: 'Mate em 3.',
  mateIn4: 'Mate em 4.',
  mateIn5: 'Mate em 5 ou mais.',
  backRankMate: 'Mate na última fileira: o rei está preso pelos próprios peões.',
  smotheredMate: 'Mate sufocado: o rei é cercado pelas próprias peças e um cavalo dá mate.',
  anastasiaMate: 'Mate de Anastasia: cavalo e torre/dama encurralam o rei na borda.',
  arabianMate: 'Mate árabe: torre e cavalo coordenados no canto.',
  hookMate: 'Mate do gancho: torre, cavalo e peão cooperam.',
  bodenMate: 'Mate de Boden: dois bispos em diagonais cruzadas.',
  doubleBishopMate: 'Mate com dois bispos.',
  dovetailMate: 'Mate da cauda de andorinha: a dama dá mate com o rei bloqueado pelas próprias peças.',
  attraction: 'Atração: uma peça (geralmente o rei) é atraída para uma casa ruim.',
  clearance: 'Desobstrução: uma casa ou linha é liberada para outra peça.',
  interference: 'Interferência: uma peça é colocada entre a peça adversária e o que ela defende.',
  intermezzo: 'Lance intermediário: um lance forçante antes da recaptura esperada.',
  xRayAttack: 'Raio X: uma peça age através de outra.',
  quietMove: 'Lance silencioso: sem xeque nem captura, mas prepara uma ameaça decisiva.',
  defensiveMove: 'Lance defensivo: a única forma de evitar perda de material ou mate.',
  zugzwang: 'Zugzwang: o adversário é obrigado a piorar a própria posição.',
  trappedPiece: 'Peça presa: uma peça sem casas de fuga é capturada.',
  hangingPiece: 'Peça pendurada: uma peça indefesa pode ser capturada.',
  capturingDefender: 'Captura do defensor: eliminar a peça que protege outra.',
  exposedKing: 'Rei exposto: a falta de proteção do rei é explorada.',
  kingsideAttack: 'Ataque na ala do rei.',
  queensideAttack: 'Ataque na ala da dama.',
  promotion: 'Promoção de peão.',
  underPromotion: 'Subpromoção: promover a uma peça que não seja a dama.',
  advancedPawn: 'Peão avançado: um peão perto da promoção decide.',
  enPassant: 'Captura en passant.',
  castling: 'Roque como parte da solução.',
  endgame: 'Final de partida.',
  middlegame: 'Meio-jogo.',
  opening: 'Abertura.',
  rookEndgame: 'Final de torres.',
  pawnEndgame: 'Final de peões.',
  queenEndgame: 'Final de damas.',
  bishopEndgame: 'Final de bispos.',
  knightEndgame: 'Final de cavalos.',
  queenRookEndgame: 'Final de dama e torre.',
  short: 'Puzzle curto (2 lances seus).',
  long: 'Puzzle longo (3 lances seus).',
  veryLong: 'Puzzle muito longo (4 ou mais lances seus).',
  oneMove: 'Puzzle de um lance.',
  advantage: 'Resultado: vantagem decisiva.',
  crushing: 'Resultado: vantagem esmagadora.',
  equality: 'Resultado: salvar a posição e igualar.',
  master: 'De uma partida entre mestres titulados.',
  masterVsMaster: 'De uma partida entre dois mestres titulados.',
  superGM: 'De uma partida entre jogadores de elite.',
};
