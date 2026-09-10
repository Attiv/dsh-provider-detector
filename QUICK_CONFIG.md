# 快速配置 DSH Provider Detector

## 🎉 插件已安装成功！

位置: `/Users/mac/Downloads/1年级暑假作业/dsh-provider-detector`

## 📝 如何在 DSH 中使用

### 步骤 1: 找到你的 DSH 配置文件

通常在以下位置之一：
- `~/.config/dsh/config.yaml`
- `~/.dsh/config.yaml`
- `./dsh.config.yaml` (项目目录)

### 步骤 2: 添加插件配置

在配置文件中添加：

```yaml
plugins:
  # 使用绝对路径
  '/Users/mac/Downloads/1年级暑假作业/dsh-provider-detector':
    # 是否在启动时自动检测所有 providers（建议 false，手动选择更灵活）
    autoDetectOnStartup: false
    
    # 检测超时时间（毫秒）
    detectionTimeout: 10000
    
    # 是否启用详细日志
    verbose: true
```

### 步骤 3: 启动 DSH

```bash
dsh --profile web
```

### 步骤 4: 使用插件

#### 通过 API 使用：

```bash
# 1. 获取所有可用的 providers
curl http://localhost:3080/api/provider-detector/providers

# 2. 检测你选择的某个 provider（比如 anthropic）
curl -X POST http://localhost:3080/api/provider-detector/detect/anthropic

# 3. 检测另一个（比如 openai）
curl -X POST http://localhost:3080/api/provider-detector/detect/openai

# 4. 查看所有缓存的结果
curl http://localhost:3080/api/provider-detector/status

# 5. 清除缓存
curl -X DELETE http://localhost:3080/api/provider-detector/cache
```

#### 通过 Web 界面使用：

1. 在浏览器中访问 DSH Web 界面
2. 进入设置页面 (Settings)
3. 找到 "Provider Detector" 选项
4. 选择要检测的 providers（支持多选）
5. 点击"检测选中的 Providers"按钮
6. 查看结果

## 🎨 主要改进

✅ **选择性检测**: 不是检测所有 providers，而是让你选择要检测哪些
✅ **批量检测**: 可以同时选择多个 providers 一起检测
✅ **实时进度**: 显示 "检测中... (2/5)" 这样的进度信息
✅ **复选框界面**: 友好的 UI，支持全选/取消全选

## 📋 配置示例

### 示例 1: 仅 API 使用（推荐）

```yaml
plugins:
  '/Users/mac/Downloads/1年级暑假作业/dsh-provider-detector':
    autoDetectOnStartup: false
    detectionTimeout: 10000
    verbose: false
```

然后通过 curl 或其他 HTTP 客户端调用 API。

### 示例 2: 启动时自动检测（监控用途）

```yaml
plugins:
  '/Users/mac/Downloads/1年级暑假作业/dsh-provider-detector':
    autoDetectOnStartup: true   # 启动时检测所有
    detectionTimeout: 15000
    verbose: true               # 记录详细日志
```

### 示例 3: 开发调试

```yaml
plugins:
  '/Users/mac/Downloads/1年级暑假作业/dsh-provider-detector':
    autoDetectOnStartup: false
    detectionTimeout: 5000      # 短超时，快速失败
    verbose: true               # 详细日志
```

## 🔍 验证安装

启动 DSH 后，查看日志应该有：

```
[info] Provider Detector plugin loaded
Provider Detector API routes registered
```

测试 API：

```bash
curl http://localhost:3080/api/provider-detector/providers
```

应该返回类似：

```json
{
  "success": true,
  "providers": ["anthropic", "openai", "deepseek"],
  "count": 3,
  "timestamp": "2025-01-15T..."
}
```

## 📚 更多信息

- 完整文档: [README.md](README.md)
- 安装说明: [INSTALLATION_COMPLETE.md](INSTALLATION_COMPLETE.md)
- 详细说明: [DETAILS.zh.md](DETAILS.zh.md)
- 快速开始: [QUICKSTART.md](QUICKSTART.md)

## ⚠️ 重要提示

代码中有几个 TODO 标记的地方需要根据实际 DSH API 实现：

1. **获取 providers 列表** (`getAllProviders` 方法)
2. **获取模型列表** (`getProviderModels` 方法)
3. **测试模型** (`testModel` 方法)

这些需要查看 DSH 的实际 API 文档或源码来完善。

## 🚀 开始使用

```bash
# 1. 编辑 DSH 配置
vim ~/.config/dsh/config.yaml

# 2. 添加插件配置（见上方示例）

# 3. 启动 DSH
dsh --profile web

# 4. 测试 API
curl http://localhost:3080/api/provider-detector/providers

# 5. 检测一个 provider
curl -X POST http://localhost:3080/api/provider-detector/detect/anthropic
```

祝使用愉快！🎉
