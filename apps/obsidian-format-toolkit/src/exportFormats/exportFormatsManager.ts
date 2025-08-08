import type MyPlugin from "../main";
import path from "path";
import fs from "fs";
import { ExportManagerSettings, ExportConfig, isExportManagerSettings } from "./types";
import { exportFormatsInfo } from "./index";
import { TextConverter } from './textConvert/index';
import { generateTimestamp } from "../lib/idGenerator";
import { OutputFormat, extensionNameOfFormat } from "./textConvert/textConverter";
import { getDefaultYAML, createFormatAssetStructure } from './textConvert/defaultStyleConfig/styleConfigs';
import { debugLog } from "../lib/debugUtils";
import { EXPORT_FORMATS_CONSTANTS } from "./types";
import { TFile, Notice, Command } from "obsidian";
import { getNoteInfo } from "../lib/noteResloveUtils";
import { normalizeCrossPlatformPath, copyFilesRecursively } from "../lib/pathUtils";
import { watch } from "vue";

export class ExportFormatsManager {
    private plugin: MyPlugin;

    constructor(plugin: MyPlugin) {
        this.plugin = plugin;
        // 第一步：注册模块设置
        this.registerSettings();
        this.initialize();
    }

    /**
     * 注册模块设置到插件的响应式设置列表中
     */
    private registerSettings(): void {
        // 获取当前设置
        const currentSettings = this.plugin.settingList[exportFormatsInfo.name];
        
        // 使用类型守卫函数检查设置是否需要重置
        const needsReset = !currentSettings || !isExportManagerSettings(currentSettings);
        
        if (needsReset) {
            console.log(`Initializing settings for ${exportFormatsInfo.name} with type checking`);
            this.plugin.settingList[exportFormatsInfo.name] = exportFormatsInfo.defaultConfigs;
        }

        // 将模块信息添加到插件的模块设置列表中
        this.plugin.moduleSettings.push(exportFormatsInfo);
    }

    /**
     * 获取当前配置（始终从响应式settingList中获取最新配置）
     */
    get config(): ExportManagerSettings {
        return this.plugin.settingList[exportFormatsInfo.name] as ExportManagerSettings;
    }

    initialize(): void {
        this.config.exportConfigs.filter(item => item.enabled).forEach(item => {
            this.addExportCommand(item);
        });
        this.config.exportConfigs.forEach(item => {
            this.watchConfig(item);
        });
    }

    /**
     * 添加新导出格式配置
     */
    addExportFormatItem(format: OutputFormat): void {
        const hexId = generateTimestamp("hex");
        // 根据格式类型设置默认图标
        const getDefaultIcon = (format: OutputFormat): string => {
            switch (format) {
                case 'typst': return 'file-text';
                case 'vuepress': return 'book';
                case 'quarto': return 'file-code';
                case 'plain': return 'file';
                default: return 'download';
            }
        };
        
        const newConfig: ExportConfig = {
        id: `export-${hexId}`,
        commandId: `doc-weaver:export-${hexId}`,
        style_dir: path.posix.join('styles', hexId),
        name: `export-${hexId}`,
        output_dir: path.posix.join(EXPORT_FORMATS_CONSTANTS.DEFAULT_OUTPUT_DIR, hexId),
        output_base_name: EXPORT_FORMATS_CONSTANTS.DEFAULT_OUTPUT_BASE_NAME + '_' + "{{date:YYYY-MM-DD}}",
        template: getDefaultYAML(format) || '',
        enabled: true,
        format: format,
        excalidraw_export_type: EXPORT_FORMATS_CONSTANTS.DEFAULT_EXCALIDRAW_EXPORT_TYPE,
        excalidraw_png_scale: EXPORT_FORMATS_CONSTANTS.DEFAULT_EXCALIDRAW_PNG_SCALE,
        icon: getDefaultIcon(format) // 必须提供图标，根据格式设置默认图标
        };
    
        // 创建对应的资源文件夹
        const styleDirAbs = path.posix.join(
        this.plugin.PLUGIN_ABS_PATH,
        newConfig.style_dir
        );
        if (!fs.existsSync(styleDirAbs)) {
        fs.mkdirSync(styleDirAbs, { recursive: true });
        }
        createFormatAssetStructure(styleDirAbs, format);
        
        debugLog('New export config added:', newConfig.name);
        const configs = this.config.exportConfigs;
        configs.push(newConfig);
        this.addExportCommand(configs[configs.length - 1]);
        this.watchConfig(configs[configs.length - 1]);
    }

