/** Faixas incluídas no app e créditos dos sons (exibidos em Configurações › Som e › Sobre). */

export interface BundledTrack {
  id: string;
  name: string;
  author: string;
  file: string; // em public/music
  link: string;
}

const AUTHOR_ALEX = 'Alex McCulloch (Pro Sensory)';

export const BUNDLED_TRACKS: BundledTrack[] = [
  { id: 'incluida:public-domain-jazz', name: 'Public Domain Jazz', author: AUTHOR_ALEX, file: 'public-domain-jazz.mp3', link: 'https://opengameart.org/content/public-domain-jazz' },
  { id: 'incluida:mocha-frapp', name: 'Mocha Frapp', author: AUTHOR_ALEX, file: 'mocha-frapp.mp3', link: 'https://opengameart.org/content/mocha-frapp' },
  { id: 'incluida:mirror-lake', name: 'Mirror Lake', author: 'Joth', file: 'mirror-lake.mp3', link: 'https://opengameart.org/content/mirror-lake' },
  { id: 'incluida:bossa-nova', name: 'Bossa Nova', author: 'Joth', file: 'bossa-nova.mp3', link: 'https://opengameart.org/content/bossa-nova' },
];

export const MUSIC_LICENSE = 'CC0 (domínio público), via OpenGameArt';

export const SFX_CREDIT = {
  author: 'Enigmahack',
  what: 'Pacotes de efeitos da Lichess (Padrão, Piano, NES e Futurista)',
  license: 'AGPLv3 ou posterior',
  link: 'https://github.com/lichess-org/lila/tree/master/public/sound',
};

export const bundledTrackUrl = (t: BundledTrack) => `${import.meta.env.BASE_URL}music/${t.file}`;
