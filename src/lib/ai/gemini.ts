// Cliente da API REST do Gemini (Google AI Studio).
// - Só usa `fetch`; não conhece nada de xadrez.
// - A chave vai sempre no cabeçalho `x-goog-api-key`, nunca na URL.
// - Cada tentativa tem timeout; 429, 404, 5xx e timeout caem para o modelo reserva.

export const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_TIMEOUT_MS = 60_000;

export interface GeminiModel {
  id: string; // 'models/…'
  displayName: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
}

export type GeminiErrorKind = 'no-key' | 'no-model' | 'invalid-key' | 'bad-request' | 'rate-limit' | 'offline' | 'blocked' | 'empty' | 'server' | 'timeout' | 'not-found';

export class GeminiError extends Error {
  kind: GeminiErrorKind;
  status?: number;
  retryAfterSeconds?: number;
  constructor(kind: GeminiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'GeminiError';
    this.kind = kind;
    this.status = status;
  }
}

export interface GenerateRequest {
  system: string;
  messages: Array<{ role: 'user' | 'model'; text: string }>;
  jsonSchema?: object;
  temperature?: number;
}

export interface GenerateResult {
  text: string;
  model: string;
}

export interface GeminiDeps {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/** Tipos de erro que justificam tentar o modelo reserva. */
const FALLBACK_KINDS: GeminiErrorKind[] = ['rate-limit', 'not-found', 'server', 'timeout'];

/** O Google responde chave inválida com 400 + ErrorInfo reason API_KEY_INVALID. */
function keyInvalid(body: unknown): boolean {
  const details = (body as { error?: { details?: unknown } } | null)?.error?.details;
  return Array.isArray(details) && details.some((d) => (d as { reason?: unknown } | null)?.reason === 'API_KEY_INVALID');
}

/** 400 só é chave recusada com API_KEY_INVALID; os demais (modelo sem suporte, plano indisponível…) são pedido recusado. */
function kindForStatus(status: number, body: unknown): GeminiErrorKind {
  if (status === 400) return keyInvalid(body) ? 'invalid-key' : 'bad-request';
  if (status === 401 || status === 403) return 'invalid-key';
  if (status === 404) return 'not-found';
  if (status === 429) return 'rate-limit';
  return 'server';
}

/** Lê "42s" / "42.5s" do RetryInfo do corpo, ou o cabeçalho Retry-After (segundos). */
function retryAfterFrom(res: Response, body: unknown): number | undefined {
  const details = (body as { error?: { details?: unknown } } | null)?.error?.details;
  if (Array.isArray(details)) {
    for (const d of details as Array<{ '@type'?: unknown; retryDelay?: unknown }>) {
      if (typeof d?.['@type'] === 'string' && d['@type'].endsWith('google.rpc.RetryInfo') && typeof d.retryDelay === 'string') {
        const s = parseFloat(d.retryDelay);
        if (Number.isFinite(s) && s >= 0) return s;
      }
    }
  }
  const header = Number(res.headers.get('Retry-After'));
  return Number.isFinite(header) && header > 0 ? header : undefined;
}

async function errorFromResponse(res: Response): Promise<GeminiError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // corpo ausente ou inválido: o status basta
  }
  const msg = (body as { error?: { message?: unknown } } | null)?.error?.message;
  const e = new GeminiError(kindForStatus(res.status, body), typeof msg === 'string' ? msg : `O Gemini respondeu com erro ${res.status}.`, res.status);
  if (e.kind === 'rate-limit') e.retryAfterSeconds = retryAfterFrom(res, body);
  return e;
}

/** Uma requisição com timeout; traduz falhas de rede e de status em GeminiError. */
async function request(url: string, key: string, init: RequestInit, deps: GeminiDeps): Promise<unknown> {
  const fetchImpl = deps.fetchImpl ?? ((...args) => fetch(...args));
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, deps.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, {
      ...init,
      signal: controller.signal,
      headers: { ...(init.headers as Record<string, string>), 'x-goog-api-key': key },
    });
    if (!res.ok) throw await errorFromResponse(res);
    try {
      return await res.json();
    } catch {
      throw new GeminiError('server', 'Resposta inválida do Gemini.', res.status);
    }
  } catch (e) {
    if (e instanceof GeminiError) throw e;
    if (timedOut || (e as Error)?.name === 'AbortError') throw new GeminiError('timeout', 'O Gemini demorou demais para responder.');
    throw new GeminiError('offline', 'Não foi possível acessar o Gemini.');
  } finally {
    clearTimeout(timer);
  }
}

interface RawModel {
  name?: string;
  displayName?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
}

