<template>
  <!-- 工具栏按钮组件，复现原版 editingToolbarCommandItem 样式 -->
  <div v-if="icon">
  <v-tooltip :text="name" location="top" :open-delay="500">
    <template #activator="{ props }"> 
      <v-btn
        v-bind="props"
        :class="buttonClasses"
        @click="handleClick"
      >
        <!-- 图标内容 -->
        <Icon :name="icon" />
      </v-btn>
    </template>
  </v-tooltip>
</div>
<div v-else>
  <v-btn
    :class="buttonClasses"
    @click="handleClick"
  >
    <span class="button-text">{{ name }}</span>
  </v-btn>
</div>
</template>

<script setup lang="ts">
/**
 * ToolbarButton 工具栏按钮组件
 * 复现原版 Obsidian Editing Toolbar 的按钮样式和行为
 */

import { computed, ref } from 'vue';
import Icon from '../../vue/components/Icon.vue';

// 组件属性定义
interface Props {
  id: string;
  name: string;
  icon?: string;
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
  const classes = ['editing-toolbar-command-item'];

  if (props.icon) {
    classes.push('icon-btn-square');
  }

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