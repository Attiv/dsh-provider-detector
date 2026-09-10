import { Context } from '@deepseek-ai/cordis';
import { registerRoutes } from './routes';
import {
  AdvertisedModel,
  probeModel,
  ProbeModelResult,
  selectModels,
  StreamUsage,
} from './detection';

export const name = 'provider-detector';
export const inject = ['llm', 'webServer'];

export interface Config {
  autoDetectOnStartup?: boolean;
  detectionTimeout?: number;
  verbose?: boolean;
}

export interface ModelInfo extends AdvertisedModel {
  id: string;
  name: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  models: ModelInfo[];
  error?: string;
}

export interface ProviderStatus {
  providerId: string;
  providerName: string;
  isAvailable: boolean;
  models: ModelStatus[];
  lastChecked?: Date;
  error?: string;
}

export interface ModelStatus extends ProbeModelResult {
  usage?: StreamUsage;
}

interface LlmService {
  listProviders?: () => Array<{ id: string; name?: string }>;
  listModels?: (provider: string) => Promise<unknown[]>;
  stream?: (options: Record<string, unknown>) => AsyncIterable<any>;
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    providerDetector: ProviderDetectorService;
  }
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function normalizeModels(providerId: string, models: unknown[]): ModelInfo[] {
  return models
    .map((model): ModelInfo | undefined => {
      if (typeof model === 'string') {
        return { id: model, name: model, provider: providerId };
      }
      if (!model || typeof model !== 'object') return undefined;

      const candidate = model as Record<string, unknown>;
      const id = typeof candidate.id === 'string' ? candidate.id : undefined;
      if (!id) return undefined;
      const name = typeof candidate.name === 'string' ? candidate.name : id;
      return { ...candidate, id, name, provider: providerId } as ModelInfo;
    })
    .filter((model): model is ModelInfo => Boolean(model));
}

export class ProviderDetectorService {
  private readonly ctx: Context;
  private readonly config: Required<Config>;
  private readonly statusCache = new Map<string, ProviderStatus>();

  constructor(ctx: Context, config: Config = {}) {
    this.ctx = ctx;
    this.config = {
      autoDetectOnStartup: config.autoDetectOnStartup ?? false,
      detectionTimeout: config.detectionTimeout ?? 10000,
      verbose: config.verbose ?? false,
    };
  }

  private getLlm(): LlmService {
    const llmService = (this.ctx as any).llm as LlmService | undefined;
    if (!llmService) throw new Error('LLM service not available');
    return llmService;
  }

  async getAllProviders(): Promise<ProviderInfo[]> {
    const llm = this.getLlm();
    if (!llm.listProviders) throw new Error('LLM service does not expose listProviders()');
    if (!llm.listModels) throw new Error('LLM service does not expose listModels()');

    const providers = llm.listProviders();
    return Promise.all(providers.map(async (provider) => {
      const info: ProviderInfo = {
        id: provider.id,
        name: provider.name || provider.id,
        models: [],
      };

      try {
        if (this.config.verbose) this.ctx.logger?.info(`Fetching models for provider: ${provider.id}`);
        info.models = normalizeModels(provider.id, await llm.listModels!(provider.id));
      } catch (error) {
        info.error = messageFrom(error);
        this.ctx.logger?.warn(`Failed to get models for provider ${provider.id}:`, error);
      }

      return info;
    }));
  }

  async detectProvider(providerId: string, modelIds?: string[]): Promise<ProviderStatus> {
    const status: ProviderStatus = {
      providerId,
      providerName: providerId,
      isAvailable: false,
      models: [],
      lastChecked: new Date(),
    };

    try {
      const llm = this.getLlm();
      if (!llm.listProviders || !llm.listModels || !llm.stream) {
        throw new Error('LLM service does not expose the provider/model/stream APIs');
      }

      const provider = llm.listProviders().find((item) => item.id === providerId);
      if (!provider) throw new Error(`Unknown provider: ${providerId}`);
      status.providerName = provider.name || provider.id;

      const models = selectModels(
        normalizeModels(providerId, await llm.listModels(providerId)),
        modelIds,
      );

      for (const model of models) {
        const modelStatus = await probeModel({
          providerId,
          model,
          timeoutMs: this.config.detectionTimeout,
          stream: (options) => llm.stream!({ ...options }),
        });
        status.models.push(modelStatus);
      }

      status.isAvailable = status.models.some((model) => model.isAvailable);
    } catch (error) {
      status.error = messageFrom(error);
      this.ctx.logger?.error(`Failed to detect provider ${providerId}:`, error);
    }

    this.statusCache.set(providerId, status);
    return status;
  }

  async detectAll(): Promise<ProviderStatus[]> {
    const providers = await this.getAllProviders();
    const results: ProviderStatus[] = [];
    for (const provider of providers) {
      results.push(await this.detectProvider(provider.id));
    }
    return results;
  }

  getCachedStatus(providerId: string): ProviderStatus | undefined {
    return this.statusCache.get(providerId);
  }

  getAllCachedStatus(): ProviderStatus[] {
    return Array.from(this.statusCache.values());
  }

  clearCache(): void {
    this.statusCache.clear();
  }

  getConfig(): Required<Config> {
    return this.config;
  }
}

export function apply(ctx: Context, config: Config = {}) {
  const service = new ProviderDetectorService(ctx, config);
  ctx.provide('providerDetector', service);
  registerRoutes(ctx);
  ctx.logger?.info('Provider Detector plugin loaded');

  if (service.getConfig().autoDetectOnStartup) {
    setTimeout(async () => {
      try {
        const results = await service.detectAll();
        ctx.logger?.info(`Detection completed. Found ${results.length} providers.`);
      } catch (error) {
        ctx.logger?.error('Automatic detection failed:', error);
      }
    }, 5000);
  }
}
