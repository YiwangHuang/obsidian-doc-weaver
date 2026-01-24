import { Notice, TFile, TAbstractFile, TFolder, Editor, Menu } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import MyPlugin from '../main';
import { exportFormatsInfo } from './index';
import type { ExportManagerSettings, ExportConfig } from './types';
import { TextConverter } from './textConvert/index';
import { extensionNameOfFormat, OutputFormat } from './textConvert/textConverter';
import { getNoteInfo } from '../lib/noteResloveUtils';
import { DEBUG, debugLog } from '../lib/debugUtils';
import { normalizeCrossPlatformPath, copyFilesRecursively } from '../lib/pathUtils';
import { getLocalizedText } from '../lib/textUtils';

//TODO: 新增功能：直接通过typst的WebAssembly版本导出为pdf


async function exportToFormats(plugin: MyPlugin, sourceFile: TFile): Promise<void> {
    if (sourceFile.extension !== 'md' || sourceFile.path.endsWith('.excalidraw.md')) {
        new Notice(`${sourceFile.basename} is not markdown files, only markdown files can be parsed to export.`);
        return;
    }
    const sourceContent = (await getNoteInfo(plugin, sourceFile)).mainContent// 只获取笔记主要内容，暂时用不到笔记属性
    const settings = plugin.settingList[exportFormatsInfo.name] as ExportManagerSettings;// 获取设置
    const converter = new TextConverter(plugin, sourceFile);
    
    const enabledConfigs = settings.exportConfigs.filter(item => item.enabled);
    if (enabledConfigs.length === 0) {
        new Notice("No enabled export formats found. Please enable at least one format in settings.");
        return;
    }

    for (const item of enabledConfigs) {
        converter.exportConfig = item;
        const styleDirAbs = path.posix.join(plugin.PLUGIN_ABS_PATH, item.style_dir);
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
        
        converter.resetLinkParser(); // 每次导出前重置linkParser，避免重复写入链接信息

        // 处理主要内容
        const exportContent = await converter.convert(sourceContent, item.format);
        
        // 使用重构后的replacePlaceholders方法，直接处理模板和内容的整合
        const finalContent = converter.replacePlaceholders(item.template, exportContent);
        
        fs.writeFileSync(path.posix.join(outputDir, outputFullName), finalContent);
        
        // 拷贝附件
        converter.copyAttachment(outputDir);

        new Notice(converter.linkParser.formatExportSummary(path.posix.join(outputDir, outputFullName)), 2000); // 打印导出信息

        converter.exportConfig = null;

        console.log('打印附件信息')//
        for (const link of converter.linkParser.linkList) {
            console.log(`Path: ${link.source_path}, Type: ${link.type}`);
        }
    }
}

type DeepMoveCache = {
    text: string;
    converter: TextConverter;
};

async function deepCopy(plugin: MyPlugin, noteFile: TFile, text: string): Promise<void> {
    const converter = new TextConverter(plugin, noteFile);
    converter.linkParser.isRecursiveEmbedNote = false; // 默认不递归解析嵌入笔记TODO: 可以改为在设置界面中选择
    converter.linkParser.isRenewExportName = true; // 为附件生成新的导出名称
    //console.log(converter.linkParser.links);//.map(link => link.path)
    const copyText = await converter.convert(text, 'plain'); 
    console.log(copyText);
    plugin.commandCache['deepMove'] = {text: copyText, converter} as DeepMoveCache;
}

function deepPaste(plugin: MyPlugin, editor: Editor): void {//TODO: 为深度拷贝后的附件名中添加随机数，同时更新笔记中的链接
    if(!plugin.commandCache['deepMove']) {
        new Notice('No deep move cache found');
        return;
    }
    const currentFile = plugin.app.workspace.getActiveFile() as TFile;
    const {text, converter} = plugin.commandCache['deepMove'] as DeepMoveCache;
    console.log(converter.linkParser.linkList);
    editor.replaceRange(text, editor.getCursor());
    if(currentFile.parent){
        converter.copyAttachment(plugin.getPathAbs(currentFile.parent.path));
    }
}

/**
 * 导出单个文件到指定格式
 * @param plugin - 插件实例
 * @param sourceFile - 源文件
 * @param config - 导出配置
 */
