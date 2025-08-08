<template>
  <!-- 
    编辑工具栏主容器，复现原版 Obsidian Editing Toolbar 
    ID: editingToolbarModalBar (保持与原版一致)
  -->
  <div
    v-show="visible && isInMarkdownEditor"
    id="editingToolbarModalBar"
    ref="toolbarRef"
    :class="toolbarClasses"
    :style="toolbarStyle"
    @mousedown="handleMouseDown"
  >
    <!-- 工具栏按钮容器 -->
    <div class="toolbar-buttons-container">
      <!-- 
        使用复合key确保Vue能正确识别数组变化：
        - item.commandId/name: 项目标识
        - index: 数组位置
        - children?.length: 子项数量，确保子数组变化时重新渲染
      -->
      <ToolbarButton
        v-for="(item, index) in items"
        :key="`${item.commandId || item.name}-${index}-${item.children?.length || 0}`"
        :item="item"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * EditingToolbar 编辑工具栏主组件
 * 复现原版 Obsidian Editing Toolbar 的视觉效果和拖拽功能
 */

import { ref, reactive, computed, inject, onMounted, onUnmounted } from 'vue';
import ToolbarButton from './ToolbarButton.vue';
import type { ToolbarItem, ToolbarDependencies } from '../types';
import { MarkdownView } from 'obsidian';
import { generalInfo, GeneralSettings } from '../index';



// 组件属性
interface Props {
  /** 传入的工具栏条目列表 */
  items: ToolbarItem[];
}

const props = withDefaults(defineProps<Props>(), {

});

// 组件事件
const emit = defineEmits<{
  positionChange: [x: number, y: number];
}>();

// 组件引用
const toolbarRef = ref<HTMLElement>();

// 位置状态
const position = reactive({
  x: 100,
  y: 100
});

// 拖拽状态
const isDragging = ref(false);
const dragState = reactive({
  startX: 0,
  startY: 0,
  startPosX: 0,
  startPosY: 0,
  hasDragged: false
});

// 注入工具栏上下文
const toolbarContext = inject<ToolbarDependencies>('toolbarContext');
const configs = toolbarContext?.plugin.settingList[generalInfo.name] as GeneralSettings;
const visible = computed(() => configs.showToolBar)

// 编辑器状态
const isInMarkdownEditor = ref(false);

// 计算属性：处理可见性逻辑
// const isVisible = computed(() => props.visible());

/**
 * 工具栏数据处理
 * 
 * 将外部传入的响应式props.items转换为组件内部的computed，
 * 确保当父组件数据变化时，子组件能正确响应更新
 */
const items = computed(() => props.items);

// 计算属性

/**
 * 工具栏CSS类名
 */
const toolbarClasses = computed(() => {
  const classes = ['editing-toolbar-modal'];
  return classes;
});

/**
 * 工具栏样式
 */
const toolbarStyle = computed(() => ({
  position: 'fixed' as const,
  left: `${position.x}px`,
  top: `${position.y}px`,
  transform: `translate(var(--toolbar-horizontal-offset, 0px), var(--toolbar-vertical-offset, 0px))`,
  transition: isDragging.value ? 'none' : '100ms cubic-bezier(0.92, -0.53, 0.65, 1.21)',
  cursor: isDragging.value ? 'grabbing' : 'grab'
}));

// 方法

// 按钮点击现在由 ToolbarButton 组件内部直接处理，不再需要父组件的事件处理函数

/**
 * 处理鼠标按下（开始拖拽检测）
 */
const handleMouseDown = (event: MouseEvent) => {
  // 阻止默认行为，但不阻止事件冒泡（让按钮点击仍能工作）
  event.preventDefault();
  
  isDragging.value = true;
  dragState.hasDragged = false;
  
  dragState.startX = event.clientX;
  dragState.startY = event.clientY;
  dragState.startPosX = position.x;
  dragState.startPosY = position.y;

  // 添加全局事件监听
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  
  // 添加选择取消（防止拖拽时选中文本）
  document.addEventListener('selectstart', preventSelect);
};

/**
 * 处理鼠标移动（拖拽过程）
 */
