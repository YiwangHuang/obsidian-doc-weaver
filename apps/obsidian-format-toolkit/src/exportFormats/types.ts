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
import typstArticleConfig from './defaultStyleConfig/typst/article_config.typ?raw';
import typstArticleDemoZh from './defaultStyleConfig/typst/article_demo_zh.typ?raw';
import typstArticleDemoEn from './defaultStyleConfig/typst/article_demo_en.typ?raw';
import typstSlidesConfig from './defaultStyleConfig/typst/slides_config.typ?raw';
import typstSlidesDemoZh from './defaultStyleConfig/typst/slides_demo_zh.typ?raw';
import typstSlidesDemoEn from './defaultStyleConfig/typst/slides_demo_en.typ?raw';
import typstCustomStyles from './defaultStyleConfig/typst/DW_styles.typ?raw';

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
export interface ThemeDependency {
    /** 相对于样式目录的文件路径 */
    relative_path: string;
    /** 文件内容 */
    content: string;
}

/**
 * 预设模板描述符：描述一种格式下的一个预设方案
 * 用于在"添加导出格式"时提供可选的内置模板
 */
export interface PresetDescriptor {
    /** 预设显示名称（如 'Typst - 默认'），同时作为新建配置的初始名称 */
    name: string;
    /** 所属格式 */
    format: OutputFormat;
    /** 覆盖的 ExportConfig 字段（如 contentTemplate 等），不含动态字段 */
    overrides: Partial<ExportConfig>;
    /** 该预设专属的风格文件列表 */
    themeDependencies: ThemeDependency[];
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

const YAML_TYPST =`#import "DW_styles.typ": *
#import "@preview/mitex:0.2.5": *
#import "@preview/tablem:0.3.0": tablem
#import "DW_styles.typ": *
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
    outputDirAbsTemplate:   { type: 'string',  required: true,  default: path.join(placeholders.VAR_VAULT_DIR, 'output', placeholders.VAR_PRESET_NAME) }, // 默认值为 vault 根目录下的 output 目录
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
 * 提供 createConfig / createAssetStructure / getPresets 等通用方法，
 * 子类通过覆盖 getPresets() 提供格式特定的预设模板列表
 */
class ExportConfigBaseIO extends ConfigIO<ExportConfig> {
    constructor(fieldDefs: Record<string, FieldDef> = exportConfigBase) {
        super(fieldDefs);
    }

    /**
     * 获取该格式下所有可用预设模板，子类覆盖以提供格式特定预设
     * @returns 预设模板描述符数组
     */
    getPresets(): PresetDescriptor[] {
        return [];
    }

    /**
     * 基于 getDefaults() 创建一个新的导出配置
     * 动态字段（id、commandId 等）由 hexId 生成，其余使用 fieldDefs 中的默认值（含 icon）
     * @param hexId 唯一标识符（十六进制时间戳）
     * @param preset 可选预设模板，提供时将合并其 overrides 字段，并以预设名称作为初始名称
     * @returns 完整的 ExportConfig 对象
     */
    createConfig(hexId: string, preset?: PresetDescriptor): ExportConfig {
        const defaults = this.getDefaults();
        return {
            ...defaults,
            // 预设覆盖字段（放在动态字段之前，不会覆盖 id/commandId 等动态字段）
            ...(preset?.overrides ?? {}),
            // 以下为动态字段，始终基于 hexId 生成，不受预设覆盖影响
            id: `export-${hexId}`,
            commandId: `doc-weaver:export-${hexId}`,
            styleDirRel: path.posix.join('styles', hexId),
            name: preset?.name ? `${preset.name}-${hexId}` : `export-${hexId}`,
        } as ExportConfig;
    }

    /**
     * 在指定路径创建格式的资源文件结构
     * 基于预设的 themeDependencies 逐一写入文件
     * @param basePath 样式目录的绝对路径
     * @param preset 可选预设模板，提供时使用其 themeDependencies
     */
    createAssetStructure(basePath: string, preset?: PresetDescriptor): void {
        const dependencies = preset?.themeDependencies ?? [];
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

    /** Typst 格式的预设模板列表 */
    getPresets(): PresetDescriptor[] {
        return [
            {
                name: 'Typst-' + getLocalizedText({ en: 'Article', zh: '文章' }),
                format: 'typst',
                overrides: {
                    contentTemplate: `#import "article_config.typ": *

#show: DW_article.with(
  title: [${placeholders.VAR_NOTE_NAME}],
  author: [Author],
  date: [${placeholders.VAR_DATE}],
)
${placeholders.VAR_CONTENT}
`
                },
                themeDependencies: [
                    { relative_path: 'article_config.typ', content: typstArticleConfig },
                    { relative_path: 'DW_styles.typ', content: typstCustomStyles },
                    { relative_path: 'demo.typ', content: getLocalizedText({ en: typstArticleDemoEn, zh: typstArticleDemoZh }) },
                ],
            },
            {
                name: 'Typst-' + getLocalizedText({ en: 'Slides', zh: '幻灯片' }),
                format: 'typst',
                overrides: {
                    contentTemplate: `#import "slides_config.typ": *

#show: DW_slides.with(
  title: [${placeholders.VAR_NOTE_NAME}],
  subtitle: [],
  author: [Author],
  date: [${placeholders.VAR_DATE}],
  institution: [],
  logo: none,
)
${placeholders.VAR_CONTENT}
`
                },
                themeDependencies: [
                    { relative_path: 'slides_config.typ', content: typstSlidesConfig },
                    { relative_path: 'DW_styles.typ', content: typstCustomStyles },
                    { relative_path: 'demo.typ', content: getLocalizedText({ en: typstSlidesDemoEn, zh: typstSlidesDemoZh }) },
                ],
            },
            // 在此追加更多 Typst 预设模板...
        ];
    }
}

/** ExportConfig HMD 读写中间层 */
class ExportConfigHMDIO extends ExportConfigBaseIO {
    constructor() {
        super(exportConfigHMD);
    }

    /** HMD 格式的预设模板列表 */
    getPresets(): PresetDescriptor[] {
        return [
            {
                name: 'HMD',
                format: 'HMD',
                overrides: {},
                themeDependencies: [],
            },
            // 在此追加更多 HMD 预设模板...
        ];
    }
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

/** 根据已有导出配置对象获取对应的IO实例 */
export function getExportConfigIO(exportConfig: ExportConfig): ExportConfigTypstIO | ExportConfigHMDIO | ExportConfigBaseIO {
    return getExportConfigIOByFormat(exportConfig.format);
}

/** 根据格式字符串获取对应的IO实例（用于"添加"流程中尚无 ExportConfig 对象时） */
export function getExportConfigIOByFormat(format: OutputFormat): ExportConfigBaseIO {
    switch (format) {
        case 'typst':   return exportConfigTypstIO;
        case 'HMD':     return exportConfigHMDIO;
        default:        return new ExportConfigBaseIO(); //TODO: 其他格式暂不支持，返回空实例
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
