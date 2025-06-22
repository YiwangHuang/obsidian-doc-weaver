<template>
  <ConfigurationItem
    :title="title"
    :description="description"
    :disabled="disabled"
  >
    <!-- 控制区域 -->
    <template #control>
      <div class="config-controls">
        <!-- 主要控制组件（如开关） -->
        <slot name="control"></slot>
        
        <!-- 弹窗触发按钮 -->
        <Button
          v-if="hasModalContent"
          variant="ghost"
          size="small"
          @click="openModal"
          :disabled="disabled"
          :title="modalButtonTooltip"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5H4a.5.5 0 0 1 0-1h3.5V4a.5.5 0 0 1 .5-.5zM7.5 8.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1H8.5V4a.5.5 0 0 0-1 0v4.5z"/>
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/>
          </svg>
          {{ modalButtonText }}
        </Button>
      </div>
    </template>

    <!-- 基础详细信息 -->
    <template v-if="$slots.details" #details>
      <slot name="details"></slot>
    </template>
  </ConfigurationItem>

  <!-- Obsidian原生Modal -->
  <ObsidianVueModal
    v-if="hasModalContent"
    v-model:visible="modalVisible"
    :obsidian-app="obsidianApp"
    :title="modalTitle"
    @close="handleClose"
  >
    <!-- 弹窗内容 -->
    <div class="obsidian-modal-content">
      <slot name="modal-content"></slot>
      
      <!-- 底部操作按钮 -->
      <div class="obsidian-modal-actions">
        <div class="save-status">
          <span v-if="saveState?.saving" class="saving-text">
            <span class="loading-spinner"></span>
            保存中...
          </span>
          <span v-else-if="saveState?.error" class="error-text">
            保存失败: {{ saveState.error }}
          </span>
          <span v-else-if="hasUnsavedChanges" class="unsaved-text">
            有未保存的更改
          </span>
        </div>
        
        <div class="action-buttons">
          <Button
            variant="ghost"
            @click="handleCancel"
            :disabled="saveState?.saving"
          >
            取消
          </Button>
          
          <Button
            variant="secondary"
            @click="handleReset"
            :disabled="saveState?.saving || !hasUnsavedChanges"
          >
            重置
          </Button>
          
          <Button
            variant="primary"
            @click="handleSave"
            :loading="saveState?.saving"
            :disabled="!hasUnsavedChanges"
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  </ObsidianVueModal>
</template>

<script setup lang="ts">
import { ref, computed, useSlots } from 'vue';
import { App as ObsidianApp } from 'obsidian';
import ConfigurationItem from './ConfigurationItem.vue';
import ObsidianVueModal from './ObsidianVueModal.vue';
import Button from './Button.vue';
import type { SaveState } from '../types';

// 定义Props
interface ConfigurationItemWithObsidianModalProps {
  title?: string;
  description?: string;
  disabled?: boolean;
  modalTitle?: string;
  modalButtonText?: string;
  modalButtonTooltip?: string;
  saveState?: SaveState;
  hasUnsavedChanges?: boolean;
  confirmOnCancel?: boolean;
  obsidianApp: ObsidianApp;
}

// 定义Events
interface ConfigurationItemWithObsidianModalEmits {
  (e: 'modal-open'): void;
  (e: 'modal-close'): void;
  (e: 'modal-save'): void;
  (e: 'modal-reset'): void;
  (e: 'modal-cancel'): void;
}

const props = withDefaults(defineProps<ConfigurationItemWithObsidianModalProps>(), {
  disabled: false,
  modalButtonText: '高级设置',
  modalButtonTooltip: '打开高级设置',
  hasUnsavedChanges: false,
  confirmOnCancel: true,
});

const emit = defineEmits<ConfigurationItemWithObsidianModalEmits>();

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
  return props.modalTitle || `${props.title || '配置项'} - 高级设置`;
});

// 打开弹窗
const openModal = () => {
  modalVisible.value = true;
  emit('modal-open');
};

// 处理保存
const handleSave = () => {
  emit('modal-save');
};

// 处理重置
const handleReset = () => {
  if (confirm('确定要重置所有更改吗？此操作无法撤销。')) {
    emit('modal-reset');
  }
};

// 处理取消
const handleCancel = () => {
  if (props.hasUnsavedChanges && props.confirmOnCancel) {
    if (confirm('您有未保存的更改，确定要放弃这些更改并关闭吗？')) {
      modalVisible.value = false;
      emit('modal-cancel');
    }
  } else {
    modalVisible.value = false;
    emit('modal-cancel');
  }
};

// 处理关闭
const handleClose = () => {
  if (props.hasUnsavedChanges && props.confirmOnCancel) {
    if (confirm('您有未保存的更改，确定要放弃这些更改并关闭吗？')) {
      modalVisible.value = false;
      emit('modal-close');
    } else {
      // 阻止关闭，重新打开
      modalVisible.value = true;
    }
  } else {
    modalVisible.value = false;
    emit('modal-close');
  }
};
</script>

<style scoped>
.config-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 弹窗按钮的图标样式 */
.config-controls svg {
  width: 14px;
  height: 14px;
}

/* Obsidian Modal 内容样式 */
.obsidian-modal-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 200px;
}

.obsidian-modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--background-modifier-border);
}

.save-status {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.saving-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-accent);
  font-size: 13px;
}

.error-text {
  color: var(--text-error);
  font-size: 13px;
}

.unsaved-text {
  color: var(--text-muted);
  font-size: 13px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.loading-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--background-modifier-border);
  border-top: 2px solid var(--interactive-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式 */
@media (max-width: 768px) {
  .obsidian-modal-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .save-status {
    order: 2;
    justify-content: center;
  }
  
  .action-buttons {
    order: 1;
    justify-content: center;
  }
}
</style> 