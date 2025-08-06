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
      <ToolbarButton
        v-for="(item, index) in toolbarItems"
        :key="item.id"
        v-bind="item"
        :index="index"
        @click="handleButtonClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * EditingToolbar 编辑工具栏主组件
 * 复现原版 Obsidian Editing Toolbar 的视觉效果和拖拽功能
 */

import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import ToolbarButton from './ToolbarButton.vue';
import type { ToolbarItem } from '../types';
import { MarkdownView } from 'obsidian';

// 组件属性
interface Props {
  visible?: boolean;
  iconSize?: number;
  app?: any; // Obsidian App实例
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  iconSize: 18
});

// 组件事件
const emit = defineEmits<{
  buttonClick: [id: string];
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

// 编辑器状态
const isInMarkdownEditor = ref(false);

// 工具栏数据（模拟原版的工具栏按钮，包含多级菜单结构）
const toolbarItems = ref<ToolbarItem[]>([
  {
    id: 'bold',
    name: '粗体',
    icon: 'bold',
    action: () => console.log('执行粗体操作')
  },
  {
    id: 'italic',
    name: '斜体',
    icon: 'italic',
    action: () => console.log('执行斜体操作')
  },
  {
    id: 'font-color',
    name: '字体颜色',
    icon: 'palette',
    children: [
      {
        id: 'color-red',
        name: '红色',
        icon: 'circle',
        action: () => console.log('应用红色字体')
      },
      {
        id: 'color-blue',
        name: '蓝色',
        icon: 'circle',
        action: () => console.log('应用蓝色字体')
      },
      {
        id: 'color-green',
        name: '绿色',
        icon: 'circle',
        action: () => console.log('应用绿色字体')
      }
    ]
  },
  {
    id: 'highlight',
    name: '高亮',
    icon: 'highlighter',
    children: [
      {
        id: 'highlight-yellow',
        name: '黄色高亮',
        icon: 'highlighter',
        action: () => console.log('应用黄色高亮')
      },
      {
        id: 'highlight-green',
        name: '绿色高亮',
        icon: 'highlighter',
        action: () => console.log('应用绿色高亮')
      },
      {
        id: 'highlight-more',
        name: '更多高亮',
        icon: 'more-horizontal',
        children: [
          {
            id: 'highlight-red',
            name: '红色高亮',
            icon: 'highlighter',
            action: () => console.log('应用红色高亮')
          },
          {
            id: 'highlight-blue',
            name: '蓝色高亮',
            icon: 'highlighter',
            action: () => console.log('应用蓝色高亮')
          }
        ]
      }
    ]
  },
  {
    id: 'code',
    name: '行内代码',
    icon: 'code-glyph',
    action: () => console.log('插入行内代码')
  },
  {
    id: 'link',
    name: '链接',
    icon: 'link',
    action: () => console.log('插入链接')
  }
]);

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

/**
 * 处理按钮点击
 */
const handleButtonClick = (id: string) => {
  // 如果刚刚拖拽过，不触发点击事件
  if (dragState.hasDragged) {
    dragState.hasDragged = false;
    return;
  }
  
  emit('buttonClick', id);
  console.log('工具栏按钮点击:', id);
};

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
  if (!props.app) return;
  
  const activeLeaf = props.app.workspace.getActiveViewOfType(MarkdownView);
  isInMarkdownEditor.value = activeLeaf !== null;
};

// 生命周期
onMounted(() => {
  ensureInViewport();
  window.addEventListener('resize', handleResize);
  
  // 检查编辑器状态
  checkIfInMarkdownEditor();
  
  // 监听工作区变化以检测编辑器切换
  if (props.app && props.app.workspace) {
    props.app.workspace.on('active-leaf-change', checkIfInMarkdownEditor);
  }
});

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('selectstart', preventSelect);
  window.removeEventListener('resize', handleResize);
  
  // 清理工作区监听器
  if (props.app && props.app.workspace) {
    props.app.workspace.off('active-leaf-change', checkIfInMarkdownEditor);
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