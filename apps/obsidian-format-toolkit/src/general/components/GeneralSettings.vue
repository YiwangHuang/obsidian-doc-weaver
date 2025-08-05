<template>
  <div class="general-settings">
    <div class="setting-item">
      <div class="setting-item-info">
        <div class="setting-item-name">{{ $t('general.title') }}</div>
        <div class="setting-item-description">{{ $t('general.description') }}</div>
      </div>
    </div>
    
    <!-- SpeedDial 显示控制 -->
    <div class="setting-item">
      <div class="setting-item-info">
        <div class="setting-item-name">{{ $t('general.speedDial.title') }}</div>
        <div class="setting-item-description">{{ $t('general.speedDial.description') }}</div>
      </div>
      <div class="setting-item-control">
        <v-switch
          v-model="localSettings.showSpeedDial"
          hide-details
          density="compact"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * General 模块设置组件
 * 提供通用模块的配置界面
 */

import { reactive, watch } from 'vue';
import type { GeneralSettings } from '../types';

// 定义组件属性
interface Props {
  value: GeneralSettings;
}

// 定义事件
interface Emits {
  (e: 'update:value', value: GeneralSettings): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 创建响应式数据
const localSettings = reactive({ ...props.value });

// 监听本地设置变化，同步到父组件
watch(
  () => localSettings,
  (newSettings) => {
    emit('update:value', { ...newSettings });
  },
  { deep: true }
);

// 监听外部属性变化，同步到本地
watch(
  () => props.value,
  (newValue) => {
    Object.assign(localSettings, newValue);
  },
  { deep: true }
);

// 多语言支持
const $t = (key: string): string => {
  const translations: Record<string, Record<string, string>> = {
    en: {
      'general.title': 'General Settings',
      'general.description': 'Configure general functionality',
      'general.speedDial.title': 'Show SpeedDial Button',
      'general.speedDial.description': 'Display a floating action button in the editor'
    },
    zh: {
      'general.title': '通用设置',
      'general.description': '配置通用功能',
      'general.speedDial.title': '显示悬浮按钮',
      'general.speedDial.description': '在编辑器中显示一个悬浮的快捷操作按钮'
    }
  };
  
  const locale = 'zh'; // 默认使用中文，可以根据需要动态设置
  return translations[locale]?.[key] || key;
};
</script>

<style scoped>
.general-settings {
  padding: 16px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--background-modifier-border);
}

.setting-item-info {
  flex: 1;
}

.setting-item-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.setting-item-description {
  color: var(--text-muted);
  font-size: 0.9em;
}

.setting-item-control {
  display: flex;
  align-items: center;
}
</style>