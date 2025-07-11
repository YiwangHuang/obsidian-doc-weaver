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
            enabled: true
        },
        {
            id: 'doc-weaver-toggle-bold',
            name: 'Toggle Bold',
            prefix: '**',
            suffix: '**',
            enabled: true
        },
        {
            id: 'doc-weaver-toggle-italic',
            name: 'Toggle Italic',
            prefix: '*',
            suffix: '*',
            enabled: true
        }
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
    suffix?: string
): TagConfig {
    const hexId = generateHexId();
    return {
        id: `doc-weaver-tag-${hexId}`,
        name: name || `tag-${hexId}`,
        prefix: prefix || '<u>',
        suffix: suffix || '</u>',
        enabled: true
    };
} 