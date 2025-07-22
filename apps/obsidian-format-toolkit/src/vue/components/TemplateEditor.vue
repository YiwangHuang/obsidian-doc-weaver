<!--
  模板编辑器组件
  提供带占位符快速插入功能的编辑器
  通过插槽接受任意内容，对其中的所有文本输入组件生效
-->
<template>
  <div ref="editorContainer" @focusin="handleFocusIn" @focusout="handleFocusOut">
    <!-- 内容插槽 -->
    <slot></slot>

    <!-- 占位符选择区域 -->
    <div class="mb-4">
      <div class="d-flex align-center justify-space-between mb-2">
        <p class="text-caption text-medium-emphasis mt-2">
          {{ getLocalizedText({ 
            en: "Click an input field above, then click a placeholder to insert it", 
            zh: "先点击上方的输入框，然后点击占位符将其插入" 
          }) }}
        </p>
        <v-chip
          :color="hasFocusedElement ? 'success' : 'warning'"
          size="x-small"
          variant="outlined"
        >
          {{ hasFocusedElement 
            ? getLocalizedText({ en: "Ready", zh: "就绪" })
            : getLocalizedText({ en: "Click field first", zh: "请先点击输入框" })
          }}
        </v-chip>
      </div>
      
      <!-- 占位符按钮 -->
      <div class="d-flex flex-wrap ga-2">
        <v-tooltip
          v-for="item in placeholders"
          :key="item.value"
          :text="item.description"
          :disabled="!item.description"
          location="top"
        >
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              :disabled="!hasFocusedElement"
              variant="outlined"
              size="small"
              @click="insertPlaceholder(item.value)"
            >
              {{ item.value }}
            </v-chip>
          </template>
        </v-tooltip>
      </div>
      

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
const hasFocusedElement = ref(false);
const currentFocusedElement = ref<HTMLElement | null>(null);

/**
 * 检查元素是否为可编辑元素
 */
const isEditableElement = (element: HTMLElement): boolean => {
  return (
    element.tagName === 'TEXTAREA' ||
    (element.tagName === 'INPUT' && element.getAttribute('type') === 'text') ||
    element.getAttribute('contenteditable') === 'true'
  );
};

/**
 * 处理焦点进入
 */
const handleFocusIn = (event: FocusEvent) => {
  const target = event.target as HTMLElement;
  if (isEditableElement(target)) {
    hasFocusedElement.value = true;
    currentFocusedElement.value = target;
  }
};

/**
 * 处理焦点离开
 */
const handleFocusOut = () => {
  setTimeout(() => {
    const activeElement = document.activeElement as HTMLElement;
    const isInContainer = editorContainer.value?.contains(activeElement);
    const isEditable = activeElement && isEditableElement(activeElement);
    
    if (!isInContainer || !isEditable) {
      hasFocusedElement.value = false;
      currentFocusedElement.value = null;
    }
  }, 100);
};

/**
 * 在指定元素中插入占位符
 */
const insertIntoElement = (element: HTMLElement, placeholder: string): void => {
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    const input = element as HTMLInputElement | HTMLTextAreaElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    
    const newValue = 
      input.value.substring(0, start) + 
      placeholder + 
      input.value.substring(end);
    
    input.value = newValue;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    // 设置光标位置
    const newPosition = start + placeholder.length;
    input.setSelectionRange(newPosition, newPosition);
    input.focus();
  } else if (element.getAttribute('contenteditable') === 'true') {
    element.focus();
    const selection = window.getSelection();
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(placeholder));
      range.collapse(false);
    } else {
      element.textContent = (element.textContent || '') + placeholder;
    }
  }
};

/**
 * 插入占位符到当前聚焦的元素
 */
const insertPlaceholder = (placeholder: string) => {
  if (currentFocusedElement.value) {
    insertIntoElement(currentFocusedElement.value, placeholder);
  }
};

/**
 * 查找容器内所有可编辑的文本元素
 */
const findEditableElements = (): HTMLElement[] => {
  if (!editorContainer.value) return [];
  
  const selectors = ['textarea', 'input[type="text"]', '[contenteditable="true"]'];
  const elements: HTMLElement[] = [];
  
  selectors.forEach(selector => {
    const found = editorContainer.value!.querySelectorAll(selector);
    elements.push(...Array.from(found) as HTMLElement[]);
  });
  
  return elements;
};

// 组件挂载时检查初始焦点状态
onMounted(() => {
  const activeElement = document.activeElement as HTMLElement;
  const isInContainer = editorContainer.value?.contains(activeElement);
  const isEditable = activeElement && isEditableElement(activeElement);
  
  if (isInContainer && isEditable) {
    hasFocusedElement.value = true;
    currentFocusedElement.value = activeElement;
  }
});

// 暴露方法给父组件使用
defineExpose({
  insertPlaceholder,
  findEditableElements
});
</script>

 