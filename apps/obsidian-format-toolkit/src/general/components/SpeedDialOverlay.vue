<template>
  <div 
    class="speed-dial-overlay"
    :style="{
      position: 'fixed',
      top: position.y + 'px',
      left: position.x + 'px',
      zIndex: 1000
    }"
  >
    <v-speed-dial
      v-model="fab"
      transition="fade-transition"
    >
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          fab
          size="small"
          icon="mdi-plus"
          @mousedown="startDrag"
          @touchstart="startDrag"
          @click="handleActivatorClick"
        />
      </template>

      <v-btn
        icon="mdi-pencil"
        size="small"
        @click="handleClick('edit')"
      />

      <v-btn
        icon="mdi-delete"
        size="small"
        @click="handleClick('delete')"
      />

      <v-btn
        icon="mdi-star"
        size="small"
        @click="handleClick('star')"
      />
    </v-speed-dial>
  </div>
</template>

<script setup lang="ts">
/**
 * SpeedDialOverlay 组件
 * 在 Obsidian 编辑界面显示一个可拖动的 v-speed-dial 组件
 */

import { ref, reactive, onMounted, onUnmounted } from 'vue';

// 组件状态
const fab = ref(false);
const isDragging = ref(false);
const dragDistance = ref(0);

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
 * @param event 鼠标或触摸事件
 */
const startDrag = (event: MouseEvent | TouchEvent) => {
  event.preventDefault();
  event.stopPropagation();

  isDragging.value = false; // 初始时不认为是拖拽
  dragDistance.value = 0;
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
  
  dragState.startX = clientX;
  dragState.startY = clientY;
  dragState.startPosX = position.x;
  dragState.startPosY = position.y;

  // 添加全局事件监听器
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchmove', onDrag);
  document.addEventListener('touchend', endDrag);
};

/**
 * 拖拽过程中
 * @param event 鼠标或触摸事件
 */
const onDrag = (event: MouseEvent | TouchEvent) => {
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

  const deltaX = clientX - dragState.startX;
  const deltaY = clientY - dragState.startY;
  
  // 计算拖拽距离
  dragDistance.value = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // 如果拖拽距离超过阈值，认为是拖拽而不是点击
  if (dragDistance.value > 5) {
    isDragging.value = true;
    // 关闭 speed-dial 如果在拖拽
    fab.value = false;
  }

  if (isDragging.value) {
    // 更新位置
    position.x = Math.max(0, Math.min(window.innerWidth - 56, dragState.startPosX + deltaX));
    position.y = Math.max(0, Math.min(window.innerHeight - 56, dragState.startPosY + deltaY));
  }
};

/**
 * 结束拖拽
 */
const endDrag = () => {
  // 移除全局事件监听器
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('touchend', endDrag);
  
  // 延迟重置拖拽状态，避免立即触发点击
  setTimeout(() => {
    isDragging.value = false;
    dragDistance.value = 0;
  }, 50);
};

/**
 * 处理激活按钮点击事件
 */
const handleActivatorClick = (event: MouseEvent) => {
  // 如果刚刚拖拽过，阻止点击事件
  if (isDragging.value || dragDistance.value > 5) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
};

/**
 * 处理按钮点击事件
 * @param action 动作类型
 */
const handleClick = (action: string) => {
  console.log(`Speed dial action: ${action}`);
  // 关闭 speed-dial
  fab.value = false;
};

// 组件挂载时的初始化
onMounted(() => {
  // 可以在这里添加初始化逻辑
  console.log('SpeedDialOverlay mounted');
});

// 组件卸载时的清理
onUnmounted(() => {
  // 确保移除所有事件监听器
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('touchend', endDrag);
  console.log('SpeedDialOverlay unmounted');
});
</script>

<style scoped>
.speed-dial-overlay {
  user-select: none;
  width: fit-content;
  height: fit-content;
}
</style>