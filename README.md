# DSH Provider Detector

[![GitHub stars](https://img.shields.io/github/stars/Attiv/dsh-provider-detector?style=social)](https://github.com/Attiv/dsh-provider-detector)
[![GitHub license](https://img.shields.io/github/license/Attiv/dsh-provider-detector)](https://github.com/Attiv/dsh-provider-detector/blob/main/LICENSE)

DeepSeek Harness 的 Provider 和模型检测插件 - 支持选择性检测和批量测试。

> 🔗 **GitHub**: https://github.com/Attiv/dsh-provider-detector

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
  dsh-provider-detector:
    autoDetectOnStartup: false  # 是否在启动时自动检测
    detectionTimeout: 10000     # 检测超时时间（毫秒）
    verbose: false              # 是否启用详细日志
```

### 从 npm 安装（如果发布）

```bash
npm install dsh-provider-detector
```

## 使用方法

### 1. 通过 DSH Web UI

启动 DSH 后打开终端输出的地址，进入：

```text
设置 → 插件 → Provider Detector
```

页面会加载当前 providers，勾选要测试的 provider，点击“检测选中的 provider”。结果会显示每个模型的可用状态、耗时、返回文本和错误信息。

### 2. 获取 provider 和模型

```bash
curl http://127.0.0.1:3080/api/provider-detector/providers
```

返回的 `providers` 是对象数组，每个对象包含 `id`、`name` 和 DSH 当前暴露的 `models`。

### 3. 真实检测指定 provider

检测会对每个模型发起一次最小的 streaming 请求，提示词为“请回答当前时间，只输出当前时间”。因此它验证的是当前配置、网络、鉴权和模型是否真的能响应，而不只是配置文件里是否存在模型。

```bash
# 检测一个 provider 的全部模型
curl -X POST http://127.0.0.1:3080/api/provider-detector/detect/anthropic

# 只检测选中的模型
curl -X POST http://127.0.0.1:3080/api/provider-detector/detect/anthropic \
  -H 'content-type: application/json' \
  -d '{"modelIds":["claude-3-5-sonnet"]}'
```

结果里的 `models[].isAvailable` 表示模型是否成功完成响应，`responseTime` 是耗时，`responseText` 是模型返回的简短文本，`error` 是失败原因。

### 4. 批量检测和缓存

插件提供以下 API 端点：

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

#### 检测所有 providers

```bash
curl -X POST http://127.0.0.1:3080/api/provider-detector/detect-all
```

#### 获取缓存的状态

```bash
GET /api/provider-detector/status
```

#### 清除缓存

```bash
DELETE /api/provider-detector/cache
```

### 5. 通过代码

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
- [项目 GitHub 仓库](https://github.com/Attiv/dsh-provider-detector)

## 当前实现说明

- provider 和模型来自 DSH `ctx.llm.listProviders()` / `ctx.llm.listModels()`。
- 检测通过 DSH `ctx.llm.stream()` 发起真实请求。
- DSH Web profile 目前使用 `webServer.register()` 路由；插件需要注入 `llm` 和 `webServer`。
- 没有配置 provider 或模型时，接口返回空数组是正常现象。

## 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与。

## 更新日志

### 0.1.0 (2025-01-15)

- 初始版本
- 选择性 provider 检测功能
- 批量检测支持
- Web UI 界面（Vue 组件）
- RESTful API 端点
- 完整文档

## 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情

## 作者

Created by [@Attiv](https://github.com/Attiv)

---

⭐ 如果这个项目对你有帮助，请给个 Star！
