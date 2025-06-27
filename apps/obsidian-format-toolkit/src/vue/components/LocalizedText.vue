<!--
  多语言文本组件
  
  功能说明：
  - 从Obsidian的moment.locale()读取当前语言设置
  - 英语为必选参数，其他语言可选
  - 优先匹配当前语言，匹配不到返回英语
  - 仅返回字符串，不渲染任何HTML元素
  
  配置项：
  Props:
  - en: 英语文本 (string) 必需
  - zh: 中文文本 (string) 可选
  - ja: 日语文本 (string) 可选
  - ko: 韩语文本 (string) 可选
  - fr: 法语文本 (string) 可选
  - de: 德语文本 (string) 可选
  - es: 西班牙语文本 (string) 可选
  - pt: 葡萄牙语文本 (string) 可选
  - ru: 俄语文本 (string) 可选
  - it: 意大利语文本 (string) 可选
  - ar: 阿拉伯语文本 (string) 可选
  
  使用示例：
  <LocalizedText 
    en="Delete"
    zh="删除"
    ja="削除"
    ko="삭제"
    fr="Supprimer"
    de="Löschen"
  />
-->
<template>
  <span>{{ localizedText }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { moment } from 'obsidian';

// 定义Props - 英语必选，其他语言可选
interface LocalizedTextProps {
  en: string;
  zh?: string;
  ja?: string;
  ko?: string;
  fr?: string;
  de?: string;
  es?: string;
  pt?: string;
  ru?: string;
  it?: string;
  ar?: string;
  hi?: string;
  th?: string;
  vi?: string;
}

const props = defineProps<LocalizedTextProps>();

// 获取当前语言，简化为只提取主语言代码
const getCurrentLanguage = (): string => {
  try {
    return moment.locale().split('-')[0]; // 'zh-cn' -> 'zh'
  } catch {
    return 'en'; // 默认英语
  }
};

// 计算显示文本 - 直接匹配或返回英语
const localizedText = computed(() => {
  const lang = getCurrentLanguage();
  return props[lang as keyof LocalizedTextProps] || props.en;
});
</script>

<style scoped>
/* 这个组件不需要任何样式，纯粹用于文本显示 */
span {
  display: contents;
}

/* 简化实现: 直接使用 Obsidian 的 moment.locale() 获取语言并匹配 props */
</style> 