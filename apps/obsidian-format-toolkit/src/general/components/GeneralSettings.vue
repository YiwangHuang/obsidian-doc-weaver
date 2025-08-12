<template>
  <v-container fluid class="pa-0">
    <!-- 模块头部 -->
    <div>
      <h3 class="my-2">{{ getLocalizedText({ en: "General Settings", zh: "通用设置" }) }}</h3>
      <p class="text-medium-emphasis my-2">
        {{ getLocalizedText({ en: "Configure general functionality", zh: "配置通用功能" }) }}
      </p>
    </div>
    
    <!-- SpeedDial 显示控制 -->
    <div class="setting-item d-flex align-center mt-4">
      <div class="flex-grow-1">
        <div class="text-subtitle-2 font-weight-medium">
          {{ getLocalizedText({ en: "Show SpeedDial Button", zh: "显示悬浮按钮" }) }}
        </div>
        <div class="text-caption text-medium-emphasis">
          {{ getLocalizedText({ en: "Display a floating action button in the editor", zh: "在编辑器中显示一个悬浮的快捷操作按钮" }) }}
        </div>
      </div>
      <v-switch
        v-model="configs.showToolBar"
        hide-details
        density="compact"
      />
    </div>

    <!-- 分割线 -->
    <v-divider class="my-6" />

    <!-- 额外命令管理 -->
    <ExtraCommandSettings
      :plugin="props.plugin"
    />
  </v-container>
</template>

<script setup lang="ts">
/**
 * General 模块设置组件
 * 提供通用模块的配置界面
 */

import type MyPlugin from '../../main';
import type { GeneralSettings } from '../index';
import { getLocalizedText } from '../../lib/textUtils';
import { generalInfo } from '../index';
import ExtraCommandSettings from './ExtraCommandSettings.vue';

interface GeneralSettingsProps {
  plugin: MyPlugin;
}

const props = defineProps<GeneralSettingsProps>();

// 初始化设置
const configs = props.plugin.settingList[generalInfo.name] as GeneralSettings;
</script>

<style scoped>
/* 使用Vuetify内置样式，无需额外CSS */
</style>