<!--
  配置项容器组件
  
  功能说明：
  - 提供标准化的配置项布局容器
  - 支持标题、描述文本和控制组件的统一布局
  - 可选的详细信息区域，用于显示额外内容
  - 支持整体禁用状态
  - 响应式设计，移动端自动调整布局
  - 使用Obsidian主题样式确保一致性
  
  配置项：
  Props:
  - title: 配置项标题 (string) 可选
  - description: 配置项描述文本 (string) 可选
  - disabled: 是否禁用状态显示 (boolean) 默认 false
  
  Slots:
  - control: 控制组件插槽，通常放置开关、按钮等操作组件
  - details: 详细信息插槽，用于显示额外的配置内容或说明
  
  使用示例：
  <ConfigurationItem title="启用功能" description="这是一个示例配置项">
    <template #control>
      <ToggleSwitch v-model="enabled" />
    </template>
    <template #details>
      <p>详细配置说明...</p>
    </template>
  </ConfigurationItem>
-->
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