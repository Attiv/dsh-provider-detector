import { Context } from '@deepseek-ai/cordis';
import { registerRoutes } from './routes';

export const name = 'provider-detector';

export interface Config {
  /** 是否在启动时自动检测所有 providers */
  autoDetectOnStartup?: boolean;
  /** 检测超时时间（毫秒） */
  detectionTimeout?: number;
  /** 是否启用详细日志 */
  verbose?: boolean;
}

export interface ProviderStatus {
  providerId: string;
  providerName: string;
  isAvailable: boolean;
  models: ModelStatus[];
  lastChecked?: Date;
  error?: string;
}

export interface ModelStatus {
  modelId: string;
  modelName: string;
  isAvailable: boolean;
  responseTime?: number;
  error?: string;
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    providerDetector: ProviderDetectorService;
  }
}

export class ProviderDetectorService {
  private ctx: Context;
  private config: Config;
  private statusCache: Map<string, ProviderStatus> = new Map();

  constructor(ctx: Context, config: Config) {
    this.ctx = ctx;
    this.config = config;
  }

  /**
   * 获取所有可用的 providers
   */
  async getAllProviders(): Promise<string[]> {
    try {
      // 从 llm 服务获取所有注册的 providers
      const llmService = (this.ctx as any).llm;
      if (!llmService) {
        throw new Error('LLM service not available');
      }

      // 获取所有配置的 providers
      const providers: string[] = [];
      
      // 这里需要根据实际的 DSH API 来获取 providers
      // 暂时返回一个示例列表
      if (this.config.verbose) {
        this.ctx.logger?.info('Fetching all providers from LLM service');
      }

      // TODO: 实现实际的 provider 获取逻辑
      // 可能需要访问 ctx.llm.providers 或类似的 API
      
      return providers;
    } catch (error) {
      this.ctx.logger?.error('Failed to get all providers:', error);
      return [];
    }
  }

  /**
   * 检测单个 provider 的状态
   */
  async detectProvider(providerId: string): Promise<ProviderStatus> {
    const status: ProviderStatus = {
      providerId,
      providerName: providerId,
      isAvailable: false,
      models: [],
      lastChecked: new Date(),
    };

    try {
      if (this.config.verbose) {
        this.ctx.logger?.info(`Detecting provider: ${providerId}`);
      }

      // 获取该 provider 的所有模型
      const models = await this.getProviderModels(providerId);
      
      // 测试每个模型
      for (const modelId of models) {
        const modelStatus = await this.testModel(providerId, modelId);
        status.models.push(modelStatus);
      }

      // 如果至少有一个模型可用，则认为 provider 可用
      status.isAvailable = status.models.some(m => m.isAvailable);

    } catch (error) {
      status.error = error instanceof Error ? error.message : String(error);
      this.ctx.logger?.error(`Failed to detect provider ${providerId}:`, error);
    }

    // 缓存状态
    this.statusCache.set(providerId, status);

    return status;
  }

  /**
   * 检测所有 providers
   */
  async detectAll(): Promise<ProviderStatus[]> {
    const providers = await this.getAllProviders();
    const results: ProviderStatus[] = [];

    for (const providerId of providers) {
      const status = await this.detectProvider(providerId);
      results.push(status);
    }

    return results;
  }

  /**
   * 获取 provider 的所有模型
   */
  private async getProviderModels(providerId: string): Promise<string[]> {
    try {
      // TODO: 实现实际的模型获取逻辑
      // 可能需要访问 ctx.llm.getModels(providerId) 或类似的 API
      
      if (this.config.verbose) {
        this.ctx.logger?.info(`Fetching models for provider: ${providerId}`);
      }

      return [];
    } catch (error) {
      this.ctx.logger?.error(`Failed to get models for provider ${providerId}:`, error);
      return [];
    }
  }

  /**
   * 测试单个模型
   */
  private async testModel(providerId: string, modelId: string): Promise<ModelStatus> {
    const startTime = Date.now();
    const status: ModelStatus = {
      modelId,
      modelName: modelId,
      isAvailable: false,
    };

    try {
      if (this.config.verbose) {
        this.ctx.logger?.info(`Testing model: ${providerId}:${modelId}`);
      }

      // 创建一个简单的测试请求
      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Timeout'));
        }, this.config.detectionTimeout);
      });

      try {
        // TODO: 实现实际的模型测试逻辑
        // 可能需要调用 ctx.llm.chat() 或类似的 API
        
        // 示例：发送一个简单的测试消息
        // const response = await ctx.llm.chat({
        //   model: `${providerId}:${modelId}`,
        //   messages: [{ role: 'user', content: 'test' }],
        // });

        await Promise.race([
          // 实际测试逻辑
          Promise.resolve(),
          timeoutPromise
        ]);

        if (timeoutId) clearTimeout(timeoutId);
        
        status.isAvailable = true;
        status.responseTime = Date.now() - startTime;

      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        throw error;
      }

    } catch (error) {
      status.error = error instanceof Error ? error.message : String(error);
      if (this.config.verbose) {
        this.ctx.logger?.warn(`Model test failed: ${providerId}:${modelId}`, error);
      }
    }

    return status;
  }

  /**
   * 获取缓存的状态
   */
  getCachedStatus(providerId: string): ProviderStatus | undefined {
    return this.statusCache.get(providerId);
  }

  /**
   * 获取所有缓存的状态
   */
  getAllCachedStatus(): ProviderStatus[] {
    return Array.from(this.statusCache.values());
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.statusCache.clear();
  }
}

export function apply(ctx: Context, config: Config) {
  // 设置默认值
  const finalConfig = {
    autoDetectOnStartup: config.autoDetectOnStartup ?? false,
    detectionTimeout: config.detectionTimeout ?? 10000,
    verbose: config.verbose ?? false,
  };

  // 创建服务实例
  const service = new ProviderDetectorService(ctx, finalConfig);
  ctx.providerDetector = service;

  // 注册 API 路由
  registerRoutes(ctx);

  // 注册日志
  ctx.logger?.info('Provider Detector plugin loaded');

  // 如果配置了自动检测，则在启动时执行
  if (finalConfig.autoDetectOnStartup) {
    // 延迟执行，等待系统就绪
    setTimeout(async () => {
      ctx.logger?.info('Starting automatic provider detection...');
      try {
        const results = await service.detectAll();
        ctx.logger?.info(`Detection completed. Found ${results.length} providers.`);
        
        const availableCount = results.filter(r => r.isAvailable).length;
        ctx.logger?.info(`Available providers: ${availableCount}/${results.length}`);
      } catch (error) {
        ctx.logger?.error('Automatic detection failed:', error);
      }
    }, 5000);
  }
}
