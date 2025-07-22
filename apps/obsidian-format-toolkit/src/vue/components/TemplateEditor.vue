<!--
  模板编辑器组件
  提供带占位符快速插入功能的编辑器
  通过插槽接受任意内容，对其中的所有文本输入组件生效
-->
<template>
  <div ref="editorContainer">
    <!-- 内容插槽 -->
    <slot></slot>

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
  placeholders?: PlaceholderConfig[];
}

const props = withDefaults(defineProps<Props>(), {
  placeholders: () => [
    { value: '{{selectedText}}', description: 'Selected text content' },
    { value: '{{date: YYYY-MM-DD}}', description: 'Current date with custom format' },
    { value: '{{language}}', description: 'Programming language name' },
    { value: '{{type}}', description: 'Content type or category' },
    { value: '{{title}}', description: 'Title or heading text' },
    { value: '{{date: HH:mm}}', description: 'Current time' }
  ]
});

const editorContainer = ref<HTMLElement>();

/**
 * 查找容器内所有可编辑的文本元素
 */
const findEditableElements = (): HTMLElement[] => {
  if (!editorContainer.value) return [];
  
  const elements: HTMLElement[] = [];
  
  // 查找所有 textarea 元素
  const textareas = editorContainer.value.querySelectorAll('textarea');
  elements.push(...Array.from(textareas) as HTMLElement[]);
  
  // 查找所有 input[type="text"] 元素
  const textInputs = editorContainer.value.querySelectorAll('input[type="text"]');
  elements.push(...Array.from(textInputs) as HTMLElement[]);
  
  // 查找所有具有 contenteditable 属性的元素
  const editables = editorContainer.value.querySelectorAll('[contenteditable="true"]');
  elements.push(...Array.from(editables) as HTMLElement[]);
  
  return elements;
};

/**
 * 获取当前聚焦的可编辑元素
 */
const getFocusedEditableElement = (): HTMLElement | null => {
  const activeElement = document.activeElement as HTMLElement;
  
  if (!activeElement || !editorContainer.value) return null;
  
  // 检查当前聚焦元素是否在我们的容器内
  if (!editorContainer.value.contains(activeElement)) return null;
  
  // 检查是否是可编辑元素
  if (
    activeElement.tagName === 'TEXTAREA' ||
    (activeElement.tagName === 'INPUT' && activeElement.getAttribute('type') === 'text') ||
    activeElement.getAttribute('contenteditable') === 'true'
  ) {
    return activeElement;
  }
  
  return null;
};

/**
 * 在指定元素中插入占位符
 */
const insertIntoElement = (element: HTMLElement, placeholder: string): void => {
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    const input = element as HTMLInputElement | HTMLTextAreaElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    
    const currentValue = input.value || '';
    const newValue = 
      currentValue.substring(0, start) + 
      placeholder + 
      currentValue.substring(end);
    
    // 更新值并触发 input 事件（用于 Vue 的双向绑定）
    input.value = newValue;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    // 恢复光标位置
    nextTick(() => {
      const newPosition = start + placeholder.length;
      input.setSelectionRange(newPosition, newPosition);
      input.focus();
    });
  } else if (element.getAttribute('contenteditable') === 'true') {
    // 处理 contenteditable 元素
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(placeholder));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // 如果没有选区，就追加到末尾
      element.textContent = (element.textContent || '') + placeholder;
    }
  }
};

/**
 * 插入占位符到当前聚焦的元素或第一个可编辑元素
 */
const insertPlaceholder = (placeholder: string) => {
  // 首先尝试获取当前聚焦的元素
  let targetElement = getFocusedEditableElement();
  
  // 如果没有聚焦的元素，使用第一个可编辑元素
  if (!targetElement) {
    const editableElements = findEditableElements();
    if (editableElements.length > 0) {
      targetElement = editableElements[0];
      // 聚焦到该元素
      targetElement.focus();
    }
  }
  
  if (targetElement) {
    insertIntoElement(targetElement, placeholder);
  } else {
    console.warn('No editable element found for placeholder insertion');
  }
};

// 暴露方法给父组件使用（可选）
defineExpose({
  insertPlaceholder,
  findEditableElements
});
</script>

 