/**
 * Export Formats 模块的类型定义与校验
 *
 * - ConfigIO<T>：通用配置读写中间层，直接实例化并传入 fieldDefs 即可使用
 * - exportConfigBaseIO / exportConfigTypstIO / exportConfigHMDIO / exportManagerSettingsIO：预置实例
 */

import type { OutputFormat } from './textConvert/textConverter';
import type { BaseConfig } from '../general/types';
import type { FieldDef } from '../lib/configIOUtils';
import { ConfigIO, oneOf, between } from '../lib/configIOUtils';
import * as placeholders from '../lib/constant';
import * as path from 'path';
import * as fs from 'fs';
import { getLocalizedText } from '../lib/textUtils';

// Typst 格式的主题依赖文件（通过 Vite ?raw 导入为字符串）
import typstConfig from './defaultStyleConfig/typst/config.typ?raw';
import typstCustomFormat from './defaultStyleConfig/typst/DW_styles.typ?raw';
import typstDemoZh from './defaultStyleConfig/typst/demo_zh.typ?raw';
import typstDemoEn from './defaultStyleConfig/typst/demo_en.typ?raw';

// ======================== 接口定义 ========================

/** 单个导出格式配置接口，新增字段需同步修改 exportConfigBase fieldDefs */
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
    renameExportAttachment: boolean; // 是否为导出附件名增加随机数后缀，避免同名冲突
    excalidrawExportType: 'png' | 'svg';
    excalidrawPngScale: number;
}

/** 主题依赖文件描述符：描述一个需要写入到样式目录的文件 */
interface ThemeDependency {
    /** 相对于样式目录的文件路径 */
    relative_path: string;
    /** 文件内容 */
    content: string;
}

/** 导出管理器设置接口，新增字段需同步修改 exportManagerSettingsIO */
export interface ExportManagerSettings {
    exportConfigs: ExportConfig[];
    batchExportEnabled?: boolean;
}

// ======================== 实例 ========================

const YAML_HMD =`---
title: ${placeholders.VAR_NOTE_NAME}
author: your name
date: ${placeholders.VAR_DATE}
categories:
  - your category
tags:
  - your tag
---
${placeholders.VAR_CONTENT}`

const YAML_TYPST =`#import "config.typ": *

#show: doc => conf(
  title: "${placeholders.VAR_NOTE_NAME}",
  author: "",
  date: "${placeholders.VAR_DATE}",
  doc,
)
${placeholders.VAR_CONTENT}
`

const exportConfigBase: Record<keyof ExportConfig, FieldDef> = {
    name:                   { type: 'string',  required: true },
    icon:                   { type: 'string',  required: false },
    enabled:                { type: 'boolean', required: true,  default: true },
    id:                     { type: 'string',  required: true },
    commandId:              { type: 'string',  required: true },
    styleDirRel:            { type: 'string',  required: true,  default: path.join(placeholders.VAR_VAULT_DIR, 'output') },
    format:                 { type: 'string',  required: true,  validate: oneOf('quarto', 'HMD', 'typst', 'plain') },
    contentTemplate:        { type: 'string',  required: true,  default: '' },
    outputDirAbsTemplate:   { type: 'string',  required: true,  default: path.join(placeholders.VAR_VAULT_DIR, 'output') }, // 默认值为 vault 根目录下的 output 目录
    outputBasenameTemplate: { type: 'string',  required: true,  default: placeholders.VAR_NOTE_NAME + '_' + placeholders.VAR_DATE },
    imageDirAbsTemplate:    { type: 'string',  required: true,  default: path.join(placeholders.VAR_OUTPUT_DIR, 'assets') },
    imageLinkTemplate:      { type: 'string',  required: true },
    processVideo:           { type: 'boolean', required: false, default: false },
    videoDirAbsTemplate:    { type: 'string',  required: false },
    videoLinkTemplate:      { type: 'string',  required: false },
    processAudio:           { type: 'boolean', required: false, default: false },
    audioDirAbsTemplate:    { type: 'string',  required: false },
    audioLinkTemplate:      { type: 'string',  required: false },
    renameExportAttachment: { type: 'boolean', required: true, default: false },
    excalidrawExportType:   { type: 'string',  required: true,  validate: oneOf('png', 'svg'), default: 'png' },
    excalidrawPngScale:     { type: 'number',  required: true,  validate: between(1, 9), default: 2 },
} 

const exportConfigTypst: Record<keyof ExportConfig, FieldDef> = {
    ...exportConfigBase,
    icon:                   { type: 'string',  required: false, default: 'file-text' },
    format:                 { type: 'string',  required: true,  validate: oneOf('typst'), default: 'typst' },
    contentTemplate:        { type: 'string',  required: true,  validate: (value: string) => value.includes(placeholders.VAR_CONTENT), default: YAML_TYPST },
    imageLinkTemplate:      { type: 'string',  required: true,  validate: (value: string) => value.includes(placeholders.VAR_ATTACHMENT_FILE_NAME), default: `#image("${path.join('assets', placeholders.VAR_ATTACHMENT_FILE_NAME)}", width: 100%)` },
    processVideo:           { type: 'boolean', required: false, validate: oneOf(false), default: false },
    processAudio:           { type: 'boolean', required: false, validate: oneOf(false), default: false },
}

