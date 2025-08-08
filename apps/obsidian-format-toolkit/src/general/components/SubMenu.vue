<template>
  <!-- 子菜单组件，基于 v-menu 实现悬停显示 -->
  <v-menu
    v-model="isOpen"
    open-on-hover
    :close-delay="50"
    :open-delay="20"
    location="bottom center"
    :offset="2"
    transition="slide-y-transition"
  >
    <template #activator="{ props: menuProps }">
      <!-- 激活器插槽，由父组件传入 -->
      <slot name="activator" :props="menuProps" />
    </template>

    <!-- 子菜单内容 -->
    <div class="submenu-container">
      <ToolbarButton
        v-for="item in items"
        :key="item.commandId || item.name"
        :item="item"
      />
    </div>
  </v-menu>
</template>

<script setup lang="ts">
/**
 * SubMenu 子菜单组件
 * 基于 v-menu 实现悬停显示的多级菜单
 */

import { ref } from 'vue';
import type { ToolbarItem } from '../types';
import ToolbarButton from './ToolbarButton.vue';

// 组件属性
interface Props {
  items: ToolbarItem[];
}

defineProps<Props>();

// 菜单状态
const isOpen = ref(false);
</script>

<style scoped>
/* 子菜单容器样式，完全复现主工具栏的横排布局 */
.submenu-container {
  /* 横排布局 - 与主工具栏一致 */
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 2px;
  
  /* 尺寸和间距 */
  padding: 3px;
  min-width: fit-content;
  width: auto;
  height: auto;
  
  /* 视觉效果 - 与主工具栏一致 */
  background-color: var(--background-primary-alt);
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-s);
  border: 1px solid var(--background-modifier-border);
  
  /* 层级 */
  z-index: var(--layer-modal);
}

/* 移除 v-menu 默认样式影响 */
:deep(.v-overlay__content) {
  box-shadow: none !important;
  background: transparent !important;
}

/* 
  移除所有子菜单按钮的自定义样式覆盖
  让子菜单按钮完全使用全局的 .editing-toolbar-command-item 样式
  这样确保与主工具栏按钮样式完全一致
*/
</style>