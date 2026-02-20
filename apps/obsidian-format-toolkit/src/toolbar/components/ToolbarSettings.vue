<template>
  <v-container fluid class="pa-0">
    <!-- 模块头部 -->
    <!-- <div class="text-subtitle-1 font-weight-medium">{{ getLocalizedText({ en: "Toolbar Settings", zh: "工具栏设置" }) }}</div>

    <v-divider class="border-opacity-100 my-3"/> -->

    <!-- SpeedDial 显示控制 -->
    <div class="d-flex align-center my-2">
      <div class="flex-grow-1">
        <div class="text-subtitle-2 font-weight-medium">
          {{ getLocalizedText({ en: "Show Toolbar", zh: "显示悬浮工具栏" }) }}
        </div>
        <div class="text-caption text-medium-emphasis">
          {{ getLocalizedText({ en: "Display a floating toolbar in the editor", zh: "在编辑器中显示一个悬浮的快捷操作工具栏" }) }}
        </div>
      </div>
      <v-switch
        v-model="configs.showToolBar"
        hide-details
        density="compact"
      />
    </div>

    <!-- 分割线 -->
    <v-divider class="border-opacity-100 my-2" />

    <!-- 额外命令管理 -->
    <ExtraCommandSettings class="my-2"
      :plugin="props.plugin"
    />
  </v-container>
</template>

<script setup lang="ts">
/**
 * Toolbar 模块设置组件
 * 提供通用模块的配置界面
 */

import type MyPlugin from '../../main';
import type { ToolbarSettings } from '../index';
import { getLocalizedText } from '../../lib/textUtils';
import { toolbarInfo } from '../index';
import ExtraCommandSettings from './ExtraCommandSettings.vue';

interface ToolbarSettingsProps {
  plugin: MyPlugin;
}

const props = defineProps<ToolbarSettingsProps>();

// 初始化设置
const configs = props.plugin.settingList[toolbarInfo.name] as ToolbarSettings;
</script>

<style scoped>
/* 使用Vuetify内置样式，无需额外CSS */
</style>