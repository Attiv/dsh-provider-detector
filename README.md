# DSH Provider Detector

DeepSeek Harness 的 Provider 和模型检测插件。

## 功能特性

- ✅ 自动检测所有配置的 LLM providers
- ✅ 测试每个 provider 的可用模型
- ✅ 显示响应时间和错误信息
- ✅ 提供友好的 Web UI 界面
- ✅ 支持缓存检测结果
- ✅ 实时状态更新

## 安装

### 从本地安装

```bash
cd dsh-provider-detector
npm install
npm run build
```

然后在你的 DeepSeek Harness 配置中添加插件：

```yaml
plugins:
  provider-detector:
    autoDetectOnStartup: false  # 是否在启动时自动检测
    detectionTimeout: 10000     # 检测超时时间（毫秒）
    verbose: false              # 是否启用详细日志
```

### 从 npm 安装（如果发布）

```bash
npm install dsh-provider-detector
```

## 使用方法

### 1. 通过 Web UI

1. 启动 DeepSeek Harness: `dsh --profile web`
2. 打开浏览器访问 DSH Web 界面
3. 进入 Settings（设置） -> Provider Detector
4. 点击"检测所有 Providers"按钮
5. 查看检测结果

### 2. 通过 API

插件提供以下 API 端点：

#### 检测所有 providers

```bash
POST /api/provider-detector/detect-all
```

响应示例：

```json
{
  "success": true,
  "results": [
    {
      "providerId": "anthropic",
      "providerName": "anthropic",
      "isAvailable": true,
      "models": [
        {
          "modelId": "claude-3-opus",
          "modelName": "claude-3-opus",
          "isAvailable": true,
          "responseTime": 1234
        }
      ],
      "lastChecked": "2025-01-15T10:30:00.000Z"
    }
  ],
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### 检测单个 provider

```bash
POST /api/provider-detector/detect/:providerId
```

#### 获取缓存的状态

```bash
GET /api/provider-detector/status
```

#### 清除缓存

```bash
DELETE /api/provider-detector/cache
```

### 3. 通过代码

```typescript
// 在你的插件或代码中
const results = await ctx.providerDetector.detectAll();

// 检测单个 provider
const status = await ctx.providerDetector.detectProvider('anthropic');

// 获取缓存的结果
const cached = ctx.providerDetector.getAllCachedStatus();
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `autoDetectOnStartup` | boolean | `false` | 是否在启动时自动检测所有 providers |
| `detectionTimeout` | number | `10000` | 单个模型检测的超时时间（毫秒） |
| `verbose` | boolean | `false` | 是否启用详细日志输出 |

## 事件

插件会触发以下事件：

```typescript
// 检测开始
ctx.on('provider-detector/detection-started', (providerId: string) => {
  console.log(`Started detecting ${providerId}`);
});

// 检测完成
ctx.on('provider-detector/detection-completed', (providerId: string) => {
  console.log(`Completed detecting ${providerId}`);
});

// 状态更新
ctx.on('provider-detector/status-updated', (status: ProviderStatus) => {
  console.log(`Status updated for ${status.providerId}`);
});
```

## 开发

### 构建

```bash
npm run build
```

### 开发模式

```bash
npm run dev
```

### 项目结构

```
dsh-provider-detector/
├── src/
│   ├── index.ts              # 主插件逻辑
│   ├── client.ts             # 客户端 UI 注册
│   ├── routes.ts             # API 路由
│   └── components/
│       └── DetectorPanel.vue # UI 组件
├── lib/                      # 编译输出
├── package.json
├── tsconfig.json
└── README.md
```

## 注意事项

- 插件需要 DeepSeek Harness 的 `llm` 服务可用
- 检测过程可能需要一些时间，取决于配置的 providers 数量
- 建议设置合理的超时时间，避免长时间等待

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

## 相关资源

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [DSH 插件开发文档](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/plugin-development.md)

## 已知问题

- 目前需要根据实际的 DSH API 实现 provider 和模型的获取逻辑
- 模型测试功能需要完善（TODO 部分）

## 更新日志

### 0.1.0 (2025-01-15)

- 初始版本
- 基础的 provider 检测功能
- Web UI 界面
- API 端点
