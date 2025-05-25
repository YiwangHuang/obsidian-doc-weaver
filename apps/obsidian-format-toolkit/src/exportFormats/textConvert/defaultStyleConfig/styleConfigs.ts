import typstFunctions from "./typst/functions.typ?raw";
import type { OutputFormat } from "../textConverter";

// 导出 Typst 函数库文本（用于直接使用）
export { typstFunctions };

interface ThemeDependency {
  relative_path: string;
  content: string;
}

// 定义样式配置接口
interface StyleConfig {
  format: OutputFormat;
  description?: string;
  theme_dependency?: ThemeDependency[];
  yaml?: string;
}

// Typst 样式配置
const typstStyleConfig: StyleConfig = {
  format: "typst",
  description: "包含所有自定义块函数的 Typst 函数库",
  yaml: `#import "config.typ": *
  
  #show: doc => conf(
    title: "{{noteName}}",
    author: "Your name",
    doc,
    )`,
  theme_dependency: [
    {
      relative_path: "config.typ",
      content: typstFunctions
    }
  ],
};

// Quarto 样式配置
const quartoStyleConfig: StyleConfig = {
  format: "quarto",
  description: "Quarto 文档的默认配置模板",
  yaml: `---
title: "{{noteName}}"
author: "your name"
date: "{{date: YYYY-MM-DD}}"
format:
  html:
    toc: true
    number-sections: true
    code-fold: true
    theme: cosmo
---`
};

// VuePress 样式配置
const vuepressStyleConfig: StyleConfig = {
  format: "vuepress", 
  description: "VuePress 文档的默认配置模板",
  yaml: `---
title: {{noteName}}
author: your name
date: {{date: YYYY-MM-DD}}
categories:
  - your category
tags:
  - your tag
sidebar: auto
---`
};

// 导出所有样式配置
export const styleConfigs = {
  typst: typstStyleConfig,
  quarto: quartoStyleConfig,
  vuepress: vuepressStyleConfig
};

// 获取指定格式的默认 YAML 配置
export function getDefaultYAML(format: OutputFormat): string {
  const config = styleConfigs[format as keyof typeof styleConfigs];
  return config?.yaml || '';
}

// 获取指定格式的样式配置
export function getStyleConfig(format: OutputFormat): StyleConfig | undefined {
  return styleConfigs[format as keyof typeof styleConfigs];
}

// 默认导出
export default styleConfigs;