<!--
  Obsidian图标组件
  利用obsidian的API接受一个icon名，返回一个内容为icon的span
  支持可选倍率参数，仅影响当次引用的图标视觉大小（通过 --icon-size / --icon-stroke 覆盖）
-->
<template>
  <span
    ref="iconEl"
    class="obsidian-icon"
    :style="iconSizeStyle"
  ></span>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { setIcon } from 'obsidian';

// 定义props接口
interface IconProps {
  /** 图标名称 */
  name: string;
  /**
   * 可选倍率，仅影响该次引用的图标大小（覆盖 --icon-size、--icon-stroke）
   * 例如 1.5 表示 1.5 倍大小，0.8 表示缩小到 80%
   */
  scale?: number;
}

const props = withDefaults(defineProps<IconProps>(), {
  scale: undefined,
});

/** 当传入 scale 时，用 CSS 变量覆盖子元素 svg.svg-icon 的尺寸与线宽，仅影响本实例 */
const iconSizeStyle = computed(() => {
  if (props.scale == null || props.scale <= 0) return undefined;
  // 尺寸：1em * 倍率；线宽：基准 1.5 * 倍率，与图标成比例
  const size = `calc(1em * ${props.scale})`;
  const stroke = `calc(1.5 * ${props.scale})`;
  return {
    '--icon-size': size,
    '--icon-stroke': stroke,
  } as Record<string, string>;
});

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

/* 尺寸与线宽：优先使用 --icon-size / --icon-stroke（便于通过 scale 等覆盖），无则默认 1em / 1.5 */
.obsidian-icon svg {
  width: var(--icon-size, 1em);
  height: var(--icon-size, 1em);
  stroke-width: var(--icon-stroke, 1.5);
}
</style>