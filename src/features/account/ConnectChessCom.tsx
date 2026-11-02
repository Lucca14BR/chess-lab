import { useState } from 'react';
import { Search, ShieldCheck, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import { Alert, Spinner } from '@/components/ui/Feedback';
import { connectAccount, lookupProfile } from '@/lib/chesscom/sync';
import { ChessComError, validateUsername } from '@/lib/chesscom/client';
import type { ChessComProfile } from '@/lib/chesscom/types';
import type { ImportScope } from '@/lib/db/schema';
import { formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/Dialog';

export function ConnectChessCom({ compact = false, onConnected }: { compact?: boolean; onConnected?: () => void }) {
  const [username, setUsername] = useState('');
  const [scope, setScope] = useState<ImportScope>('12m');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ChessComProfile | null>(null);

  const find = async () => {
    const invalid = validateUsername(username);
    setError(invalid);
    setProfile(null);
    if (invalid) return;
    setLoading(true);
    try {
      setProfile(await lookupProfile(username));
    } catch (e) {
      setError(e instanceof ChessComError ? e.message : 'Não foi possível buscar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  const connect = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      await connectAccount(profile.username, scope);
      toast(`Conta ${profile.username} conectada. Importando dados…`, 'positive');
      onConnected?.();
    } catch (e) {
      setError(e instanceof ChessComError ? e.message : 'Não foi possível conectar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void find();
        }}
      >
        <Field label="Usuário do Chess.com" htmlFor="cc-user" error={error} className="min-w-56 flex-1">
          <Input
            id="cc-user"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setProfile(null);
              setError(null);
            }}
            placeholder="ex.: magnuscarlsen"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!error}
          />
        </Field>
        <Button type="submit" variant={profile ? 'secondary' : 'primary'} disabled={loading || !username.trim()}>
          {loading && !profile ? <Spinner className="text-current" /> : <Search />} Buscar perfil
        </Button>
      </form>

      {profile && (
        <div className="rounded-lg border border-line bg-sunken p-4">
          <div className="flex items-center gap-3">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="size-12 rounded-md object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="font-display flex size-12 items-center justify-center rounded-md bg-panel-2 text-2xl">{profile.username[0].toUpperCase()}</div>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">
                {profile.title && <span className="mr-1.5 rounded bg-negative-soft px-1 text-xs text-negative">{profile.title}</span>}
                {profile.username}
              </p>
              <p className="truncate text-xs text-ink-muted">
                {profile.name ? `${profile.name} · ` : ''}membro desde {formatDate(profile.joined * 1000)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Field label="Importar partidas" htmlFor="cc-scope" className="min-w-48">
              <Select id="cc-scope" value={scope} onChange={(e) => setScope(e.target.value as ImportScope)}>
                <option value="3m">Últimos 3 meses</option>
                <option value="12m">Últimos 12 meses</option>
                <option value="all">Todo o histórico</option>
              </Select>
            </Field>
            <Button variant="primary" onClick={connect} disabled={loading}>
              <Link2 /> Conectar e importar
            </Button>
          </div>
        </div>
      )}

      {!compact && (
        <Alert tone="info" title="Somente leitura e sem senha">
          <span className="inline-flex items-start gap-1.5">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            O Chess Lab usa apenas a API pública do Chess.com com seu nome de usuário. Nenhuma senha, cookie ou token é solicitado ou armazenado. A importação é feita uma requisição por vez; históricos longos podem levar alguns minutos.
          </span>
        </Alert>
      )}
    </div>
  );
}
