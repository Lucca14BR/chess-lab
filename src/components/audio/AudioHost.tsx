import { useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/schema';
import { useSettings } from '@/lib/settings';
import { useStore } from '@/lib/store';
import { audioUnlock, unlockAudio } from '@/lib/audio/context';
import { backgroundSession, backgroundState } from '@/lib/audio/background';
import { configureSfx, preloadSfx } from '@/lib/audio/sfx';
import { ambient } from '@/lib/audio/ambient';
import { playNow, resumeIfBlocked, retryMusic, setMusicTracks, updateMusic, type PlayerTrack } from '@/lib/audio/music';
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

  // "Tocar ao abrir o site" lido direto do banco (null enquanto carrega), guardado num ref para o gesto
  const autostart = useLiveQuery(async () => {
    const [auto, music] = await db.settings.bulkGet(['audioAutostart', 'musicEnabled']);
    return { auto: auto?.value === true, music: music?.value === true };
  }, [], null);
  const autostartRef = useRef(autostart);
  useEffect(() => {
    autostartRef.current = autostart;
  }, [autostart]);

  // Toda interação libera/retoma o áudio e tenta de novo a música recusada. Só pointerup, touchend,
  // click e keydown contam como gesto para o navegador (no toque, pointerdown não conta), então ouvimos todos.
  useEffect(() => {
    let autostartDone = false;
    const onGesture = () => {
      unlockAudio();
      resumeIfBlocked();
      const auto = autostartRef.current;
      if (autostartDone || !auto) return; // ainda carregando: tenta na próxima interação
      autostartDone = true;
      if (!auto.auto) return;
      backgroundSession.set({ musicActive: true, ambientActive: true });
      if (auto.music) playNow(); // dentro do gesto
    };
    const events = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const;
    for (const e of events) window.addEventListener(e, onGesture, true);
    return () => {
      for (const e of events) window.removeEventListener(e, onGesture, true);
    };
  }, []);

  // O play/pausa vale na hora; quando a configuração gravada chega com o mesmo valor, ela volta a mandar
  useEffect(() => {
    const o = backgroundSession.get().musicOn;
    if (o !== null && o === s.musicEnabled) backgroundSession.set({ musicOn: null });
  }, [s.musicEnabled, session.musicOn]);

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
