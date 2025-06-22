<template>
  <div class="settings-panel">
    <!-- 保存状态指示器 -->
    <div v-if="saveState.saving || saveState.error" class="status-bar">
      <div v-if="saveState.saving" class="saving-indicator">
        <span class="loading-spinner"></span>
        Saving...
      </div>
      <div v-if="saveState.error" class="error-message">
        <span class="error-icon">⚠️</span>
        Error: {{ saveState.error }}
      </div>
    </div>

    <!-- 设置内容区域 -->
    <div class="settings-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SaveState } from '../types';

// 定义Props
interface SettingsPanelProps {
  saveState: SaveState;
}

defineProps<SettingsPanelProps>();
</script>

<style scoped>
.settings-panel {
  padding: 8px 0;
}

.status-bar {
  margin-bottom: 16px;
}

.saving-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-accent);
  font-size: 12px;
  padding: 8px 12px;
  background: var(--background-secondary);
  border-radius: 4px;
  border-left: 3px solid var(--interactive-accent);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-error);
  font-size: 12px;
  padding: 8px 12px;
  background: var(--background-secondary);
  border-radius: 4px;
  border-left: 3px solid var(--text-error);
}

.loading-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--background-modifier-border);
  border-top: 2px solid var(--interactive-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-icon {
  font-size: 14px;
}

.settings-content {
  min-height: 200px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 