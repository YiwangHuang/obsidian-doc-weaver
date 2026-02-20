<template>
  <v-container fluid class="pa-0">
    <!-- 模块头部：仅用于展示占位信息 -->
    <div class="my-2">
      <div class="text-subtitle-2 font-weight-medium">
        {{ getLocalizedText({ en: "General", zh: "通用" }) }}
      </div>
      <p class="text-caption text-medium-emphasis">
        {{ getLocalizedText({
          en: "This is a placeholder settings page with no configurable options yet.",
          zh: "这是一个占位用的设置页面，目前没有任何可配置选项。"
        }) }}
      </p>
    </div>
  </v-container>
</template>

<script setup lang="ts">
/**
 * Base 模块设置组件
 * 提供一个空白的设置标签页，占位未来的扩展配置。
 */
import type MyPlugin from '../../main';
import { getLocalizedText } from '../../lib/textUtils';

/**
 * Base 模块设置组件的 props 定义
 * 与其他模块保持一致，接收插件实例。
 */
interface BaseSettingsProps {
  plugin: MyPlugin;
}

// 定义组件 props，当前未实际使用，仅用于接口一致性
const props = defineProps<BaseSettingsProps>();
</script>

<style scoped>
/* 使用 Vuetify 默认样式，此处暂不添加自定义样式 */
</style>

