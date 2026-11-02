import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { ExternalLink, Music, Pause, Play, Plus, Trash2, Volume2 } from 'lucide-react';
import { setSetting, useSettings, type AmbientType, type SfxSet } from '@/lib/settings';
import { useStore } from '@/lib/store';
import { AMBIENT_OPTIONS, playTrack, setAmbient, setMusicOn, useBackground } from '@/lib/audio/controls';
import { musicStore } from '@/lib/audio/music';
import { SFX_LABELS, SFX_NAMES, SFX_SETS, playSfx } from '@/lib/audio/sfx';
import { BUNDLED_TRACKS, MUSIC_LICENSE, SFX_CREDIT } from '@/lib/audio/credits';
import { addMusicFiles, removeMusicTrack, useUserTracks } from '@/lib/audio/musicLibrary';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Range, Segmented, Select, Switch } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Feedback';
import { confirm, toast } from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';

const fmtMb = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;

function Subheading({ children }: { children: string }) {
  return <h3 className="mb-2 text-xs font-medium tracking-wide text-ink-muted uppercase">{children}</h3>;
}

export function SoundSection() {
  const s = useSettings();
  const bg = useBackground();
  const ref = useRef<HTMLDivElement>(null);
  const { hash } = useLocation();

  // Chegou por "Mais opções de som": rola até aqui depois que a página monta
  useEffect(() => {
    if (hash !== '#som') return;
    const t = window.setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    return () => clearTimeout(t);
  }, [hash]);

  return (
    <div ref={ref} id="som" className="scroll-mt-20">
      <Card>
        <CardHeader icon={<Volume2 />} title="Som" subtitle="Efeitos dos lances, música para estudar e chuva de fundo. A chuva e os trovões são gerados no próprio navegador, sem arquivos." />
        <CardBody className="space-y-6">
          <div className="space-y-1.5">
            <Range id="master-volume" label="Volume geral" value={s.masterVolume} onChange={(v) => void setSetting('masterVolume', v)} className="max-w-sm" />
            <p className="text-xs text-ink-faint">No iPhone, a chave de silencioso pode deixar mudos os efeitos e a chuva; se não ouvir nada, confira a chave e o volume do aparelho.</p>
          </div>

          <section className="border-t border-line pt-4">
            <Subheading>Efeitos dos lances</Subheading>
            <div className="divide-y divide-line">
              <Switch id="sfx-on" label="Tocar efeitos" description="Lance, captura e xeque em todos os tabuleiros; vitória, derrota e empate no Jogar; acerto e erro nos puzzles e exercícios." checked={s.sfxEnabled} onChange={(v) => void setSetting('sfxEnabled', v)} />
              <Switch id="sfx-nav" label="Tocar ao navegar pelos lances" description="Ao andar pelo histórico (setas, lista de lances, árvore de variantes). Desligado, só os lances novos tocam." checked={s.sfxOnNavigate} onChange={(v) => void setSetting('sfxOnNavigate', v)} />
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Pacote de sons" htmlFor="sfx-set">
                <Select id="sfx-set" value={s.sfxSet} onChange={(e) => void setSetting('sfxSet', e.target.value as SfxSet)}>
                  {SFX_SETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Range id="sfx-volume" label="Volume dos efeitos" value={s.sfxVolume} onChange={(v) => void setSetting('sfxVolume', v)} className="self-end" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Ouvir os sons">
              {SFX_NAMES.map((n) => (
                <Button key={n} size="sm" variant="ghost" onClick={() => playSfx(n, { preview: true })} title={`Ouvir: ${SFX_LABELS[n]}`}>
                  <Play /> {SFX_LABELS[n]}
                </Button>
              ))}
            </div>
          </section>

          <MusicPart />

          <section className="border-t border-line pt-4">
            <Subheading>Ambiente</Subheading>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Som ambiente">
                <Segmented<AmbientType> value={bg.ambient} onChange={(v) => void setAmbient({ ambientType: v })} options={AMBIENT_OPTIONS} ariaLabel="Som ambiente" />
              </Field>
              <Range id="ambient-volume" label="Volume do ambiente" value={s.ambientVolume} onChange={(v) => void setSetting('ambientVolume', v)} className="self-end" />
            </div>
            <Switch id="thunder" label="Trovoadas" description="Trovões de vez em quando, perto ou ao longe. Tocam com a chuva ou sozinhos." checked={bg.thunder} onChange={(v) => void setAmbient({ ambientThunder: v })} />
          </section>

          <section className="border-t border-line pt-4">
            <Switch
              id="audio-autostart"
              label="Tocar música e ambiente ao abrir o site"
              description="O navegador só libera som depois que você interage com a página; por isso eles começam no seu primeiro clique ou tecla. Desligado, cada visita começa em silêncio, até você dar play."
              checked={s.audioAutostart}
              onChange={(v) => void setSetting('audioAutostart', v)}
            />
          </section>

          <SoundCredits />
        </CardBody>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function MusicPart() {
  const s = useSettings();
  const bg = useBackground();
  const music = useStore(musicStore);
  const userTracks = useUserTracks();
  const fileRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);
  const playingNow = bg.music && !music.blocked; // recusado pelo navegador: mostra "tocar"
  const [errors, setErrors] = useState<string[]>([]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setAdding(true);
    try {
      const r = await addMusicFiles([...files]);
      setErrors(r.errors);
      if (r.added) toast(r.added === 1 ? 'Música adicionada.' : `${r.added} músicas adicionadas.`, 'positive');
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (await confirm({ title: 'Remover música?', message: `“${name}” será apagada deste navegador.`, confirmLabel: 'Remover', danger: true })) await removeMusicTrack(id);
  };

  const rows = [
    ...BUNDLED_TRACKS.map((t) => ({ id: t.id, name: t.name, detail: `${t.author} · incluída`, own: false })),
    ...(userTracks ?? []).map((t) => ({ id: t.id, name: t.name, detail: `Sua · ${fmtMb(t.size)}`, own: true })),
  ];

  return (
    <section className="border-t border-line pt-4">
      <Subheading>Música</Subheading>
      <div className="divide-y divide-line">
        <Switch id="music-on" label="Tocar música" description="Continua tocando enquanto você muda de página. As faixas incluídas são baixadas do site quando tocam pela primeira vez." checked={playingNow} onChange={(v) => void setMusicOn(v)} />
        <Switch id="music-shuffle" label="Ordem aleatória" checked={s.musicShuffle} onChange={(v) => void setSetting('musicShuffle', v)} />
      </div>
      <Range id="music-volume" label="Volume da música" value={s.musicVolume} onChange={(v) => void setSetting('musicVolume', v)} className="mt-2 max-w-sm" />

      <ul className="mt-4 space-y-1" aria-label="Faixas">
        {rows.map((t) => {
          const current = music.currentId === t.id;
          const playing = current && playingNow;
          return (
            <li key={t.id} className={cn('flex items-center gap-2 rounded-md border px-2 py-1.5', current ? 'border-brass/50 bg-accent-soft' : 'border-line bg-sunken')}>
              <Button size="icon-sm" variant="ghost" onClick={() => void (playing ? setMusicOn(false) : playTrack(t.id))} aria-label={playing ? `Pausar ${t.name}` : `Tocar ${t.name}`}>
                {playing ? <Pause /> : <Play />}
              </Button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{t.name}</p>
                <p className="truncate text-[11px] text-ink-faint">{t.detail}</p>
              </div>
              {t.own && (
                <Button size="icon-sm" variant="ghost" onClick={() => void remove(t.id, t.name)} aria-label={`Remover ${t.name}`}>
                  <Trash2 />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {music.error && <p className="mt-2 text-xs text-negative">{music.error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input ref={fileRef} type="file" accept="audio/*" multiple className="hidden" onChange={(e) => void onFiles(e.target.files).finally(() => (e.target.value = ''))} />
        <Button onClick={() => fileRef.current?.click()} disabled={adding}>
          <Plus /> Adicionar músicas
        </Button>
        <p className="text-xs text-ink-faint">Arquivos de áudio do seu computador, até 50 MB cada. Ficam guardados só neste navegador e não entram no backup.</p>
      </div>
      {errors.length > 0 && (
        <Alert tone="negative" title="Algumas músicas não foram adicionadas" className="mt-3">
          <ul className="list-disc space-y-0.5 pl-5 text-xs">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function SoundCredits() {
  return (
    <section className="border-t border-line pt-4 text-xs text-ink-muted">
      <h3 className="mb-2 flex items-center gap-1.5 font-medium tracking-wide uppercase">
        <Music className="size-3.5" /> Créditos
      </h3>
      <ul className="space-y-1">
        <li>
          {SFX_CREDIT.what}: {SFX_CREDIT.author}, licença {SFX_CREDIT.license}.{' '}
          <a className="inline-flex items-center gap-0.5 text-brass hover:underline" href={SFX_CREDIT.link} target="_blank" rel="noreferrer">
            Fonte <ExternalLink className="size-3" />
          </a>
        </li>
        {BUNDLED_TRACKS.map((t) => (
          <li key={t.id}>
            Música “{t.name}”: {t.author}, {MUSIC_LICENSE}.{' '}
            <a className="inline-flex items-center gap-0.5 text-brass hover:underline" href={t.link} target="_blank" rel="noreferrer">
              Página <ExternalLink className="size-3" />
            </a>
          </li>
        ))}
        <li>Chuva e trovões: gerados no próprio navegador pelo Chess Lab (Web Audio), sem arquivos de terceiros.</li>
      </ul>
    </section>
  );
}
