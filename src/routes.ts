import { Context } from '@deepseek-ai/cordis';

export function registerRoutes(ctx: Context) {
  const sendJson = (res: any, status: number, body: unknown) => {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body));
  };

  const readJsonBody = async (req: any): Promise<Record<string, unknown>> => {
    if (req.body && typeof req.body === 'object') return req.body;
    if (!req.on) return {};

    return new Promise((resolve, reject) => {
      let body = '';
      req.setEncoding?.('utf8');
      req.on('data', (chunk: string) => {
        body += chunk;
        if (body.length > 64 * 1024) reject(new Error('Request body too large'));
      });
      req.on('end', () => {
        if (!body.trim()) return resolve({});
        try {
          const parsed = JSON.parse(body);
          resolve(parsed && typeof parsed === 'object' ? parsed : {});
        } catch {
          reject(new Error('Invalid JSON body'));
        }
      });
      req.on('error', reject);
    });
  };

  // 获取所有可用的 providers 列表
  const providersRoute = async (_req: any, res: any) => {
    try {
      if (!ctx.providerDetector) {
        return sendJson(res, 503, { error: 'Provider detector service not available' });
      }

      const providers = await ctx.providerDetector.getAllProviders();

      sendJson(res, 200, {
        success: true, 
        providers,
        providerIds: providers.map((provider) => provider.id),
        count: providers.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      ctx.logger?.error('API error:', error);
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  };

  // 注册 API 路由
  const detectAllRoute = async (_req: any, res: any) => {
    try {
      if (!ctx.providerDetector) {
        return sendJson(res, 503, { error: 'Provider detector service not available' });
      }

      const results = await ctx.providerDetector.detectAll();

      sendJson(res, 200, {
        success: true, 
        results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      ctx.logger?.error('API error:', error);
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  };

  const detectProviderRoute = async (req: any, res: any) => {
    try {
      if (!ctx.providerDetector) {
        return sendJson(res, 503, { error: 'Provider detector service not available' });
      }

      const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
      const providerId = decodeURIComponent(pathname.slice('/api/provider-detector/detect/'.length));
      if (!providerId) {
        return sendJson(res, 400, { error: 'Provider ID is required' });
      }

      const body = await readJsonBody(req);
      const modelIds = Array.isArray(body.modelIds)
        ? body.modelIds.filter((modelId): modelId is string => typeof modelId === 'string')
        : undefined;
      const result = await ctx.providerDetector.detectProvider(providerId, modelIds);

      sendJson(res, 200, {
        success: true, 
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      ctx.logger?.error('API error:', error);
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  };

  const statusRoute = async (_req: any, res: any) => {
    try {
      if (!ctx.providerDetector) {
        return sendJson(res, 503, { error: 'Provider detector service not available' });
      }

      const cachedResults = ctx.providerDetector.getAllCachedStatus();

      sendJson(res, 200, {
        success: true, 
        results: cachedResults,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      ctx.logger?.error('API error:', error);
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  };

  const clearCacheRoute = async (_req: any, res: any) => {
    try {
      if (!ctx.providerDetector) {
        return sendJson(res, 503, { error: 'Provider detector service not available' });
      }

      ctx.providerDetector.clearCache();

      sendJson(res, 200, {
        success: true,
        message: 'Cache cleared',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      ctx.logger?.error('API error:', error);
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  };

  // The current DSH web host exposes WebServer.register() rather than an
  // Express-style router. Each handler validates its HTTP method locally.
  const routes = [
    { kind: 'exact' as const, path: '/api/provider-detector/providers', method: 'GET', handler: providersRoute },
    { kind: 'exact' as const, path: '/api/provider-detector/detect-all', method: 'POST', handler: detectAllRoute },
    { kind: 'prefix' as const, path: '/api/provider-detector/detect', method: 'POST', handler: detectProviderRoute },
    { kind: 'exact' as const, path: '/api/provider-detector/status', method: 'GET', handler: statusRoute },
    { kind: 'exact' as const, path: '/api/provider-detector/cache', method: 'DELETE', handler: clearCacheRoute },
  ];

  const webServer = (ctx as any).webServer;
  for (const route of routes) {
    ctx.effect(() => webServer.register({
      kind: route.kind,
      path: route.path,
      handler: async (req: any, res: any) => {
        if (req.method !== route.method) {
          res.setHeader('allow', route.method);
          return sendJson(res, 405, { error: 'Method not allowed' });
        }
        return route.handler(req, res);
      },
    }));
  }

  ctx.logger?.info('Provider Detector API routes registered');
}
