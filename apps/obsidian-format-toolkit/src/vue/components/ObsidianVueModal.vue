<!--
  最简单的Obsidian Vue弹窗组件
  
  功能说明：
  - 将Vue组件内容渲染到Obsidian原生Modal中
  - 支持双向绑定的可见性控制
  - 最简单的实现，无额外功能
  
  配置项：
  Props:
  - visible: 弹窗可见状态 (boolean) 必需
  - obsidianApp: Obsidian应用实例 (App) 必需
  
  Events:
  - update:visible: 可见状态变化时发出
  
  Slots:
  - default: 弹窗内容（可直接包含标题和其他内容）
-->
<template>
  <Teleport to="body" v-if="visible">
    <div ref="modalContainer" style="display: none;">
      <slot></slot>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue';
import { Modal, App as ObsidianApp } from 'obsidian';

// Props定义
interface ObsidianVueModalProps {
  visible: boolean;
  obsidianApp: ObsidianApp;
}

// Events定义
interface ObsidianVueModalEmits {
  (e: 'update:visible', value: boolean): void;
}

const props = defineProps<ObsidianVueModalProps>();
const emit = defineEmits<ObsidianVueModalEmits>();

// 引用
const modalContainer = ref<HTMLElement>();
let obsidianModal: SimpleVueModal | null = null;

// 简单的Obsidian Modal类
class SimpleVueModal extends Modal {
  private vueContainer: HTMLElement;
  private onModalClose: () => void;

  constructor(
    app: ObsidianApp, 
    vueContainer: HTMLElement,
    onClose?: () => void
  ) {
    super(app);
    this.vueContainer = vueContainer;
    this.onModalClose = onClose || (() => {});
  }

  onOpen() {
    const { contentEl } = this;
    
    // 直接将Vue容器移入Modal
    if (this.vueContainer) {
      // 显示Vue容器并移入Modal
      this.vueContainer.style.display = 'block';
      contentEl.appendChild(this.vueContainer);
    }
  }

  onClose() {
    // 将Vue容器移回原位并隐藏
    if (this.vueContainer && this.vueContainer.parentNode) {
      this.vueContainer.style.display = 'none';
      document.body.appendChild(this.vueContainer);
    }
    this.onModalClose();
  }
}

// 监听visible变化
watch(() => props.visible, async (newVisible) => {
  if (newVisible) {
    await nextTick();
    openModal();
  } else {
    closeModal();
  }
});

// 打开Modal
const openModal = () => {
  if (!obsidianModal && modalContainer.value) {
    obsidianModal = new SimpleVueModal(
      props.obsidianApp,
      modalContainer.value,
      () => {
        emit('update:visible', false);
        obsidianModal = null;
      }
    );
    
    obsidianModal.open();
  }
};

// 关闭Modal
const closeModal = () => {
  if (obsidianModal) {
    obsidianModal.close();
    obsidianModal = null;
  }
};

// 组件卸载时清理
onUnmounted(() => {
  closeModal();
});
</script>

<style scoped>
.vue-modal-content {
  min-height: 100px;
}
</style> 