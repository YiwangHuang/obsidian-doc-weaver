<template>
  <!--
    图标选择按钮组件
    - 点击按钮后打开图标选择器
    - 选择成功后将图标名称写入传入的 command.icon
  -->
  <v-btn size="small" class="me-2 icon-btn-square" @click="handleSelectIcon">
    <Icon :name="props.command.icon || 'file'" />
  </v-btn>
  
</template>

<script setup lang="ts">
import type { App as ObsidianApp } from 'obsidian';
import Icon from './Icon.vue';
import { openIconSelector } from '../../lib/iconUtils';
import type { ToolbarItemConfig } from '../../general/types';

/**
 * 组件属性：
 * - app: Obsidian 应用实例
 * - command: 工具栏命令对象（会原地修改其 icon 字段）
 */
interface Props {
  app: ObsidianApp;
  command: ToolbarItemConfig;
}

const props = defineProps<Props>();

/**
 * 打开图标选择器并将结果写回 command.icon
 */
const handleSelectIcon = async () => {
  const iconName = await openIconSelector(props.app);
  if (iconName) {
    props.command.icon = iconName;
  }
};
</script>

<style scoped>
/* 与父级保持一致的正方形按钮尺寸 */
</style>


