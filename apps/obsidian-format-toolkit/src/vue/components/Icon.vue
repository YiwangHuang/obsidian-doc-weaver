<!--
  Obsidian图标组件
  利用obsidian的API接受一个icon名，返回一个内容为icon的span
-->
<template>
  <span ref="iconEl" class="obsidian-icon"></span>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { setIcon } from 'obsidian';

// 定义props接口
interface IconProps {
  /** 图标名称 */
  name: string;
}

const props = defineProps<IconProps>();

// 图标元素引用
const iconEl = ref<HTMLElement | null>(null);

/**
 * 设置图标的函数
 * 使用obsidian的setIcon API来渲染图标
 */
const setIconContent = () => {
  if (props.name && iconEl.value) {
    setIcon(iconEl.value, props.name);
  }
};

// 组件挂载后设置图标
onMounted(() => {
  setIconContent();
});

// 监听图标名称变化，动态更新图标
watch(() => props.name, () => {
  setIconContent();
});
</script>

<style scoped>
.obsidian-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 继承父元素的尺寸设置 */
.obsidian-icon svg {
  width: 1em;
  height: 1em;
}
</style>