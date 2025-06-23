<!--
  设置面板容器组件
  
  功能说明：
  - 提供设置页面的主容器和布局结构
  - 集成保存状态指示器，显示保存进度和错误信息
  - 自动显示/隐藏状态栏基于保存状态
  - 提供统一的内容区域布局和间距
  - 支持加载动画和错误提示样式
  - 使用Obsidian主题样式确保一致性
  
  配置项：
  Props:
  - saveState: 保存状态对象 (SaveState) 必需
    * SaveState类型：
      - saving: 是否正在保存 (boolean)
      - error: 错误信息 (string | null)
  
  Slots:
  - default: 设置内容区域，用于放置配置项组件
  
  状态指示器功能：
  - 保存中：显示旋转加载动画和"Saving..."文本
  - 错误：显示警告图标和错误信息
  - 正常：隐藏状态栏
  
  使用示例：
  <SettingsPanel :save-state="saveState">
    <ConfigurationItem title="设置1">
      <template #control>
        <ToggleSwitch v-model="setting1" />
      </template>
    </ConfigurationItem>
  </SettingsPanel>
-->
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