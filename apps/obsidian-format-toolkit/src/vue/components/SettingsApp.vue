<!--
  Vue设置应用根组件
  
  功能说明：
  - 作为Vue设置面板的根容器组件
  - 集成标签页导航和设置面板容器
  - 提供完整的设置状态管理和数据流
  
  配置项：
  Props:
  - plugin: Obsidian插件实例 (ObsidianPlugin) 必需
-->
<template>
  <div class="settings-container">
    <h2>设置面板</h2>
    
    <!-- 标签页导航 -->
    <SettingsTabs
      :tabs="props.moduleSettings"
      :active-tab="activeTab"
      :on-tab-change="switchTab"
    />
    
    <!-- 设置面板内容 -->
    <SettingsPanel :save-state="saveState">
      <!-- 标签包装器设置 -->
      <div v-if="activeTab === 'tagWrapper'" class="module-content">
        <TagWrapperSettings 
          :plugin="plugin"
          @settings-changed="handleSettingsChanged"
        />
      </div>
      
      <!-- 导出格式设置 -->
      <div v-else-if="activeTab === 'exportFormats'" class="module-content">
        <div class="module-placeholder">
          <h3>导出格式设置</h3>
          <p>此模块的Vue化正在开发中...</p>
        </div>
      </div>

      <!-- 弹窗演示 -->
      <div v-else-if="activeTab === 'modalDemo'" class="module-content">
        <DemoModalComponent :plugin="plugin" />
      </div>
    </SettingsPanel>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { SettingsAppProps } from '../types';
import { useSettingsState } from '../utils';
import SettingsTabs from './SettingsTabs.vue';
import SettingsPanel from './SettingsPanel.vue';
import TagWrapperSettings from '../../toggleTagWrapper/components/TagWrapperSettings.vue';
import DemoModalComponent from './DemoModalComponent.vue';

// 定义Props
const props = defineProps<SettingsAppProps>();

// 使用设置状态管理
const { settings, saveState } = useSettingsState(props.plugin);

// 当前活跃的标签页
const activeTab = ref(props.moduleSettings[0]?.name || 'tagWrapper');

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