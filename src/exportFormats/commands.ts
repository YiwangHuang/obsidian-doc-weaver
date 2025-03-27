import { Notice, TFile, Editor } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import * as placeholders from '../lib/constant';
import type MyPlugin from '../../main';
import { ExportFormatsSettings, exportFormatsSetting } from './settings';
import { TextConverter, BaseConverter } from './textConvert/index';
import { extensionNameOfFormat, OutputFormat } from './textConvert/textConverter';
import { getNoteInfo } from '../lib/noteResloveUtils';
import { DEBUG } from '../lib/testUtils';

//TODO: 新增功能：直接通过typst的WebAssembly版本导出为pdf
/**
 * 递归查找并复制文件，保持原有目录结构
 */
function copyFilesRecursively(
    sourceDir: string, 
    targetDir: string, 
    fileFilter: (fileName: string) => boolean = () => true
): void {
    const files = fs.readdirSync(sourceDir, { withFileTypes: true });
    
    for (const file of files) {
        const sourcePath = path.join(sourceDir, file.name);
        const targetPath = path.join(targetDir, file.name);

        if (file.isDirectory()) {
            copyFilesRecursively(sourcePath, targetPath, fileFilter);
        } else if (fileFilter(file.name)) {
            if (!fs.existsSync(path.dirname(targetPath))) {
                fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            }
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}

function replacePlaceholders(template: string, converter: TextConverter): string {
    const plugin = converter.plugin as MyPlugin;
    const currentFile = converter.getCurrentNoteFile() as TFile;
    return placeholders.replaceDatePlaceholders(template
    .replace(placeholders.VAR_VAULT_DIR, plugin.VAULT_ABS_PATH)
    .replace(placeholders.VAR_NOTE_DIR, path.dirname(plugin.getPathAbs(currentFile.path)))//TODO: 第二个参数可改为currentFile.parent.path，待测试
    .replace(placeholders.VAR_NOTE_NAME, currentFile.basename))
}

async function exportToFormats(plugin: MyPlugin, sourceFile: TFile): Promise<void> {
    if (sourceFile.extension !== 'md' || sourceFile.path.endsWith('.excalidraw.md')) {
        new Notice(`${sourceFile.basename} is not markdown files, only markdown files can be parsed to export.`);
        return;
    }
    const sourceContent = (await getNoteInfo(plugin, sourceFile)).mainContent// 只获取笔记主要内容，暂时用不到笔记属性
    const settings = plugin.settingList[exportFormatsSetting.name] as ExportFormatsSettings;// 获取设置
    const converter = new TextConverter(plugin, sourceFile);
    for (const item of settings.formats.filter(item => item.enabled)) {
        const exportStyleDirAbs = path.join(plugin.PLUGIN_ABS_PATH, 'assets', 'styles', item.id);
        const exportTargetDirAbs = replacePlaceholders(item.path, converter);
        const exportTargetFilePathAbs = path.join(exportTargetDirAbs,`${sourceFile.basename}.${extensionNameOfFormat[item.format]}`);

        // 处理 YAML 配置
        const yamlInfo = replacePlaceholders(item.yamlConfig, converter);

        // 创建目标目录
        if (!fs.existsSync(exportTargetDirAbs)) {
            fs.mkdirSync(exportTargetDirAbs, { recursive: true });
        }
        
        // 拷贝样式文件
        if (fs.existsSync(exportStyleDirAbs)) {
            copyFilesRecursively(exportStyleDirAbs, exportTargetDirAbs);
        }
        
        // 处理主要内容与YAML
        const exportContent = await converter.convert(sourceContent, item.format);
        fs.writeFileSync(exportTargetFilePathAbs, yamlInfo+'\n'+exportContent);
        
        // 拷贝附件
        converter.copyAttachment(exportTargetDirAbs);
        // const {properties, mainContent} = await getFileContentAndProperties(plugin, sourceFile)
        // console.log(properties)
        // console.log(mainContent)
        // console.log(plugin.app.metadataCache.getFileCache(sourceFile))
        // 打印所有链接的键值对
        console.log('打印附件信息')//
        for (const link of converter.links) {
            console.log(`Path: ${link.path}, Type: ${link.type}`);
        }
    }
}

type DeepMoveCache = {
    text: string;
    converter: TextConverter;
};

async function deepCopy(plugin: MyPlugin, noteFile: TFile, text: string): Promise<void> {
    const converter = new TextConverter(plugin, noteFile);
    converter.isRecursiveEmbedNote = false; // 默认不递归解析嵌入笔记TODO: 可以改为在设置界面中选择
    converter.isRenewExportName = true; // 为附件生成新的导出名称
    //console.log(converter.links);//.map(link => link.path)
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
    console.log(converter.links);
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
                            const converter = new BaseConverter();
                            console.log(await converter.convert(content, format as OutputFormat));
                            console.log(converter.md.parse(content, {}));
                            })
                    );
                }
            })
        );
    }
}