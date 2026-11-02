import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';

export type ThemeMode = 'dark' | 'light';
export type BoardTheme = 'nogueira' | 'marfim' | 'musgo' | 'ardosia' | 'ebano';
export type PieceSet = 'cburnett' | 'merida' | 'staunty' | 'chessnut';
export type SfxSet = 'sfx' | 'piano' | 'nes' | 'futuristic';
export type AmbientType = 'none' | 'calm' | 'heavy';

export interface Settings {
  displayName: string;
  boardTheme: BoardTheme;
  pieceSet: PieceSet;
  coordinates: boolean;
  coordinatesOnSquares: boolean;
  showLegalMoves: boolean;
  animation: boolean;
  autoQueen: boolean;
  engineDepth: number;
  analysisDepth: number;
  autoSync: boolean;
  headerImage: string | null; // data URL personalizada
  dailyGoalMinutes: number;
  tutorPrimaryModel: string | null; // modelo do tutor de IA (null = padrão)
  tutorFallbackModel: string | null;
  welcomeDismissed: boolean; // "Agora não" no cartão de boas-vindas do Painel
  // Som (volumes de 0 a 1)
  masterVolume: number;
  sfxEnabled: boolean;
  sfxSet: SfxSet;
  sfxVolume: number;
  sfxOnNavigate: boolean; // tocar ao andar pelo histórico de lances
  musicEnabled: boolean;
  musicVolume: number;
  musicShuffle: boolean;
  ambientType: AmbientType;
  ambientThunder: boolean;
  ambientVolume: number;
  audioAutostart: boolean; // música e ambiente começam sozinhos (na primeira interação)
}

export const DEFAULT_SETTINGS: Settings = {
  displayName: '',
  boardTheme: 'nogueira',
  pieceSet: 'cburnett',
  coordinates: true,
  coordinatesOnSquares: false,
  showLegalMoves: true,
  animation: true,
  autoQueen: false,
  engineDepth: 18,
  analysisDepth: 12,
  autoSync: true,
  headerImage: null,
  dailyGoalMinutes: 30,
  tutorPrimaryModel: null,
  tutorFallbackModel: null,
  welcomeDismissed: false,
  masterVolume: 0.8,
  sfxEnabled: true,
  sfxSet: 'sfx',
  sfxVolume: 0.7,
  sfxOnNavigate: true,
  musicEnabled: false,
  musicVolume: 0.4,
  musicShuffle: false,
  ambientType: 'none',
  ambientThunder: false,
  ambientVolume: 0.5,
  audioAutostart: false,
};

export const BOARD_THEMES: Array<{ id: BoardTheme; label: string; light: string; dark: string }> = [
  { id: 'nogueira', label: 'Nogueira', light: '#dcc29b', dark: '#9c6f49' },
  { id: 'marfim', label: 'Marfim', light: '#ece2cf', dark: '#b59f80' },
  { id: 'ebano', label: 'Ébano', light: '#c9b28c', dark: '#5a3f2c' },
  { id: 'musgo', label: 'Musgo', light: '#e6e2cc', dark: '#7f9a73' },
  { id: 'ardosia', label: 'Ardósia', light: '#dfe3e3', dark: '#8a9ea6' },
];

export const PIECE_SETS: Array<{ id: PieceSet; label: string; author: string; license: string }> = [
  { id: 'cburnett', label: 'Cburnett', author: 'Colin M.L. Burnett', license: 'GPLv2+' },
  { id: 'merida', label: 'Merida', author: 'Armando Hernandez Marroquin', license: 'GPLv2+' },
  { id: 'staunty', label: 'Staunty', author: 'sadsnake1', license: 'CC BY-NC-SA 4.0' },
  { id: 'chessnut', label: 'Chessnut', author: 'Alexis Luengas', license: 'Apache 2.0' },
];

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await db.settings.put({ key, value });
}

/** Grava várias configurações de uma vez (uma única atualização para quem observa). */
export async function setSettings(patch: Partial<Settings>) {
  await db.settings.bulkPut(Object.entries(patch).map(([key, value]) => ({ key, value })));
}

export function useSettings(): Settings {
  const rows = useLiveQuery(() => db.settings.toArray(), []);
  const s = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  for (const r of rows ?? []) if (r.key in DEFAULT_SETTINGS) s[r.key] = r.value;
  return s as unknown as Settings;
}

export async function getSettings(): Promise<Settings> {
  const rows = await db.settings.toArray();
  const s = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  for (const r of rows) if (r.key in DEFAULT_SETTINGS) s[r.key] = r.value;
  return s as unknown as Settings;
}

/* Tema: guardado também em localStorage para aplicar antes da renderização. */
const THEME_KEY = 'chesslab-theme';

export function getTheme(): ThemeMode {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    /* armazenamento indisponível: o tema vale só nesta sessão */
  }
  window.dispatchEvent(new CustomEvent('chesslab-theme', { detail: mode }));
}
