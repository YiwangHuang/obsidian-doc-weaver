<template>
  <div class="vue-settings-container">
    <h2>Vue Settings Panel</h2>
    
    <!-- 使用新的标签页组件 -->
    <SettingsTabs
      :tabs="tabs"
      :active-tab="activeTab"
      :on-tab-change="switchTab"
    />
    
    <!-- 使用新的设置面板组件 -->
    <SettingsPanel :save-state="saveState">
      <!-- 这里将在后续阶段添加具体的设置组件 -->
      <div class="settings-placeholder">
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
            <p>Available Tabs: {{ tabs.map(t => t.name).join(', ') }}</p>
            <p>Test Enabled: {{ testEnabled }}</p>
            <p>Test Text: {{ testText || '(empty)' }}</p>
            <p>Test Select: {{ testSelect }}</p>
          </template>
        </ConfigurationItem>

        <!-- 演示弹窗组件 -->
        <ConfigurationItemWithObsidianModal
          title="弹窗设置演示"
          description="点击'高级设置'按钮打开弹窗进行详细配置"
          modal-title="高级配置选项"
          :has-unsaved-changes="modalHasChanges"
          :obsidian-app="plugin.app"
          @modal-save="handleModalSave"
          @modal-reset="handleModalReset"
          @modal-open="handleModalOpen"
          @modal-close="handleModalClose"
        >
          <template #control>
            <ToggleSwitch v-model="modalMainEnabled" />
          </template>
          
          <template #details>
            <p>主要功能已{{ modalMainEnabled ? '启用' : '禁用' }}</p>
            <p>高级配置项数量: {{ modalConfig.items.length }}</p>
          </template>

          <template #modal-content>
            <div class="modal-form">
              <ConfigurationItem
                title="高级功能1"
                description="这是一个复杂的设置项，需要在弹窗中进行配置"
              >
                <template #control>
                  <ToggleSwitch v-model="modalConfig.feature1" @update:model-value="markModalChanged" />
                </template>
                <template #details>
                  <div v-if="modalConfig.feature1" class="feature-details">
                    <div class="form-group">
                      <label>配置值1:</label>
                      <TextInput
                        v-model="modalConfig.value1"
                        placeholder="输入配置值..."
                        @update:model-value="markModalChanged"
                      />
                    </div>
                    <div class="form-group">
                      <label>选择模式:</label>
                      <Dropdown
                        v-model="modalConfig.mode1"
                        :options="modalModeOptions"
                        @update:model-value="markModalChanged"
                      />
                    </div>
                  </div>
                </template>
              </ConfigurationItem>

              <ConfigurationItem
                title="高级功能2"
                description="另一个复杂设置，包含多个子选项"
              >
                <template #control>
                  <ToggleSwitch v-model="modalConfig.feature2" @update:model-value="markModalChanged" />
                </template>
                <template #details>
                  <div v-if="modalConfig.feature2" class="feature-details">
                    <div class="form-group">
                      <label>详细描述:</label>
                      <TextArea
                        v-model="modalConfig.description"
                        placeholder="输入详细描述..."
                        :rows="4"
                        @update:model-value="markModalChanged"
                      />
                    </div>
                    <div class="form-group">
                      <label>优先级:</label>
                      <Dropdown
                        v-model="modalConfig.priority"
                        :options="modalPriorityOptions"
                        @update:model-value="markModalChanged"
                      />
                    </div>
                  </div>
                </template>
              </ConfigurationItem>

              <ConfigurationItem
                title="项目列表"
                description="动态管理配置项列表"
              >
                <template #control>
                  <Button
                    variant="secondary"
                    size="small"
                    @click="addModalItem"
                  >
                    添加项目
                  </Button>
                </template>
                <template #details>
                  <div class="items-list">
                    <div
                      v-for="(item, index) in modalConfig.items"
                      :key="index"
                      class="item-row"
                    >
                      <TextInput
                        v-model="item.name"
                        placeholder="项目名称..."
                        @update:model-value="markModalChanged"
                      />
                      <Button
                        variant="danger"
                        size="small"
                        @click="removeModalItem(index)"
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </template>
              </ConfigurationItem>
            </div>
          </template>
        </ConfigurationItemWithObsidianModal>
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

// 当前活跃的标签页
const activeTab = ref(props.moduleSettings[0]?.name || '');

// 计算属性：获取标签页列表
const tabs = computed(() => props.moduleSettings);

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

// 弹窗演示相关数据
const modalMainEnabled = ref(true);
const modalHasChanges = ref(false);
const modalConfig = ref({
  feature1: false,
  value1: '',
  mode1: 'auto',
  feature2: false,
  description: '',
  priority: 'medium',
  items: [
    { name: 'Default Item 1' },
    { name: 'Default Item 2' }
  ]
});

// 弹窗下拉选项
const modalModeOptions: DropdownOption[] = [
  { value: 'auto', label: '自动模式' },
  { value: 'manual', label: '手动模式' },
  { value: 'advanced', label: '高级模式' },
];

const modalPriorityOptions: DropdownOption[] = [
  { value: 'low', label: '低优先级' },
  { value: 'medium', label: '中优先级' },
  { value: 'high', label: '高优先级' },
  { value: 'critical', label: '紧急' },
];

// 弹窗相关方法
const markModalChanged = () => {
  modalHasChanges.value = true;
};

const handleModalSave = () => {
  console.log('Modal save:', modalConfig.value);
  // 模拟保存过程
  setTimeout(() => {
    modalHasChanges.value = false;
  }, 1000);
};

const handleModalReset = () => {
  modalConfig.value = {
    feature1: false,
    value1: '',
    mode1: 'auto',
    feature2: false,
    description: '',
    priority: 'medium',
    items: [
      { name: 'Default Item 1' },
      { name: 'Default Item 2' }
    ]
  };
  modalHasChanges.value = false;
};

const handleModalOpen = () => {
  console.log('Modal opened');
};

const handleModalClose = () => {
  console.log('Modal closed');
};

const addModalItem = () => {
  modalConfig.value.items.push({ name: `New Item ${modalConfig.value.items.length + 1}` });
  markModalChanged();
};

const removeModalItem = (index: number) => {
  modalConfig.value.items.splice(index, 1);
  markModalChanged();
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

/* 弹窗表单样式 */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.feature-details {
  margin-top: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-normal);
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-row .text-input {
  flex: 1;
}
</style> 