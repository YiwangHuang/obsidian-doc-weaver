import { Notice, TFile, TAbstractFile, TFolder, Editor, Menu } from 'obsidian';
import DocWeaver from '../main';
import { exportFormatsInfo } from './index';
import type { ExportManagerSettings, ExportConfig } from './types';
import { TextConverter } from './textConvert/index';
import { extensionNameOfFormat, OutputFormat } from './textConvert/textConverter';
import { DEBUG, debugLog } from '../lib/debugUtils';
import { getLocalizedText } from '../lib/textUtils';
import { ConfirmModal } from '../lib/modalUtils';

//TODO: 新增功能：直接通过typst的WebAssembly版本导出为pdf

type DeepMoveCache = {
    text: string;
    converter: TextConverter;
};

async function deepCopy(plugin: DocWeaver, noteFile: TFile, text: string): Promise<void> {
    const converter = new TextConverter(plugin, noteFile);
    converter.linkParser.isRecursiveEmbedNote = false; // 默认不递归解析嵌入笔记TODO: 可以改为在设置界面中选择
    converter.linkParser.renameExportAttachment = true; // 为附件生成新的导出名称
    //console.log(converter.linkParser.links);//.map(link => link.path)
    const copyText = await converter.convert(text, 'plain'); 
    console.log(copyText);
    plugin.commandCache['deepMove'] = {text: copyText, converter} as DeepMoveCache;
}

function deepPaste(plugin: DocWeaver, editor: Editor): void {//TODO: 为深度拷贝后的附件名中添加随机数，同时更新笔记中的链接
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
function registerFileContextMenu(menu: Menu, files: TAbstractFile[], plugin: DocWeaver): void {
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
    if (filesToExport.length === 0 || !settings.batchExportEnabled) {
        return;
    }

    // 创建主菜单项 "Export Formats"
    menu.addItem((item) => {
        item.setTitle(
            filesToExport.length > 1 ? 
            getLocalizedText({en: 'Doc Weaver Batch Export', zh: 'Doc Weaver 批量导出'}) : getLocalizedText({en: 'Doc Weaver Export', zh: 'Doc Weaver 导出'})
        )
            .setIcon("download");
        
        // 创建子菜单
        (item as any).setSubmenu();
        const submenu = (item as any).submenu;
        
        if (!submenu) return;

        // 添加"导出所有格式"选项
        submenu.addItem((subItem: any) => {
            subItem
                .setTitle(getLocalizedText({en: 'Export All Presets', zh: '导出所有预设'}))
                .setIcon("layers")
                .onClick(() => {
                    const settings = plugin.settingList[exportFormatsInfo.name] as ExportManagerSettings;// 获取设置
                    const enabledConfigs = settings.exportConfigs.filter(item => item.enabled);
                    if (enabledConfigs.length === 0) {
                        new Notice("No enabled export formats found. Please enable at least one format in settings.");
                        return;
                    }
                    // 如果要导出的文件数量大于1，弹出确认窗口
                    if (filesToExport.length > 1) {
                        const confirmMessage = getLocalizedText({
                            en: `Export ${filesToExport.length} files to all enabled formats?`,
                            zh: `是否将 ${filesToExport.length} 个文件导出到所有启用的格式？`
                        });
                        
                        // 使用 Obsidian Modal 替代原生 confirm
                        new ConfirmModal(
                            plugin.app,
                            confirmMessage,
                            () => {
                                // 确认后执行导出
                                filesToExport.forEach(file => {
                                    // exportToFormats(plugin, file);
                                    for (const config of enabledConfigs) {
                                        plugin.exportFormatsManager.executeExport(config, file);
                                    }
                                });
                            }
                        ).open();
                    } else {
                        // 只有一个文件时直接导出，无需确认
                        filesToExport.forEach(file => {
                            // exportToFormats(plugin, file);
                            for (const config of enabledConfigs) {
                                plugin.exportFormatsManager.executeExport(config, file);
                            }
                        });
                    }
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
                            
                            // 使用 Obsidian Modal 替代原生 confirm
                            new ConfirmModal(
                                plugin.app,
                                confirmMessage,
                                async () => {
                                    // 确认后执行导出
                                    for (const file of filesToExport) {
                                        // await exportToSingleFormat(plugin, file, config);
                                        await plugin.exportFormatsManager.executeExport(config, file);
                                    }
                                }
                            ).open();
                        } else {
                            // 只有一个文件时直接导出，无需确认
                            for (const file of filesToExport) {
                                // await exportToSingleFormat(plugin, file, config);
                                await plugin.exportFormatsManager.executeExport(config, file);
                            }
                        }
                    });
            });
        });
    });
}

export function addExportFormatsCommands(plugin: DocWeaver): void {
    plugin.addCommand({
        id: 'export-formats',
        name: getLocalizedText({en: 'Export all enabled formats', zh: '导出所有激活的格式'}),
        callback: async () => {
            const settings = plugin.settingList[exportFormatsInfo.name] as ExportManagerSettings;// 获取设置
            const enabledConfigs = settings.exportConfigs.filter(item => item.enabled);
            if (enabledConfigs.length === 0) {
                new Notice("No enabled export formats found. Please enable at least one format in settings.");
                return;
            }
            for (const config of enabledConfigs) {
                plugin.exportFormatsManager.executeExport(config, plugin.app.workspace.getActiveFile() as TFile);
            }
        }
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