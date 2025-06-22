<template>
  <div class="config-item" :class="{ disabled }">
    <div class="config-header">
      <div class="config-info">
        <h4 v-if="title" class="config-title">{{ title }}</h4>
        <p v-if="description" class="config-description">{{ description }}</p>
      </div>
      <div class="config-control">
        <slot name="control"></slot>
      </div>
    </div>
    <div v-if="$slots.details" class="config-details">
      <slot name="details"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
// 定义Props
interface ConfigurationItemProps {
  title?: string;
  description?: string;
  disabled?: boolean;
}

withDefaults(defineProps<ConfigurationItemProps>(), {
  disabled: false,
});
</script>

<style scoped>
.config-item {
  padding: 16px 0;
  border-bottom: 1px solid var(--background-modifier-border);
}

.config-item:last-child {
  border-bottom: none;
}

.config-item.disabled {
  opacity: 0.6;
}

.config-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.config-info {
  flex: 1;
  min-width: 0;
}

.config-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-normal);
  line-height: 1.3;
}

.config-description {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
}

.config-control {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--background-modifier-border-hover);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .config-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .config-control {
    justify-content: flex-start;
  }
}
</style> 