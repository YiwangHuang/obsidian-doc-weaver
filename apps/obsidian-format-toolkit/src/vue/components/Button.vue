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