<!--
  预览面板组件（基于 Vuetify v-text-field）
  
  功能说明：
  - 只读展示预览内容，不可编辑、不可聚焦
  - 强调色边框 + 弱化强调色填充 + 强调色 label
  - Props 与旧版一致，调用方无需修改
  - 支持默认插槽：当提供插槽内容时，插槽 HTML 会覆盖显示在输入区域上方
  
  Props:
  - title: 预览标题，可选（对应 v-text-field 的 label）
  - content: 预览内容（任意格式，转为字符串显示；使用插槽时可省略）
-->
<template>
  <!-- 外层容器，用于相对定位插槽覆盖层 -->
  <div class="preview-panel-wrapper">
    <v-text-field
      :model-value="String(content ?? '')"
      :label="title"
      variant="outlined"
      density="compact"
      readonly
      tabindex="-1"
      hide-details
      class="preview-field"
    />
    <!-- 默认插槽：覆盖显示在组件内容区域上方 -->
    <div v-if="hasSlotContent" class="preview-slot-overlay">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';

interface PreviewPanelProps {
  /** 预览标题 */
  title?: string;
  /** 预览内容（使用插槽时可省略） */
  content?: any;
}

defineProps<PreviewPanelProps>();

const slots = useSlots();

/** 检测默认插槽是否提供了内容 */
const hasSlotContent = computed(() => !!slots.default);
</script>

<style scoped>
/* 外层容器，建立定位上下文 */
.preview-panel-wrapper {
  position: relative;
  margin-bottom: 16px;
}

/* 禁用一切交互态（hover / focus / click） */
.preview-field {
  pointer-events: none;
}

/* 弱化强调色填充背景 */
.preview-field :deep(.v-field) {
  background: color-mix(in srgb, var(--interactive-accent) 22%, transparent) !important;
}

/* 强调色边框 */
.preview-field :deep(.v-field__outline) {
  --v-field-border-opacity: 1;
  color: var(--interactive-accent) !important;
}

/* 强调色 label */
.preview-field :deep(.v-label) {
  color: var(--interactive-accent) !important;
  opacity: 1 !important;
}

/* 插槽覆盖层：绝对定位覆盖在输入区域上方 */
/* 插槽内容保留正常交互（cursor: pointer 等），仅底层 v-text-field 禁用交互 */
.preview-slot-overlay {
  position: absolute;
  /* 跳过 label 区域，覆盖输入内容区 */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 4px 12px;
  overflow: hidden;
}
</style>
