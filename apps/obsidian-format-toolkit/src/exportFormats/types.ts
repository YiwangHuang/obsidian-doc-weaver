/**
 * Export Formats 模块的类型定义与校验
 *
 * - ConfigIO<T>：通用配置读写中间层，直接实例化并传入 fieldDefs 即可使用
 * - exportConfigIO / exportManagerSettingsIO：两个预置实例
 */

import type { OutputFormat } from './textConvert/textConverter';
import type { BaseConfig } from '../general/types';
import { Notice } from 'obsidian';
import * as placeholders from '../lib/constant';
import * as path from 'path';

// ======================== 接口定义 ========================

/** 单个导出格式配置接口，新增字段需同步修改 exportConfigIO */
export interface ExportConfig extends BaseConfig {
    id: string;
    commandId: string;
    styleDirRel: string;
    format: OutputFormat;
    contentTemplate: string;
    outputDirAbsTemplate: string;
    outputBasenameTemplate: string;
    imageDirAbsTemplate: string;
    imageLinkTemplate: string;
    processVideo?: boolean;
    videoDirAbsTemplate?: string;
    videoLinkTemplate?: string;
    processAudio?: boolean;
    audioDirAbsTemplate?: string;
    audioLinkTemplate?: string;
    excalidrawExportType: 'png' | 'svg';
    excalidrawPngScale: number;
}

/** 导出管理器设置接口，新增字段需同步修改 exportManagerSettingsIO */
export interface ExportManagerSettings {
    exportConfigs: ExportConfig[];
    batchExportEnabled?: boolean;
}

// ======================== 字段描述符 ========================

/** 支持的字段类型：基础类型 + 数组（仅检查 Array.isArray） */
export type FieldType = 'string' | 'number' | 'boolean' | 'array';

/** 字段描述符：类型、是否必填、约束、默认值 */
export interface FieldDef {
    type: FieldType;
    required: boolean;
    /** 自定义校验函数，返回 true 表示合法（在基础类型检查通过后调用） */
    validate?: (value: unknown) => boolean;
    /** 默认值，不提供表示无默认值（如 id 需动态生成） */
    default?: unknown;
}

// ======================== ConfigIO ========================

/**
 * 通用配置读写中间层
 * 直接 new ConfigIO<T>(fieldDefs) 即可，无需继承
 */
export class ConfigIO<T extends object> {
    protected readonly fieldDefs: Record<string, FieldDef>;

    constructor(fieldDefs: Record<string, FieldDef>) {
        this.fieldDefs = fieldDefs;
    }

    /** 纯检查：字段值是否合法 */
    private isFieldValid(value: unknown, def: FieldDef): boolean {
        if (value === undefined) return !def.required;
        if (def.type === 'array') return Array.isArray(value);
        if (typeof value !== def.type) return false;
        if (def.validate && !def.validate(value)) return false;
        return true;
    }

    /**
     * 校验并修复单个字段
     * @param silent 为 true 时静默修复（不弹 Notice），用于 sanitize 场景
     * @returns true = 合法或已修复；false = 无法修复
     */
    private repairField(record: Record<string, unknown>, key: string, def: FieldDef, silent = false): boolean {
        if (this.isFieldValid(record[key], def)) return true;
        if (!('default' in def)) return false;
        if (!silent) {
            const old = record[key] === undefined ? '(缺失)' : JSON.stringify(record[key]);
            new Notice(`配置项 "${key}" 的值 ${old} 无效，已重置为默认值: ${JSON.stringify(def.default)}`);
        }
        record[key] = def.default;
        return true;
    }

    /** 类型守卫：校验并自动修复（弹 Notice） */
    isValid(obj: unknown): obj is T {
        if (!obj || typeof obj !== 'object') return false;
        const record = obj as Record<string, unknown>;
        let ok = true;
        for (const [key, def] of Object.entries(this.fieldDefs)) {
            if (!this.repairField(record, key, def)) ok = false;
        }
        return ok;
    }

