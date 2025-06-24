<!--
  简单演示组件
  
  功能说明：
  - 最简单的响应式输入框演示
  - 直接在页面上显示，不使用弹窗
  - 实时显示输入内容
  
  配置项：
  Props:
  - plugin: Obsidian插件实例 (MyPlugin) 必需
-->
<template>
  <div class="demo-container">
    <div class="demo-header">
      <h3>简单响应式演示</h3>
      <p class="demo-description">
        最简单的Vue响应式输入框测试，直接在页面显示。
      </p>
    </div>

    <!-- 直接的输入框演示 -->
    <ConfigurationItem
      title="响应式输入测试"
      description="在下面的输入框中输入文字，会实时更新预览内容"
    >
      <template #control>
        <div class="demo-status">
          <span class="current-text">当前: {{ inputText || '(空)' }}</span>
        </div>
      </template>
      
      <template #details>
        <div class="demo-form">
          <div class="form-group">
            <label>测试输入框：</label>
            <TextInput
              v-model="inputText"
              placeholder="在这里输入文字，会实时更新..."
            />
          </div>
          
          <div class="preview-section">
            <h4>实时预览</h4>
            <div class="preview-box">
              <p><strong>输入内容：</strong>"{{ inputText }}"</p>
              <p><strong>字符长度：</strong>{{ inputText.length }}</p>
              <p><strong>是否为空：</strong>{{ inputText.length === 0 ? '是' : '否' }}</p>
              <p><strong>时间戳：</strong>{{ lastUpdate }}</p>
            </div>
          </div>
        </div>
      </template>
    </ConfigurationItem>

    <!-- 弹窗测试 -->
    <ConfigurationItemWithObsidianModal
      title="弹窗输入测试"
      description="点击按钮测试弹窗中的响应式输入框"
      modal-title="弹窗输入测试"
      modal-button-text="打开弹窗"
      modal-button-tooltip="点击测试弹窗"
      :obsidian-app="plugin.app"
    >
      <template #control>
        <div class="demo-status">
          <span class="current-text">弹窗输入: {{ modalText || '(空)' }}</span>
        </div>
      </template>
      
      <template #details>
        <div class="demo-summary">
          <p><strong>基础文本：</strong>{{ modalText || '(无)' }}</p>
          <p><strong>邮箱：</strong>{{ emailText || '(无)' }}</p>
          <p><strong>数字：</strong>{{ numberText || '(无)' }}</p>
          <p><strong>密码：</strong>{{ passwordText ? '●'.repeat(passwordText.length) : '(无)' }}</p>
          <p><strong>多行文本：</strong>{{ textareaText ? (textareaText.length > 20 ? textareaText.substring(0, 20) + '...' : textareaText) : '(无)' }}</p>
          <p><strong>选择项：</strong>{{ selectedOption ? dropdownOptions.find(opt => opt.value === selectedOption)?.label : '(无)' }}</p>
          <p><strong>开关：</strong>{{ toggleValue ? '开启' : '关闭' }}</p>
          <p><strong>总字符数：</strong>{{ totalCharCount }}</p>
        </div>
      </template>

      <template #modal-content>
        <div class="modal-form">
          <div class="form-group">
            <label>基础文本输入框：</label>
            <TextInput
              v-model="modalText"
              placeholder="在弹窗中输入文字..."
            />
          </div>

          <div class="form-group">
            <label>邮箱输入框：</label>
            <TextInput
              v-model="emailText"
              type="email"
              placeholder="输入邮箱地址..."
            />
          </div>

          <div class="form-group">
            <label>数字输入框：</label>
            <TextInput
              v-model="numberText"
              type="number"
              placeholder="输入数字..."
            />
          </div>

          <div class="form-group">
            <label>密码输入框：</label>
            <TextInput
              v-model="passwordText"
              type="password"
              placeholder="输入密码..."
            />
          </div>

          <div class="form-group">
            <label>多行文本框：</label>
            <TextArea
              v-model="textareaText"
              placeholder="输入多行文本..."
              :rows="3"
            />
          </div>

          <div class="form-group">
            <label>下拉选择框：</label>
            <Dropdown
              v-model="selectedOption"
              :options="dropdownOptions"
            />
          </div>

          <div class="form-group">
            <label>开关控制：</label>
            <ToggleSwitch v-model="toggleValue" />
          </div>
          
          <div class="preview-section">
            <h4>弹窗实时预览</h4>
            <div class="preview-box">
              <p><strong>基础文本：</strong>"{{ modalText }}"</p>
              <p><strong>邮箱：</strong>"{{ emailText }}"</p>
              <p><strong>数字：</strong>"{{ numberText }}"</p>
              <p><strong>密码：</strong>"{{ passwordText ? '●'.repeat(passwordText.length) : '(空)' }}"</p>
              <p><strong>多行文本：</strong>"{{ textareaText }}"</p>
              <p><strong>选择项：</strong>{{ selectedOption ? dropdownOptions.find(opt => opt.value === selectedOption)?.label : '(无)' }}</p>
              <p><strong>开关状态：</strong>{{ toggleValue ? '开启' : '关闭' }}</p>
              <p><strong>总字符数：</strong>{{ totalCharCount }}</p>
              <p><strong>更新时间：</strong>{{ modalUpdateTime }}</p>
            </div>
          </div>

          <div class="form-group">
            <label>操作按钮：</label>
            <div class="button-group">
              <Button
                variant="primary"
                size="small"
                @click="clearAllInputs"
              >
                清空所有
              </Button>
              <Button
                variant="secondary"
                size="small"
                @click="fillSampleData"
              >
                填充示例
              </Button>
              <Button
                variant="ghost"
                size="small"
                @click="logModalData"
              >
                输出数据
              </Button>
            </div>
          </div>
        </div>
      </template>
    </ConfigurationItemWithObsidianModal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type MyPlugin from '../../main';
