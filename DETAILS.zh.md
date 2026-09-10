# DSH Provider Detector - 详细说明

## 项目概述

DSH Provider Detector 是一个为 DeepSeek Harness 设计的插件，用于自动检测和测试所有配置的 LLM providers 和模型的可用性。

## 功能详解

### 核心功能

1. **Provider 检测**
   - 自动发现所有配置的 LLM providers
   - 检测每个 provider 的连接状态
   - 记录检测时间和历史

2. **模型测试**
   - 逐个测试 provider 下的所有模型
   - 测量响应时间
   - 记录错误信息

3. **Web UI 界面**
   - 可视化展示所有 providers 和模型状态
   - 实时显示检测进度
   - 可展开/折叠查看详细信息
   - 显示响应时间统计

4. **API 接口**
   - RESTful API 端点
   - 支持批量和单个检测
   - 提供缓存管理

5. **事件系统**
   - 检测开始/完成事件
   - 状态更新事件
   - 可用于集成监控系统

## 技术架构

### 插件结构

```
dsh-provider-detector/
├── src/
│   ├── index.ts              # 主插件 - 后端服务
│   ├── client.ts             # 客户端入口
│   ├── routes.ts             # API 路由定义
│   └── components/
│       └── DetectorPanel.vue # Vue 组件 - UI 界面
├── lib/                      # TypeScript 编译输出
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 文档
```

### 核心组件说明

#### 1. ProviderDetectorService (src/index.ts)

核心服务类，提供以下方法:

```typescript
class ProviderDetectorService {
  // 获取所有 providers
  async getAllProviders(): Promise<string[]>
  
  // 检测单个 provider
  async detectProvider(providerId: string): Promise<ProviderStatus>
  
  // 检测所有 providers
  async detectAll(): Promise<ProviderStatus[]>
  
  // 测试单个模型
  private async testModel(providerId: string, modelId: string): Promise<ModelStatus>
  
  // 缓存管理
  getCachedStatus(providerId: string): ProviderStatus | undefined
  getAllCachedStatus(): ProviderStatus[]
  clearCache(): void
}
```

#### 2. API 路由 (src/routes.ts)

提供 HTTP 接口:

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/provider-detector/detect-all` | POST | 检测所有 providers |
| `/api/provider-detector/detect/:providerId` | POST | 检测指定 provider |
| `/api/provider-detector/status` | GET | 获取缓存状态 |
| `/api/provider-detector/cache` | DELETE | 清除缓存 |

#### 3. UI 组件 (src/components/DetectorPanel.vue)

Vue 3 组件特性:

- 使用 Composition API
- 响应式数据管理
- 美观的卡片式布局
- 可折叠的详细信息
- 颜色编码的状态指示器
- 实时更新

## 数据结构

### ProviderStatus

```typescript
interface ProviderStatus {
  providerId: string;      // Provider ID
  providerName: string;    // Provider 名称
  isAvailable: boolean;    // 是否可用
  models: ModelStatus[];   // 模型列表
  lastChecked?: Date;      // 最后检测时间
  error?: string;          // 错误信息
}
```

### ModelStatus

```typescript
interface ModelStatus {
  modelId: string;         // 模型 ID
  modelName: string;       // 模型名称
  isAvailable: boolean;    // 是否可用
  responseTime?: number;   // 响应时间(ms)
  error?: string;          // 错误信息
}
```

## 使用场景

### 场景 1: 日常运维检查

```yaml
# 配置自动检测
plugins:
  dsh-provider-detector:
    autoDetectOnStartup: true
    verbose: true
