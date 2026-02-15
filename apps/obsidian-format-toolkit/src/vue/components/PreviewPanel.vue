<!--
  预览面板组件（基于 Vuetify v-text-field）
  
  功能说明：
  - 只读展示预览内容，不可编辑、不可聚焦
  - 强调色边框 + 弱化强调色填充 + 强调色 label
  - Props 与旧版一致，调用方无需修改
  
  Props:
  - title: 预览标题，可选（对应 v-text-field 的 label）
  - content: 预览内容（任意格式，转为字符串显示）
-->
<template>
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
</template>

<script setup lang="ts">
interface PreviewPanelProps {
  /** 预览标题 */
  title?: string;
  /** 预览内容 */
  content?: any;
}

defineProps<PreviewPanelProps>();
</script>

<style scoped>
/* 禁用一切交互态（hover / focus / click） */
.preview-field {
  pointer-events: none;
  margin-bottom: 16px;
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
</style>
