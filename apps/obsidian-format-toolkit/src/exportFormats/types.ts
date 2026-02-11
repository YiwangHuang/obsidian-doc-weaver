/**
 * Export Formats模块的类型定义
 * 
 * 包含导出格式配置的所有类型定义和默认设置
 */

import type { OutputFormat } from './textConvert/textConverter';
import type { ToolbarItem } from '../general/types';
import * as placeholders from '../lib/constant';
import * as path from 'path';

/**
 * 单个导出格式配置接口
 * 修改需同步修改类型守卫函数isExportConfig
 */
export interface ExportConfig extends ToolbarItem {
    /** 格式ID，唯一标识符 */
    id: string;
    commandId: string;
    /** 样式文件夹路径，相对于插件目录 */
    style_dir_rel: string;
    /** 导出格式类型 */
    format: OutputFormat;
    /** 模板内容 */
    content_template: string;
    /** 输出目录绝对路径模板 */
    output_dir_abs_template: string;
    /** 输出文件基名模板(不含扩展名) */
    output_basename_template: string;
    /** 附件目录绝对路径模板，可以用占位符+相对路径生成 */
    attachment_dir_abs_template: string;
    /** 附件引用模板，必须包含占位符{{attachmentFileName}}。推荐使用相对路径(相对于项目根目录或导出的文件) */
    attachment_ref_template: string;
    /** 媒体附件目录绝对路径模板，可以用占位符+相对路径生成 */
    media_dir_abs_template?: string;
    /** 媒体附件引用模板，必须包含占位符{{attachmentFileName}}。推荐使用相对路径(相对于项目根目录或导出的文件) */
    media_link_template?: string;
    /** 是否处理音视频附件，默认为false */
    process_media_attachments?: boolean;
    /** Excalidraw导出类型 */
    excalidraw_export_type: 'png' | 'svg';
    /** PNG导出时的缩放比例 */
    excalidraw_png_scale: number;
}

/**
 * 导出管理器设置接口，修改需同步修改类型守卫函数isExportManagerSettings
 * 包含所有导出格式配置的容器，便于扩展更多设置项
 */
export interface ExportManagerSettings {
    /** 导出格式配置数组 */
    exportConfigs: ExportConfig[];
    batchExportEnabled?: boolean;
}

/**
 * 类型守卫函数：检查对象是否符合 ExportConfig 接口
 * @param obj 要检查的对象
 * @returns 是否符合 ExportConfig 接口
 * TODO: 展示屏蔽类型守卫函数，后续再实现
 */
export function isExportConfig(obj: unknown): obj is ExportConfig {
//     if (!obj || typeof obj !== 'object') return false;
    
//     const config = obj as Record<string, unknown>;
//     return typeof config.id === 'string' &&
//            typeof config.style_dir === 'string' &&
//            typeof config.format === 'string' &&
//            typeof config.enabled === 'boolean' &&
//            typeof config.template === 'string' &&
//            typeof config.name === 'string' &&
//            typeof config.output_dir === 'string' &&
//            typeof config.output_base_name === 'string' &&
//            (config.excalidraw_export_type === 'png' || config.excalidraw_export_type === 'svg') &&
//            typeof config.excalidraw_png_scale === 'number' &&
//            typeof config.icon === 'string' &&
//            // process_media_attachments 是可选的，所以需要检查是否存在且为布尔类型
//            (config.process_media_attachments === undefined || typeof config.process_media_attachments === 'boolean');
// }
return true;
}

/**
 * 类型守卫函数：检查对象是否符合 ExportManagerSettings 接口
 * @param obj 要检查的对象
 * @returns 是否符合 ExportManagerSettings 接口
 */
export function isExportManagerSettings(obj: unknown): obj is ExportManagerSettings {
    if (!obj || typeof obj !== 'object') return false;
    
    const settings = obj as Record<string, unknown>;
    if (!Array.isArray(settings.exportConfigs)) return false;
    
    // batchExportEnabled 是可选的，所以需要检查是否存在且为布尔类型
    const batchExportEnabledValid = settings.batchExportEnabled === undefined || 
                                     typeof settings.batchExportEnabled === 'boolean';
    
    return batchExportEnabledValid && 
           settings.exportConfigs.every((format: unknown) => isExportConfig(format));
}

/**
 * 导出模块的默认设置
 */
export const DEFAULT_EXPORT_FORMATS_SETTINGS: ExportManagerSettings = {
    exportConfigs: [],        
    batchExportEnabled: false,
};

/**
 * 导出预设相关的常量定义
 */
export const EXPORT_CONFIGS_CONSTANTS = {
    /** 默认输出目录 */
    DEFAULT_OUTPUT_DIR: path.join(placeholders.VAR_VAULT_DIR, 'output'),
    /** 默认输出文件名 */
    DEFAULT_OUTPUT_BASE_NAME: placeholders.VAR_NOTE_NAME,
    /** 默认附件目录 */
    DEFAULT_ATTACHMENT_DIR_ABS_TEMPLATE: path.join(placeholders.VAR_OUTPUT_DIR, 'assets'),
    /** 默认附件引用模板 */
    DEFAULT_ATTACHMENT_REF_TEMPLATE_TYPST: `#image("assets/${placeholders.VAR_ATTACHMENT_FILE_NAME}", width: 100%)`,
    /** 默认附件引用模板 */
    DEFAULT_ATTACHMENT_REF_TEMPLATE_HMD: `![](assets/${placeholders.VAR_ATTACHMENT_FILE_NAME})`,
    /** 默认Excalidraw导出类型 */
    DEFAULT_EXCALIDRAW_EXPORT_TYPE: 'png' as const,
    /** 默认PNG缩放比例 */
    DEFAULT_EXCALIDRAW_PNG_SCALE: 2,
    /** 最小PNG缩放比例 */
    MIN_PNG_SCALE: 1,
    /** 最大PNG缩放比例 */
    MAX_PNG_SCALE: 9,
    /** PNG缩放比例步长 */
    PNG_SCALE_STEP: 1
} as const;

/**
 * 导出格式类型选项
 */
export const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
    { value: 'typst', label: 'Typst' },
    { value: 'HMD', label: 'HMD' },
];

// TODO: 暂时不支持，后续待开发
// { value: 'quarto', label: 'Quarto' },
// { value: 'plain', label: 'Plain' }


/**
 * Excalidraw导出类型选项
 */
export const EXCALIDRAW_EXPORT_OPTIONS = [
    { value: 'png', label: 'PNG' },
    { value: 'svg', label: 'SVG' }
] as { value: 'png' | 'svg'; label: string }[];

/**
 * 根据格式获取文件扩展名的映射
 */
export const EXTENSION_MAP: Record<OutputFormat, string> = {
    'typst': 'typ',
    'HMD': 'md',
    'quarto': 'qmd',
    'plain': 'md'
} as const; 