    /** 安全解析：合法返回 T，否则 undefined */
    parse(obj: unknown): T | undefined {
        return this.isValid(obj) ? obj : undefined;
    }

    /** 静默修复所有不合法或缺失的字段（不弹 Notice） */
    sanitize(config: T): T {
        const record = config as Record<string, unknown>;
        for (const [key, def] of Object.entries(this.fieldDefs)) {
            this.repairField(record, key, def, true);
        }
        return config;
    }

    /** 获取指定字段的默认值 */
    getDefault(key: string): unknown {
        const def = this.fieldDefs[key];
        return def && 'default' in def ? def.default : undefined;
    }

    /** 获取所有有默认值的字段 */
    getDefaults(): Partial<T> {
        const result: Record<string, unknown> = {};
        for (const [key, def] of Object.entries(this.fieldDefs)) {
            if ('default' in def) result[key] = def.default;
        }
        return result as Partial<T>;
    }
}

// ======================== 实例 ========================


const YAML_HMD: string =`---
title: ${placeholders.VAR_NOTE_NAME}
author: your name
date: ${placeholders.VAR_DATE}
categories:
  - your category
tags:
  - your tag
---
${placeholders.VAR_CONTENT}`

const YAML_TYPST: string =`---
title: "${placeholders.VAR_NOTE_NAME}"
author: "your name"
date: "${placeholders.VAR_DATE}"
format:
  html:
    toc: true
    number-sections: true
    code-fold: true
    theme: cosmo
---
${placeholders.VAR_CONTENT}`



/** 常用的 validate 工具函数 */
const oneOf = (...values: unknown[]) => (v: unknown) => values.includes(v);
const between = (min: number, max: number) => (v: unknown) => typeof v === 'number' && v >= min && v <= max;

const exportConfigBase: Record<keyof ExportConfig, FieldDef> = {
    name:                   { type: 'string',  required: true },
    icon:                   { type: 'string',  required: false },
    enabled:                { type: 'boolean', required: true,  default: true },
    id:                     { type: 'string',  required: true },
    commandId:              { type: 'string',  required: true },
    styleDirRel:            { type: 'string',  required: true,  default: path.join(placeholders.VAR_VAULT_DIR, 'output') },
    format:                 { type: 'string',  required: true,  validate: oneOf('quarto', 'HMD', 'typst', 'plain') },
    contentTemplate:        { type: 'string',  required: true,  default: '' },
    outputDirAbsTemplate:   { type: 'string',  required: true },
    outputBasenameTemplate: { type: 'string',  required: true,  default: placeholders.VAR_NOTE_NAME + '_' + placeholders.VAR_DATE },
    imageDirAbsTemplate:    { type: 'string',  required: true,  default: path.join(placeholders.VAR_OUTPUT_DIR, 'assets') },
    imageLinkTemplate:      { type: 'string',  required: true },
    processVideo:           { type: 'boolean', required: false, default: false },
    videoDirAbsTemplate:    { type: 'string',  required: false },
    videoLinkTemplate:      { type: 'string',  required: false },
    processAudio:           { type: 'boolean', required: false, default: false },
    audioDirAbsTemplate:    { type: 'string',  required: false },
    audioLinkTemplate:      { type: 'string',  required: false },
    excalidrawExportType:   { type: 'string',  required: true,  validate: oneOf('png', 'svg'), default: 'png' },
    excalidrawPngScale:     { type: 'number',  required: true,  validate: between(1, 9), default: 2 },
} 

const exportConfigTypst: Record<keyof ExportConfig, FieldDef> = {
    ...exportConfigBase,
    format:                 { type: 'string',  required: true,  validate: oneOf('typst'), default: 'typst' },
    contentTemplate:        { type: 'string',  required: true,  validate: (value: string) => value.includes(placeholders.VAR_CONTENT), default: YAML_TYPST },
    imageLinkTemplate:      { type: 'string',  required: true,  default: `#image("${path.join('assets', placeholders.VAR_ATTACHMENT_FILE_NAME)}", width: 100%)` },
    processVideo:           { type: 'boolean', required: false, validate: oneOf(false), default: false },
    processAudio:           { type: 'boolean', required: false, validate: oneOf(false), default: false },
}

