/**
 * Export Formats模块的类型定义
 * 
 * 包含导出格式配置的所有类型定义和默认设置
 */

import type { OutputFormat } from './textConvert/textConverter';
import * as placeholders from '../lib/constant';
import * as path from 'path';

/**
 * 单个导出格式配置接口
 * 修改需同步修改类型守卫函数isExportConfig
 */
export interface ExportConfig {
    /** 格式ID，唯一标识符 */
    id: string;
    /** 样式文件夹路径 */
    style_dir: string;
    /** 导出格式类型 */
    format: OutputFormat;
    /** 是否启用此配置 */
    enabled: boolean;
    /** 模板内容 */
    template: string;
    /** 格式名称，用于显示 */
    name: string;
    /** 输出目录路径 */
    output_dir: string;
    /** 输出文件基础名称 */
    output_base_name: string;
    /** Excalidraw导出类型 */
    excalidraw_export_type: 'png' | 'svg';
    /** PNG导出时的缩放比例 */
    excalidraw_png_scale: number;
    /** 导出格式图标，用于在UI中显示 */
    icon?: string;
}

/**
 * 导出管理器设置接口，修改需同步修改类型守卫函数isExportManagerSettings
 * 包含所有导出格式配置的容器，便于扩展更多设置项
 */
export interface ExportManagerSettings {
    /** 导出格式配置数组 */
    exportConfigs: ExportConfig[];
}

/**
 * 类型守卫函数：检查对象是否符合 ExportConfig 接口
 * @param obj 要检查的对象
 * @returns 是否符合 ExportConfig 接口
 */
export function isExportConfig(obj: unknown): obj is ExportConfig {
    if (!obj || typeof obj !== 'object') return false;
    
    const config = obj as Record<string, unknown>;
    return typeof config.id === 'string' &&
           typeof config.style_dir === 'string' &&
           typeof config.format === 'string' &&
           typeof config.enabled === 'boolean' &&
           typeof config.template === 'string' &&
           typeof config.name === 'string' &&
           typeof config.output_dir === 'string' &&
           typeof config.output_base_name === 'string' &&
           (config.excalidraw_export_type === 'png' || config.excalidraw_export_type === 'svg') &&
           typeof config.excalidraw_png_scale === 'number' &&
           (config.icon === undefined || typeof config.icon === 'string');
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
    
    return settings.exportConfigs.every((format: unknown) => isExportConfig(format));
}

/**
 * 导出格式的默认设置
 */
export const DEFAULT_EXPORT_FORMATS_SETTINGS: ExportManagerSettings = {
    exportConfigs: []
};

/**
 * 导出格式相关的常量定义
 */
export const EXPORT_FORMATS_CONSTANTS = {
    /** 默认输出目录 */
    DEFAULT_OUTPUT_DIR: path.join(placeholders.VAR_VAULT_DIR, 'output'),
    /** 默认输出文件名 */
    DEFAULT_OUTPUT_BASE_NAME: placeholders.VAR_NOTE_NAME,
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
export const FORMAT_OPTIONS = [
    { value: 'typst', label: 'Typst' },
    { value: 'vuepress', label: 'VuePress' },
] as { value: OutputFormat; label: string }[];

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
    'vuepress': 'md',
    'quarto': 'qmd',
    'plain': 'md'
} as const; 