const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return;

  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;
  
  // 如果移动距离超过阈值，标记为已拖拽
  if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
    dragState.hasDragged = true;
  }

  // 更新位置
  position.x = dragState.startPosX + deltaX;
  position.y = dragState.startPosY + deltaY;
  
  // 确保在可视区域内
  ensureInViewport();
  
  emit('positionChange', position.x, position.y);
};

/**
 * 处理鼠标释放（结束拖拽）
 */
const handleMouseUp = () => {
  // 移除全局事件监听
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('selectstart', preventSelect);
  
  isDragging.value = false;
  
  // 延迟重置拖拽标记，确保点击事件能正确判断
  setTimeout(() => {
    dragState.hasDragged = false;
  }, 50);
};

/**
 * 阻止选择文本
 */
const preventSelect = (event: Event) => {
  event.preventDefault();
};

/**
 * 确保工具栏位置在可视区域内
 */
const ensureInViewport = () => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  const toolbarWidth = toolbarRef.value?.offsetWidth || 300;
  const toolbarHeight = toolbarRef.value?.offsetHeight || 50;
  
  // 调整X坐标
  position.x = Math.max(0, Math.min(windowWidth - toolbarWidth, position.x));
  
  // 调整Y坐标
  position.y = Math.max(0, Math.min(windowHeight - toolbarHeight, position.y));
};

/**
 * 处理窗口大小变化
 */
const handleResize = () => {
  ensureInViewport();
};

/**
 * 检查当前是否在Markdown编辑器中
 */
const checkIfInMarkdownEditor = () => {
  if (!toolbarContext?.plugin.app) {
    isInMarkdownEditor.value = false;
    return;
  }
  
  try {
    const activeLeaf = toolbarContext.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    isInMarkdownEditor.value = activeLeaf !== null;
  } catch (error) {
    console.error('Failed to check markdown editor state:', error);
    isInMarkdownEditor.value = false;
  }
};

// 生命周期
onMounted(() => {
  ensureInViewport();
  window.addEventListener('resize', handleResize);
  
  // 检查编辑器状态
  checkIfInMarkdownEditor();
  
  // 监听工作区变化以检测编辑器切换
  if (toolbarContext?.plugin?.app?.workspace) {
    toolbarContext.plugin.app.workspace.on('active-leaf-change', checkIfInMarkdownEditor);
  }
});

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('selectstart', preventSelect);
  window.removeEventListener('resize', handleResize);
  
  // 清理工作区监听器
  if (toolbarContext?.plugin?.app?.workspace) {
    toolbarContext.plugin.app.workspace.off('active-leaf-change', checkIfInMarkdownEditor);
  }
});
</script>

<style scoped>
/* 复现原版工具栏容器样式 - 强制单行布局 */
#editingToolbarModalBar {
  width: auto;
  height: auto;
  padding: 3px;
  display: flex; /* 改为flex布局，强制单行 */
  user-select: none;
  border-radius: var(--radius-m);
  min-width: fit-content;
  justify-content: space-around;
  z-index: var(--layer-modal);
  background-color: var(--background-primary-alt);
  box-shadow: var(--shadow-s);
  
  /* 单行布局设置 */
  flex-wrap: nowrap; /* 强制不换行 */
  align-items: center;
  gap: 2px;
}

/* 工具栏按钮容器 */
.toolbar-buttons-container {
  display: contents; /* 让子元素直接参与父级的flex布局 */
}

/* 美学效果：轻微的边框 */
#editingToolbarModalBar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-m);
  pointer-events: none;
  opacity: 0.5;
}

/* 拖拽时的视觉反馈 */
.editing-toolbar-modal {
  transition: transform 100ms cubic-bezier(0.92, -0.53, 0.65, 1.21);
}

/* 响应式调整 - 单行布局 */
@media (max-width: 768px) {
  #editingToolbarModalBar {
    /* 单行布局下，小屏幕时可能需要调整间距 */
    gap: 1px;
  }
}

@media (max-width: 480px) {
  #editingToolbarModalBar {
    /* 超小屏幕时进一步减少间距 */
    gap: 0px;
  }
}
</style>