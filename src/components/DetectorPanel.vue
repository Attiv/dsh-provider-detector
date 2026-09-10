<template>
  <div class="provider-detector-panel">
    <div class="panel-header">
      <h2>Provider & Model Detection</h2>
      <p class="description">
        选择并检测指定的 LLM providers 和模型的可用性
      </p>
    </div>

    <!-- Provider 选择区域 -->
    <div class="provider-selection">
      <h3>选择要检测的 Providers</h3>
      
      <div v-if="loadingProviders" class="loading">
        ⏳ 加载 providers 列表...
      </div>

      <div v-else-if="availableProviders.length === 0" class="empty-providers">
        ⚠️ 没有找到配置的 providers
      </div>

      <div v-else class="providers-checkboxes">
        <div class="select-all">
          <label>
            <input 
              type="checkbox" 
              :checked="allSelected"
              @change="toggleSelectAll"
            />
            <strong>全选</strong>
          </label>
        </div>
        
        <div class="provider-checkbox-list">
          <label 
            v-for="provider in availableProviders" 
            :key="provider.id"
            class="provider-checkbox"
          >
            <input 
              type="checkbox" 
              :value="provider.id"
              v-model="selectedProviders"
            />
            <span>{{ provider.name }} ({{ provider.models.length }} 个模型)</span>
          </label>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions">
      <button 
        @click="detectSelected" 
        :disabled="isDetecting || selectedProviders.length === 0"
        class="btn btn-primary"
      >
        <span v-if="!isDetecting">
          🔍 检测选中的 Providers ({{ selectedProviders.length }})
        </span>
        <span v-else>
          ⏳ 检测中... ({{ currentDetecting }}/{{ selectedProviders.length }})
        </span>
      </button>
      
      <button 
        @click="loadProviders" 
        :disabled="isDetecting"
        class="btn btn-secondary"
      >
        🔄 刷新列表
      </button>
      
      <button 
        @click="clearResults" 
        :disabled="isDetecting || results.length === 0"
        class="btn btn-secondary"
      >
        🗑️ 清除结果
      </button>
    </div>

    <div v-if="error" class="error-message">
      ❌ {{ error }}
    </div>

    <div v-if="results.length === 0 && !isDetecting" class="empty-state">
      <p>暂无检测结果。选择 providers 后点击"检测选中的 Providers"开始检测。</p>
    </div>

    <!-- 检测结果 -->
    <div v-if="results.length > 0" class="results">
      <div class="summary">
        <div class="summary-item">
          <span class="label">已检测:</span>
          <span class="value">{{ results.length }}</span>
        </div>
        <div class="summary-item success">
          <span class="label">可用:</span>
          <span class="value">{{ availableCount }}</span>
        </div>
        <div class="summary-item error">
          <span class="label">不可用:</span>
          <span class="value">{{ unavailableCount }}</span>
        </div>
        <div class="summary-item info">
          <span class="label">总模型数:</span>
          <span class="value">{{ totalModels }}</span>
        </div>
      </div>

      <div class="provider-list">
        <div 
          v-for="provider in results" 
          :key="provider.providerId"
          class="provider-item"
          :class="{ available: provider.isAvailable, unavailable: !provider.isAvailable }"
        >
          <div class="provider-header" @click="toggleProvider(provider.providerId)">
            <div class="provider-info">
              <span class="status-icon">
                {{ provider.isAvailable ? '✅' : '❌' }}
              </span>
              <span class="provider-name">{{ provider.providerName }}</span>
              <span class="provider-id">({{ provider.providerId }})</span>
              <span class="model-count">
                {{ provider.models.length }} 个模型
              </span>
            </div>
            <button class="toggle-btn">
              {{ expandedProviders.has(provider.providerId) ? '▼' : '▶' }}
            </button>
          </div>

          <div v-if="expandedProviders.has(provider.providerId)" class="provider-details">
            <div v-if="provider.error" class="provider-error">
              错误: {{ provider.error }}
            </div>

            <div v-if="provider.lastChecked" class="last-checked">
              最后检测: {{ formatDate(provider.lastChecked) }}
            </div>

            <div v-if="provider.models.length > 0" class="models-list">
              <h4>模型列表:</h4>
              <div 
                v-for="model in provider.models" 
                :key="model.modelId"
                class="model-item"
                :class="{ available: model.isAvailable, unavailable: !model.isAvailable }"
              >
                <span class="status-icon">
                  {{ model.isAvailable ? '✅' : '❌' }}
                </span>
                <span class="model-name">{{ model.modelName }}</span>
                <span v-if="model.responseTime" class="response-time">
                  {{ model.responseTime }}ms
                </span>
                <span v-if="model.responseText" class="response-text">
                  {{ model.responseText }}
                </span>
                <span v-if="model.usage?.totalTokens" class="usage">
                  {{ model.usage.totalTokens }} tokens
                </span>
                <span v-if="model.error" class="model-error">
                  {{ model.error }}
                </span>
              </div>
            </div>

            <div v-else class="no-models">
              该 provider 没有配置模型
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface ModelStatus {
  modelId: string;
  modelName: string;
  isAvailable: boolean;
  responseTime?: number;
  responseText?: string;
  finishKind?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  error?: string;
}

interface ProviderInfo {
  id: string;
  name: string;
  models: Array<{ id: string; name: string }>;
  error?: string;
}

