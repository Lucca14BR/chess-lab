import { useState } from 'react';
import { ExternalLink, KeyRound, ListRestart, Save, Sparkles, Trash2 } from 'lucide-react';
import { defaultModels, geminiErrorMessage, listModels, type GeminiModel } from '@/lib/ai/gemini';
import { getGeminiKey, removeGeminiKey, setGeminiKey, useHasGeminiKey } from '@/lib/tutor/key';
import { setSetting, useSettings } from '@/lib/settings';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import { Alert } from '@/components/ui/Feedback';
import { confirm, toast } from '@/components/ui/Dialog';

export function TutorSection() {
  const s = useSettings();
  const hasKey = useHasGeminiKey();
  const [draft, setDraft] = useState('');
  // A lista de modelos fica só aqui (não é salva)
  const [models, setModels] = useState<GeminiModel[] | null>(null);
  const [busy, setBusy] = useState<'save' | 'test' | 'refresh' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!draft.trim()) return;
    setBusy('save');
    try {
      await setGeminiKey(draft);
      setDraft('');
      setModels(null);
      setError(null);
      toast('Chave salva neste navegador.', 'positive');
    } finally {
      setBusy(null);
    }
  };

  // Testar e atualizar usam a chave salva
  const load = async (kind: 'test' | 'refresh') => {
    setBusy(kind);
    setError(null);
    try {
      const key = await getGeminiKey();
      if (!key) throw new Error('Nenhuma chave salva.');
      const list = await listModels(key);
      setModels(list);
      if (s.tutorPrimaryModel === null && s.tutorFallbackModel === null) {
        const d = defaultModels(list);
        await setSetting('tutorPrimaryModel', d.primary);
        await setSetting('tutorFallbackModel', d.fallback);
      }
      toast(kind === 'test' ? `Chave aceita: ${list.length} modelos disponíveis.` : `Lista atualizada: ${list.length} modelos.`, 'positive');
    } catch (e) {
      setError(geminiErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    const ok = await confirm({ title: 'Remover a chave do Gemini?', message: 'A chave será apagada deste navegador. O tutor deixa de funcionar até você salvar uma nova.', confirmLabel: 'Remover chave', danger: true });
    if (!ok) return;
    await removeGeminiKey();
    setModels(null);
    setError(null);
    toast('Chave removida.', 'info');
  };

  // Modelo salvo que não veio na lista continua selecionado
  const optionsFor = (current: string | null) => {
    const extra = current && !models?.some((m) => m.id === current) ? current : null;
    return (
      <>
        {models?.map((m) => (
          <option key={m.id} value={m.id}>
            {m.displayName}
          </option>
        ))}
        {extra && <option value={extra}>{models ? `${extra} (não listado)` : extra}</option>}
      </>
    );
  };

  const disabled = busy !== null;
  const noKey = hasKey !== true;

  return (
    <Card>
      <CardHeader icon={<Sparkles />} title="Tutor de IA" subtitle="Explicações em português com o Gemini do Google, usando a sua própria chave." />
      <CardBody className="space-y-5">
        <Field
          label="Chave da API do Gemini"
          htmlFor="gemini-key"
          hint={
            <a className="inline-flex items-center gap-1 text-brass hover:underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
              Gerar chave no Google AI Studio <ExternalLink className="size-3" />
            </a>
          }
        >
          <div className="flex flex-wrap gap-2">
            <Input
              id="gemini-key"
              type="password"
              autoComplete="off"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={hasKey ? 'Chave salva neste navegador' : 'Cole a sua chave'}
              className="max-w-sm min-w-56 flex-1"
            />
            <Button variant="primary" onClick={() => void save()} disabled={disabled || !draft.trim()}>
              <Save /> Salvar chave
            </Button>
            <Button onClick={() => void load('test')} disabled={disabled || noKey}>
              <KeyRound /> Testar chave
            </Button>
            <Button variant="danger" onClick={() => void remove()} disabled={disabled || noKey}>
              <Trash2 /> Remover chave
            </Button>
          </div>
        </Field>

        {error && (
          <Alert tone="negative" title="Não foi possível consultar o Google">
            {error}
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Modelo principal" htmlFor="tutor-primary" hint="Usado primeiro em cada pergunta.">
            <Select id="tutor-primary" value={s.tutorPrimaryModel ?? ''} onChange={(e) => void setSetting('tutorPrimaryModel', e.target.value || null)}>
              <option value="">{models ? 'Selecione…' : 'Padrão (teste a chave para listar)'}</option>
              {optionsFor(s.tutorPrimaryModel)}
            </Select>
          </Field>
          <Field label="Modelo reserva" htmlFor="tutor-fallback" hint="Entra no lugar do principal se ele atingir o limite.">
            <Select id="tutor-fallback" value={s.tutorFallbackModel ?? ''} onChange={(e) => void setSetting('tutorFallbackModel', e.target.value || null)}>
              <option value="">Nenhum</option>
              {optionsFor(s.tutorFallbackModel)}
            </Select>
          </Field>
        </div>
        <div>
          <Button onClick={() => void load('refresh')} disabled={disabled || noKey}>
            <ListRestart /> Atualizar lista
          </Button>
        </div>

        <Alert tone="warning" title="Antes de usar">
          <ul className="list-disc space-y-1 pl-5 text-xs">
            <li>No plano gratuito, o Google pode usar o conteúdo enviado para melhorar os produtos dele.</li>
            <li>O envio inclui a posição (FEN), os lances, as avaliações do motor e a sua pergunta. Nada pessoal é enviado.</li>
            <li>A chave fica legível para quem usa este navegador: crie uma chave só para o Chess Lab e remova-a em computador compartilhado.</li>
            <li>Limites e modelos gratuitos mudam a critério do Google.</li>
          </ul>
        </Alert>
      </CardBody>
    </Card>
  );
}
