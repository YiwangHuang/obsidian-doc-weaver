import type MyPlugin from "../main";
import path from "path";
import fs from "fs";
import { ExportManagerSettings, ExportConfig, exportManagerSettingsIO, getExportConfigIOByFormat } from "./types";
import type { PresetDescriptor } from "./types";
import { exportFormatsInfo } from "./index";
import { TextConverter } from './textConvert/index';
import { generateTimestamp } from "../lib/idGenerator";
import { extensionNameOfFormat } from "./textConvert/textConverter";
import { debugLog } from "../lib/debugUtils";
import { TFile, Notice, Command } from "obsidian";
import { getNoteInfo } from "../lib/noteResloveUtils";
import { normalizeCrossPlatformPath, copyFilesRecursively } from "../lib/pathUtils";
import { watch } from "vue";
// import { registerHtmlProcessor } from "./textConvert/processors/htmlProcessor";

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
        // 校验并修复当前设置，无效或缺失时回退到默认配置
        this.plugin.settingList[exportFormatsInfo.name] = exportManagerSettingsIO.ensureValid(
            this.plugin.settingList[exportFormatsInfo.name],
            exportFormatsInfo.defaultConfigs
        );

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
     * @param preset 预设模板描述符，包含格式类型、字段覆盖值和风格文件
     */
    addExportFormatItem(preset: PresetDescriptor): void {
        const hexId = generateTimestamp("hex");

        // 根据预设的格式类型获取对应的 ConfigIO 实例
        const configIO = getExportConfigIOByFormat(preset.format);

        // 通过 ConfigIO 创建配置（默认值 + 预设覆盖 + 动态字段）
        const newConfig = configIO.createConfig(hexId, preset);

        // 创建对应的资源文件夹
        const styleDirAbs = path.posix.join(
            this.plugin.PLUGIN_ABS_PATH,
            newConfig.styleDirRel
        );
        if (!fs.existsSync(styleDirAbs)) {
            fs.mkdirSync(styleDirAbs, { recursive: true });
        }
        // 通过 ConfigIO 写入预设指定的风格文件
        configIO.createAssetStructure(styleDirAbs, preset);

        debugLog('New export config added:', newConfig.name);
        // 添加命令和监听仍在此方法中执行
        const configs = this.config.exportConfigs;
        configs.push(newConfig);
        this.addExportCommand(configs[configs.length - 1]);
        this.watchConfig(configs[configs.length - 1]);
    }

    deleteExportFormatItem(exportFormatIndex: number): void {
        const item = this.config.exportConfigs[exportFormatIndex];
        const styleDirAbs = path.posix.join(
            this.plugin.PLUGIN_ABS_PATH,
            item.styleDirRel
        );
        if (fs.existsSync(styleDirAbs)) {
            fs.rmSync(styleDirAbs, { recursive: true, force: true });
        }
        this.config.exportConfigs.splice(exportFormatIndex, 1);
        this.removeExportCommand(item);
    }

    /**
     * 复制导出格式配置
     * 创建指定配置的副本，包括样式文件夹
     * @param exportFormatIndex 要复制的配置索引
     */
    duplicateExportFormatItem(exportFormatIndex: number): void {
        const originalConfig = this.config.exportConfigs[exportFormatIndex];
        const hexId = generateTimestamp("hex");
        
        // 创建配置的深拷贝并生成新的ID
        const newConfig: ExportConfig = {
            ...originalConfig,
            id: `export-${hexId}`,
            commandId: `doc-weaver:export-${hexId}`,
            name: `${originalConfig.name} - Copy`,
            styleDirRel: path.posix.join('styles', hexId),
            outputDirAbsTemplate: path.posix.join(originalConfig.outputDirAbsTemplate, hexId),
        };

        // 创建新的样式文件夹并复制原有样式文件
        const originalStyleDirAbs = path.posix.join(
            this.plugin.PLUGIN_ABS_PATH,
            originalConfig.styleDirRel
        );
        const newStyleDirAbs = path.posix.join(
            this.plugin.PLUGIN_ABS_PATH,
            newConfig.styleDirRel
        );

        // 创建新文件夹
        if (!fs.existsSync(newStyleDirAbs)) {
            fs.mkdirSync(newStyleDirAbs, { recursive: true });
        }

        // 复制样式文件
        if (fs.existsSync(originalStyleDirAbs)) {
            copyFilesRecursively(originalStyleDirAbs, newStyleDirAbs);
        }

        // 将新配置插入到原配置后面
        const configs = this.config.exportConfigs;
        configs.splice(exportFormatIndex + 1, 0, newConfig);
        
        // 为新配置添加命令和监听
        this.addExportCommand(newConfig);
        this.watchConfig(newConfig);
        
        debugLog('Export config duplicated:', newConfig.name);
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
        const converter = new TextConverter(this.plugin, sourceFile, item);
        converter.linkParser.renameExportAttachment = item.renameExportAttachment;

        // 设置导出配置
        const style_dir_abs = path.posix.join(this.plugin.PLUGIN_ABS_PATH, item.styleDirRel);
        const output_dir_abs = normalizeCrossPlatformPath(converter.replacePlaceholders(item.outputDirAbsTemplate)); // 跨平台路径处理
        const output_filename = `${converter.replacePlaceholders(item.outputBasenameTemplate)}.${extensionNameOfFormat[item.format]}`;
        const output_file_path = path.posix.join(output_dir_abs, output_filename);


        
        // 创建目标目录
        if (!fs.existsSync(output_dir_abs)) {
            fs.mkdirSync(output_dir_abs, { recursive: true });
        }
        
        // 拷贝样式文件，过滤掉demo.typ文件
        if (fs.existsSync(style_dir_abs)) {
            copyFilesRecursively(style_dir_abs, output_dir_abs, (fileName) => fileName !== 'demo.typ');
        }
        
        // converter.resetLinkParser(); // 每次导出前重置linkParser，避免重复写入链接信息

        const exportContent = await converter.convert(sourceContent, item.format);
        
        // 使用重构后的replacePlaceholders方法，直接处理模板和内容的整合
        const finalContent = converter.replacePlaceholders(item.contentTemplate, exportContent);
        
        fs.writeFileSync(output_file_path, finalContent);
        

        // const attachment_dir_abs = normalizeCrossPlatformPath(
        //     converter.replacePlaceholders(item.attachment_dir_abs_template)
        //     .replace(VAR_OUTPUT_DIR, output_dir_abs));
        // 拷贝附件
        await converter.copyAttachment();

        new Notice(converter.linkParser.formatExportSummary(output_file_path), 5000); // 打印导出信息

        console.log('打印附件信息')//
        for (const link of converter.linkParser.linkList) {
            console.log(`Path: ${link.source_path_rel_vault}, Type: ${link.type}`);
        }
    }
    
}