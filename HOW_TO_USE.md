# 🎯 DSH Provider Detector - 如何使用插件

## ✅ 插件已安装

**位置**: `/Users/mac/github/dsh-provider-detector`  
**配置**: 已添加到 `~/.dsh/settings.yaml`

## 📍 在哪里找到插件

### 方式 1: 通过 API 使用（推荐）

插件提供 HTTP API，可以通过命令行或任何 HTTP 客户端使用。

#### 步骤 1: 获取认证 Token

DSH Web 界面需要认证。你需要：

1. 打开浏览器访问 DSH Web 界面
2. 在浏览器开发者工具中查看 Cookie 或 Token
3. 或者直接在 DSH Web 界面的控制台使用（无需认证）

#### 步骤 2: 使用 API

**打开浏览器访问**: http://localhost:3080

然后在浏览器的**开发者控制台**（按 F12）中执行：

```javascript
// 1. 获取所有可用的 providers
fetch('/api/provider-detector/providers')
  .then(r => r.json())
  .then(data => console.log('可用的 providers:', data))

// 2. 检测单个 provider（以 anthropic 为例）
fetch('/api/provider-detector/detect/anthropic', {method: 'POST'})
  .then(r => r.json())
  .then(data => console.log('检测结果:', data))

// 3. 查看所有缓存结果
fetch('/api/provider-detector/status')
  .then(r => r.json())
  .then(data => console.log('所有结果:', data))

// 4. 清除缓存
fetch('/api/provider-detector/cache', {method: 'DELETE'})
  .then(r => r.json())
  .then(data => console.log('缓存已清除:', data))
```

### 方式 2: 通过 DSH 插件设置（如果 DSH 支持）

如果 DSH Web 界面有插件管理页面：

1. 打开 DSH Web 界面: http://localhost:3080
2. 点击右上角的 **设置图标** ⚙️
3. 找到 **Plugins（插件）** 或 **Extensions（扩展）** 部分
4. 应该能看到 **Provider Detector** 插件
5. 点击进入插件页面

### 方式 3: 使用 Vue UI 组件（需要集成）

插件包含了 Vue 组件 `DetectorPanel.vue`，但需要集成到 DSH 的前端。

**组件位置**: `~/github/dsh-provider-detector/src/components/DetectorPanel.vue`

## 🚀 快速开始 - 完整示例

### 在浏览器控制台使用

1. **打开 DSH Web 界面**
   ```
   http://localhost:3080
   ```

2. **按 F12 打开开发者工具**，切换到 Console（控制台）标签

3. **运行以下代码**：

```javascript
// ========================================
// DSH Provider Detector 快速测试
// ========================================

console.log('🔍 开始测试 Provider Detector 插件...\n');

// 1️⃣ 获取所有可用的 providers
async function getProviders() {
  console.log('1️⃣ 获取所有可用的 providers...');
  const response = await fetch('/api/provider-detector/providers');
  const data = await response.json();
  console.log('✅ 可用的 providers:', data);
  return data.providers || [];
}

// 2️⃣ 检测选择的 providers
async function detectProvider(providerId) {
  console.log(`\n2️⃣ 检测 provider: ${providerId}...`);
  const response = await fetch(`/api/provider-detector/detect/${providerId}`, {
    method: 'POST'
  });
  const data = await response.json();
  console.log(`✅ ${providerId} 检测结果:`, data);
  return data;
}

// 3️⃣ 查看所有结果
async function getAllResults() {
  console.log('\n3️⃣ 获取所有缓存结果...');
  const response = await fetch('/api/provider-detector/status');
  const data = await response.json();
  console.log('✅ 所有结果:', data);
  return data;
}

// 🎯 运行完整测试
async function runTest() {
  try {
    // 获取 providers 列表
    const providers = await getProviders();
    
    if (providers.length === 0) {
      console.warn('⚠️ 没有找到任何 providers');
      console.log('💡 这可能是因为需要完善 getAllProviders() 方法');
      return;
    }
    
    // 检测第一个 provider
    if (providers[0]) {
      await detectProvider(providers[0]);
    }
    
    // 查看所有结果
    await getAllResults();
    
    console.log('\n✅ 测试完成！');
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 🚀 执行测试
runTest();
```

## 📊 API 端点说明

### 1. 获取 providers 列表

```javascript
GET /api/provider-detector/providers
```

**响应示例**:
```json
{
  "success": true,
  "providers": ["anthropic", "openai", "deepseek"],
  "count": 3,
  "timestamp": "2025-01-15T19:05:00.000Z"
}
```

### 2. 检测单个 provider

```javascript
POST /api/provider-detector/detect/:providerId
```

**示例**:
```javascript
fetch('/api/provider-detector/detect/anthropic', {method: 'POST'})
  .then(r => r.json())
  .then(console.log)
```

**响应示例**:
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
    "lastChecked": "2025-01-15T19:05:00.000Z"
  }
}
```

### 3. 获取所有缓存结果

```javascript
GET /api/provider-detector/status
```

### 4. 清除缓存

```javascript
DELETE /api/provider-detector/cache
```

## 🎨 如果你想看 UI 界面

插件包含了完整的 Vue UI 组件，但需要集成到 DSH 前端。组件特性：

- ☑️ 复选框列表选择 providers
- 🔘 全选/取消全选功能  
- 📊 显示选中数量
- ⏳ 实时检测进度
- 📈 详细结果展示（可展开/折叠）
- 🎨 颜色编码状态（绿色=可用，红色=不可用）

**组件文件**: `~/github/dsh-provider-detector/src/components/DetectorPanel.vue`

要使用 UI，需要：
1. 将组件集成到 DSH 的前端构建系统
2. 注册到 DSH 的设置页面
3. 重新构建 DSH 前端

## ⚠️ 当前状态说明

### ✅ 已完成
- 插件代码已编写
- 插件已构建（npm build）
- 插件已配置到 DSH
- API 路由已注册
- 全局 npm link 已完成

### ⚠️ 待完善
代码中有 TODO 标记的部分需要根据实际 DSH API 实现：

1. **获取 providers 列表** (`getAllProviders`)
   - 当前返回空数组
   - 需要调用 DSH 的 LLM 服务 API

2. **获取模型列表** (`getProviderModels`)
   - 需要实现具体逻辑

3. **测试模型** (`testModel`)
   - 需要实际调用 LLM API 测试

### 🔍 验证插件是否加载

在浏览器控制台运行：

```javascript
// 测试 API 是否响应
fetch('/api/provider-detector/providers')
  .then(r => r.text())
  .then(text => console.log('API 响应:', text))
```

如果返回 JSON 数据（即使 providers 是空数组），说明插件已正确加载。
如果返回 404 或其他错误，说明插件未加载或路由未注册。

## 📝 完整使用流程

1. **打开 DSH Web 界面**: http://localhost:3080
2. **打开浏览器控制台**: 按 F12
3. **运行上面的测试代码**
4. **查看输出结果**
5. **根据需要调用不同的 API 端点**

## 🛠️ 下一步

1. **完善 TODO 部分**: 根据 DSH API 实现实际的检测逻辑
2. **测试功能**: 确保能正确获取和检测 providers
3. **集成 UI**: 如果需要可视化界面，将 Vue 组件集成到 DSH 前端

## 📚 相关文件

- 完整文档: `~/github/dsh-provider-detector/README.md`
- 配置说明: `~/github/dsh-provider-detector/QUICK_CONFIG.md`
- 项目总结: `~/github/dsh-provider-detector/PROJECT_SUMMARY.md`

---

**快速测试**: 在浏览器控制台粘贴上面的测试代码，看是否能获取到 providers 列表！
