<!--
  Vue设置应用根组件
  
  功能说明：
  - 作为Vue设置面板的根容器组件
  - 集成标签页导航和设置面板容器
  - 提供完整的设置状态管理和数据流
  - 使用动态组件映射，支持灵活的模块扩展
  
  配置项：
  Props:
  - plugin: Obsidian插件实例 (ObsidianPlugin) 必需
  - moduleSettings: 模块设置数组，包含Vue组件映射
-->
<template>
  <div class="settings-container">
    <h2>Doc Weaver</h2>
    
    <!-- 标签页导航 -->
    <SettingsTabs
      :tabs="allTabs"
      :active-tab="activeTab"
      :on-tab-change="switchTab"
    />
    
    <!-- 设置面板内容 -->
    <SettingsPanel :save-state="saveState">
      <!-- 动态组件渲染 -->
      <div v-if="currentComponent" class="module-content">
        <component 
          :is="currentComponent"
          :plugin="plugin"
          @settings-changed="handleSettingsChanged"
        />
      </div>
      
      <!-- 未找到组件时的占位符 -->
      <div v-else class="module-placeholder">
        <h3>{{ activeTab }}</h3>
        <p>No component found for this tab</p>
      </div>
    </SettingsPanel>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SettingsAppProps } from '../types';
import { useSettingsState } from '../utils';
import SettingsTabs from './SettingsTabs.vue';
import SettingsPanel from './SettingsPanel.vue';
import DemoModalComponent from './DemoModalComponent.vue';

// 定义Props
const props = defineProps<SettingsAppProps>();

// 使用设置状态管理
const { settings, saveState } = useSettingsState(props.plugin);

// Demo标签页配置（仅在此组件内定义）
const demoTab = {
  name: 'modalDemo',
  description: 'Vue弹窗组件演示',
  defaultSettings: {},
  component: DemoModalComponent
};

// 合并所有标签页（模块标签页 + demo标签页）
const allTabs = computed(() => [
  ...props.moduleSettings,
  demoTab
]);

// 当前活跃的标签页
const activeTab = ref(allTabs.value[0]?.name || 'tagWrapper');

// 动态获取当前组件
const currentComponent = computed(() => {
  // 先从注册的模块中查找
  const moduleTab = props.moduleSettings.find(tab => tab.name === activeTab.value);
  if (moduleTab?.component) {
    return moduleTab.component;
  }
  
  // 再检查是否是demo标签页
  if (activeTab.value === demoTab.name) {
    return demoTab.component;
  }
  
  return null;
});

// 切换标签页
const switchTab = (tabName: string) => {
  activeTab.value = tabName;
};

// 处理设置变更
const handleSettingsChanged = (newSettings: any) => {
  console.log('Settings changed:', newSettings);
};
</script>

<style scoped>
.settings-container {
  padding: 16px;
}

.module-content {
  padding: 16px 0;
}

.module-placeholder {
  text-align: center;
  padding: 32px;
  background: var(--background-secondary);
  border-radius: 8px;
}

.module-placeholder h3 {
  margin: 0 0 8px 0;
  color: var(--text-normal);
}

.module-placeholder p {
  margin: 0;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .settings-container {
    padding: 12px;
  }
  
  .module-content {
    padding: 12px 0;
  }
}
</style> 