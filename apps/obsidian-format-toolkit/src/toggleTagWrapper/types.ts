import type { BaseConfig } from "../general/types";
import type { FieldDef } from "../lib/configIOUtils";
import { ConfigIO, oneOf } from "../lib/configIOUtils";
/**
 * Toggle Tag Wrapper模块的类型定义
 */

/**
 * 标签配置接口 - 基于HTML标签类型和类名的配置
 */
export interface TagConfig extends BaseConfig {
    id: string;
    commandId: string;
    /** HTML标签类型 */
    tagType: 'span' | 'font' | 'u' | 'i' | 's';
    /** HTML标签的class属性值，空字符串表示只匹配标签类型 */
    tagClass: string;
    /** Typst格式的前缀，不包含"[" */
    typstPrefix: string;
    /** CSS 片段，会根据启用状态热插拔到 Obsidian */
    cssSnippet: string;
}

/** 支持的标签类型 */
type SupportedTagType = TagConfig['tagType'];

/**
 * 基于TagConfig生成HTML开始标签
 * @param config 标签配置对象
 * @returns HTML开始标签字符串
 */
export function generateStartTagFromConfig(config: TagConfig): string {
    if (config.tagClass.trim() === '') {
        // 无class属性的标签
        return `<${config.tagType}>`;
    } else {
        // 有class属性的标签
        return `<${config.tagType} class="${config.tagClass}">`;
    }
}

/**
 * 基于TagConfig生成HTML结束标签
 * @param config 标签配置对象
 * @returns HTML结束标签字符串
 */
export function generateEndTagFromConfig(config: TagConfig): string {
    return `</${config.tagType}>`;
}

/**
 * 标签包装器设置接口
 */
export interface TagWrapperSettings {
    /** 标签配置数组 */
    tags: TagConfig[];
}

/** TagConfig 字段定义：描述类型、是否必填和默认值 */
const tagConfigFields: Record<keyof TagConfig, FieldDef> = {
    name:        { type: 'string',  required: true },
    icon:        { type: 'string',  required: false, default: 'tag' },
    enabled:     { type: 'boolean', required: true,  default: true },
    id:          { type: 'string',  required: true },
    commandId:   { type: 'string',  required: true },
    tagType:     { type: 'string',  required: true,  validate: oneOf('span', 'font', 'u', 'i', 's'), default: 'u' },
    tagClass:    { type: 'string',  required: true,  default: '' },
    typstPrefix: { type: 'string',  required: true,  default: '#DW_underline' },
    cssSnippet:  { type: 'string',  required: true,  default: `u {
    color: blue;
    cursor: pointer; /* 鼠标悬停显示为手型 */
    text-decoration: none; /* 去掉默认的下划线 */
    border-bottom: 1px solid black; /* 使用边框模拟下划线 */
    position: relative; /* 使得伪元素定位可以相对于元素 */
}` },
};

/**
 * TagConfig 读写中间层
 * 负责创建新配置，并复用 ConfigIO 的校验与默认值机制
 */
class TagConfigIO extends ConfigIO<TagConfig> {
    constructor() {
        super(tagConfigFields);
    }

    /**
     * 基于 getDefaults() 创建新的标签配置
     * @param hexId 唯一时间戳标识符
     * @param overrides 可选覆盖项
     */
    createConfig(hexId: string, overrides: Partial<TagConfig> = {}): TagConfig {
        const defaults = this.getDefaults() as Partial<TagConfig>;
        const tagType = (overrides.tagType ?? defaults.tagType ?? 'u') as SupportedTagType;
        return {
            ...defaults,
            ...overrides,
            id: `tag-${hexId}`,
            commandId: `doc-weaver:tag-${hexId}`,
            name: `tag-${overrides.name ?? hexId}`,
            tagType: tagType,
            typstPrefix: '',
            cssSnippet: '',
        } as TagConfig;
    }
}

/**
 * TagWrapperSettings 读写中间层
 * 集中维护模块默认配置，替代原 DEFAULT 常量
 */
class TagWrapperSettingsIO extends ConfigIO<TagWrapperSettings> {
    constructor() {
        super({
            tags: { type: 'array', required: true, default: [
                {
                    ...tagConfigIO.getDefaults(),
                    id: 'toggle-underline',
                    commandId: 'doc-weaver:toggle-underline',
                    name: 'Underline',
                    icon: 'underline'
                },
            ] },
        });
    }

    /** 覆盖父类返回值类型，便于调用侧直接获得完整类型 */
    getDefaults(): TagWrapperSettings {
        return super.getDefaults() as TagWrapperSettings;
    }
}

/** 单例实例：供模块入口与管理器复用 */
export const tagConfigIO = new TagConfigIO();
export const tagWrapperSettingsIO = new TagWrapperSettingsIO();