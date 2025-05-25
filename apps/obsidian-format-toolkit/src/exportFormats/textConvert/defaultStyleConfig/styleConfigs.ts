import typstConfig from "./typst/config.typ?raw";
import typstCustomFormat from "./typst/custom_format.typ?raw";
import type { OutputFormat } from "../textConverter";
import * as path from 'path';
import * as fs from 'fs';

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
  theme_dependency: [
    {
      relative_path: "config.typ",
      content: typstConfig
    },
    {
      relative_path: "custom_format.typ",
      content: typstCustomFormat
    }
  ],
  yaml: `#import "config.typ": *

#show: doc => conf(
  title: "{{noteName}}",
  author: "Your name",
  doc,
)`
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

/**
 * 基于样式配置创建格式的默认文件结构
 * @param basePath 目标路径
 * @param format 格式类型
 */
export function createFormatAssetStructure(basePath: string, format: OutputFormat): void {
    // 从样式配置中获取主题依赖文件
    const styleConfig = getStyleConfig(format);
    
    if (!styleConfig?.theme_dependency) {
        return; // 如果没有主题依赖，直接返回
    }
    
    // 创建每个主题依赖文件
    for (const dependency of styleConfig.theme_dependency) {
        const fullPath = path.join(basePath, dependency.relative_path);
        const dirPath = path.dirname(fullPath);
        
        // 确保目录存在
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // 写入文件内容
        fs.writeFileSync(fullPath, dependency.content);
    }
}

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