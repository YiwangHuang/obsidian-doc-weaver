<!--
  简化预览面板组件
  
  功能说明：
  - 显示预览内容的简单框
  - 标题显示在框的左上方，类似v-text-field的label
  - 无需类型分类，由调用方决定内容格式
  - 内容支持水平滚动，默认显示最右侧
  
  Props:
  - title: 预览标题，可选
  - content: 预览内容（任意格式）
-->
<template>
  <div class="preview-panel">
    <!-- 标题标签，位于左上角 -->
    <label v-if="title" class="preview-label">
      {{ title }}
    </label>
    
    <!-- 预览内容框 -->
    <div class="preview-box">
      <div ref="contentContainer" class="preview-scroll-container">
        <slot>
          <code class="preview-content">{{ content }}</code>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';

interface PreviewPanelProps {
  /** 预览标题 */
  title?: string;
  /** 预览内容 */
  content?: any;
}

const props = defineProps<PreviewPanelProps>();
const contentContainer = ref<HTMLElement>();

/**
 * 滚动到最右侧
 */
const scrollToRight = () => {
  if (contentContainer.value) {
    contentContainer.value.scrollLeft = contentContainer.value.scrollWidth;
  }
};

// 监听内容变化，自动滚动到最右侧
watch(() => props.content, async () => {
  await nextTick();
  scrollToRight();
}, { immediate: true });
</script>

<style scoped>
.preview-panel {
  position: relative;
  margin-bottom: 16px;
}

.preview-label {
  position: absolute;
  top: -8px;
  left: 12px;
  background: var(--background-primary);
  padding: 0 6px;
  font-size: 12px;
  color: var(--text-muted);
  z-index: 1;
  font-weight: 500;
}

.preview-box {
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background: var(--background-secondary);
  min-height: 40px;
  transition: border-color 0.2s ease;
  overflow: hidden; /* 防止内容溢出 */
}

.preview-box:hover {
  border-color: var(--interactive-hover);
}

.preview-scroll-container {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 12px;
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb-bg) transparent;
}

.preview-scroll-container::-webkit-scrollbar {
  height: 6px;
}

.preview-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.preview-scroll-container::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb-bg);
  border-radius: 3px;
}

.preview-scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: var(--scrollbar-thumb-bg-hover);
}

.preview-content {
  font-family: var(--font-monospace);
  font-size: 0.9em;
  color: var(--text-normal);
  background: transparent;
  white-space: nowrap; /* 防止换行，强制水平滚动 */
  display: inline-block;
  margin: 0;
  padding: 0;
  min-width: max-content; /* 确保内容不被压缩 */
}
</style> 