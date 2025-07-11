/**
 * Toggle Tag Wrapper模块的类型定义
 */

/**
 * 单个标签配置接口
 */
export interface TagConfig {
    /** 命令ID，唯一标识符 */
    id: string;
    /** 命令名称，用于显示和识别 */
    name: string;
    /** 开始标签（前缀） */
    prefix: string;
    /** 结束标签（后缀） */
    suffix: string;
    /** 是否启用此标签配置 */
    enabled: boolean;
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
 * 标签包装器的默认设置
 */
export const DEFAULT_TAG_WRAPPER_SETTINGS: TagWrapperSettings = {
    tags: [
        {
            id: 'doc-weaver-toggle-underline',
            name: 'Toggle Underline',
            prefix: '<u>',
            suffix: '</u>',
            enabled: true,
            cssSnippet: '/* 下划线样式 */\nu {\n  text-decoration: underline;\n  text-decoration-color: var(--text-accent);\n}'
        },
    ]
};

/**
 * 生成6位16进制随机ID
 */
export function generateHexId(): string {
    return Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0');
}

/**
 * 创建新的标签配置
 */
export function createNewTagConfig(
    name?: string,
    prefix?: string,
    suffix?: string,
    cssSnippet?: string
): TagConfig {
    const hexId = generateHexId();
    return {
        id: `doc-weaver-tag-${hexId}`,
        name: name || `tag-${hexId}`,
        prefix: prefix || '<u>',
        suffix: suffix || '</u>',
        enabled: true,
        cssSnippet: cssSnippet || `u {
    color: blue;
    cursor: pointer; /* 鼠标悬停显示为手型 */
    text-decoration: none; /* 去掉默认的下划线 */
    border-bottom: 1px solid black; /* 使用边框模拟下划线 */
    position: relative; /* 使得伪元素定位可以相对于 <u> 元素 */
}`
    };
} 