const exportConfigHMD: Record<keyof ExportConfig, FieldDef> = {
    ...exportConfigBase,
    icon:                   { type: 'string',  required: false, default: 'book' },
    format:                 { type: 'string',  required: true,  validate: oneOf('HMD'), default: 'HMD' },
    contentTemplate:        { type: 'string',  required: true,  validate: (value: string) => value.includes(placeholders.VAR_CONTENT), default: YAML_HMD },
    imageLinkTemplate:      { type: 'string',  required: true,  validate: (value: string) => value.includes(placeholders.VAR_ATTACHMENT_FILE_NAME), default: `![](${path.join('assets', placeholders.VAR_ATTACHMENT_FILE_NAME)})` },
    videoDirAbsTemplate:    { type: 'string',  required: false, default: path.join(placeholders.VAR_OUTPUT_DIR, 'assets') },
    videoLinkTemplate:      { type: 'string',  required: false, validate: (value: string) => value.includes(placeholders.VAR_ATTACHMENT_FILE_NAME), default: `![[]](${path.join('assets',placeholders.VAR_ATTACHMENT_FILE_NAME)})` },
    audioDirAbsTemplate:    { type: 'string',  required: false, default: path.join(placeholders.VAR_OUTPUT_DIR, 'assets') },
    audioLinkTemplate:      { type: 'string',  required: false, validate: (value: string) => value.includes(placeholders.VAR_ATTACHMENT_FILE_NAME), default: `![[]](${path.join('assets',placeholders.VAR_ATTACHMENT_FILE_NAME)})` },
}


/**
 * ExportConfig 中间基类
 * 提供 createConfig / createAssetStructure 等通用方法，
 * 子类通过覆盖 getThemeDependencies() 提供格式特定配置
 */
class ExportConfigBaseIO extends ConfigIO<ExportConfig> {
    constructor(fieldDefs: Record<string, FieldDef> = exportConfigBase) {
        super(fieldDefs);
    }

    /** 主题依赖文件列表，子类覆盖以提供格式特定的资源文件 */
    protected getThemeDependencies(): ThemeDependency[] {
        return [];
    }

    /**
     * 基于 getDefaults() 创建一个新的导出配置
     * 动态字段（id、commandId 等）由 hexId 生成，其余使用 fieldDefs 中的默认值（含 icon）
     * @param hexId 唯一标识符（十六进制时间戳）
     * @returns 完整的 ExportConfig 对象
     */
    createConfig(hexId: string): ExportConfig {
        const defaults = this.getDefaults();
        return {
            ...defaults,
            // 以下为动态字段，需基于 hexId 生成，无法在 fieldDefs 中预设
            id: `export-${hexId}`,
            commandId: `doc-weaver:export-${hexId}`,
            styleDirRel: path.posix.join('styles', hexId),
            name: `export-${hexId}`,
            outputDirAbsTemplate: path.posix.join(defaults.outputDirAbsTemplate as string, hexId),
        } as ExportConfig;
    }

    /**
     * 在指定路径创建格式的默认资源文件结构
     * 基于 getThemeDependencies() 返回的文件列表逐一写入
     * @param basePath 样式目录的绝对路径
     */
    createAssetStructure(basePath: string): void {
        const dependencies = this.getThemeDependencies();
        if (dependencies.length === 0) return;

        for (const dependency of dependencies) {
            const fullPath = path.posix.join(basePath, dependency.relative_path);
            const dirPath = path.dirname(fullPath);

            // 确保目录存在
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            // 写入文件内容
            fs.writeFileSync(fullPath, dependency.content);
        }
    }
}

/** ExportConfig Typst 读写中间层 */
class ExportConfigTypstIO extends ExportConfigBaseIO {
    constructor() {
        super(exportConfigTypst);
    }

    /** Typst 格式的主题依赖文件（config.typ、custom_format.typ、demo.typ） */
    protected getThemeDependencies(): ThemeDependency[] {
        return [
            { relative_path: 'config.typ', content: typstConfig },
            { relative_path: 'DW_styles.typ', content: typstCustomFormat },
            { relative_path: 'demo.typ', content: getLocalizedText({ en: typstDemoEn, zh: typstDemoZh }) },
        ];
    }
}

/** ExportConfig HMD 读写中间层 */
class ExportConfigHMDIO extends ExportConfigBaseIO {
    constructor() {
        super(exportConfigHMD);
    }

    // HMD 格式无主题依赖文件，使用基类默认的空数组
}

/** ExportManagerSettings 读写中间层，可在此扩展 Settings 特有的方法 */
class ExportManagerSettingsIO extends ConfigIO<ExportManagerSettings> {
    constructor() {
        super({
            exportConfigs:      { type: 'array',   required: true, default: [] },
            batchExportEnabled: { type: 'boolean', required: false, default: false },
        });
    }

    getDefaults(): ExportManagerSettings {
        return super.getDefaults() as ExportManagerSettings;
    }
    // 在此添加 Settings 专用方法
}

/** 根据导出格式获取对应的IO实例 */
export function getExportConfigIO(exportConfig: ExportConfig): ExportConfigTypstIO | ExportConfigHMDIO | ExportConfigBaseIO {
    switch (exportConfig.format) {
        case 'typst':   
            return exportConfigTypstIO;
        case 'HMD':
            return exportConfigHMDIO;
        default:
            return new ExportConfigBaseIO(); //TODO: 其他格式暂不支持，返回空实例，后续应对每一格式提供特有的IO实例，取消default返回值
    }
}

/** 单例实例 */
export const exportConfigTypstIO = new ExportConfigTypstIO();
export const exportConfigHMDIO = new ExportConfigHMDIO();
export const exportManagerSettingsIO = new ExportManagerSettingsIO();

// ======================== 默认值与常量 ========================

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
