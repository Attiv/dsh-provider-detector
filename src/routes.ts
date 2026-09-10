import { Context } from '@deepseek-ai/cordis';

export function registerRoutes(ctx: Context) {
  const router = (ctx as any).router;
  if (!router) {
    ctx.logger?.warn('Router not available, skipping route registration');
    return;
  }

  // 获取所有可用的 providers 列表
  router.get('/api/provider-detector/providers', async (req: any, res: any) => {
    try {
      if (!ctx.providerDetector) {
        return res.status(503).json({ error: 'Provider detector service not available' });
      }

      const providers = await ctx.providerDetector.getAllProviders();
      
      res.json({ 
        success: true, 
        providers,
        count: providers.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      ctx.logger?.error('API error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // 注册 API 路由
  router.post('/api/provider-detector/detect-all', async (req: any, res: any) => {
    try {
      if (!ctx.providerDetector) {
        return res.status(503).json({ error: 'Provider detector service not available' });
      }

      const results = await ctx.providerDetector.detectAll();
      
      res.json({ 
        success: true, 
        results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      ctx.logger?.error('API error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  router.post('/api/provider-detector/detect/:providerId', async (req: any, res: any) => {
    try {
      if (!ctx.providerDetector) {
        return res.status(503).json({ error: 'Provider detector service not available' });
      }

      const { providerId } = req.params;
      if (!providerId) {
        return res.status(400).json({ error: 'Provider ID is required' });
      }

      const result = await ctx.providerDetector.detectProvider(providerId);
      
      res.json({ 
        success: true, 
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      ctx.logger?.error('API error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  router.get('/api/provider-detector/status', async (req: any, res: any) => {
    try {
      if (!ctx.providerDetector) {
        return res.status(503).json({ error: 'Provider detector service not available' });
      }

      const cachedResults = ctx.providerDetector.getAllCachedStatus();
      
      res.json({ 
        success: true, 
        results: cachedResults,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      ctx.logger?.error('API error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  router.delete('/api/provider-detector/cache', async (req: any, res: any) => {
    try {
      if (!ctx.providerDetector) {
        return res.status(503).json({ error: 'Provider detector service not available' });
      }

      ctx.providerDetector.clearCache();
      
      res.json({ 
        success: true,
        message: 'Cache cleared',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      ctx.logger?.error('API error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  ctx.logger?.info('Provider Detector API routes registered');
}
