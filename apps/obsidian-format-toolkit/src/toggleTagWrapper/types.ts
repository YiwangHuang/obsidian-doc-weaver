import type { ToolbarItem } from "../general/types";
/**
 * Toggle Tag Wrapper模块的类型定义
 */

/**
 * 单个标签配置接口
 */
export interface TagConfig extends ToolbarItem {
    id: string;
    commandId: string;
    /** 开始标签（前缀） */
    prefix: string;
    /** 结束标签（后缀） */
    suffix: string;
    /** CSS 片段，会根据启用状态热插拔到 Obsidian */
    cssSnippet: string;
}

/**
 * 标签包装器设置接口
 */
export interface TagWrapperSettings {
    /** 标签配置数组 */
    tags: TagConfig[];
}

/**
 * 类型守卫函数：检查对象是否符合 TagConfig 接口
 * @param obj 要检查的对象
 * @returns 是否符合 TagConfig 接口
 */
export function isTagConfig(obj: unknown): obj is TagConfig {
    if (!obj || typeof obj !== 'object') return false;
    
    const config = obj as Record<string, unknown>;
    return typeof config.id === 'string' &&
           typeof config.name === 'string' &&
           typeof config.prefix === 'string' &&
           typeof config.suffix === 'string' &&
           typeof config.enabled === 'boolean' &&
           typeof config.cssSnippet === 'string' &&
           typeof config.icon === 'string';
}

/**
 * 类型守卫函数：检查对象是否符合 TagWrapperSettings 接口
 * @param obj 要检查的对象
 * @returns 是否符合 TagWrapperSettings 接口
 */
export function isTagWrapperSettings(obj: unknown): obj is TagWrapperSettings {
    if (!obj || typeof obj !== 'object') return false;
    
    const settings = obj as Record<string, unknown>;
    if (!Array.isArray(settings.tags)) return false;
    
    return settings.tags.every((tag: unknown) => isTagConfig(tag));
}

/**
 * 标签包装器的默认设置
 */
export const DEFAULT_TAG_WRAPPER_SETTINGS: TagWrapperSettings = {
    tags: [
        {
            id: 'toggle-underline',
            commandId: 'doc-weaver:toggle-underline',
            name: 'Underline',
            prefix: '<u>',
            suffix: '</u>',
            enabled: true,
            cssSnippet: `u {
color: blue; /* 下划线颜色 */
cursor: pointer; /* 鼠标悬停显示为手型 */
text-decoration: none; /* 去掉默认的下划线 */
border-bottom: 1px solid black; /* 使用边框模拟下划线 */
position: relative; /* 使得伪元素定位可以相对于 <u> 元素 */
}`,
            icon: 'underline'
        },
    ]
};