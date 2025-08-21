<!--
  带占位符支持的输入组件
  
  功能说明：
  - 通过插槽接受任意输入组件（v-text-field、v-textarea等）
  - 支持自定义占位符快速插入
  - 默认收起，点击输入区域时展开占位符面板
  - 复用TemplateEditor的核心逻辑，保持代码简洁
  
  Props:
  - placeholders: 支持的占位符配置数组
  - autoHide: 是否自动隐藏面板（默认true）
-->
<template>
  <div class="input-with-placeholders">
    <!-- 输入组件插槽 -->
    <div ref="inputContainer" @focusin="handleFocusIn" @focusout="handleFocusOut">
      <slot></slot>
    </div>

    <!-- 占位符面板 - 默认隐藏，点击输入区域时展开 -->
    <v-expand-transition>
      <div v-show="showPlaceholderPanel" class="placeholder-panel">
        <!-- 占位符按钮组 -->
        <div class="placeholder-buttons">
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
                class="placeholder-chip"
                @click="insertPlaceholder(item.value)"
              >
                {{ item.value }}
              </v-chip>
            </template>
          </v-tooltip>
        </div>
      </div>
    </v-expand-transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getLocalizedText } from '../../lib/textUtils';

/**
 * 占位符配置接口
 */
interface PlaceholderConfig {
  value: string;
  description?: string;
}

/**
 * 组件 Props 接口
 */
interface InputWithPlaceholdersProps {
  /** 支持的占位符配置 */
  placeholders?: PlaceholderConfig[];
  /** 是否自动隐藏面板 */
  autoHide?: boolean;
}

// 定义 Props
const props = withDefaults(defineProps<InputWithPlaceholdersProps>(), {
  placeholders: () => [],
  autoHide: true
});

// 响应式数据
const inputContainer = ref<HTMLElement>();
const showPlaceholderPanel = ref(false);
const hasFocusedElement = ref(false);
const currentFocusedElement = ref<HTMLElement | null>(null);
const hideTimer = ref<NodeJS.Timeout | null>(null);

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
 * 处理输入区域获得焦点
 */
const handleFocusIn = (event: FocusEvent) => {
  const target = event.target as HTMLElement;
  if (isEditableElement(target)) {
    // 清除可能存在的隐藏定时器
    if (hideTimer.value) {
      clearTimeout(hideTimer.value);
      hideTimer.value = null;
    }
    
    hasFocusedElement.value = true;
    currentFocusedElement.value = target;
    showPlaceholderPanel.value = true;
  }
};

/**
 * 处理输入区域失去焦点
 */
const handleFocusOut = () => {
  if (!props.autoHide) return;
  
  // 延迟检查焦点状态，给用户时间点击占位符
  hideTimer.value = setTimeout(() => {
    const activeElement = document.activeElement as HTMLElement;
    const isInContainer = inputContainer.value?.contains(activeElement);
    const isEditable = activeElement && isEditableElement(activeElement);
    
    if (!isInContainer || !isEditable) {
      hasFocusedElement.value = false;
      currentFocusedElement.value = null;
      showPlaceholderPanel.value = false;
    }
  }, 200);
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
    
    // 设置光标位置到插入占位符之后
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
    
    // 保持面板显示一段时间，方便连续插入
    if (props.autoHide && hideTimer.value) {
      clearTimeout(hideTimer.value);
      hideTimer.value = setTimeout(() => {
        showPlaceholderPanel.value = false;
        hasFocusedElement.value = false;
        currentFocusedElement.value = null;
      }, 1500);
    }
  }
};
</script>

<style scoped>
.input-with-placeholders {
  position: relative;
}

.placeholder-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  background: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 8px;
  margin-top: 4px;
}

.placeholder-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.placeholder-chip {
  cursor: pointer;
  transition: all 0.2s ease;
}

.placeholder-chip:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .placeholder-panel {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  }
}
</style>
