<!--
  Obsidian Vue弹窗集成组件
  
  功能说明：
  - 将Vue组件内容集成到Obsidian原生Modal中
  - 保持完美的Obsidian主题一致性和用户体验
  - 支持双向绑定的可见性控制
  - 自动处理Modal的创建、打开、关闭生命周期
  - 支持自定义标题和关闭回调
  - 组件卸载时自动清理Modal资源
  
  配置项：
  Props:
  - visible: 弹窗可见状态 (boolean) 必需
  - obsidianApp: Obsidian应用实例 (ObsidianApp) 必需
  - title: 弹窗标题 (string) 可选
  - onClose: 关闭回调函数 (Function) 可选
  
  Events:
  - update:visible: 可见状态变化时发出，传递新的boolean值
  - close: 弹窗关闭时发出
  
  Slots:
  - default: 弹窗内容区域
  
  使用示例：
  <ObsidianVueModal
    v-model:visible="showModal"
    :obsidian-app="app"
    title="设置"
    @close="handleClose"
  >
    <div>弹窗内容...</div>
  </ObsidianVueModal>
  
  注意事项：
  - 该组件使用隐藏的DOM元素配合Obsidian Modal实现
  - Vue内容会被复制到Obsidian Modal中，因此事件绑定需要特别处理
  - 建议配合其他UI组件使用，而不是直接操作DOM
-->
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