```

每次启动 DSH 时自动检测所有 providers，快速发现配置问题。

### 场景 2: 故障诊断

当某个 provider 出现问题时:

1. 打开 Web UI 的 Provider Detector 页面
2. 点击"检测所有 Providers"
3. 查看具体的错误信息和响应时间
4. 识别问题 provider 或模型

### 场景 3: 性能监控

```bash
# 定期调用 API 获取状态
curl http://localhost:3080/api/provider-detector/detect-all | jq .
```

可以集成到监控系统中，定期检查 providers 状态。

### 场景 4: 新 Provider 测试

添加新的 provider 配置后:

1. 通过 UI 或 API 运行检测
2. 验证配置是否正确
3. 检查模型列表和响应时间

## 高级用法

### 1. 监听事件

```typescript
// 在你的插件中
ctx.on('provider-detector/detection-started', (providerId) => {
  console.log(`开始检测 ${providerId}`);
});

ctx.on('provider-detector/status-updated', (status) => {
  if (!status.isAvailable) {
    // 发送告警
    sendAlert(`Provider ${status.providerId} 不可用`);
  }
});
```

### 2. 编程式调用

```typescript
// 在代码中使用服务
const detector = ctx.providerDetector;

// 检测特定 provider
const status = await detector.detectProvider('anthropic');

// 检查缓存
const cachedResults = detector.getAllCachedStatus();
```

### 3. 自定义检测逻辑

可以扩展 `ProviderDetectorService` 类:

```typescript
class CustomDetectorService extends ProviderDetectorService {
  async testModel(providerId: string, modelId: string) {
    // 自定义测试逻辑
    // 例如: 发送特定的测试消息
    // 或者: 测试特定的功能
  }
}
```

## 配置最佳实践

### 开发环境

```yaml
plugins:
  dsh-provider-detector:
    autoDetectOnStartup: false  # 手动触发，避免启动延迟
    detectionTimeout: 5000      # 较短的超时
    verbose: true               # 详细日志
```

### 生产环境

```yaml
plugins:
  dsh-provider-detector:
    autoDetectOnStartup: true   # 自动检测
    detectionTimeout: 10000     # 较长的超时
    verbose: false              # 简洁日志
```

## 性能考虑

### 检测时间

- 每个模型测试: ~1-5 秒
- 10 个 providers，每个 3 个模型: ~30-150 秒
- 并行优化: TODO (未来版本)

### 资源占用

- 内存: 缓存所有状态，约 1-10 MB
- CPU: 检测时轻度占用
- 网络: 发送测试请求

### 优化建议

1. 合理设置 `detectionTimeout`
2. 不需要时不启用 `autoDetectOnStartup`
3. 定期清除缓存
4. 考虑只检测活跃的 providers

## 故障排查

### 常见问题

**Q: 检测结果显示所有 providers 不可用**

A: 检查:
- LLM 服务是否正常启动
- Provider 配置是否正确
- 网络连接是否正常
- API keys 是否有效

**Q: 检测速度很慢**

A: 
- 减小 `detectionTimeout` 值
- 检查网络延迟
- 考虑减少检测的模型数量

**Q: UI 界面不显示**

A:
- 确认使用 `dsh --profile web`
- 检查插件是否正确加载
- 查看浏览器控制台错误
- 清除浏览器缓存

### 调试技巧

1. **启用详细日志**
   ```yaml
   verbose: true
   ```

2. **查看 DSH 日志**
   ```bash
   dsh --profile web --log-level debug
   ```

3. **使用 API 测试**
   ```bash
   curl -v http://localhost:3080/api/provider-detector/status
   ```

4. **检查插件加载**
   查看 DSH 启动日志中是否有:
   ```
   Provider Detector plugin loaded
   ```

## 未来计划

- [ ] 并行检测以提高速度
- [ ] 支持自定义测试消息
- [ ] 历史记录和趋势分析
- [ ] 邮件/Webhook 告警
- [ ] 更详细的性能指标
- [ ] 支持检测计划任务
- [ ] 导出检测报告

## 贡献指南

欢迎贡献！请:

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

- GitHub Issues
- 社区讨论区

---

**注意**: 这是一个社区插件，不是 DeepSeek 官方插件。使用时请注意测试和验证。
