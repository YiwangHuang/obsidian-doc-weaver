<template>
  <div class="vue-settings-container">
    <h2>Vue Settings Panel</h2>
    <div class="settings-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        :class="['setting-tab-button', { active: activeTab === tab.name }]"
        @click="switchTab(tab.name)"
      >
        {{ tab.name }}
      </button>
    </div>
    
    <div class="settings-content">
      <div v-if="saveState.saving" class="saving-indicator">
        Saving...
      </div>
      <div v-if="saveState.error" class="error-message">
        Error: {{ saveState.error }}
      </div>
      
      <!-- 这里将在后续阶段添加具体的设置组件 -->
      <div class="settings-placeholder">
        <p>Active Tab: {{ activeTab }}</p>
        <p>Available Tabs: {{ tabs.map(t => t.name).join(', ') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SettingsAppProps } from '../types';
import { useSettingsState } from '../utils';

// 定义Props
const props = defineProps<SettingsAppProps>();

// 使用设置状态管理
const { settings, saveState } = useSettingsState(props.plugin);

// 调试输出
console.log('Vue Settings App mounted');
console.log('Plugin:', props.plugin.manifest.name);
console.log('Module Settings:', props.moduleSettings.map(m => m.name));
console.log('Current Settings:', settings);

// 当前活跃的标签页
const activeTab = ref(props.moduleSettings[0]?.name || '');

// 计算属性：获取标签页列表
const tabs = computed(() => props.moduleSettings);

// 切换标签页
const switchTab = (tabName: string) => {
  activeTab.value = tabName;
};
</script>

<style scoped>
.vue-settings-container {
  padding: 16px;
}

.settings-tabs {
  display: flex;
  border-bottom: 1px solid var(--background-modifier-border);
  margin-bottom: 16px;
}

.setting-tab-button {
  padding: 8px 16px;
  margin: 0 8px 0 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
}

.setting-tab-button:hover {
  color: var(--text-normal);
}

.setting-tab-button.active {
  color: var(--text-normal);
  border-bottom: 2px solid var(--interactive-accent);
}

.settings-content {
  padding: 8px 0;
}

.saving-indicator {
  color: var(--text-accent);
  font-size: 12px;
  margin-bottom: 8px;
}

.error-message {
  color: var(--text-error);
  font-size: 12px;
  margin-bottom: 8px;
}

.settings-placeholder {
  padding: 16px;
  background: var(--background-secondary);
  border-radius: 4px;
  color: var(--text-muted);
}
</style> 