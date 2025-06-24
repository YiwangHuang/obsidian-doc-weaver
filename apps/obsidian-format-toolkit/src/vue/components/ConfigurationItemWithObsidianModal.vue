<!--
  最简单的配置项弹窗组件
  
  功能说明：
  - 扩展ConfigurationItem，增加简单的弹窗功能
  - 只有一个按钮用于打开弹窗
  - 弹窗内显示Vue组件内容
  - 无保存、取消、重置等复杂功能
  
  配置项：
  Props:
  - title: 配置项标题 (string) 可选
  - description: 配置项描述文本 (string) 可选
  - disabled: 是否禁用 (boolean) 默认 false
  - modalTitle: 弹窗标题 (string) 可选
  - modalButtonText: 弹窗按钮文本 (string) 默认 '打开设置'
  - obsidianApp: Obsidian应用实例 (App) 必需
  
  Slots:
  - control: 主要控制组件插槽
  - details: 基础详细信息插槽
  - modal-content: 弹窗内容插槽
-->
<template>
  <ConfigurationItem
    :title="title"
    :description="description"
    :disabled="disabled"
  >
    <!-- 控制区域 -->
    <template #control>
      <div class="config-controls">
        <!-- 主要控制组件 -->
        <slot name="control"></slot>
        
        <!-- 弹窗按钮 -->
        <Button
          v-if="hasModalContent"
          variant="secondary"
          size="small"
          @click="openModal"
          :disabled="disabled"
        >
          {{ modalButtonText }}
        </Button>
      </div>
    </template>

    <!-- 详细信息 -->
    <template v-if="$slots.details" #details>
      <slot name="details"></slot>
    </template>
  </ConfigurationItem>

  <!-- 简单弹窗 -->
  <ObsidianVueModal
    v-if="hasModalContent"
    v-model:visible="modalVisible"
    :obsidian-app="obsidianApp"
    :title="modalTitle"
  >
    <div class="modal-content-wrapper">
      <slot name="modal-content"></slot>
    </div>
  </ObsidianVueModal>
</template>

<script setup lang="ts">
import { ref, computed, useSlots } from 'vue';
import { App as ObsidianApp } from 'obsidian';
import ConfigurationItem from './ConfigurationItem.vue';
import ObsidianVueModal from './ObsidianVueModal.vue';
import Button from './Button.vue';

// 定义Props
interface ConfigurationItemWithObsidianModalProps {
  title?: string;
  description?: string;
  disabled?: boolean;
  modalTitle?: string;
  modalButtonText?: string;
  obsidianApp: ObsidianApp;
}

const props = withDefaults(defineProps<ConfigurationItemWithObsidianModalProps>(), {
  disabled: false,
  modalButtonText: '打开设置',
});

// 获取插槽
const slots = useSlots();

// 弹窗可见状态
const modalVisible = ref(false);

// 计算属性：是否有弹窗内容
const hasModalContent = computed(() => {
  return !!slots['modal-content'];
});

// 计算属性：弹窗标题
const modalTitle = computed(() => {
  return props.modalTitle || props.title || '设置';
});

// 打开弹窗
const openModal = () => {
  modalVisible.value = true;
};
</script>

<style scoped>
.config-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-content-wrapper {
  padding: 4px 0;
  min-height: 50px;
}
</style> 