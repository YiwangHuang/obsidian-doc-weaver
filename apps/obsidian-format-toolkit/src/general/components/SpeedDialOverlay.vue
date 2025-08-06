<template>
  <!-- 
    编辑工具栏：复现 Obsidian Editing Toolbar 的视觉效果
    使用新的 EditingToolbar 组件
  -->
  <EditingToolbar
    :visible="isVisible"
    @button-click="handleButtonClick"
    @position-change="handlePositionChange"
  />
</template>

<script setup lang="ts">
/**
 * SpeedDialOverlay 组件（现在使用 Obsidian Editing Toolbar 设计）
 * 复现原版 Obsidian Editing Toolbar 的视觉效果和功能
 */

import { ref } from 'vue';
import EditingToolbar from './EditingToolbar.vue';

// 工具栏状态
const isVisible = ref(true);

/**
 * 处理按钮点击事件
 */
const handleButtonClick = (id: string) => {
  console.log(`工具栏按钮点击: ${id}`);
  // 这里可以集成到具体的命令执行逻辑
};

/**
 * 处理位置变化事件
 */
const handlePositionChange = (x: number, y: number) => {
  console.log(`工具栏位置变化: (${x}, ${y})`);
  // 这里可以保存位置设置到本地存储
};
</script>

<style scoped>
/* 样式现在由 EditingToolbar 组件和 shared-styles.css 管理 */
</style>