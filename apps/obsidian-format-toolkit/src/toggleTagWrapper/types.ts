/**
 * Toggle Tag Wrapper模块的类型定义
 * 
 * 包含标签包装器配置的所有类型定义和默认设置
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
            id: 'toggle-underline',
            name: 'Toggle Underline',
            prefix: '<u>',
            suffix: '</u>',
            enabled: true
        },
        {
            id: 'toggle-bold',
            name: 'Toggle Bold',
            prefix: '**',
            suffix: '**',
            enabled: true
        },
        {
            id: 'toggle-italic',
            name: 'Toggle Italic',
            prefix: '*',
            suffix: '*',
            enabled: true
        }
    ]
};

/**
 * 标签包装器相关的常量定义
 */
export const TAG_WRAPPER_CONSTANTS = {
    /** 新标签的默认前缀 */
    DEFAULT_TAG_PREFIX: '<tag>',
    /** 新标签的默认后缀 */
    DEFAULT_TAG_SUFFIX: '</tag>',
    /** 新标签的默认启用状态 */
    DEFAULT_ENABLED: true,
    /** 最小标签数量（不能全部删除） */
    MIN_TAG_COUNT: 1
} as const;

/**
 * 生成5位16进制随机ID
 * @returns string 格式如：'a1b2c'
 */
export function generateHexId(): string {
    return Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0');
}

/**
 * 创建新的标签配置
 * @param name 标签名称（可选）
 * @param prefix 前缀（可选）
 * @param suffix 后缀（可选）
 * @returns 新的标签配置对象
 */
export function createNewTagConfig(
    name?: string,
    prefix?: string,
    suffix?: string
): TagConfig {
    const hexId = generateHexId();
    return {
        id: `tag-${hexId}`,
        name: name || `新标签 ${hexId}`,
        prefix: prefix || TAG_WRAPPER_CONSTANTS.DEFAULT_TAG_PREFIX,
        suffix: suffix || TAG_WRAPPER_CONSTANTS.DEFAULT_TAG_SUFFIX,
        enabled: TAG_WRAPPER_CONSTANTS.DEFAULT_ENABLED
    };
}

/**
 * 验证标签配置是否有效
 * @param tag 标签配置
 * @returns 是否有效
 */
export function isValidTagConfig(tag: TagConfig): boolean {
    return !!(
        tag.id &&
        tag.name &&
        typeof tag.prefix === 'string' &&
        typeof tag.suffix === 'string' &&
        typeof tag.enabled === 'boolean'
    );
}

/**
 * 验证标签包装器设置是否有效
 * @param settings 标签包装器设置
 * @returns 是否有效
 */
export function isValidTagWrapperSettings(settings: TagWrapperSettings): boolean {
    return !!(
        settings.tags &&
        Array.isArray(settings.tags) &&
        settings.tags.length > 0 &&
        settings.tags.every(isValidTagConfig)
    );
} 