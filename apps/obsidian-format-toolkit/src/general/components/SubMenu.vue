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

    <!-- 子菜单内容（横竖排可切换） -->
    <div class="submenu-container-vertical">
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
/* 子菜单容器样式（横排），复现主工具栏的横向布局 */
.submenu-container-horizontal {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 2px;
  padding: 3px;
  min-width: fit-content;
  width: auto;
  height: auto;
  background-color: var(--background-primary-alt);
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-s);
  border: 1px solid var(--background-modifier-border);
  z-index: var(--layer-modal);
}

/* 子菜单容器样式（竖排） */
.submenu-container-vertical {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  padding: 3px;
  background-color: var(--background-primary-alt);
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-s);
  border: 1px solid var(--background-modifier-border);
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