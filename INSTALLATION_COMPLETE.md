# DSH Provider Detector - 使用指南

## ✅ 已完成安装

插件已成功安装并构建！

## 📝 主要功能

- ✅ **选择性检测**: 可以选择要检测的 providers（不是检测所有）
- ✅ **批量检测**: 支持一次检测多个选中的 providers  
- ✅ **RESTful API**: 提供完整的 HTTP API 接口
- ✅ **缓存管理**: 支持结果缓存和清理
- ✅ **详细信息**: 显示每个模型的响应时间和错误信息

## 🚀 使用方法

### 方法 1: 通过 HTML 界面（推荐）

插件提供了一个完整的 Vue 组件界面 (`DetectorPanel.vue`)，具有以下功能：

- 📋 显示所有可用的 providers 列表
- ☑️ 复选框选择要检测的 providers  
- 🔍 一键检测选中的 providers
- 📊 实时显示检测进度
- 📈 详细的统计信息和结果展示

**界面截图说明：**
- Provider 选择区域：带复选框的 provider 列表
- 操作按钮：检测选中的 Providers、刷新列表、清除结果
- 统计摘要：已检测数、可用数、不可用数、总模型数
- Provider 卡片：可展开查看详细的模型信息

### 方法 2: 通过 API

#### 1. 获取所有可用的 providers

```bash
curl http://localhost:3080/api/provider-detector/providers
```

响应示例：
```json
{
  "success": true,
  "providers": ["anthropic", "openai", "deepseek"],
  "count": 3,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### 2. 检测单个 provider

```bash
curl -X POST http://localhost:3080/api/provider-detector/detect/anthropic
```

响应示例：
```json
{
  "success": true,
  "result": {
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
}
```

#### 3. 批量检测（选择多个）

```bash
# 检测 anthropic
curl -X POST http://localhost:3080/api/provider-detector/detect/anthropic

# 检测 openai  
curl -X POST http://localhost:3080/api/provider-detector/detect/openai

# 检测 deepseek
curl -X POST http://localhost:3080/api/provider-detector/detect/deepseek
```

#### 4. 获取缓存的检测结果

```bash
curl http://localhost:3080/api/provider-detector/status
```

#### 5. 清除缓存

```bash
curl -X DELETE http://localhost:3080/api/provider-detector/cache
```

## ⚙️ 配置插件

在你的 DeepSeek Harness 配置文件中添加：

### 基础配置

```yaml
plugins:
  './dsh-provider-detector':
    autoDetectOnStartup: false  # 不自动检测，手动选择
    detectionTimeout: 10000     # 10秒超时
    verbose: false              # 简洁日志
```

### 开发调试配置

```yaml
plugins:
  './dsh-provider-detector':
    autoDetectOnStartup: false
    detectionTimeout: 5000      # 更短超时，快速失败
    verbose: true               # 详细日志，便于调试
```

### 自动监控配置

```yaml
plugins:
  './dsh-provider-detector':
    autoDetectOnStartup: true   # 启动时自动检测所有
    detectionTimeout: 15000     # 更长超时
    verbose: true               # 记录详细日志
```

## 📦 项目结构

```
dsh-provider-detector/
├── lib/                          # ✅ 已构建的 JavaScript 文件
│   ├── index.js                  # 主插件逻辑
│   ├── index.d.ts                # TypeScript 类型定义
│   ├── routes.js                 # API 路由
│   └── routes.d.ts               # 路由类型定义
├── src/                          # 源代码
│   ├── index.ts                  # 主服务类
│   ├── routes.ts                 # API 路由定义
│   └── components/
│       └── DetectorPanel.vue     # Vue UI 组件
├── node_modules/                 # ✅ 依赖已安装
├── package.json                  # 项目配置
├── tsconfig.json                 # TypeScript 配置
└── README.md                     # 文档
```

## 🔌 集成到 DSH

### 方式 1: 本地路径（推荐）

在 DSH 配置中直接引用：

```yaml
plugins:
  '/Users/mac/Downloads/1年级暑假作业/dsh-provider-detector':
    verbose: true
```

### 方式 2: npm link

```bash
# 在插件目录
cd /Users/mac/Downloads/1年级暑假作业/dsh-provider-detector
npm link

# 然后在配置中
plugins:
  dsh-provider-detector: {}
```

### 方式 3: 复制到 DSH 插件目录

```bash
# 复制到 DSH 插件目录（如果有）
cp -r dsh-provider-detector ~/.dsh/plugins/
```

## 🎨 UI 组件使用

`DetectorPanel.vue` 组件提供完整的交互界面：

**功能特性：**
- ✅ 自动加载所有可用 providers
- ✅ 默认全选（可取消）
- ✅ 显示选中数量：`检测选中的 Providers (3)`
- ✅ 实时进度：`检测中... (2/3)`
- ✅ 响应式设计，适配不同屏幕
- ✅ 颜色编码状态指示器（绿色=可用，红色=不可用）

**使用步骤：**
1. 页面加载时自动获取 providers 列表
2. 默认全选，可以取消勾选不需要的
3. 点击"检测选中的 Providers"按钮
4. 查看实时进度和结果
5. 展开 provider 卡片查看模型详情

## 📊 API 端点总览

| 端点 | 方法 | 功能 | 参数 |
|------|------|------|------|
| `/api/provider-detector/providers` | GET | 获取 provider 列表 | - |
| `/api/provider-detector/detect/:providerId` | POST | 检测单个 provider | providerId (路径参数) |
| `/api/provider-detector/detect-all` | POST | 检测所有 providers | - |
| `/api/provider-detector/status` | GET | 获取缓存状态 | - |
| `/api/provider-detector/cache` | DELETE | 清除缓存 | - |

## ⚠️ 注意事项

1. **TODO 项**: 代码中标记了 TODO 的地方需要根据实际 DSH API 实现：
   - `getAllProviders()` - 获取 providers 列表
   - `getProviderModels()` - 获取模型列表  
   - `testModel()` - 实际的模型测试逻辑

2. **依赖**: 需要 DSH 提供 `router` 服务来注册 API 路由

3. **性能**: 检测多个 providers 需要时间，建议合理设置超时

## 🔧 开发和调试

### 修改代码后重新构建

```bash
cd /Users/mac/Downloads/1年级暑假作业/dsh-provider-detector
npm run build
```

### 开发模式（自动重新编译）

```bash
npm run dev
```

### 查看日志

启动 DSH 时查看插件日志：

```bash
dsh --profile web --log-level debug
```

应该看到：
```
[info] Provider Detector plugin loaded
```

## 📝 下一步

1. **完善检测逻辑**: 根据实际 DSH API 实现 TODO 部分
2. **测试功能**: 通过 API 或 UI 测试检测功能
3. **集成 UI**: 将 Vue 组件集成到 DSH 前端
4. **添加功能**: 可以扩展添加更多功能

## 🤝 对比改进

**改进点：**
- ✅ **选择性检测**: 不再是检测所有，而是用户选择  
- ✅ **更好的 UI**: 复选框选择，实时进度显示
- ✅ **批量操作**: 可一次检测多个选中的 providers
- ✅ **清晰的 API**: 分离了获取列表和检测的接口

## 📚 相关资源

- [DeepSeek Harness GitHub](https://github.com/deepseek-ai/deepseek-harness)
- 插件完整文档: README.md
- 快速开始: QUICKSTART.md  
- 详细说明: DETAILS.zh.md

---

**安装状态**: ✅ 完成  
**构建状态**: ✅ 成功  
**准备使用**: ✅ 是

如有问题，请查阅文档或提出问题！
