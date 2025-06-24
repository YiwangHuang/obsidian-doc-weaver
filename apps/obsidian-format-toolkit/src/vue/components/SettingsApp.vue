<!--
  Vue设置应用根组件
  
  功能说明：
  - 作为Vue设置面板的根容器组件
  - 集成标签页导航和设置面板容器
  - 提供完整的设置状态管理和数据流
  - 包含组件演示和测试功能
  - 支持Obsidian弹窗集成演示
  - 自动保存用户设置到插件配置
  
  主要特性：
  - 多标签页支持，动态内容切换
  - 防抖保存机制(500ms延迟)
  - 完整的弹窗交互流程演示
  - 组件状态同步和变更跟踪
  - 响应式UI适配移动端
  
  配置项：
  Props:
  - plugin: Obsidian插件实例 (ObsidianPlugin) 必需
  
  组件演示内容：
  1. 基础UI组件测试(开关、输入框、下拉框、按钮)
  2. 配置项容器布局演示
  3. Obsidian弹窗集成完整流程
  4. 动态项目管理功能
  5. 保存状态和错误处理
  
  使用示例：
  <SettingsApp :plugin="pluginInstance" />
-->
<template>
  <div class="vue-settings-container">
    <h2>Vue Settings Panel</h2>
    
    <!-- 使用新的标签页组件 -->
    <SettingsTabs
      :tabs="props.moduleSettings"
      :active-tab="activeTab"
      :on-tab-change="switchTab"
    />
    
    <!-- 使用新的设置面板组件 -->
    <SettingsPanel :save-state="saveState">
      <!-- 根据当前标签页显示不同的设置内容 -->
      <div v-if="activeTab === 'tagWrapper'" class="module-settings">
        <TagWrapperSettings 
          :plugin="plugin"
          @settings-changed="handleTagWrapperSettingsChanged"
        />
      </div>
      
      <!-- Export Formats设置 -->
      <div v-else-if="activeTab === 'exportFormats'" class="module-settings">
        <div class="module-placeholder">
          <h3>导出格式设置</h3>
          <p>这个模块的Vue化还在开发中...</p>
          <p>目前使用原生DOM实现</p>
        </div>
      </div>

      <!-- Vue弹窗组件演示 -->
      <div v-else-if="activeTab === 'modalDemo'" class="module-settings">
        <DemoModalComponent :plugin="plugin" />
      </div>
      
      <!-- 演示和测试内容 -->
      <div v-else-if="activeTab === 'Demo'" class="settings-placeholder">
        <ConfigurationItem
          title="Vue组件测试"
          description="这是一个Vue组件的测试示例，展示基础组件的使用"
        >
          <template #control>
            <ToggleSwitch v-model="testEnabled" />
          </template>
          <template #details>
            <div class="test-components">
              <div class="component-demo">
                <h5>文本输入框:</h5>
                <TextInput
                  v-model="testText"
                  placeholder="输入一些测试文本..."
                />
              </div>
              
              <div class="component-demo">
                <h5>下拉选择:</h5>
                <Dropdown
                  v-model="testSelect"
                  :options="testOptions"
                />
              </div>
              
              <div class="component-demo">
                <h5>按钮组合:</h5>
                <div class="button-group">
                  <Button variant="primary" size="small">Primary</Button>
                  <Button variant="secondary" size="small">Secondary</Button>
                  <Button variant="danger" size="small">Danger</Button>
                </div>
              </div>
            </div>
          </template>
        </ConfigurationItem>
        
        <ConfigurationItem
          title="当前状态"
          description="显示当前标签页和可用标签"
        >
          <template #control>
            <span class="status-text">{{ activeTab }}</span>
          </template>
          <template #details>
            <p>Available Tabs: {{ props.moduleSettings.map(t => t.name).join(', ') }}</p>
            <p>Test Enabled: {{ testEnabled }}</p>
            <p>Test Text: {{ testText || '(empty)' }}</p>
            <p>Test Select: {{ testSelect }}</p>
          </template>
        </ConfigurationItem>


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
import ConfigurationItem from './ConfigurationItem.vue';
import ConfigurationItemWithObsidianModal from './ConfigurationItemWithObsidianModal.vue';
import ToggleSwitch from './ToggleSwitch.vue';
import TextInput from './TextInput.vue';
import TextArea from './TextArea.vue';
import Dropdown from './Dropdown.vue';
import Button from './Button.vue';
import TagWrapperSettings from '../../toggleTagWrapper/components/TagWrapperSettings.vue';
import DemoModalComponent from './DemoModalComponent.vue';
import type { DropdownOption } from './Dropdown.vue';

// 定义Props
const props = defineProps<SettingsAppProps>();

// 使用设置状态管理
const { settings, saveState } = useSettingsState(props.plugin);

// 调试输出
console.log('Vue Settings App mounted');
console.log('Plugin:', props.plugin.manifest.name);
console.log('Module Settings:', props.moduleSettings.map(m => m.name));
console.log('Current Settings:', settings);

// 当前活跃的标签页 - 使用实际的模块名称
const activeTab = ref(props.moduleSettings[0]?.name || 'tagWrapper');

// 切换标签页
const switchTab = (tabName: string) => {
  activeTab.value = tabName;
};

// 测试用的响应式数据
const testEnabled = ref(true);
const testText = ref('');
const testSelect = ref('option1');
const testOptions: DropdownOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

// 这些弹窗演示功能已经移动到了独立的DemoModalComponent组件中

/**
 * 处理Tag Wrapper设置变更
 */
const handleTagWrapperSettingsChanged = (settings: any) => {
  console.log('Tag Wrapper settings changed:', settings);
  // 这里可以添加额外的处理逻辑
};
</script>

<style scoped>
.vue-settings-container {
  padding: 16px;
}

.settings-placeholder {
  /* Remove the old placeholder styles since we're using proper components now */
}

.test-components {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.component-demo {
  padding: 12px;
  background: var(--background-secondary);
  border-radius: 4px;
}

.component-demo h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--text-normal);
}

.button-group {
  display: flex;
  gap: 8px;
}

.status-text {
  font-weight: 500;
  color: var(--text-accent);
}

/* 弹窗表单样式已移动到DemoModalComponent中 */
</style> 