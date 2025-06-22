<template>
  <!-- 这个组件不直接渲染内容，而是通过Obsidian Modal渲染 -->
  <div style="display: none;">
    <div ref="vueContent">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick } from 'vue';
import { Modal, App as ObsidianApp } from 'obsidian';

// Props定义
interface ObsidianVueModalProps {
  visible: boolean;
  obsidianApp: ObsidianApp;
  title?: string;
  onClose?: () => void;
}

// Events定义  
interface ObsidianVueModalEmits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}

const props = defineProps<ObsidianVueModalProps>();
const emit = defineEmits<ObsidianVueModalEmits>();

// 引用
const vueContent = ref<HTMLElement>();
let obsidianModal: CustomVueModal | null = null;

// 自定义Obsidian Modal类
class CustomVueModal extends Modal {
  private vueElement: HTMLElement;
  private onCloseCallback?: () => void;
  private titleText?: string;

  constructor(app: ObsidianApp, vueElement: HTMLElement, title?: string, onClose?: () => void) {
    super(app);
    this.vueElement = vueElement;
    this.titleText = title;
    this.onCloseCallback = onClose;
  }

  onOpen() {
    const { contentEl } = this;
    
    // 设置标题
    if (this.titleText) {
      const titleEl = contentEl.createEl('h2', { 
        text: this.titleText,
        cls: 'modal-title'
      });
      titleEl.style.marginBottom = '16px';
    }
    
    // 将Vue组件内容移动到Modal中
    if (this.vueElement) {
      contentEl.appendChild(this.vueElement.cloneNode(true));
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    
    // 触发关闭回调
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }
}

// 监听visible变化
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    openModal();
  } else {
    closeModal();
  }
});

// 打开Modal
const openModal = async () => {
  if (!obsidianModal && vueContent.value) {
    await nextTick(); // 确保Vue内容已渲染
    
    obsidianModal = new CustomVueModal(
      props.obsidianApp,
      vueContent.value,
      props.title,
      () => {
        emit('update:visible', false);
        emit('close');
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

<style>
/* 使用Obsidian原生样式，几乎不需要自定义样式 */
.modal-title {
  color: var(--text-normal);
  font-weight: 600;
}
</style> 