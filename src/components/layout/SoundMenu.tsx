import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Music, Pause, Play, SkipForward } from 'lucide-react';
import { setSetting, useSettings, type AmbientType } from '@/lib/settings';
import { useStore } from '@/lib/store';
import { AMBIENT_OPTIONS, setAmbient, setMusicOn, useBackground } from '@/lib/audio/controls';
import { musicStore, nextMusicTrack } from '@/lib/audio/music';
import { Button } from '@/components/ui/Button';
import { Range, Segmented, Switch } from '@/components/ui/Form';
import { cn } from '@/lib/utils';

/** Controle rápido de som na barra do topo: música, ambiente e volumes. */
export function SoundMenu() {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const s = useSettings();
  const bg = useBackground();
  const music = useStore(musicStore);
  const active = bg.music || bg.ambient !== 'none' || bg.thunder;

  // Fecha ao clicar fora ou com Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="sound-menu"
        aria-label="Som: música e ambiente"
        title="Som"
        className={cn('flex size-8 items-center justify-center rounded-full border transition-colors', active ? 'border-brass/50 text-brass' : 'border-line text-ink-faint hover:text-ink')}
      >
        <Music className="size-[15px]" />
      </button>
      {open && (
        <div id="sound-menu" role="dialog" aria-label="Som" className="z-30 space-y-4 rounded-lg border border-line-strong bg-panel p-4 shadow-2xl max-sm:fixed max-sm:inset-x-4 max-sm:top-16 sm:absolute sm:top-11 sm:right-0 sm:w-80">
          <section>
            <p className="mb-1.5 text-[11px] tracking-wide text-ink-muted uppercase">Música</p>
            <div className="flex items-center gap-2">
              <Button size="icon" variant={bg.music ? 'primary' : 'secondary'} onClick={() => void setMusicOn(!bg.music)} aria-label={bg.music ? 'Pausar música' : 'Tocar música'} title={bg.music ? 'Pausar' : 'Tocar'}>
                {bg.music ? <Pause /> : <Play />}
              </Button>
              <Button size="icon" variant="ghost" onClick={nextMusicTrack} aria-label="Próxima faixa" title="Próxima faixa">
                <SkipForward />
              </Button>
              <p className="min-w-0 flex-1 truncate text-sm text-ink" title={music.currentName ?? undefined}>
                {music.currentName ?? <span className="text-ink-muted">Jazz para estudar</span>}
              </p>
            </div>
            {music.error && <p className="mt-1 text-xs text-negative">{music.error}</p>}
          </section>

          <section>
            <p className="mb-1.5 text-[11px] tracking-wide text-ink-muted uppercase">Ambiente</p>
            <Segmented<AmbientType> size="sm" value={bg.ambient} onChange={(v) => void setAmbient({ ambientType: v })} options={AMBIENT_OPTIONS} ariaLabel="Som ambiente" />
            <Switch id="menu-thunder" label="Trovoadas" checked={bg.thunder} onChange={(v) => void setAmbient({ ambientThunder: v })} />
          </section>

          <section className="space-y-2.5">
            <Range id="menu-master" label="Volume geral" value={s.masterVolume} onChange={(v) => void setSetting('masterVolume', v)} />
            <Range id="menu-music" label="Música" value={s.musicVolume} onChange={(v) => void setSetting('musicVolume', v)} />
            <Range id="menu-ambient" label="Ambiente" value={s.ambientVolume} onChange={(v) => void setSetting('ambientVolume', v)} />
            <Range id="menu-sfx" label="Efeitos dos lances" value={s.sfxVolume} onChange={(v) => void setSetting('sfxVolume', v)} />
          </section>

          <Link to="/configuracoes#som" onClick={() => setOpen(false)} className="block text-xs text-brass hover:underline">
            Mais opções de som
          </Link>
        </div>
      )}
    </div>
  );
}
