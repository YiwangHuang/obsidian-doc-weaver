<template>
  <!-- 
    工具栏容器：固定定位，可拖拽的浮动工具栏
    - position.x/y: 通过拖拽更新的位置坐标
  -->
  <v-card 
    class="speed-dial-overlay"
    :style="{
      position: 'fixed',
      top: position.y + 'px',
      left: position.x + 'px',
      zIndex: 1000,
      minWidth: '200px'
    }"
    elevation="4"
  >
    <!-- 
      可折叠工具栏：
      - collapse: 控制工具栏内容的展开/收起
      - 工具栏本身包含拖拽和折叠功能
    -->
    <v-toolbar 
      :collapse="isCollapsed" 
      density="compact"
      color="grey-lighten-2"
    >


      <!-- 工具栏标题和拖拽区域 -->
      <v-toolbar-title 
        class="text-subtitle-2 drag-handle"
        @mousedown="startDrag"
        @touchstart="startDrag"
        style="cursor: move; user-select: none;"
      >
        工具栏
      </v-toolbar-title>

      <!-- 工具栏按钮组 -->
      <template v-slot:append>
        <div class="d-flex ga-1">
          <!-- 折叠/展开按钮 -->
          <v-btn
            :icon="isCollapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'"
            size="small"
            variant="text"
            @click="toggleCollapse"
          />

          <!-- 拖拽按钮 -->
          <v-btn
            icon="mdi-drag"
            size="small"
            variant="text"
            @mousedown="startDrag"
            @touchstart="startDrag"
            style="cursor: move;"
          />
        </div>
      </template>
    </v-toolbar>

    <!-- 
      工具栏内容区域：
      - 只在未折叠时显示
      - 包含所有功能按钮
    -->
    <v-card-text v-show="!isCollapsed" class="pa-2">
      <div class="d-flex flex-column ga-1">
        <v-btn
          prepend-icon="mdi-pencil"
          text="编辑"
          size="small"
          variant="outlined"
          block
          @click="handleClick('edit')"
        />

        <v-btn
          prepend-icon="mdi-delete"
          text="删除"
          size="small"
          variant="outlined"
          color="error"
          block
          @click="handleClick('delete')"
        />

        <v-btn
          prepend-icon="mdi-star"
          text="收藏"
          size="small"
          variant="outlined"
          color="warning"
          block
          @click="handleClick('star')"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
/**
 * SpeedDialOverlay 组件（现在使用工具栏设计）
 * 在 Obsidian 编辑界面显示一个可拖动、可折叠的浮动工具栏
 */

import { ref, reactive, onMounted, onUnmounted } from 'vue';

// 组件状态
const isCollapsed = ref(true); // 工具栏是否折叠
const isDragging = ref(false);

// 位置状态
const position = reactive({
  x: 20, // 默认位置 - 距离左边20px
  y: 100  // 默认位置 - 距离顶部100px
});

// 拖拽相关状态
const dragState = reactive({
  startX: 0,
  startY: 0,
  startPosX: 0,
  startPosY: 0
});

/**
 * 开始拖拽
 */
const startDrag = (event: MouseEvent | TouchEvent) => {
  event.preventDefault();
  event.stopPropagation();

  isDragging.value = true;
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
  
  dragState.startX = clientX;
  dragState.startY = clientY;
  dragState.startPosX = position.x;
  dragState.startPosY = position.y;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchmove', onDrag);
  document.addEventListener('touchend', endDrag);
};

/**
 * 拖拽过程中
 */
const onDrag = (event: MouseEvent | TouchEvent) => {
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

  const deltaX = clientX - dragState.startX;
  const deltaY = clientY - dragState.startY;

  // 更新位置
  position.x = dragState.startPosX + deltaX;
  position.y = dragState.startPosY + deltaY;
  
  // 确保位置在可视区域内
  ensureInViewport();
};

/**
 * 结束拖拽
 */
const endDrag = () => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('touchend', endDrag);
  
  isDragging.value = false;
};

/**
 * 切换工具栏折叠状态
 */
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

/**
 * 处理按钮点击事件
 */
const handleClick = (action: string) => {
  console.log(`Toolbar action: ${action}`);
};

/**
 * 确保位置在可视区域内
 */
const ensureInViewport = () => {
  // 获取当前窗口尺寸
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // 工具栏的最小尺寸
  const toolbarMinWidth = 200;
  const toolbarMinHeight = 48;
  
  // 调整 X 坐标
  position.x = Math.max(0, Math.min(windowWidth - toolbarMinWidth, position.x));
  
  // 调整 Y 坐标
  position.y = Math.max(0, Math.min(windowHeight - toolbarMinHeight, position.y));
};

/**
 * 处理窗口大小变化
 */
const handleResize = () => {
  ensureInViewport();
};

// 组件挂载时的初始化
onMounted(() => {
  // 初始化时确保位置在可视区域内
  ensureInViewport();
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);
});

// 组件卸载时的清理
onUnmounted(() => {
  // 移除所有事件监听器
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('touchend', endDrag);
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.speed-dial-overlay {
  user-select: none;
  width: fit-content;
  height: fit-content;
}
</style>