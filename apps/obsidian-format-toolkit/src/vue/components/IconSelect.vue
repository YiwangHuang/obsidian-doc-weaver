<template>
  <v-tooltip interactive location="top" :open-delay="500">
    <template #activator="{ props: activatorProps }"> 
      <v-combobox
        v-bind="activatorProps"
        v-model="selectedIcon"
        :items="iconOptions"
        :label="getLocalizedText({ en: 'Select Icon', zh: '选择图标' })"
        variant="outlined"
        density="compact"
        style="max-width: 360px;"
        hide-details
        clearable
      >
        <!-- 自定义选项显示模板 -->
        <template #item="{ props, item }">
          <v-list-item v-bind="props" :title="item.raw">
            <template #prepend>
              <Icon v-if="item.raw" :name="item.raw" size="small" class="me-2" />
            </template>
          </v-list-item>
        </template>
        
        <!-- 自定义选中值显示模板 -->
        <template #selection="{ item }">
          <div class="d-flex align-center">
            <Icon :name="item.raw" size="small" class="me-2" />
            <span>{{ item.raw }}</span>
          </div>
        </template>
      </v-combobox>
    </template>
    <div>
      {{ getLocalizedText({ en: "More icons please visit: ", zh: "更多图标请访问：" }) }}
      <a class="text-primary font-weight-medium" href="https://lucide.dev/">
        Lucide
      </a>
    </div>
  </v-tooltip>
</template>

<script setup lang="ts">
/**
 * IconSelect 图标选择组件
 * 基于Vuetify的v-combobox组件实现图标选择功能
 * 支持从预设列表选择或手动输入图标名称
 */

import { computed } from 'vue';
import Icon from './Icon.vue';
import { getLocalizedText } from '../../lib/textUtils';

// 图标选项类型定义
interface IconOption {
  /** 图标名称 */
  icon: string;
  /** 显示别名（可选），如果有则显示别名，否则显示图标名称 */
  alias?: string;
}

// 组件属性定义
interface Props {
  /** 当前选中的图标值 */
  modelValue?: string;
  /** 是否禁用组件 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false
});

// 组件事件
const emit = defineEmits<{
  'update:modelValue': [value: string];
  'change': [value: string];
}>();

/**
 * 图标选项列表
 * 简化结构，只包含icon和可选的alias属性
 */
const iconOptions: string[] = [
  // { icon: '', alias: '(无图标)' }, // 空选项
'file-text',
'file-sliders',
'file-check',
'home',
'columns-2',
'columns-3',
'columns-4',
'cog',  
'pencil',
'delete',
'download',
'underline',
'italic',
'bold',
'strikethrough',
'code',
'quote',
'list',
'upload',
'file',
'folder',
'phone',
'calendar',
'clock',
'star',
'heart',
'tag',
'link',
'image'
];

/**
 * 当前选中的图标
 */
const selectedIcon = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
});

</script>

<style scoped>
/* 组件样式可以根据需要添加 */
</style>