const exportConfigHMD: Record<keyof ExportConfig, FieldDef> = {
    ...exportConfigBase,
    format:                 { type: 'string',  required: true,  validate: oneOf('HMD'), default: 'HMD' },
    contentTemplate:        { type: 'string',  required: true,  validate: (value: string) => value.includes(placeholders.VAR_CONTENT), default: YAML_HMD },
    videoDirAbsTemplate:    { type: 'string',  required: false, default: path.join(placeholders.VAR_OUTPUT_DIR, 'assets') },
    videoLinkTemplate:      { type: 'string',  required: false, default: `![[]](${path.join('assets',placeholders.VAR_ATTACHMENT_FILE_NAME)})` },
    audioDirAbsTemplate:    { type: 'string',  required: false, default: path.join(placeholders.VAR_OUTPUT_DIR, 'assets') },
    audioLinkTemplate:      { type: 'string',  required: false, default: `![[]](${path.join('assets',placeholders.VAR_ATTACHMENT_FILE_NAME)})` },
}


/** ExportConfig 读写中间层 */
export const exportConfigIO = new ConfigIO<ExportConfig>(exportConfigBase);

/** ExportManagerSettings 读写中间层 */
export const exportManagerSettingsIO = new ConfigIO<ExportManagerSettings>({
    exportConfigs:      { type: 'array',   required: true, default: [] },
    batchExportEnabled: { type: 'boolean', required: false, default: false },
});

// ======================== 兼容性导出 ========================

export function isExportConfig(obj: unknown): obj is ExportConfig {
    return exportConfigIO.isValid(obj);
}

export function isExportManagerSettings(obj: unknown): obj is ExportManagerSettings {
    return exportManagerSettingsIO.isValid(obj);
}

// ======================== 默认值与常量 ========================

export const DEFAULT_EXPORT_FORMATS_SETTINGS: ExportManagerSettings = {
    exportConfigs: [],
    batchExportEnabled: false,
};

export const EXPORT_CONFIGS_CONSTANTS = {
    DEFAULT_OUTPUT_DIR: path.join(placeholders.VAR_VAULT_DIR, 'output'),
    DEFAULT_OUTPUT_BASE_NAME: placeholders.VAR_NOTE_NAME,
    DEFAULT_ATTACHMENT_DIR_ABS_TEMPLATE: path.join(placeholders.VAR_OUTPUT_DIR, 'assets'),
    DEFAULT_ATTACHMENT_REF_TEMPLATE_TYPST: `#image("assets/${placeholders.VAR_ATTACHMENT_FILE_NAME}", width: 100%)`,
    DEFAULT_ATTACHMENT_REF_TEMPLATE_HMD: `![](assets/${placeholders.VAR_ATTACHMENT_FILE_NAME})`,
    DEFAULT_EXCALIDRAW_EXPORT_TYPE: 'png' as const,
    DEFAULT_EXCALIDRAW_PNG_SCALE: 2,
    MIN_PNG_SCALE: 1,
    MAX_PNG_SCALE: 9,
    PNG_SCALE_STEP: 1,
} as const;

export const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
    { value: 'typst', label: 'Typst' },
    { value: 'HMD', label: 'HMD' },
];

// TODO: 暂时不支持，后续待开发
// { value: 'quarto', label: 'Quarto' },
// { value: 'plain', label: 'Plain' }

export const EXCALIDRAW_EXPORT_OPTIONS = [
    { value: 'png', label: 'PNG' },
    { value: 'svg', label: 'SVG' },
] as { value: 'png' | 'svg'; label: string }[];

export const EXTENSION_MAP: Record<OutputFormat, string> = {
    'typst': 'typ',
    'HMD': 'md',
    'quarto': 'qmd',
    'plain': 'md',
} as const;
