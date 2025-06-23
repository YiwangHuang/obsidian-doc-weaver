<!--
  多行文本输入框组件
  
  功能说明：
  - 支持多行文本输入和编辑
  - 支持双向数据绑定(v-model)
  - 可控制的垂直尺寸调整功能
  - 支持自定义行数和列数
  - 提供错误状态显示
  - 支持禁用和只读状态
  - 使用Obsidian主题样式确保一致性
  
  配置项：
  Props:
  - modelValue: 文本框值 (string) 必需
  - placeholder: 占位符文本 (string) 默认 ''
  - disabled: 是否禁用 (boolean) 默认 false
  - readonly: 是否只读 (boolean) 默认 false
  - hasError: 是否显示错误状态 (boolean) 默认 false
  - rows: 可见行数 (number) 默认 4
  - cols: 可见列数 (number) 可选
  - resizable: 是否允许调整大小 (boolean) 默认 true
  
  Events:
  - update:modelValue: 输入值变化时发出，传递新的string值
  - blur: 失去焦点时发出，传递FocusEvent对象
  - focus: 获得焦点时发出，传递FocusEvent对象
  
  使用示例：
  <TextArea v-model="content" :rows="6" placeholder="请输入详细内容..." />
-->
<template>
  <textarea
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :rows="rows"
    :cols="cols"
    @input="handleInput"
    @blur="handleBlur"
    @focus="handleFocus"
    class="text-area"
    :class="{
      error: hasError,
      disabled: disabled,
      readonly: readonly,
      resizable: resizable
    }"
  />
</template>

<script setup lang="ts">
// 定义Props
interface TextAreaProps {
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  hasError?: boolean;
  rows?: number;
  cols?: number;
  resizable?: boolean;
}

// 定义Events
interface TextAreaEmits {
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
}

const props = withDefaults(defineProps<TextAreaProps>(), {
  placeholder: '',
  disabled: false,
  readonly: false,
  hasError: false,
  rows: 4,
  resizable: true,
});

const emit = defineEmits<TextAreaEmits>();

// 处理输入
const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
};

// 处理失去焦点
const handleBlur = (event: FocusEvent) => {
  emit('blur', event);
};

// 处理获得焦点
const handleFocus = (event: FocusEvent) => {
  emit('focus', event);
};
</script>

<style scoped>
.text-area {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 3px;
  background: var(--background-primary);
  color: var(--text-normal);
  font-size: 14px;
  font-family: inherit;
  line-height: 1.4;
  transition: all 0.2s ease;
  min-height: 80px;
}

.text-area.resizable {
  resize: vertical;
}

.text-area:not(.resizable) {
  resize: none;
}

.text-area:focus {
  outline: none;
  border-color: var(--interactive-accent);
  box-shadow: 0 0 0 2px var(--interactive-accent-hover);
}

.text-area:hover:not(:disabled):not(:readonly) {
  border-color: var(--interactive-hover);
}

.text-area.error {
  border-color: var(--text-error);
}

.text-area.error:focus {
  border-color: var(--text-error);
  box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.2);
}

.text-area.disabled {
  background: var(--background-secondary);
  color: var(--text-muted);
  cursor: not-allowed;
  resize: none;
}

.text-area.readonly {
  background: var(--background-secondary);
  cursor: default;
  resize: none;
}

.text-area::placeholder {
  color: var(--text-muted);
}
</style> 