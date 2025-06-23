<!--
  文本输入框组件
  
  功能说明：
  - 支持多种输入类型(text、password、email、url、number)
  - 支持双向数据绑定(v-model)
  - 提供错误状态显示和样式
  - 支持禁用和只读状态
  - 完整的键盘和鼠标交互
  - 使用Obsidian主题样式确保一致性
  
  配置项：
  Props:
  - modelValue: 输入框值 (string) 必需
  - type: 输入类型 ('text' | 'password' | 'email' | 'url' | 'number') 默认 'text'
  - placeholder: 占位符文本 (string) 默认 ''
  - disabled: 是否禁用 (boolean) 默认 false
  - readonly: 是否只读 (boolean) 默认 false
  - hasError: 是否显示错误状态 (boolean) 默认 false
  
  Events:
  - update:modelValue: 输入值变化时发出，传递新的string值
  - blur: 失去焦点时发出，传递FocusEvent对象
  - focus: 获得焦点时发出，传递FocusEvent对象
  
  使用示例：
  <TextInput v-model="text" type="email" placeholder="请输入邮箱" :hasError="!isValid" />
-->
<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    @input="handleInput"
    @blur="handleBlur"
    @focus="handleFocus"
    class="text-input"
    :class="{
      error: hasError,
      disabled: disabled,
      readonly: readonly
    }"
  />
</template>

<script setup lang="ts">
// 定义Props
interface TextInputProps {
  modelValue: string;
  type?: 'text' | 'password' | 'email' | 'url' | 'number';
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  hasError?: boolean;
}

// 定义Events
interface TextInputEmits {
  (e: 'update:modelValue', value: string): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
}

const props = withDefaults(defineProps<TextInputProps>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  readonly: false,
  hasError: false,
});

const emit = defineEmits<TextInputEmits>();

// 处理输入
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
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
.text-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 3px;
  background: var(--background-primary);
  color: var(--text-normal);
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.text-input:focus {
  outline: none;
  border-color: var(--interactive-accent);
  box-shadow: 0 0 0 2px var(--interactive-accent-hover);
}

.text-input:hover:not(:disabled):not(:readonly) {
  border-color: var(--interactive-hover);
}

.text-input.error {
  border-color: var(--text-error);
}

.text-input.error:focus {
  border-color: var(--text-error);
  box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.2);
}

.text-input.disabled {
  background: var(--background-secondary);
  color: var(--text-muted);
  cursor: not-allowed;
}

.text-input.readonly {
  background: var(--background-secondary);
  cursor: default;
}

.text-input::placeholder {
  color: var(--text-muted);
}
</style> 