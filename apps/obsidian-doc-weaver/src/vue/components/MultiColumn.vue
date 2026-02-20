<!--
  多栏布局组件
  
  功能说明：
  - 支持自定义栏数和每栏宽度比例
  - 支持每栏内容的对齐方式
  - 响应式布局，在小屏幕下自动堆叠
  
  使用示例：
  <MultiColumn :columns="[
    { width: 2, align: 'left', content: '左栏内容' },
    { width: 3, align: 'right', content: '右栏内容' }
  ]" />
-->
<template>
  <div class="multi-column-container" :class="{ 'is-stacked': isStacked }">
    <div
      v-for="(column, index) in columns"
      :key="index"
      class="column"
      :class="[
        `align-${column.align || 'left'}`,
        `flex-${column.align || 'left'}`
      ]"
      :style="getColumnStyle(column)"
    >
      <slot :name="'column-' + index">
        {{ column.content }}
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// 列配置接口
interface Column {
  width: number;  // 宽度比例
  align?: 'left' | 'right' | 'center';  // 对齐方式
  content?: string;  // 默认内容
}

// Props定义
interface Props {
  columns: Column[];  // 列配置数组
  stackBreakpoint?: number;  // 堆叠断点（像素），默认768px
}

const props = withDefaults(defineProps<Props>(), {
  stackBreakpoint: 768
});

// 是否堆叠显示
const isStacked = ref(false);

// 计算列样式
const getColumnStyle = (column: Column) => {
  if (isStacked.value) {
    return {
      width: '100%'
    };
  }
  
  // 计算总宽度比例
  const totalWidth = props.columns.reduce((sum, col) => sum + col.width, 0);
  
  // 计算当前列的百分比宽度
  const widthPercent = (column.width / totalWidth) * 100;
  
  return {
    width: `${widthPercent}%`
  };
};

// 响应式处理
const updateLayout = () => {
  isStacked.value = window.innerWidth <= props.stackBreakpoint;
};

// 监听窗口大小变化
onMounted(() => {
  updateLayout();
  window.addEventListener('resize', updateLayout);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateLayout);
});
</script>

<style scoped>
.multi-column-container {
  display: flex;
  gap: 16px;
  width: 100%;
}

.multi-column-container.is-stacked {
  flex-direction: column;
}

.column {
  min-width: 0;  /* 防止内容溢出 */
  display: flex;
  align-items: center;
}

/* 文本对齐方式 */
.align-left {
  text-align: left;
}

.align-right {
  text-align: right;
}

.align-center {
  text-align: center;
}

/* Flex 对齐方式 - 适用于 flex 容器 */
.flex-left {
  justify-content: flex-start;
}

.flex-right {
  justify-content: flex-end;
}

.flex-center {
  justify-content: center;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .multi-column-container {
    gap: 24px;
  }
}
</style> 