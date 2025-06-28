<!--
  简化演示组件
  
  功能说明：
  - 简单的响应式输入框演示
  - 基础样式展示
  - 弹窗交互演示
  
  配置项：
  Props:
  - plugin: Obsidian插件实例 (MyPlugin) 必需
-->
<template>
  <div class="demo-container">
    <div class="module-header">
      <h3>基础组件演示</h3>
      <p class="module-description">
        演示基础输入组件和弹窗交互。
      </p>
    </div>

    <!-- 基础输入演示 -->
    <div class="demo-section">
      <div class="module-header">
        <h4>输入演示</h4>
        <p class="module-description">输入文字查看实时更新效果</p>
      </div>
      
      <div class="section-content">
        <TextInput
          v-model="inputText"
          placeholder="输入文字..."
        />
        
        <div class="preview-box">
          <p><strong>输入内容：</strong>{{ inputText || '(空)' }}</p>
          <p><strong>字符数：</strong>{{ inputText.length }}</p>
        </div>
      </div>
    </div>

    <!-- 样式演示 -->
    <div class="demo-section">
      <div class="module-header">
        <h4>样式演示</h4>
        <p class="module-description">基础样式和交互效果</p>
      </div>
      
      <div class="section-content">
        <div class="style-grid">
          <div class="style-item primary">
            <p>主要样式</p>
          </div>
          <div class="style-item secondary">
            <p>次要样式</p>
          </div>
          <div class="style-item accent">
            <p>强调样式</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗演示 -->
    <div class="demo-section">
      <div class="module-header">
        <h4>弹窗演示</h4>
        <p class="module-description">点击按钮打开弹窗</p>
      </div>
      
      <div class="section-content">
        <Button @click="showModal">打开弹窗</Button>
      </div>
    </div>

    <!-- 分栏布局演示 -->
    <div class="demo-section">
      <div class="module-header">
        <h4>分栏布局演示</h4>
        <p class="module-description">展示不同比例和对齐方式的分栏布局</p>
      </div>
      <div class="section-content">
        <!-- 2:3比例的左右分栏 -->
        <div class="demo-block">
          <h5>2:3 左右分栏</h5>
          <MultiColumn :columns="[
            { width: 2, align: 'left', content: '左栏内容 (2/5宽度)' },
            { width: 3, align: 'right', content: '右栏内容 (3/5宽度)' }
          ]" />
        </div>

        <!-- 1:1:1等宽三栏 -->
        <div class="demo-block">
          <h5>等宽三栏</h5>
          <MultiColumn :columns="[
            { width: 1, align: 'left', content: '左栏' },
            { width: 1, align: 'center', content: '中栏' },
            { width: 1, align: 'right', content: '右栏' }
          ]" />
        </div>

        <!-- 1:2:1不等宽三栏 -->
        <div class="demo-block">
          <h5>1:2:1 三栏</h5>
          <MultiColumn :columns="[
            { width: 1, align: 'left', content: '左栏 (1/4宽度)' },
            { width: 2, align: 'center', content: '中栏 (2/4宽度)' },
            { width: 1, align: 'right', content: '右栏 (1/4宽度)' }
          ]" />
        </div>
      </div>
    </div>

    <!-- 演示弹窗 -->
    <ObsidianVueModal
      v-model:visible="modalVisible"
      :obsidian-app="plugin.app"
    >
      <div class="modal-content">
        <h2 class="modal-title">演示弹窗</h2>
        <h4>弹窗内容</h4>
        <p>这是一个基础的弹窗演示。</p>
        <p>当前输入：{{ inputText || '(空)' }}</p>
        
        <div class="modal-actions">
          <Button
            variant="secondary"
            @click="modalVisible = false"
          >
            关闭
          </Button>
        </div>
      </div>
    </ObsidianVueModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type MyPlugin from '../../main';
import TextInput from './TextInput.vue';
import Button from './Button.vue';
import TextArea from './TextArea.vue';
import Dropdown from './Dropdown.vue';
import ToggleSwitch from './ToggleSwitch.vue';
import ObsidianVueModal from './ObsidianVueModal.vue';
import MultiColumn from './MultiColumn.vue';

// 组件属性接口定义
interface DemoModalProps {
  plugin: MyPlugin;
}

// 接收props
const props = defineProps<DemoModalProps>();

// 响应式数据
const inputText = ref('');
const modalVisible = ref(false);

// 打开弹窗
const openModal = () => {
  modalVisible.value = true;
};

// 新增的 showModal 函数
const showModal = () => {
  modalVisible.value = true;
};
</script>

<style scoped>
@import '../shared-styles.css';

.demo-container {
  padding: 16px 0;
}

.demo-section {
  padding: 16px 0;
  border-bottom: 1px solid var(--background-modifier-border);
}

.demo-section:last-child {
  border-bottom: none;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-box {
  padding: 12px;
  background: var(--background-secondary);
  border-radius: 4px;
}

.preview-box p {
  margin: 4px 0;
  font-size: 13px;
  color: var(--text-muted);
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.style-item {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.style-item p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: white;
}

.style-item.primary {
  background: var(--interactive-accent);
}

.style-item.secondary {
  background: var(--text-muted);
}

.style-item.accent {
  background: var(--text-accent);
}

.modal-content {
  padding: 16px;
}

.modal-content h4 {
  margin: 0 0 12px 0;
  color: var(--text-normal);
  font-size: 16px;
  font-weight: 600;
}

.modal-content p {
  margin: 0 0 8px 0;
  color: var(--text-muted);
  font-size: 14px;
}

.modal-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .demo-section {
    padding: 12px 0;
  }
  
  .style-grid {
    grid-template-columns: 1fr;
  }
}

/* 演示块样式 */
.demo-block {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 8px;
  background: var(--background-primary);
}

.demo-block:last-child {
  margin-bottom: 0;
}

.demo-block h5 {
  margin: 0 0 12px 0;
  color: var(--text-normal);
  font-size: 14px;
  font-weight: 500;
}

/* 分栏演示样式 */
.demo-block :deep(.column) {
  padding: 12px;
  background: var(--background-secondary);
  border-radius: 6px;
  font-size: 14px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .demo-block {
    padding: 12px;
  }
}
</style> 