import ConfigurationItem from './ConfigurationItem.vue';
import ConfigurationItemWithObsidianModal from './ConfigurationItemWithObsidianModal.vue';
import TextInput from './TextInput.vue';
import TextArea from './TextArea.vue';
import Dropdown from './Dropdown.vue';
import ToggleSwitch from './ToggleSwitch.vue';
import Button from './Button.vue';
import type { DropdownOption } from './Dropdown.vue';

// 组件属性接口定义
interface DemoModalProps {
  /** Obsidian插件实例，用于访问app等核心功能 */
  plugin: MyPlugin;
}

// 接收props
const props = defineProps<DemoModalProps>();

// 响应式数据 - 页面输入
const inputText = ref('');
const lastUpdate = ref('');

// 响应式数据 - 弹窗输入
const modalText = ref('');
const emailText = ref('');
const numberText = ref('');
const passwordText = ref('');
const textareaText = ref('');
const selectedOption = ref('');
const toggleValue = ref(false);
const modalUpdateTime = ref('');

// 下拉选项数据
const dropdownOptions: DropdownOption[] = [
  { value: '', label: '请选择...' },
  { value: 'option1', label: '选项 1' },
  { value: 'option2', label: '选项 2' },
  { value: 'option3', label: '选项 3' },
  { value: 'custom', label: '自定义选项' }
];

// 计算属性 - 总字符数
const totalCharCount = computed(() => {
  return modalText.value.length + 
         emailText.value.length + 
         numberText.value.length + 
         passwordText.value.length + 
         textareaText.value.length;
});

// 监听输入变化，更新时间戳
watch(inputText, () => {
  lastUpdate.value = new Date().toLocaleTimeString();
});

// 监听弹窗输入变化
watch([modalText, emailText, numberText, passwordText, textareaText, selectedOption, toggleValue], () => {
  modalUpdateTime.value = new Date().toLocaleTimeString();
});

// 弹窗操作方法
const clearAllInputs = () => {
  modalText.value = '';
  emailText.value = '';
  numberText.value = '';
  passwordText.value = '';
  textareaText.value = '';
  selectedOption.value = '';
  toggleValue.value = false;
};

const fillSampleData = () => {
  modalText.value = '示例文本内容';
  emailText.value = 'example@email.com';
  numberText.value = '42';
  passwordText.value = 'password123';
  textareaText.value = '这是一个多行文本的示例\n包含换行符\n用于演示文本区域组件';
  selectedOption.value = 'option2';
  toggleValue.value = true;
};

const logModalData = () => {
  const data = {
    基础文本: modalText.value,
    邮箱: emailText.value,
    数字: numberText.value,
    密码: passwordText.value,
    多行文本: textareaText.value,
    选择项: selectedOption.value,
    开关状态: toggleValue.value,
    总字符数: totalCharCount.value,
    更新时间: modalUpdateTime.value
  };
  console.log('=== 弹窗数据 ===', data);
};
</script>

<style scoped>
.demo-container {
  padding: 16px 0;
}

.demo-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--interactive-accent);
}

.demo-header h3 {
  margin: 0 0 8px 0;
  color: var(--text-normal);
  font-size: 18px;
  font-weight: 600;
}

.demo-description {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.4;
}

.demo-status {
  display: flex;
  align-items: center;
}

.current-text {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}

.demo-summary {
  padding: 12px 0;
}

.demo-summary p {
  margin: 0 0 8px 0;
  color: var(--text-normal);
  font-weight: 500;
}

.demo-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px 0;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px 0;
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

.preview-section {
  margin-top: 16px;
}

.preview-section h4 {
  margin: 0 0 12px 0;
  color: var(--text-normal);
  font-size: 14px;
  font-weight: 600;
}

.preview-box {
  padding: 16px;
  background: var(--background-secondary);
  border-radius: 6px;
  border-left: 4px solid var(--interactive-accent);
}

.preview-box p {
  margin: 0 0 8px 0;
  color: var(--text-normal);
  font-size: 13px;
}

.preview-box p:last-child {
  margin-bottom: 0;
}

.button-group {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
</style> 