async function exportToSingleFormat(plugin: MyPlugin, sourceFile: TFile, config: ExportConfig): Promise<void> {
    if (sourceFile.extension !== 'md' || sourceFile.path.endsWith('.excalidraw.md')) {
        new Notice(`${sourceFile.basename} is not a markdown note, only markdown notes can be parsed to export.`);
        return;
    }
    
    try {
        const sourceContent = (await getNoteInfo(plugin, sourceFile)).mainContent;
        const converter = new TextConverter(plugin, sourceFile);
        converter.exportConfig = config;
        
        const styleDirAbs = path.posix.join(plugin.PLUGIN_ABS_PATH, config.style_dir);
        const outputDir = normalizeCrossPlatformPath(converter.replacePlaceholders(config.output_dir));
        const outputFullName = `${converter.replacePlaceholders(config.output_base_name)}.${extensionNameOfFormat[config.format]}`;

        // 创建目标目录
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // 拷贝样式文件，过滤掉demo.typ文件
        if (fs.existsSync(styleDirAbs)) {
            copyFilesRecursively(styleDirAbs, outputDir, (fileName) => fileName !== 'demo.typ');
        }
        
        converter.resetLinkParser();

        // 处理主要内容
        const exportContent = await converter.convert(sourceContent, config.format);
        const finalContent = converter.replacePlaceholders(config.template, exportContent);
        
        fs.writeFileSync(path.posix.join(outputDir, outputFullName), finalContent);
        
        // 拷贝附件
        converter.copyAttachment(outputDir);

        new Notice(converter.linkParser.formatExportSummary(path.posix.join(outputDir, outputFullName)), 2000);
        
        converter.exportConfig = null;
    } catch (error) {
        console.error(`Error exporting ${sourceFile.basename} to ${config.format}:`, error);
        new Notice(`Failed to export ${sourceFile.basename} to ${config.format}`);
    }
}

/**
 * 递归收集所有TFile类型的文件
 * @param abstractFiles - 抽象文件或文件夹数组
 * @returns 所有TFile类型的文件列表
 */
function collectAllFiles(abstractFiles: TAbstractFile[]): TFile[] {
    const fileList: TFile[] = [];
    
    // 递归遍历处理单个抽象文件
    function processFile(file: TAbstractFile): void {
        if (file instanceof TFile) {
            // 如果是TFile，直接添加到列表
            file.extension==='md'&&!file.path.endsWith('.excalidraw.md')&&fileList.push(file);
        } else if (file instanceof TFolder) {
            // 如果是TFolder，递归遍历其children属性
            file.children.forEach(child => processFile(child));
        }
    }
    
    // 遍历所有传入的抽象文件
    abstractFiles.forEach(file => processFile(file));
    
    return fileList;
}

/**
 * 注册文件右键菜单
 * 每次打开菜单时基于 plugin.settingList 中的配置动态生成子菜单项
 * @param menu - 菜单对象
 * @param files - 抽象文件数组（可包含文件和文件夹）
 * @param plugin - 插件实例
 */