interface ProviderStatus {
  providerId: string;
  providerName: string;
  isAvailable: boolean;
  models: ModelStatus[];
  lastChecked?: Date;
  error?: string;
}

const availableProviders = ref<ProviderInfo[]>([]);
const selectedProviders = ref<string[]>([]);
const results = ref<ProviderStatus[]>([]);
const isDetecting = ref(false);
const currentDetecting = ref(0);
const loadingProviders = ref(false);
const error = ref<string>('');
const expandedProviders = ref<Set<string>>(new Set());

const allSelected = computed(() => 
  availableProviders.value.length > 0 && 
  selectedProviders.value.length === availableProviders.value.length
);

const availableCount = computed(() => 
  results.value.filter(r => r.isAvailable).length
);

const unavailableCount = computed(() => 
  results.value.filter(r => !r.isAvailable).length
);

const totalModels = computed(() => 
  results.value.reduce((sum, r) => sum + r.models.length, 0)
);

onMounted(() => {
  loadProviders();
});

async function loadProviders() {
  loadingProviders.value = true;
  error.value = '';
  
  try {
    const response = await fetch('/api/provider-detector/providers');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    availableProviders.value = Array.isArray(data.providers)
      ? data.providers
      : (data.providerIds || []).map((id: string) => ({ id, name: id, models: [] }));
    
    // 默认全选
    if (selectedProviders.value.length === 0 && availableProviders.value.length > 0) {
      selectedProviders.value = availableProviders.value.map((provider) => provider.id);
    }
    
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载 providers 失败';
    console.error('Failed to load providers:', e);
  } finally {
    loadingProviders.value = false;
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedProviders.value = [];
  } else {
    selectedProviders.value = availableProviders.value.map((provider) => provider.id);
  }
}

async function detectSelected() {
  if (selectedProviders.value.length === 0) {
    error.value = '请至少选择一个 provider';
    return;
  }

  isDetecting.value = true;
  currentDetecting.value = 0;
  error.value = '';
  results.value = [];
  
  try {
    // 逐个检测选中的 providers
    for (const providerId of selectedProviders.value) {
      currentDetecting.value++;
      
      const response = await fetch(`/api/provider-detector/detect/${encodeURIComponent(providerId)}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`检测 ${providerId} 失败: HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.result) {
        results.value.push(data.result);
      }
    }
    
  } catch (e) {
    error.value = e instanceof Error ? e.message : '检测失败';
    console.error('Detection failed:', e);
  } finally {
    isDetecting.value = false;
    currentDetecting.value = 0;
  }
}

function clearResults() {
  results.value = [];
  expandedProviders.value.clear();
  error.value = '';
}

function toggleProvider(providerId: string) {
  if (expandedProviders.value.has(providerId)) {
    expandedProviders.value.delete(providerId);
  } else {
    expandedProviders.value.add(providerId);
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('zh-CN');
}
</script>

<style scoped>
.provider-detector-panel {
  padding: 20px;
  max-width: 1200px;
}

.panel-header {
  margin-bottom: 30px;
}

.panel-header h2 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #333;
}

.description {
  color: #666;
  font-size: 14px;
}

.provider-selection {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.provider-selection h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: #333;
}

.loading, .empty-providers {
  padding: 20px;
  text-align: center;
  color: #666;
}

.providers-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.select-all {
  padding-bottom: 10px;
  border-bottom: 1px solid #dee2e6;
}

.select-all label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.provider-checkbox-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  padding: 10px 0;
}

.provider-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  background-color: white;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.provider-checkbox:hover {
  background-color: #e9ecef;
}

.provider-checkbox input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
}

.error-message {
  padding: 10px;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 6px;
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.summary {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.summary-item .label {
  font-size: 12px;
  color: #666;
}

.summary-item .value {
  font-size: 24px;
  font-weight: bold;
}

.summary-item.success .value {
  color: #28a745;
}

.summary-item.error .value {
  color: #dc3545;
}

.summary-item.info .value {
  color: #007bff;
}

.provider-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.provider-item {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  overflow: hidden;
}

.provider-item.available {
  border-left: 4px solid #28a745;
}

.provider-item.unavailable {
  border-left: 4px solid #dc3545;
}

.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  cursor: pointer;
  background-color: #fff;
  transition: background-color 0.2s;
}

.provider-header:hover {
  background-color: #f8f9fa;
}

.provider-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-icon {
  font-size: 18px;
}

.provider-name {
  font-weight: bold;
  font-size: 16px;
}

.provider-id {
  color: #666;
  font-size: 14px;
}

.model-count {
  color: #007bff;
  font-size: 12px;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 5px 10px;
}

.provider-details {
  padding: 15px;
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
}

.provider-error {
  padding: 10px;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 14px;
}

.last-checked {
  color: #666;
  font-size: 12px;
  margin-bottom: 10px;
}

.models-list h4 {
  font-size: 14px;
  margin-bottom: 10px;
  color: #333;
}

.model-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background-color: #fff;
  border-radius: 4px;
  margin-bottom: 5px;
  flex-wrap: wrap;
}

.model-item.available {
  border-left: 3px solid #28a745;
}

.model-item.unavailable {
  border-left: 3px solid #dc3545;
}

.model-name {
  font-weight: 500;
}

.response-time {
  color: #28a745;
  font-size: 12px;
}

.model-error {
  color: #dc3545;
  font-size: 12px;
  flex: 1;
  text-align: right;
}

.no-models {
  color: #666;
  font-style: italic;
  padding: 10px;
}
</style>
