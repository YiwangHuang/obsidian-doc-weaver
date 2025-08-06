<template>
  <!-- 工具栏按钮组件，复现原版 editingToolbarCommandItem 样式 -->
  <v-btn
    :class="buttonClasses"
    variant="text"
    size="small"
    density="compact"
    :ripple="false"
    @click="handleClick"
  >
    <!-- 图标内容 -->
    <template v-if="icon">
      <Icon :name="icon" />
    </template> 
    <template v-else>
      <span class="button-text">{{ name }}</span>
    </template>
  </v-btn>
</template>

<script setup lang="ts">
/**
 * ToolbarButton 工具栏按钮组件
 * 复现原版 Obsidian Editing Toolbar 的按钮样式和行为
 */

import { computed } from 'vue';
import Icon from '../../vue/components/Icon.vue';

// 组件属性定义
interface Props {
  id: string;
  name: string;
  icon?: string;
  iconHtml?: string;
  index?: number;
  isSecondRow?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  index: 0,
  isSecondRow: false
});

// 组件事件
const emit = defineEmits<{
  click: [id: string];
}>();

/**
 * 按钮CSS类名
 */
const buttonClasses = computed(() => {
  const classes = ['editing-toolbar-command-item', 'icon-btn-square'];
  
  if (props.isSecondRow) {
    classes.push('editing-toolbar-second');
  }
  
  return classes;
});

/**
 * 处理按钮点击
 */
const handleClick = () => {
  emit('click', props.id);
};
</script>

<style scoped>
/* 复现原版按钮样式 */
:deep(.editing-toolbar-command-item) {
  margin: 2px !important;
  border: none !important;
  display: flex !important;
  cursor: default !important;
  padding: 5px 6px !important;
  box-shadow: none !important;
  margin-left: 3px !important;
  margin-right: 3px !important;
  position: relative !important;
  border-radius: var(--radius-s) !important;
  font-size: initial !important;
  background-color: var(--background-primary-alt) !important;
  height: auto !important;
  min-height: unset !important;
  min-width: unset !important;
  width: auto !important;
}

/* 悬停效果 */
:deep(.editing-toolbar-command-item:hover) {
  background-color: var(--background-modifier-hover) !important;
}

/* 按钮文本样式 */
.button-text {
  font-size: 12px;
  color: var(--text-normal);
}

/* 移除Vuetify默认样式 */
:deep(.v-btn__content) {
  opacity: 1 !important;
}

:deep(.v-btn__overlay) {
  display: none !important;
}
</style>