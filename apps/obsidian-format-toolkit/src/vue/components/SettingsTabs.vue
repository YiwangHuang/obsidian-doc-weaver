<!--
  设置标签页导航组件
  
  功能说明：
  - 提供多标签页的导航界面
  - 支持活动标签页的视觉高亮显示
  - 每个标签支持悬停提示(tooltip)
  - 响应式设计，适配不同屏幕尺寸
  - 使用Obsidian主题样式确保一致性
  - 支持键盘导航和无障碍访问
  
  配置项：
  Props:
  - tabs: 标签页数组，类型为包含name和description的对象数组
  - activeTab: 当前活动标签页名称 (string)
  - onTabChange: 标签页切换回调函数
  
  Tab对象结构：
  - name: 标签页名称 (string) 必需
  - description: 标签页描述，用于tooltip显示 (string) 可选
  
  使用示例：
  <SettingsTabs
    :tabs="[
      { name: '基础设置', description: '基本功能配置' },
      { name: '高级设置', description: '高级功能配置' }
    ]"
    :active-tab="currentTab"
    :on-tab-change="handleTabChange"
  />
-->
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