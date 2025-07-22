<!--
  模板编辑器组件
  提供带占位符快速插入功能的文本编辑器
-->
<template>
  <div>
    <!-- 模板内容输入区域 -->
    <v-textarea
      ref="templateTextarea"
      v-model="modelValue"
      :label="label"
      :placeholder="placeholder"
      variant="outlined"
      hide-details="auto"
      rows="6"
      density="compact"
      class="mb-3"
    />

    <!-- 占位符选择区域 -->
    <div class="mb-4">
      <h4 class="text-subtitle-2 mb-2">
        {{ getLocalizedText({ en: "Available Placeholders", zh: "可用占位符" }) }}
      </h4>
      
      <!-- 使用 v-chip-group 管理占位符chip -->
      <v-chip-group
        variant="outlined"
        color="primary"
        column
      >
        <v-tooltip
          v-for="placeholder in placeholders"
          :key="placeholder.value"
          :text="placeholder.description"
          :disabled="!placeholder.description"
          location="top"
        >
          <template #activator="{ props: tooltipProps }">
            <v-chip
              v-bind="tooltipProps"
              :text="placeholder.value"
              size="small"
              @click="insertPlaceholder(placeholder.value)"
              style="cursor: pointer;"
            />
          </template>
        </v-tooltip>
      </v-chip-group>
      
      <p class="text-caption text-medium-emphasis mt-2">
        {{ getLocalizedText({ 
          en: "Click to insert placeholder at cursor position", 
          zh: "点击将占位符插入到光标位置" 
        }) }}
      </p>
    </div>

    <!-- 预览区域 -->
    <div v-if="showPreview">
      <h4 class="text-subtitle-2 mb-2">
        {{ getLocalizedText({ en: "Preview", zh: "预览" }) }}
      </h4>
      <div class="pa-3" style="background: var(--background-modifier-border); border-radius: 4px;">
        <pre style="margin: 0; font-family: var(--font-monospace); font-size: 0.9em; white-space: pre-wrap;">{{ getTemplatePreview(modelValue || '') }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { getLocalizedText } from '../../lib/textUtils';

interface PlaceholderConfig {
  value: string;
  description?: string;
}

interface Props {
  modelValue: string;
  label?: string;
  placeholder?: string;
  placeholders?: PlaceholderConfig[];
  showPreview?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: '',
  placeholders: () => [
    { value: '{{selectedText}}', description: 'Selected text content' },
    { value: '{{date: YYYY-MM-DD}}', description: 'Current date with custom format' },
    { value: '{{language}}', description: 'Programming language name' },
    { value: '{{type}}', description: 'Content type or category' },
    { value: '{{title}}', description: 'Title or heading text' },
    { value: '{{date: HH:mm}}', description: 'Current time' }
  ],
  showPreview: true
});

const modelValue = defineModel<string>();
const templateTextarea = ref();

/**
 * 插入占位符到光标位置
 * 支持替换选中文本，如果没有选中则在光标位置插入
 * @param placeholder 要插入的占位符
 */
const insertPlaceholder = (placeholder: string) => {
  // 尝试通过 ref 找到 textarea 元素，TODO: 找到生效的那种方法
  if (templateTextarea.value) {
    // 多种方式尝试获取实际的 DOM 元素
    const textareaEl = templateTextarea.value.$el?.querySelector('textarea') || 
                      templateTextarea.value.$el?.querySelector('input[type="text"]') ||
                      templateTextarea.value.$refs?.input?.$el ||
                      templateTextarea.value.$refs?.input;
    
    // 如果找到了 textarea 元素且支持选择操作
    if (textareaEl && (textareaEl.tagName === 'TEXTAREA' || textareaEl.tagName === 'INPUT')) {
      const start = textareaEl.selectionStart || 0;
      const end = textareaEl.selectionEnd || 0;
      
      // 计算新的模板内容：在光标位置插入或替换选中文本
      const currentValue = modelValue.value || '';
      const newValue = 
        currentValue.substring(0, start) + 
        placeholder + 
        currentValue.substring(end);
      
      // 更新值
      modelValue.value = newValue;
      
      // 在下一个 tick 恢复光标位置
      nextTick(() => {
        const newPosition = start + placeholder.length;
        textareaEl.setSelectionRange(newPosition, newPosition);
        textareaEl.focus();
      });
      
      return;
    }
  }
  
  // 备用方案：如果无法找到 textarea 引用，使用当前活动元素
  const activeElement = document.activeElement as HTMLTextAreaElement;
  
  if (activeElement && 
      activeElement.tagName === 'TEXTAREA' && 
      typeof activeElement.selectionStart === 'number' &&
      typeof activeElement.selectionEnd === 'number') {
    
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    
    const currentValue = modelValue.value || '';
    const newValue = 
      currentValue.substring(0, start) + 
      placeholder + 
      currentValue.substring(end);
    
    modelValue.value = newValue;
    
    nextTick(() => {
      const newPosition = start + placeholder.length;
      activeElement.setSelectionRange(newPosition, newPosition);
      activeElement.focus();
    });
  } else {
    // 最后的备用方案：追加到末尾
    modelValue.value = (modelValue.value || '') + placeholder;
  }
};

/**
 * 获取模板预览文本
 * 将占位符替换为示例文本，便于用户理解效果
 * @param template 原始模板内容
 * @returns 预览文本
 */
const getTemplatePreview = (template: string): string => {
  return template
    // 替换常见占位符为示例文本
    .replace(/\{\{selectedText\}\}/g, 'Selected Text')
    .replace(/\{\{date:\s*([^}]+)\}\}/g, '2024-01-01') // 简化日期预览
    .replace(/\{\{language\}\}/g, 'javascript')
    .replace(/\{\{type\}\}/g, 'note')
    .replace(/\{\{title\}\}/g, 'Example Title')
    .replace(/\{\{time\}\}/g, '14:30')
    // 处理其他占位符
    .replace(/\{\{(\w+)\}\}/g, '$1');
};
</script>

 