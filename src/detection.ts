import { randomUUID } from 'node:crypto';

export const CURRENT_TIME_PROMPT = '请回答当前时间，只输出当前时间。';

export interface AdvertisedModel {
  id: string;
  name?: string;
  description?: string;
  provider?: string;
  [key: string]: unknown;
}

export interface StreamUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  reasoningTokens?: number;
  [key: string]: unknown;
}

export interface StreamChunk {
  type: string;
  index?: number;
  text?: string;
  usage?: StreamUsage;
  reason?: { kind?: string; failure?: unknown; [key: string]: unknown };
  [key: string]: unknown;
}

export interface CollectedStream {
  text: string;
  usage?: StreamUsage;
  finish?: { kind?: string; failure?: unknown; [key: string]: unknown };
}

export interface ProbeModelOptions {
  providerId: string;
  model: AdvertisedModel;
  timeoutMs: number;
  stream: (options: {
    provider: string;
    model: string;
    messages: Array<{
      id: string;
      role: 'user';
      content: Array<{ type: 'text'; text: string }>;
      source: { kind: 'user' };
    }>;
    temperature: number;
    maxTokens: number;
    signal: AbortSignal;
  }) => AsyncIterable<StreamChunk>;
}

export interface ProbeModelResult {
  modelId: string;
  modelName: string;
  isAvailable: boolean;
  responseTime?: number;
  responseText?: string;
  usage?: StreamUsage;
  finishKind?: string;
  error?: string;
}

export function selectModels(models: AdvertisedModel[], modelIds?: string[]): AdvertisedModel[] {
  if (modelIds === undefined) return models;
  const selected = new Set(modelIds);
  return models.filter((model) => selected.has(model.id));
}

export async function collectStream(stream: AsyncIterable<StreamChunk>): Promise<CollectedStream> {
  let text = '';
  let usage: StreamUsage | undefined;
  let finish: CollectedStream['finish'];

  for await (const chunk of stream) {
    if (chunk.type === 'text-delta' && typeof chunk.text === 'string') {
      text += chunk.text;
    } else if (chunk.type === 'usage' && chunk.usage) {
      usage = chunk.usage;
    } else if (chunk.type === 'finish' && chunk.reason) {
      finish = chunk.reason;
    }
  }

  return { text, usage, finish };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const candidate = error as Record<string, unknown>;
    for (const key of ['message', 'error', 'detail', 'reason']) {
      const value = candidate[key];
      if (typeof value === 'string' && value) return value;
      if (value && typeof value === 'object') {
        const nested = (value as Record<string, unknown>).message;
        if (typeof nested === 'string' && nested) return nested;
      }
    }
    try {
      return JSON.stringify(error).slice(0, 500);
    } catch {
      return 'Unknown model error';
    }
  }
  return String(error);
}

export async function probeModel(options: ProbeModelOptions): Promise<ProbeModelResult> {
  const startedAt = Date.now();
  const controller = new AbortController();
  let timedOut = false;
  let timeoutId: NodeJS.Timeout | undefined;

  const result: ProbeModelResult = {
    modelId: options.model.id,
    modelName: options.model.name || options.model.id,
    isAvailable: false,
  };

  try {
    const stream = options.stream({
      provider: options.providerId,
      model: options.model.id,
      messages: [{
        id: randomUUID(),
        role: 'user',
        content: [{ type: 'text', text: CURRENT_TIME_PROMPT }],
        source: { kind: 'user' },
      }],
      temperature: 0,
      maxTokens: 16,
      signal: controller.signal,
    });

    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
        reject(new Error(`Timeout after ${options.timeoutMs}ms`));
      }, options.timeoutMs);
    });

    const collected = await Promise.race([collectStream(stream), timeout]);
    result.responseTime = Date.now() - startedAt;
    result.responseText = collected.text;
    result.usage = collected.usage;
    result.finishKind = collected.finish?.kind;

    if (collected.finish?.kind === 'error' || collected.finish?.kind === 'aborted') {
      result.error = collected.finish.failure ? errorMessage(collected.finish.failure) : `Model finished with ${collected.finish.kind}`;
      return result;
    }

    result.isAvailable = true;
    return result;
  } catch (error) {
    result.responseTime = Date.now() - startedAt;
    result.error = timedOut ? `Timeout after ${options.timeoutMs}ms` : errorMessage(error);
    return result;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
