<!--
  Obsidian图标按钮组件
  继承v-btn的所有属性和事件，仅改变icon的处理方式为使用Obsidian的setIcon
  支持 icon、prepend-icon、append-icon 属性
-->
<template>
  <v-btn v-bind="$attrs" @click="$emit('click', $event)">
    <!-- 前置图标 -->
    <span v-if="prependIcon" ref="prependIconEl"></span>
    
    <!-- 主图标或默认内容 -->
    <span v-if="icon" ref="iconEl"></span>
    <slot v-else></slot>
    
    <!-- 后置图标 -->
    <span v-if="appendIcon" ref="appendIconEl"></span>
  </v-btn>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { setIcon } from 'obsidian';

const props = defineProps<{
  icon?: string;
  prependIcon?: string;
  appendIcon?: string;
}>();

defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const iconEl = ref<HTMLElement | null>(null);
const prependIconEl = ref<HTMLElement | null>(null);
const appendIconEl = ref<HTMLElement | null>(null);

onMounted(() => {
  // 设置主图标
  if (props.icon && iconEl.value) {
    setIcon(iconEl.value, props.icon);
  }
  
  // 设置前置图标
  if (props.prependIcon && prependIconEl.value) {
    setIcon(prependIconEl.value, props.prependIcon);
  }
  
  // 设置后置图标
  if (props.appendIcon && appendIconEl.value) {
    setIcon(appendIconEl.value, props.appendIcon);
  }
});
</script> 