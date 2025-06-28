<!--
  确认弹窗组件
  
  功能说明：
  - 基础的确认弹窗组件
  - 预定义取消和确认按钮
  - 支持自定义点击事件处理
  - 弹窗内容通过插槽传入
  
  使用示例：
  <ConfirmDialog 
    v-model:visible="showDialog"
    :onConfirm="handleConfirm"
    :onCancel="handleCancel"
    :obsidian-app="app"
  >
    <h2>确认标题</h2>
    <p>确认要删除此项吗？</p>
  </ConfirmDialog>
-->
<template>
  <ObsidianVueModal
    v-model:visible="internalVisible"
    :obsidian-app="obsidianApp"
    @update:visible="handleVisibilityChange"
  >
    <div>
      <slot></slot>
      
      <div class="dialog-actions">
        <Button
          variant="primary"
          @click="handleConfirm"
        >
          <LocalizedText en="Confirm" zh="确认" />
        </Button>
        <Button
          variant="secondary"
          @click="handleCancel"
        >
          <LocalizedText en="Cancel" zh="取消" />
        </Button>
      </div>
    </div>
  </ObsidianVueModal>
</template>

<script setup lang="ts">
import { App } from 'obsidian';
import { ref, watch, nextTick, onUnmounted } from 'vue';
import ObsidianVueModal from './ObsidianVueModal.vue';
import Button from './Button.vue';
import LocalizedText from './LocalizedText.vue';
import '../shared-styles.css';

// Props定义
interface ConfirmDialogProps {
  visible: boolean;
  obsidianApp: App;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// Events定义
interface ConfirmDialogEmits {
  (e: 'update:visible', visible: boolean): void;
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  onConfirm: () => {},
  onCancel: () => {}
});

const emit = defineEmits<ConfirmDialogEmits>();

// 内部状态管理
const internalVisible = ref(props.visible);
const isUnmounted = ref(false);

// 监听外部 visible 变化
watch(() => props.visible, (newVal) => {
  if (!isUnmounted.value) {
    internalVisible.value = newVal;
  }
});

// 组件卸载时标记
onUnmounted(() => {
  isUnmounted.value = true;
});

/**
 * 安全的emit函数，避免在组件卸载后调用
 */
const safeEmit = (event: 'update:visible', value: boolean) => {
  if (!isUnmounted.value) {
    try {
      emit(event, value);
    } catch (error) {
      console.warn('Failed to emit event:', error);
    }
  }
};

/**
 * 处理可见性变化
 */
const handleVisibilityChange = (visible: boolean) => {
  if (!isUnmounted.value) {
    internalVisible.value = visible;
    // 使用 nextTick 确保在合适的时机发出事件
    nextTick(() => {
      safeEmit('update:visible', visible);
    });
  }
};

/**
 * 处理确认按钮点击
 */
const handleConfirm = () => {
  if (isUnmounted.value) return;
  
  try {
    props.onConfirm();
    internalVisible.value = false;
    nextTick(() => {
      safeEmit('update:visible', false);
    });
  } catch (error) {
    console.error('Error in confirm handler:', error);
  }
};

/**
 * 处理取消按钮点击
 */
const handleCancel = () => {
  if (isUnmounted.value) return;
  
  try {
    props.onCancel();
    internalVisible.value = false;
    nextTick(() => {
      safeEmit('update:visible', false);
    });
  } catch (error) {
    console.error('Error in cancel handler:', error);
  }
};
</script>

<style scoped>
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
</style> 