function registerFileContextMenu(menu: Menu, files: TAbstractFile[], plugin: MyPlugin): void {
    // 获取导出格式配置（实时从 settingList 中读取）
    const settings = plugin.settingList[exportFormatsInfo.name] as ExportManagerSettings;
    const enabledConfigs = settings.exportConfigs.filter(item => item.enabled);

    // 如果没有启用的导出格式，不显示菜单（条件过滤）
    if (enabledConfigs.length === 0) {
        return;
    }

    // 建立待导出文件列表：递归处理文件和文件夹，收集所有TFile
    const filesToExport = collectAllFiles(files);
    
    debugLog('filesToExport', filesToExport);

    // 如果没有可导出的文件，不显示菜单
    if (filesToExport.length === 0) {
        return;
    }

    // 创建主菜单项 "Export Formats"
    menu.addItem((item) => {
        item.setTitle(getLocalizedText({en: 'Doc Weaver Export', zh: 'Doc Weaver 导出'}))
            .setIcon("download");
        
        // 创建子菜单
        (item as any).setSubmenu();
        const submenu = (item as any).submenu;
        
        if (!submenu) return;

        // 添加"导出所有格式"选项
        submenu.addItem((subItem: any) => {
            subItem
                .setTitle(getLocalizedText({en: 'Export All Formats', zh: '导出所有格式'}))
                .setIcon("layers")
                .onClick(() => {
                    // 如果要导出的文件数量大于1，弹出确认窗口
                    if (filesToExport.length > 1) {
                        const confirmMessage = getLocalizedText({
                            en: `Export ${filesToExport.length} files to all enabled formats?`,
                            zh: `是否将 ${filesToExport.length} 个文件导出到所有启用的格式？`
                        });
                        
                        if (!confirm(confirmMessage)) {
                            return;
                        }
                    }
                    
                    // 使用收集到的待导出文件列表
                    filesToExport.forEach(file => {
                        exportToFormats(plugin, file);
                    });
                });
        });

        // 添加分隔符
        submenu.addSeparator();

        // 为每个启用的格式动态添加子菜单项
        enabledConfigs.forEach((config: ExportConfig) => {
            submenu.addItem((subItem: any) => {
                subItem
                    // 使用自定义名称或默认格式名称
                    .setTitle(config.name || config.format)
                    .setIcon(config.icon || "file-text")
                    .onClick(async () => {
                        // 如果要导出的文件数量大于1，弹出确认窗口
                        if (filesToExport.length > 1) {
                            const formatName = config.name || config.format;
                            const confirmMessage = getLocalizedText({
                                en: `Export ${filesToExport.length} files to ${formatName}?`,
                                zh: `是否将 ${filesToExport.length} 个文件导出为 ${formatName}？`
                            });
                            
                            if (!confirm(confirmMessage)) {
                                return;
                            }
                        }
                        
                        // 批量导出收集到的文件到指定格式
                        for (const file of filesToExport) {
                            await exportToSingleFormat(plugin, file, config);
                        }
                    });
            });
        });
    });
}

export function addExportFormatsCommands(plugin: MyPlugin): void {
    plugin.addCommand({
        id: 'export-formats',
        name: getLocalizedText({en: 'Export all enabled formats', zh: '导出所有激活的格式'}),
        callback: async () => await exportToFormats(plugin, plugin.app.workspace.getActiveFile() as TFile)
    });

    // 注册文件右键菜单 - 动态生成导出格式子菜单
    // TODO: 需要将files参数类型冲突，根据文件和目录分别处理，弹出提醒框，确认后再进行批量导出操作
    plugin.registerEvent(
        plugin.app.workspace.on("files-menu", (menu, files) => {
            registerFileContextMenu(menu, files, plugin);
        })
    );

    plugin.registerEvent(
        plugin.app.workspace.on("file-menu", (menu, file) => {
            registerFileContextMenu(menu, [file], plugin);
        })
    );

    if (DEBUG) {
        // 深度拷贝和粘贴(笔记与附件打包迁移工具)
        plugin.registerEvent(
            plugin.app.workspace.on("editor-menu", (menu, editor, info) => {
                menu.addItem((item)=>
                    item.setTitle("Deep copy")
                        .setIcon("document")
                        .onClick(async () => await deepCopy(plugin, plugin.app.workspace.getActiveFile() as TFile, editor.getSelection()))
                )
                menu.addItem((item)=>
                    item.setTitle("Deep paste")
                        .setIcon("document")
                        .onClick(() => deepPaste(plugin, editor))
                )
            }
        ))
        // 调用baseConverter测试文本转换规则
        plugin.registerEvent(
            plugin.app.workspace.on("editor-menu", (menu, editor, info) => {
                for (const format of Object.keys(extensionNameOfFormat)) {
                    menu.addItem((item) =>
                    item
                        .setTitle(`Export ${format} test `)
                        .setIcon("document")
                        .onClick(async () => {
                            // console.log(info);
                            const content = editor.getSelection();
                            new Notice(`选中的文本是: ${content}`);
                            const converter = new TextConverter(plugin, plugin.app.workspace.getActiveFile() as TFile);
                            console.log(await converter.convert(content, format as OutputFormat));
                            // console.log(converter.linkParser.linkList);
                            console.log(converter.md.parse(content, {}));
                            })
                    );
                }
            })
        );
    }
}