import { useEffect, useMemo } from 'react';
import { getSettings, useSettings } from '@/lib/settings';
import { useStore } from '@/lib/store';
import { audioUnlock, unlockAudio } from '@/lib/audio/context';
import { backgroundSession, backgroundState } from '@/lib/audio/background';
import { configureSfx, preloadSfx } from '@/lib/audio/sfx';
import { ambient } from '@/lib/audio/ambient';
import { retryMusic, setMusicTracks, updateMusic, type PlayerTrack } from '@/lib/audio/music';
import { BUNDLED_TRACKS, bundledTrackUrl } from '@/lib/audio/credits';
import { useUserTracks } from '@/lib/audio/musicLibrary';
import { effectiveVolume } from '@/lib/audio/volume';

/**
 * Liga as configurações de som aos motores de áudio (efeitos, ambiente e música).
 * Fica no layout, fora das rotas: a música continua ao trocar de página. Não desenha nada.
 */
export function AudioHost() {
  const s = useSettings();
  const session = useStore(backgroundSession);
  const { unlocked } = useStore(audioUnlock);
  const userTracks = useUserTracks();
  const bg = backgroundState(s, session);

  // Toda interação libera/retoma o áudio; a primeira também cuida do "tocar ao abrir o site"
  useEffect(() => {
    let first = true;
    const onGesture = () => {
      unlockAudio();
      if (!first) return;
      first = false;
      void getSettings().then((st) => {
        if (st.audioAutostart) backgroundSession.set({ musicActive: true, ambientActive: true });
      });
    };
    window.addEventListener('pointerdown', onGesture, true);
    window.addEventListener('keydown', onGesture, true);
    return () => {
      window.removeEventListener('pointerdown', onGesture, true);
      window.removeEventListener('keydown', onGesture, true);
    };
  }, []);

  useEffect(() => {
    configureSfx({ enabled: s.sfxEnabled, set: s.sfxSet, volume: effectiveVolume(s.masterVolume, s.sfxVolume), onNavigate: s.sfxOnNavigate });
  }, [s.sfxEnabled, s.sfxSet, s.masterVolume, s.sfxVolume, s.sfxOnNavigate]);

  useEffect(() => {
    if (!unlocked) return;
    preloadSfx();
    retryMusic();
  }, [unlocked]);

  const ambientVolume = effectiveVolume(s.masterVolume, s.ambientVolume);
  useEffect(() => {
    if (unlocked) ambient.update({ type: bg.ambient, thunder: bg.thunder, volume: ambientVolume });
  }, [unlocked, bg.ambient, bg.thunder, ambientVolume]);

  const tracks = useMemo<PlayerTrack[] | null>(() => {
    if (!userTracks) return null; // ainda carregando as músicas da pessoa
    return [
      ...BUNDLED_TRACKS.map((t) => ({ id: t.id, name: t.name, author: t.author, src: { kind: 'url' as const, url: bundledTrackUrl(t) } })),
      ...userTracks.map((t) => ({ id: t.id, name: t.name, src: { kind: 'blob' as const, blob: t.blob } })),
    ];
  }, [userTracks]);
  useEffect(() => {
    if (tracks) setMusicTracks(tracks);
  }, [tracks]);

  const musicVolume = effectiveVolume(s.masterVolume, s.musicVolume);
  useEffect(() => {
    updateMusic({ on: bg.music && unlocked && !!tracks, volume: musicVolume, shuffle: s.musicShuffle });
  }, [bg.music, unlocked, tracks, musicVolume, s.musicShuffle]);

  return null;
}