/** Lista os modelos que aceitam generateContent, seguindo a paginação. */
export async function listModels(key: string, deps: GeminiDeps = {}): Promise<GeminiModel[]> {
  if (!key) throw new GeminiError('no-key', 'Nenhuma chave do Gemini configurada.');
  const out: GeminiModel[] = [];
  let pageToken = '';
  for (let page = 0; page < 20; page++) {
    const url = `${GEMINI_BASE}/models?pageSize=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const body = (await request(url, key, { method: 'GET' }, deps)) as { models?: RawModel[]; nextPageToken?: string };
    for (const m of body.models ?? []) {
      if (!m.name || !m.supportedGenerationMethods?.includes('generateContent')) continue;
      out.push({
        id: m.name,
        displayName: m.displayName ?? m.name,
        inputTokenLimit: m.inputTokenLimit ?? 0,
        outputTokenLimit: m.outputTokenLimit ?? 0,
      });
    }
    if (!body.nextPageToken) break;
    pageToken = body.nextPageToken;
  }
  return out;
}

interface RawGenerate {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
}

async function generateOnce(key: string, model: string, req: GenerateRequest, deps: GeminiDeps): Promise<string> {
  const body = {
    systemInstruction: { parts: [{ text: req.system }] },
    contents: req.messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    generationConfig: {
      temperature: req.temperature ?? 0.4,
      ...(req.jsonSchema && { responseMimeType: 'application/json', responseJsonSchema: req.jsonSchema }),
    },
  };
  const raw = (await request(
    `${GEMINI_BASE}/${model}:generateContent`,
    key,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    deps,
  )) as RawGenerate;
  if (raw.promptFeedback?.blockReason) throw new GeminiError('blocked', `Pedido bloqueado pelo Gemini (${raw.promptFeedback.blockReason}).`);
  const cand = raw.candidates?.[0];
  const text = (cand?.content?.parts ?? []).map((p) => p.text ?? '').join('');
  if (!text) {
    if (cand?.finishReason === 'SAFETY') throw new GeminiError('blocked', 'Resposta bloqueada pelo Gemini (SAFETY).');
    throw new GeminiError('empty', 'O Gemini devolveu uma resposta vazia.');
  }
  return text;
}

/** Gera texto no modelo principal; usa a reserva em 429, 404, 5xx e timeout. */
export async function generate(
  key: string,
  models: { primary: string; fallback: string | null },
  req: GenerateRequest,
  deps: GeminiDeps = {},
): Promise<GenerateResult> {
  if (!key) throw new GeminiError('no-key', 'Nenhuma chave do Gemini configurada.');
  const chain = [models.primary];
  if (models.fallback && models.fallback !== models.primary) chain.push(models.fallback);
  for (let i = 0; ; i++) {
    try {
      return { text: await generateOnce(key, chain[i], req, deps), model: chain[i] };
    } catch (e) {
      const last = i === chain.length - 1;
      if (last || !(e instanceof GeminiError) || !FALLBACK_KINDS.includes(e.kind)) throw e;
    }
  }
}

/** Modelos que não servem para o tutor (voz, imagem, embeddings; Gemma não aceita instrução de sistema nem JSON). */
const EXCLUDED = /tts|image|audio|live|embedding|gemma/;
/** Alias e versões de teste: só entram se não houver versão estável. */
const UNSTABLE = /preview|exp|latest/;

/** Modelos que o tutor pode usar (os seletores das Configurações mostram só estes). */
export function usableModels(models: GeminiModel[]): GeminiModel[] {
  return models.filter((m) => !EXCLUDED.test(m.id));
}

/** Versão numérica do nome ('models/gemini-2.5-flash' → [2, 5]); sem número, []. */
function version(id: string): number[] {
  return /\d+(?:\.\d+)*/.exec(id)?.[0].split('.').map(Number) ?? [];
}

function byVersionDesc(a: string, b: string): number {
  const va = version(a);
  const vb = version(b);
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    const d = (vb[i] ?? -1) - (va[i] ?? -1);
    if (d !== 0) return d;
  }
  return b.localeCompare(a, undefined, { numeric: true });
}

/** Principal = flash mais novo; reserva = flash-lite mais novo; estável antes de preview/alias. */
export function defaultModels(models: GeminiModel[]): { primary: string | null; fallback: string | null } {
  const ids = usableModels(models)
    .map((m) => m.id)
    .sort(byVersionDesc);
  const pick = (ok: (id: string) => boolean) => {
    const found = ids.filter(ok);
    return found.find((id) => !UNSTABLE.test(id)) ?? found[0] ?? null;
  };
  return {
    primary: pick((id) => id.includes('flash') && !id.includes('lite')),
    fallback: pick((id) => id.includes('flash-lite')),
  };
}

/** Texto PT-BR para mostrar ao usuário. */
export function geminiErrorMessage(e: unknown): string {
  if (!(e instanceof GeminiError)) return 'Não foi possível falar com o tutor agora. Tente de novo.';
  switch (e.kind) {
    case 'no-key':
      return 'Ative o tutor colando sua chave do Gemini em Configurações.';
    case 'no-model':
      return 'Escolha um modelo em Configurações.';
    case 'invalid-key':
      return 'Chave recusada pelo Google. Confira em Configurações.';
    case 'bad-request':
      return 'O modelo escolhido recusou o pedido. Escolha outro em Configurações.';
    case 'offline':
      return 'Sem conexão. O motor continua funcionando; o tutor volta quando a internet voltar.';
    case 'rate-limit':
      return e.retryAfterSeconds != null
        ? `Limite atingido. Tente de novo em ${Math.max(1, Math.ceil(e.retryAfterSeconds / 60))} min`
        : 'Limite atingido. Tente de novo em alguns minutos.';
    case 'blocked':
      return 'O Google bloqueou esta resposta. Tente reformular ou tente de novo.';
    case 'empty':
      return 'O tutor não devolveu resposta. Tente de novo.';
    case 'timeout':
      return 'O tutor demorou demais para responder. Tente de novo.';
    case 'not-found':
      return 'Modelo não encontrado. Escolha outro em Configurações.';
    case 'server':
      return 'O serviço do Google está com problemas. Tente de novo em instantes.';
  }
}