    deleteExportFormatItem(exportFormatIndex: number): void {
        const item = this.config.exportConfigs[exportFormatIndex];
        const styleDirAbs = path.posix.join(
            this.plugin.PLUGIN_ABS_PATH,
            item.style_dir
        );
        if (fs.existsSync(styleDirAbs)) {
            fs.rmSync(styleDirAbs, { recursive: true, force: true });
        }
        this.config.exportConfigs.splice(exportFormatIndex, 1);
        this.removeExportCommand(item);
    }

    addExportCommand(item: ExportConfig): void {
        const command: Command = {
            id: item.id, //此id非彼id，在plugin外调用命令所需的commandId需要再前面添加'doc-weaver:'
            name: item.name,
            callback: async () => await this.executeExport(item, this.plugin.app.workspace.getActiveFile() as TFile)
        };
        this.plugin.addCommand(command);
    }

    removeExportCommand(item: ExportConfig): void {
        this.plugin.removeCommand(item.id); //此id非彼id，在plugin外调用命令所需的commandId需要再前面添加'doc-weaver:'
    }

    watchConfig(item: ExportConfig): void {
        watch(() => item.enabled, (newVal, oldVal) => {
            if (newVal) {
                this.addExportCommand(item);
            } else {
                this.removeExportCommand(item);
            }
        });
        watch(() => item.name, (newVal, oldVal) => {
            if (item.enabled) {
                this.removeExportCommand(item);
                this.addExportCommand(item);
            }
        });
    }

    /**
     * 执行导出格式
     * @param item 导出配置
     * @param sourceFile 源文件
     */
    async executeExport(item: ExportConfig, sourceFile: TFile): Promise<void> {
        // 预检查和实例化文本转换器
        if (sourceFile.extension !== 'md' || sourceFile.path.endsWith('.excalidraw.md')) {
            new Notice(`${sourceFile.basename} is not markdown files, only markdown files can be parsed to export.`);
            return;
        }
        const sourceContent = (await getNoteInfo(this.plugin, sourceFile)).mainContent// 只获取笔记主要内容，暂时用不到笔记属性
        const converter = new TextConverter(this.plugin, sourceFile);

        // 设置导出配置
        converter.exportConfig = item;
        const styleDirAbs = path.posix.join(this.plugin.PLUGIN_ABS_PATH, item.style_dir);
        const outputDir = normalizeCrossPlatformPath(converter.replacePlaceholders(item.output_dir)); // 跨平台路径处理
        const outputFullName = `${converter.replacePlaceholders(item.output_base_name)}.${extensionNameOfFormat[item.format]}`;

        // 创建目标目录
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // 拷贝样式文件，过滤掉demo.typ文件
        if (fs.existsSync(styleDirAbs)) {
            copyFilesRecursively(styleDirAbs, outputDir, (fileName) => fileName !== 'demo.typ');
        }
        
        // converter.resetLinkParser(); // 每次导出前重置linkParser，避免重复写入链接信息

        // 处理主要内容
        const exportContent = await converter.convert(sourceContent, item.format);
        
        // 使用重构后的replacePlaceholders方法，直接处理模板和内容的整合
        const finalContent = converter.replacePlaceholders(item.template, exportContent);
        
        fs.writeFileSync(path.posix.join(outputDir, outputFullName), finalContent);
        
        // 拷贝附件
        converter.copyAttachment(outputDir);

        new Notice(converter.linkParser.formatExportSummary(path.posix.join(outputDir, outputFullName)), 2000); // 打印导出信息

        console.log('打印附件信息')//
        for (const link of converter.linkParser.linkList) {
            console.log(`Path: ${link.source_path}, Type: ${link.type}`);
        }
    }
    
}