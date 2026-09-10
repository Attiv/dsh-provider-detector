# 快速开始指南

## 1. 安装插件

```bash
cd dsh-provider-detector
npm install
npm run build
```

或者使用安装脚本:

```bash
./install.sh
```

## 2. 配置 DSH

在你的 DeepSeek Harness 配置文件中添加插件:

**方式 1: 使用本地路径**

```yaml
plugins:
  './path/to/dsh-provider-detector':
    autoDetectOnStartup: false
    detectionTimeout: 10000
    verbose: false
```

**方式 2: 使用 npm link (推荐用于开发)**

```bash
# 在插件目录中
npm link

# 在 DSH 配置中
plugins:
  dsh-provider-detector:
    autoDetectOnStartup: false
```

**方式 3: 从 npm 安装（如果已发布）**

```bash
npm install -g dsh-provider-detector
```

```yaml
plugins:
  dsh-provider-detector: {}
```

## 3. 启动 DSH

```bash
dsh --profile web
```

## 4. 使用插件

### 通过 Web UI

1. 打开浏览器访问 DSH Web 界面
2. 进入 **Settings（设置）** → **Provider Detector**
3. 点击 **"检测所有 Providers"** 按钮
4. 等待检测完成，查看结果

### 通过 API

```bash
# 检测所有 providers
curl -X POST http://localhost:3080/api/provider-detector/detect-all

# 检测单个 provider
curl -X POST http://localhost:3080/api/provider-detector/detect/anthropic

# 获取缓存的状态
curl http://localhost:3080/api/provider-detector/status

# 清除缓存
curl -X DELETE http://localhost:3080/api/provider-detector/cache
```

## 5. 查看结果

检测完成后，你将看到:

- ✅ 所有配置的 providers 列表
- ✅ 每个 provider 的可用状态
- ✅ 每个模型的响应时间
- ✅ 错误信息（如果有）

## 配置选项说明

```yaml
plugins:
  dsh-provider-detector:
    # 在 DSH 启动时自动检测（默认: false）
    autoDetectOnStartup: true
    
    # 单个模型测试的超时时间，单位毫秒（默认: 10000）
    detectionTimeout: 5000
    
    # 输出详细日志（默认: false）
    verbose: true
```

## 故障排查

### 问题 1: 插件未加载

**检查:**
- 确认插件已正确构建 (`npm run build`)
- 检查配置文件路径是否正确
- 查看 DSH 启动日志

### 问题 2: 检测失败

**可能原因:**
- LLM 服务未启动
- Provider 配置不正确
- 网络连接问题

**解决方法:**
- 启用 verbose 日志查看详细信息
- 检查 DSH 的 LLM providers 配置
- 增加 detectionTimeout 值

### 问题 3: UI 不显示

**检查:**
- 确认使用的是 `dsh --profile web`
- 清除浏览器缓存
- 检查浏览器控制台错误

## 下一步

- 查看完整文档: [README.md](README.md)
- 贡献代码或报告问题
- 自定义检测逻辑

## 需要帮助？

- 查看 [DeepSeek Harness 文档](https://github.com/deepseek-ai/deepseek-harness)
- 提交 Issue
- 加入社区讨论
