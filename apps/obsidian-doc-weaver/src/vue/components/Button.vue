<!--
  通用按钮组件
  
  功能说明：
  - 提供4种样式变体：primary(主要)、secondary(次要)、danger(危险)、ghost(幽灵)
  - 支持3种尺寸：small、medium、large
  - 支持加载状态显示和禁用状态
  - 完全使用Obsidian主题变量确保一致性
  - 支持键盘导航和无障碍访问
  
  配置项：
  Props:
  - type: 按钮类型 ('button' | 'submit' | 'reset') 默认 'button'
  - variant: 样式变体 ('primary' | 'secondary' | 'danger' | 'ghost') 默认 'secondary'  
  - size: 尺寸 ('small' | 'medium' | 'large') 默认 'medium'
  - disabled: 是否禁用 (boolean) 默认 false
  - loading: 是否显示加载状态 (boolean) 默认 false
  
  Events:
  - click: 点击事件，传递MouseEvent对象
  
  Slots:
  - default: 按钮内容区域
-->
<template>
  <button
    :type="type"
    :disabled="disabled"
    @click="handleClick"
    class="btn"
    :class="[
      `btn-${variant}`,
      `btn-${size}`,
      {
        disabled: disabled,
        loading: loading
      }
    ]"
  >
    <span v-if="loading" class="loading-spinner"></span>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
// 定义Props
interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

// 定义Events
interface ButtonEmits {
  (e: 'click', event: MouseEvent): void;
}

const props = withDefaults(defineProps<ButtonProps>(), {
  type: 'button',
  variant: 'secondary',
  size: 'medium',
  disabled: false,
  loading: false,
});

const emit = defineEmits<ButtonEmits>();

// 处理点击
const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid;
  border-radius: 3px;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
}

.btn:focus {
  outline: 2px solid var(--interactive-accent);
  outline-offset: 2px;
}

/* 尺寸变体 */
.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-medium {
  padding: 8px 16px;
  font-size: 14px;
}

.btn-large {
  padding: 12px 20px;
  font-size: 16px;
}

/* 样式变体 */
.btn-primary {
  background: var(--interactive-accent);
  border-color: var(--interactive-accent);
  color: var(--text-on-accent);
}

.btn-primary:hover:not(.disabled):not(.loading) {
  background: var(--interactive-accent-hover);
  border-color: var(--interactive-accent-hover);
}

.btn-secondary {
  background: var(--background-primary);
  border-color: var(--background-modifier-border);
  color: var(--text-normal);
}

.btn-secondary:hover:not(.disabled):not(.loading) {
  background: var(--background-modifier-hover);
  border-color: var(--interactive-hover);
}

.btn-danger {
  background: var(--text-error);
  border-color: var(--text-error);
  color: var(--text-on-accent);
}

.btn-danger:hover:not(.disabled):not(.loading) {
  background: color-mix(in srgb, var(--text-error) 80%, black);
  border-color: color-mix(in srgb, var(--text-error) 80%, black);
}

.btn-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--text-normal);
}

.btn-ghost:hover:not(.disabled):not(.loading) {
  background: var(--background-modifier-hover);
}

/* 状态 */
.btn.disabled,
.btn.loading {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 