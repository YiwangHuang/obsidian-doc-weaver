import { Notice, TFile, Editor } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import MyPlugin from '../main';
import { exportFormatsInfo } from './index';
import type { ExportManagerSettings } from './types';
import { TextConverter } from './textConvert/index';
import { extensionNameOfFormat, OutputFormat } from './textConvert/textConverter';
import { getNoteInfo } from '../lib/noteResloveUtils';
import { DEBUG } from '../lib/debugUtils';
import { normalizeCrossPlatformPath, copyFilesRecursively } from '../lib/pathUtils';

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

export function addExportFormatsCommands(plugin: MyPlugin): void {
    plugin.addCommand({
        id: 'export-formats',
        name: 'Export Formats',
        callback: async () => await exportToFormats(plugin, plugin.app.workspace.getActiveFile() as TFile)
    });

    plugin.registerEvent(
        plugin.app.workspace.on("files-menu", (menu, files) => {
            // 确保文件对象存在，且是普通文件（不是文件夹）
            menu.addItem((item) =>
                item
                    .setTitle("批量导出文件")
                    .setIcon("document")
                    .onClick(() => {
                        for (const file of files) {
                            if (file instanceof TFile) {
                                // console.log("选中的文件:", file.path, "\n",file.extension);
                                // new Notice(`文件路径: ${file.path}`);
                                exportToFormats(plugin, file);
                            }
                        }
                    })
            );
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
                            console.log(converter.linkParser.linkList);
                            // console.log(converter.md.parse(content, {}));
                            })
                    );
                }
            })
        );
    }
}