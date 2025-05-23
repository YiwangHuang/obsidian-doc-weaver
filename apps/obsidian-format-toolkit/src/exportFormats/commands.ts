import { Notice, TFile, Editor } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';
import MyPlugin from '../main';
import { ExportManagerSetting, exportFormatsSetting } from './settings';
import { TextConverter } from './textConvert/index';
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

async function exportToFormats(plugin: MyPlugin, sourceFile: TFile): Promise<void> {
    if (sourceFile.extension !== 'md' || sourceFile.path.endsWith('.excalidraw.md')) {
        new Notice(`${sourceFile.basename} is not markdown files, only markdown files can be parsed to export.`);
        return;
    }
    const sourceContent = (await getNoteInfo(plugin, sourceFile)).mainContent// 只获取笔记主要内容，暂时用不到笔记属性
    const settings = plugin.settingList[exportFormatsSetting.name] as ExportManagerSetting;// 获取设置
    const converter = new TextConverter(plugin, sourceFile);
    for (const item of settings.exportConfigs.filter(item => item.enabled)) {
        converter.exportConfig = item;
        const exportStyleDirAbs = path.join(plugin.PLUGIN_ABS_PATH, 'assets', 'styles', item.id);
        const outputDir = converter.replacePlaceholders(item.output_dir);
        const outputFullName = `${converter.replacePlaceholders(item.output_base_name)}.${extensionNameOfFormat[item.format]}`;
        // 处理 YAML 配置
        const yamlInfo = converter.replacePlaceholders(item.yaml);

        // 创建目标目录
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // 拷贝样式文件
        if (fs.existsSync(exportStyleDirAbs)) {
            copyFilesRecursively(exportStyleDirAbs, outputDir);
        }
        
        // 处理主要内容与YAML
        const exportContent = await converter.convert(sourceContent, item.format);
        fs.writeFileSync(path.join(outputDir,outputFullName), yamlInfo+'\n'+exportContent);
        
        // 拷贝附件
        converter.new_copyAttachment(outputDir);
        // const {properties, mainContent} = await getFileContentAndProperties(plugin, sourceFile)
        // console.log(properties)
        // console.log(mainContent)
        // console.log(plugin.app.metadataCache.getFileCache(sourceFile))
        // 打印所有链接的键值对
        
        converter.exportConfig = null;

        console.log('打印附件信息')//
        for (const link of converter.linkParser.links) {
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
    console.log(converter.linkParser.links);
    editor.replaceRange(text, editor.getCursor());
    if(currentFile.parent){
        converter.new_copyAttachment(plugin.getPathAbs(currentFile.parent.path));
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