<template>
  <div class="settings-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.name"
      :class="['setting-tab-button', { active: activeTab === tab.name }]"
      @click="handleTabClick(tab.name)"
      :title="tab.description"
    >
      {{ tab.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SettingsTabsProps } from '../types';

// 定义Props
const props = defineProps<SettingsTabsProps>();

// 处理标签页点击
const handleTabClick = (tabName: string) => {
  props.onTabChange(tabName);
};
</script>

<style scoped>
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
  font-size: 14px;
  transition: all 0.2s ease;
}

.setting-tab-button:hover {
  color: var(--text-normal);
  background: var(--background-modifier-hover);
}

.setting-tab-button.active {
  color: var(--text-normal);
  border-bottom: 2px solid var(--interactive-accent);
}

.setting-tab-button:focus {
  outline: 2px solid var(--interactive-accent);
  outline-offset: 2px;
}
</style> 