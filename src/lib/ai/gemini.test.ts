import { describe, expect, it, vi } from 'vitest';
import { GeminiError, defaultModels, generate, geminiErrorMessage, listModels, usableModels } from './gemini';

const json = (body: unknown, status = 200, headers?: Record<string, string>) => new Response(JSON.stringify(body), { status, headers });
const ok = (text: string) => json({ candidates: [{ content: { parts: [{ text }] } }] });
const asFetch = (fn: unknown) => fn as unknown as typeof fetch;
const REQ = { system: 's', messages: [{ role: 'user' as const, text: 'oi' }] };
const MODELS = { primary: 'models/principal', fallback: 'models/reserva' };

async function failure(p: Promise<unknown>): Promise<GeminiError> {
  try {
    await p;
  } catch (e) {
    return e as GeminiError;
  }
  throw new Error('não lançou');
}

describe('listModels', () => {
  it('filtra generateContent e segue nextPageToken', async () => {
    const m = (name: string, methods: string[]) => ({ name, displayName: name, inputTokenLimit: 100, outputTokenLimit: 10, supportedGenerationMethods: methods });
    const fetchImpl = vi.fn(async (url: string) =>
      url.includes('pageToken=t')
        ? json({ models: [m('models/c', ['generateContent'])] })
        : json({ models: [m('models/a', ['generateContent']), m('models/b', ['embedContent'])], nextPageToken: 't' }),
    );
    const list = await listModels('K', { fetchImpl: asFetch(fetchImpl) });
    expect(list.map((x) => x.id)).toEqual(['models/a', 'models/c']);
    expect(list[0]).toEqual({ id: 'models/a', displayName: 'models/a', inputTokenLimit: 100, outputTokenLimit: 10 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(fetchImpl.mock.calls[1][0])).toContain('pageToken=t');
  });

  it('traduz status de erro', async () => {
    const fetchImpl = vi.fn(async () => json({}, 403));
    const e = await failure(listModels('K', { fetchImpl: asFetch(fetchImpl) }));
    expect(e.kind).toBe('invalid-key');
    expect(e.status).toBe(403);
  });
});

describe('chave', () => {
  it('vai no cabeçalho e nunca na URL', async () => {
    const fetchImpl = vi.fn(async (url: string) => (url.endsWith(':generateContent') ? ok('oi') : json({ models: [] })));
    await listModels('K', { fetchImpl: asFetch(fetchImpl) });
    await generate('K', MODELS, REQ, { fetchImpl: asFetch(fetchImpl) });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    for (const [url, init] of fetchImpl.mock.calls as unknown as Array<[string, RequestInit]>) {
      expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('K');
      expect(url).not.toContain('K');
      expect(url).not.toContain('key=');
    }
  });

  it('chave vazia não chama fetch', async () => {
    const fetchImpl = vi.fn();
    const e = await failure(generate('', MODELS, REQ, { fetchImpl: asFetch(fetchImpl) }));
    expect(e.kind).toBe('no-key');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('generate', () => {
  it('monta o corpo com instrução, conversa e esquema JSON', async () => {
    const fetchImpl = vi.fn(async () => ok('x'));
    const schema = { type: 'object' };
    await generate('K', MODELS, { ...REQ, jsonSchema: schema }, { fetchImpl: asFetch(fetchImpl) });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/principal:generateContent');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      systemInstruction: { parts: [{ text: 's' }] },
      contents: [{ role: 'user', parts: [{ text: 'oi' }] }],
      generationConfig: { temperature: 0.4, responseMimeType: 'application/json', responseJsonSchema: schema },
    });
  });

  it('sem esquema, não pede JSON', async () => {
    const fetchImpl = vi.fn(async () => ok('x'));
    await generate('K', MODELS, { ...REQ, temperature: 0.9 }, { fetchImpl: asFetch(fetchImpl) });
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.generationConfig).toEqual({ temperature: 0.9 });
  });

  it('concatena as partes do primeiro candidato', async () => {
    const fetchImpl = vi.fn(async () => json({ candidates: [{ content: { parts: [{ text: 'a' }, { text: 'b' }] } }] }));
    const r = await generate('K', MODELS, REQ, { fetchImpl: asFetch(fetchImpl) });
    expect(r).toEqual({ text: 'ab', model: 'models/principal' });
  });

  it.each([429, 404, 503])('usa a reserva em %i', async (status) => {
    const fetchImpl = vi.fn(async (url: string) => (url.includes('principal') ? json({}, status) : ok('oi')));
    const r = await generate('K', MODELS, REQ, { fetchImpl: asFetch(fetchImpl) });
    expect(r).toEqual({ text: 'oi', model: 'models/reserva' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('usa a reserva em timeout', async () => {
    const fetchImpl = vi.fn(
      (url: string, init: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          if (!url.includes('principal')) return resolve(ok('oi'));
          init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
    );
    const r = await generate('K', MODELS, REQ, { fetchImpl: asFetch(fetchImpl), timeoutMs: 10 });
    expect(r).toEqual({ text: 'oi', model: 'models/reserva' });
  });

  it('timeout sem reserva vira kind timeout', async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
    );
    const e = await failure(generate('K', { primary: 'models/p', fallback: null }, REQ, { fetchImpl: asFetch(fetchImpl), timeoutMs: 10 }));
    expect(e.kind).toBe('timeout');
  });

  it.each([401, 403])('não usa a reserva em %i (chave recusada)', async (status) => {
    const fetchImpl = vi.fn(async () => json({}, status));
    const e = await failure(generate('K', MODELS, REQ, { fetchImpl: asFetch(fetchImpl) }));
    expect(e).toBeInstanceOf(GeminiError);
    expect(e.kind).toBe('invalid-key');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('400 com API_KEY_INVALID é chave recusada', async () => {
    const body = { error: { code: 400, status: 'INVALID_ARGUMENT', message: 'API key not valid.', details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'API_KEY_INVALID', domain: 'googleapis.com' }] } };
    const fetchImpl = vi.fn(async () => json(body, 400));
    const e = await failure(generate('K', MODELS, REQ, { fetchImpl: asFetch(fetchImpl) }));
    expect(e.kind).toBe('invalid-key');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['sem detalhes', {}],
    ['modelo sem instrução de sistema', { error: { code: 400, status: 'INVALID_ARGUMENT', message: 'Developer instruction is not enabled for models/gemma-3-27b-it' } }],
    ['plano gratuito indisponível no país', { error: { code: 400, status: 'FAILED_PRECONDITION', message: 'User location is not supported for the API use without a billing account linked.' } }],
  ])('outro 400 (%s) é pedido recusado, sem reserva', async (_name, body) => {
    const fetchImpl = vi.fn(async () => json(body, 400));
    const e = await failure(generate('K', MODELS, REQ, { fetchImpl: asFetch(fetchImpl) }));
    expect(e.kind).toBe('bad-request');
    expect(e.status).toBe(400);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('não repete quando a reserva é igual ao principal', async () => {
    const fetchImpl = vi.fn(async () => json({}, 429));
    const e = await failure(generate('K', { primary: 'models/p', fallback: 'models/p' }, REQ, { fetchImpl: asFetch(fetchImpl) }));
    expect(e.kind).toBe('rate-limit');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retryAfterSeconds vem do RetryInfo', async () => {
    const body = { error: { details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '42s' }] } };
    const fetchImpl = vi.fn(async () => json(body, 429));
    const e = await failure(generate('K', MODELS, REQ, { fetchImpl: asFetch(fetchImpl) }));
    expect(e.kind).toBe('rate-limit');
    expect(e.retryAfterSeconds).toBe(42);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('retryAfterSeconds vem do cabeçalho Retry-After', async () => {
    const fetchImpl = vi.fn(async () => json({}, 429, { 'Retry-After': '30' }));
    const e = await failure(generate('K', MODELS, REQ, { fetchImpl: asFetch(fetchImpl) }));
    expect(e.retryAfterSeconds).toBe(30);
  });

  it('bloqueio e resposta vazia', async () => {
    let e = await failure(generate('K', MODELS, REQ, { fetchImpl: asFetch(async () => json({ promptFeedback: { blockReason: 'SAFETY' } })) }));
    expect(e.kind).toBe('blocked');
    e = await failure(generate('K', MODELS, REQ, { fetchImpl: asFetch(async () => json({ candidates: [] })) }));
    expect(e.kind).toBe('empty');
  });

  it('offline quando o fetch lança TypeError', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const e = await failure(generate('K', MODELS, REQ, { fetchImpl: asFetch(fetchImpl) }));
    expect(e.kind).toBe('offline');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('defaultModels', () => {
  const m = (id: string) => ({ id, displayName: id, inputTokenLimit: 1, outputTokenLimit: 1 });
  it('escolhe principal flash e reserva flash-lite', () => {
    const list = ['models/gemini-9-flash', 'models/gemini-9-flash-lite', 'models/gemini-10-flash', 'models/gemini-10-flash-tts', 'models/gemini-10-pro'].map(m);
    expect(defaultModels(list)).toEqual({ primary: 'models/gemini-10-flash', fallback: 'models/gemini-9-flash-lite' });
  });
  it('lista real: ignora alias, preview e modelos sem uso', () => {
    const ids = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-flash-preview-09-2025', 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-pro', 'gemma-3-27b-it', 'gemini-2.5-flash-preview-tts'];
    expect(defaultModels(ids.map((id) => m(`models/${id}`)))).toEqual({ primary: 'models/gemini-2.5-flash', fallback: 'models/gemini-2.5-flash-lite' });
  });
  it('só com preview, usa o preview', () => {
    const list = ['models/gemini-3-flash-preview', 'models/gemini-flash-latest'].map(m);
    expect(defaultModels(list).primary).toBe('models/gemini-3-flash-preview');
  });
  it('sem flash, não escolhe nada', () => {
    expect(defaultModels(['models/gemini-10-pro'].map(m))).toEqual({ primary: null, fallback: null });
  });
});

describe('usableModels', () => {
  const m = (id: string) => ({ id, displayName: id, inputTokenLimit: 1, outputTokenLimit: 1 });
  it('tira gemma, tts, imagem, áudio, live e embedding', () => {
    const ids = ['models/gemini-2.5-flash', 'models/gemma-3-27b-it', 'models/gemini-2.5-flash-preview-tts', 'models/gemini-2.5-flash-image', 'models/gemini-2.5-flash-native-audio', 'models/gemini-live-2.5-flash', 'models/gemini-embedding-001', 'models/gemini-2.5-pro'];
    expect(usableModels(ids.map(m)).map((x) => x.id)).toEqual(['models/gemini-2.5-flash', 'models/gemini-2.5-pro']);
  });
});

describe('geminiErrorMessage', () => {
  it('traduz cada tipo', () => {
    expect(geminiErrorMessage(new GeminiError('invalid-key', 'x'))).toBe('Chave recusada pelo Google. Confira em Configurações.');
    expect(geminiErrorMessage(new GeminiError('offline', 'x'))).toBe('Sem conexão. O motor continua funcionando; o tutor volta quando a internet voltar.');
    expect(geminiErrorMessage(new GeminiError('rate-limit', 'x'))).toBe('Limite atingido. Tente de novo em alguns minutos.');
    const e = new GeminiError('rate-limit', 'x');
    e.retryAfterSeconds = 61;
    expect(geminiErrorMessage(e)).toBe('Limite atingido. Tente de novo em 2 min');
    e.retryAfterSeconds = 5;
    expect(geminiErrorMessage(e)).toBe('Limite atingido. Tente de novo em 1 min');
    expect(geminiErrorMessage(new GeminiError('bad-request', 'x'))).toBe('O modelo escolhido recusou o pedido. Escolha outro em Configurações.');
    expect(geminiErrorMessage(new GeminiError('no-model', 'x'))).toBe('Escolha um modelo em Configurações.');
  });
  it('erro desconhecido tem texto genérico', () => {
    expect(geminiErrorMessage(new Error('boom'))).toMatch(/tutor/i);
  });
});
