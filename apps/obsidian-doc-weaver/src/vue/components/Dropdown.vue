<!--
  下拉选择组件
  
  功能说明：
  - 提供标准的下拉选择功能
  - 支持双向数据绑定(v-model)
  - 支持字符串和数字类型的选项值
  - 支持选项禁用状态
  - 自动类型转换(保持原始值类型)
  - 自定义下拉箭头样式
  - 使用Obsidian主题样式确保一致性
  
  配置项：
  Props:
  - modelValue: 当前选中值 (string | number) 必需
  - options: 选项数组 (DropdownOption[]) 必需
    * DropdownOption类型：
      - value: 选项值 (string | number)
      - label: 显示文本 (string)  
      - disabled: 是否禁用 (boolean) 可选
  - disabled: 是否禁用整个下拉框 (boolean) 默认 false
  
  Events:
  - update:modelValue: 选择变化时发出，传递新的值
  - change: 选择变化时发出，传递新的值
  
  使用示例：
  <Dropdown 
    v-model="selectedValue" 
    :options="[
      { value: 'option1', label: '选项1' },
      { value: 'option2', label: '选项2', disabled: true }
    ]" 
  />
-->
<template>
  <select
    :value="modelValue"
    :disabled="disabled"
    @change="handleChange"
    class="dropdown"
    :class="{ disabled }"
  >
    <option
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </option>
  </select>
</template>

<script setup lang="ts">
// 选项类型定义
export interface DropdownOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// 定义Props
interface DropdownProps {
  modelValue: string | number;
  options: DropdownOption[];
  disabled?: boolean;
}

// 定义Events
interface DropdownEmits {
  (e: 'update:modelValue', value: string | number): void;
  (e: 'change', value: string | number): void;
}

const props = withDefaults(defineProps<DropdownProps>(), {
  disabled: false,
});

const emit = defineEmits<DropdownEmits>();

// 处理变更
const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = target.value;
  
  // 尝试转换为数字（如果原值是数字类型）
  const convertedValue = typeof props.modelValue === 'number' ? Number(value) : value;
  
  emit('update:modelValue', convertedValue);
  emit('change', convertedValue);
};
</script>

<style scoped>
.dropdown {
  width: 100%;
  padding: 0px 9px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 3px;
  background: var(--background-primary);
  color: var(--text-normal);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown:focus {
  outline: none;
  border-color: var(--interactive-accent);
  box-shadow: 0 0 0 2px var(--interactive-accent-hover);
}

.dropdown:hover:not(:disabled) {
  border-color: var(--interactive-hover);
}

.dropdown.disabled {
  background: var(--background-secondary);
  color: var(--text-muted);
  cursor: not-allowed;
}

.dropdown option {
  background: var(--background-primary);
  color: var(--text-normal);
  padding: 4px 8px;
}

.dropdown option:disabled {
  color: var(--text-muted);
}

/* 自定义下拉箭头样式 */
.dropdown {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  padding-right: 32px;
}
</style> 