# Provider Model Detection Design

## Goal

让 DSH Provider Detector 从当前 DSH runtime 获取已注册 provider 和模型，并对用户选择的 provider 下每个模型发送一次最小“当前时间”请求，返回可用性、响应、耗时、token 用量和错误信息。

## Architecture

插件只使用 DSH 的 `ctx.llm` 服务，不读取或打印 API Key，也不自行实现 OpenAI-compatible 请求协议。`ctx.llm.listProviders()` 和 `ctx.llm.listModels(provider)` 提供检测目录；`ctx.llm.stream()` 负责真实模型调用。WebServer API 暴露 provider/model 清单和检测结果，Vue 面板消费这些 API 并允许选择 provider。

检测请求固定为短文本“请回答当前时间，只输出当前时间。”，使用低 `maxTokens`、AbortController 超时和每模型独立结果。流式返回中的 `finish.kind === error/aborted` 视为失败；成功结果保留短响应预览、耗时和 usage。

## API contract

- `GET /api/provider-detector/providers`: 返回 `{ providers: [{ id, name, models, error? }] }`。
- `POST /api/provider-detector/detect/:providerId`: 检测该 provider 的全部已列出模型；可选 JSON `{ modelIds: string[] }` 限制模型集合。
- `POST /api/provider-detector/detect-all`: 检测所有 provider。
- `GET /api/provider-detector/status`: 返回缓存结果。
- `DELETE /api/provider-detector/cache`: 清理缓存。

## Error handling

单个模型失败不会中止同一 provider 的其他模型检测。错误结果包含稳定的 message；不包含 credential、完整请求头或响应中的敏感字段。provider/model 列举失败作为 provider-level error 返回。

## UI

更新现有 `DetectorPanel.vue`：provider 复选框显示模型数量，选择 provider 后逐个调用检测 API，结果展开显示每个模型的成功/失败、响应预览、耗时和 token 用量。组件仍作为独立面板，暂不修改 DSH 前端 bundle 注册机制。

## Testing

增加 Node 内置 test 的纯逻辑测试：模型选择、超时包装、流式 chunk 汇总和错误分类。使用最小的 fake LLM runtime，不联网。随后执行 TypeScript build，并启动真实 DSH web profile，通过 API 验证 provider 清单和检测路由能够加载。
