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
    <div class="demo-header">
      <h3>基础组件演示</h3>
      <p class="demo-description">
        演示基础输入组件和弹窗交互。
      </p>
    </div>

    <!-- 基础输入演示 -->
    <div class="demo-section">
      <div class="section-header">
        <h4>输入演示</h4>
        <p class="section-desc">输入文字查看实时更新效果</p>
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
      <div class="section-header">
        <h4>样式演示</h4>
        <p class="section-desc">基础样式和交互效果</p>
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
      <div class="section-header">
        <h4>弹窗演示</h4>
        <p class="section-desc">点击按钮打开弹窗</p>
      </div>
      
      <div class="section-content">
        <Button
          variant="primary"
          @click="openModal"
        >
          打开弹窗
        </Button>
      </div>
    </div>

    <!-- 演示弹窗 -->
    <ObsidianVueModal
      v-model:visible="modalVisible"
      :obsidian-app="plugin.app"
      title="演示弹窗"
    >
      <div class="modal-content">
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
import ObsidianVueModal from './ObsidianVueModal.vue';

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
</script>

<style scoped>
.demo-container {
  padding: 16px 0;
}

.demo-header {
  margin-bottom: 24px;
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
}

.demo-section {
  padding: 16px 0;
  border-bottom: 1px solid var(--background-modifier-border);
}

.demo-section:last-child {
  border-bottom: none;
}

.section-header {
  margin-bottom: 16px;
}

.section-header h4 {
  margin: 0 0 4px 0;
  color: var(--text-normal);
  font-size: 16px;
  font-weight: 500;
}

.section-desc {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
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
</style> 