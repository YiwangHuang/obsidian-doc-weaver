<!--
  开关切换组件
  
  功能说明：
  - 提供美观的开关切换界面，基于Obsidian设计风格
  - 支持双向数据绑定(v-model)
  - 支持禁用状态和键盘操作
  - 带有平滑的过渡动画效果
  - 完全无障碍访问支持
  
  配置项：
  Props:
  - modelValue: 当前开关状态 (boolean) 必需
  - disabled: 是否禁用 (boolean) 默认 false
  
  Events:
  - update:modelValue: 状态变化时发出，传递新的boolean值
  
  使用示例：
  <ToggleSwitch v-model="enabled" :disabled="false" />
-->
<template>
  <label class="toggle-switch" :class="{ disabled }">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      @change="handleChange"
      class="toggle-input"
    />
    <span class="toggle-slider"></span>
  </label>
</template>

<script setup lang="ts">
// 定义Props
interface ToggleSwitchProps {
  modelValue: boolean;
  disabled?: boolean;
}

// 定义Events
interface ToggleSwitchEmits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = withDefaults(defineProps<ToggleSwitchProps>(), {
  disabled: false,
});

const emit = defineEmits<ToggleSwitchEmits>();

// 处理变更
const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
};
</script>

<style scoped>
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
  cursor: pointer;
}

.toggle-switch.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--background-modifier-border);
  border-radius: 24px;
  transition: all 0.2s ease;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: var(--background-primary);
  border-radius: 50%;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-slider {
  background-color: var(--interactive-accent);
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(18px);
}

.toggle-input:focus + .toggle-slider {
  box-shadow: 0 0 0 2px var(--interactive-accent-hover);
}

.toggle-switch:hover .toggle-slider {
  background-color: var(--interactive-hover);
}

.toggle-input:checked + .toggle-switch:hover .toggle-slider {
  background-color: var(--interactive-accent-hover);
}
</style> 