import { TFile, Notice } from "obsidian";
import type { AdvancedConverter } from "./textConverter";
import { getNoteInfo, NoteInfo } from "../../lib/noteResloveUtils";
import * as path from 'path';
import { generateHexId } from "../../lib/idGenerator";
import { getHeadingText } from '../../lib/noteResloveUtils';
import type { OutputFormat } from "./textConverter";
import type { Token, StateBlock } from "markdown-it";
import { getLinkpath } from "obsidian";
// 定义媒体和图片扩展名列表
export const mediaExtensions = ['mp4','mp3','m4a',]
export const imageExtensions = ['png','jpg','jpeg','gif','svg','webp']

export type LinkConfig = {
    source_path: string; // 源文件路径，相对于vault根目录
    export_name: string; // 导出文件名，包含扩展名      
    type?: 'media' | 'image' | 'markdown' | 'excalidraw';
}

export interface LinkParseRule{
    /** 规则名称，用于标识和调试 */
    name: string;
    /** 规则的简短描述 */
    description: string;
    /** 
     * 处理优先级，决定规则的应用顺序：
     * - 'ext_name': 最先尝试匹配扩展名，可以多次定义
     * - 'no_ext_name': 匹配到扩展名后当成markdown处理，仅能定义一次
     * - 'decorator': 装饰器规则，可以多次定义
     * - 'alias': 别名处理规则，仅能定义一次
     */
    priority: 'ext_name' | 'no_ext_name' | 'decorator' | 'alias';
    /**
     * 链接过滤器函数
     * @param linkPart 要检查的链接部分
     * @returns 如果应该处理此链接则返回true，否则返回false
     */
    shouldProcess: (linkPart: string) => boolean;
    /**
     * 链接处理器数组，按顺序执行
     * 每个处理器处理链接的特定方面
     */
    processors: LinkProcessor[];
}

/**
 * 按格式分类的链接处理器接口
 * @property formats 此处理器支持的输出格式列表
 * @property processor 实际的处理函数
 */
export interface LinkProcessor {
    /** 描述处理器的作用 */
    description?: string;
    /** 此处理器支持的输出格式列表 */
    formats: OutputFormat[];
    /** 
     * 处理链接部分的函数
     * @param linkPart 链接部分内容
     * @param linkParser 链接解析器实例，用于调用工具方法
     */
    processor: (linkPart: string, linkParser: LinkParser,mdState: StateBlock, linkToken: Token) => void;
}

export class LinkParser {
    public static rules: LinkParseRule[] = [];
    
    /**
     * 注册一个新的链接解析规则
     * @param rule 要注册的规则
     */
    public static registerRule(rule: LinkParseRule): void {
        // 验证规则的合法性
        if (!rule.name || !rule.priority || !rule.shouldProcess || !rule.processors || rule.processors.length === 0) {
            console.error('Invalid rule:', rule);
            return;
        }
        
        // 对于'no_ext_name'和'alias'优先级，确保只有一条规则
        if ((rule.priority === 'no_ext_name' || rule.priority === 'alias') && 
            this.rules.some(r => r.priority === rule.priority)) {
            console.warn(`Rule with priority '${rule.priority}' already exists. Only one rule of this type is allowed.`);
            return;
        }
        
        // 添加规则到规则列表
        this.rules.push(rule);
    }

    private converter: AdvancedConverter;
    
    // 从AdvancedConverter迁移的属性
    public linkList: LinkConfig[] = []; // 链接附件信息
    public isRecursiveEmbedNote = true; // 是否递归解析嵌入笔记
    public isRenewExportName = false; // 是否为附件生成新的导出名称，默认不生成(使用原名称作为导出名)
    private noteFileStack: TFile[] = []; // 文件处理栈，用于跟踪文件处理层级
    public embedNoteCache: Record<string, NoteInfo> = {}; // 嵌入笔记缓存

    constructor(converter: AdvancedConverter) {
        this.converter = converter;
        this.noteFileStack = [converter.entryNote];
    }

    /**
     * 获取附件目录，相对于导出目录
     * @returns 附件目录，相对于导出目录
     */
    get attachmentDir(): string {
        return this.converter.attachmentDir;
    }

    /**
     * 获取导出目录，相对于vault根目录
     * @returns 导出目录，相对于vault根目录
     */
    get exportConfig() {
        return this.converter.exportConfig;
    }

    /**
     * 获取当前正在处理的文件
     * @returns 当前文件，如果没有则返回undefined
     */             
    public getCurrentNoteFile(): TFile {
        return this.noteFileStack[this.noteFileStack.length - 1];
    }

    /**
     * 切换到新的文件进行处理
     * @param filepath 要切换到的新文件路径
     * @returns 是否成功切换到新文件
     */
    public pushNoteFile(filepath: string): boolean {
        const file = this.converter.plugin.app.vault.getFileByPath(filepath);
        if (!file) {
            return false;
        }
        this.noteFileStack.push(file);
        return true;
    }

    /**
     * 返回到上一个处理的文件
     * @returns 是否成功返回到上一个文件
     */
    public popNoteFile(): boolean {
        if (this.noteFileStack.length <= 1) {
            return false;
        }
        this.noteFileStack.pop();
        return true;
    }

    /**
     * 在当前文件中查找附件路径
     * @param linkText 要查找的链接文本
     * @returns 附件TFile对象，如果未找到则返回null
     */
    public findLinkPath(linkText: string): TFile|null {
        // 使用 Obsidian 官方 API 处理带标题索引的链接
        // getLinkpath 会自动提取文件路径部分，去掉标题引用
        const cleanPath = getLinkpath(linkText);
        
        // 使用清理后的路径查找文件
        const attachmentFile = this.converter.plugin.app.metadataCache.getFirstLinkpathDest(cleanPath, this.getCurrentNoteFile().path);
        
        return attachmentFile;
    }

    /**
     * 判断笔记是否属于excalidraw文件
     * @param noteFile 笔记文件路径或文件对象
     * @returns 是否属于excalidraw文件
     */
    public isExcalidrawNote(noteFile: TFile|string): boolean {
        if(typeof noteFile === 'string'){
            noteFile = this.converter.plugin.app.vault.getFileByPath(noteFile) as TFile;
        }
        // console.log(this.converter.plugin.app.metadataCache.getFileCache(noteFile)?.frontmatter?.excalidraw);
        return this.converter.plugin.app.metadataCache.getFileCache(noteFile)?.frontmatter?.['excalidraw-plugin']==='parsed';
    }
    
    /**
     * 预先用异步函数解析嵌入笔记的信息(包括其中的所有嵌套嵌入)到embedNoteCache。
     * 这样调用 markdown-it 时，可以用同步函数处理embedNoteCache(markdown-it 仅支持同步函数)。
     * @param noteFile 需要解析的笔记文件
     * 
     * 函数功能：
     * 1. 获取指定笔记的元数据信息
     * 2. 将笔记信息缓存到embedNoteCache中
     * 3. 递归解析笔记中的所有嵌入内容
     */
    public async resolveEmbedNoteInfo(noteFile: TFile): Promise<void> {
        if(this.embedNoteCache[noteFile.path]) return;// 如果笔记已经解析过，则直接返回，避免因两个笔记互相嵌入而陷入无限递归
        if(this.isExcalidrawNote(noteFile)){
            return;
        } // 如果笔记属于excalidraw文件（实际上不是md笔记，只是把excalidraw文件当作md笔记存储），则直接返回，避免因excalidraw文件过大影响性能
        const noteInfo = await getNoteInfo(this.converter.plugin, noteFile);
        this.embedNoteCache[noteFile.path] = noteInfo;
        const embeds = noteInfo.cachedMetadata.embeds;
        if(embeds){
            for(const embed of embeds){
                // 使用 Obsidian 官方 API 处理带标题索引的嵌入链接
                const cleanPath = getLinkpath(embed.link);
                const embedFile = this.converter.plugin.app.metadataCache.getFirstLinkpathDest(cleanPath, noteInfo.path);
                if(embedFile && embedFile.extension === 'md'){
                    await this.resolveEmbedNoteInfo(embedFile);
                }
            }
        }
    }
    

    /**
     * 解析链接文本，按照规则优先级执行匹配的处理器
     * @param linkText 要解析的链接文本，格式为"部分1|部分2|部分3"
     */
    public parseLink(linkText: string, mdState: StateBlock, linkToken: Token): void {
        // 1. 将linkText以|为分隔符拆分成linkParts字符串数组
        const linkParts = linkText.split('|');
        
        // 按优先级顺序定义处理流程
        const priorityOrder: Array<'ext_name' | 'no_ext_name' | 'decorator' | 'alias'> = [
            'ext_name',     // 先尝试匹配扩展名
            'no_ext_name',  // 再匹配无扩展名处理
            'decorator',    // 然后是装饰器
            'alias'         // 最后是别名处理
        ];
        
        // 2. 处理每个链接部分
        for (const part of linkParts) {
            let isPartProcessed = false;
            let currentPriorityIndex = 0;
            
            // 按优先级顺序尝试匹配规则
            while (currentPriorityIndex < priorityOrder.length) {
                const priority = priorityOrder[currentPriorityIndex];
                
                // 如果部分已处理且不是decorator阶段，跳到decorator或结束
                if (isPartProcessed && priority !== 'decorator') {
                    currentPriorityIndex = priority === 'alias' ? priorityOrder.length : priorityOrder.indexOf('decorator');
                    continue;
                }
                
                // 获取当前优先级的所有规则
                const rulesWithPriority = LinkParser.rules.filter(rule => rule.priority === priority);
                
                // 尝试应用每个规则
                for (const rule of rulesWithPriority) {
                    if (rule.shouldProcess(part)) {
                        // 应用匹配的处理器
                        rule.processors
                            .filter((processor: LinkProcessor) => processor.formats.includes(this.converter.format))
                            .forEach((processor: LinkProcessor) => processor.processor(part, this, mdState, linkToken));
                        
                        isPartProcessed = true;
                        
                        // 根据优先级处理后续流程
                        if (priority === 'ext_name' || priority === 'no_ext_name') {
                            // 跳到decorator阶段
                            currentPriorityIndex = priorityOrder.indexOf('decorator');
                            break;
                        } else if (priority === 'alias') {
                            // alias处理完成后结束所有处理
                            currentPriorityIndex = priorityOrder.length;
                            break;
                        }
                        // decorator可以继续匹配，不跳转
                    }
                }
                
                // 移动到下一个优先级
                currentPriorityIndex++;
            }
            
            // 记录未处理的部分
            if (!isPartProcessed) {
                console.log(`Link part not processed: ${part}`);
            }
        }
    }

    /**
     * 处理文件名,在扩展名前插入随机数
     * @param filename 原始文件名
     * @param hexNum 随机数的十六进制位数，默认为2
     * @returns 处理后的文件名
     */
    public addHexId(filename: string, hexNum= 2): string {
        // 基本扩展名，匹配: .txt, .png, .jpg, .mp3, .mp4
        const basicExt = /\.([a-zA-Z0-9]+)$/;
        //多重扩展名，匹配: .tar.gz, .min.js, .d.ts
        const multiExt = /\.([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*)$/;
        
        if(filename.match(multiExt)){
            // 在扩展名前插入随机数
            return filename.replace(multiExt, `_${generateHexId(hexNum)}.$1`);
        }
        // 在基本扩展名前插入随机数
        return filename.replace(basicExt, `_${generateHexId(hexNum)}.$1`);
    }

}

/**
 * 使用示例：
 * 使用parseLink方法解析链接
 * ```typescript
 * const linkParser = new LinkParser(converter);
 * linkParser.parseLink("image.png|显示文本|80%");
 * ```
 */

LinkParser.registerRule({
    name: "ImageExtensionRule",
    description: "处理图片链接",
    priority: 'ext_name',
    shouldProcess: (linkPart) => {
        const imageExtList = imageExtensions.map(ext => '.' + ext); //TODO: 删除外部的imageExtensions，在该注册规则中定义image适配的扩展名
        return imageExtList.some(ext => linkPart.toLowerCase().endsWith(ext));
    },
    processors: [
        {
            description: "定义解析图片链接的处理器，适用所有输出格式",
            formats: ['typst', 'vuepress', 'quarto','plain'],
            processor: (linkPart, parser, mdState, linkToken) => {
                const attachmentPath = parser.findLinkPath(linkPart);
                if(attachmentPath === null){
                    new Notice(`未找到图片链接: ${linkPart}`);
                    console.log(`未找到图片链接: ${linkPart}`);
                    return;
                }
                let exportName = path.basename(attachmentPath.path);// 获取附件名(带扩展名)
                if(parser.isRenewExportName){
                    exportName = parser.addHexId(exportName);
                }
                parser.linkList.push({export_name: exportName, source_path: attachmentPath.path});// 添加到链接列表中
                linkToken.hidden = false;
                linkToken.content = exportName;
                linkToken.markup = '![[]]';
                // console.log(`处理图片链接: ${linkPart} (typst/vuepress/quarto格式)`);
            }
        },
    ]
});

LinkParser.registerRule({
    name: "mediaExtensionRule",
    description: "处理媒体链接",
    priority: 'ext_name',
    shouldProcess: (linkPart) => {
        const mediaExtList = mediaExtensions.map(ext => '.' + ext); //TODO: 删除外部的imageExtensions，在该注册规则中定义image适配的扩展名
        return mediaExtList.some(ext => linkPart.toLowerCase().endsWith(ext));
    },
    processors: [
        {
            description: "定义解析媒体链接的处理器，适用所有输出格式",
            formats: ['vuepress', 'quarto','plain'],
            processor: (linkPart, parser, mdState, linkToken) => {
                const attachmentPath = parser.findLinkPath(linkPart);
                if(attachmentPath === null){
                    new Notice(`未找到媒体链接: ${linkPart}`);
                    console.log(`未找到媒体链接: ${linkPart}`);
                    return;
                }
                let exportName = path.basename(attachmentPath.path);// 获取附件名(带扩展名)
                if(parser.isRenewExportName){
                    exportName = parser.addHexId(exportName);
                }
                parser.linkList.push({export_name: exportName, source_path: attachmentPath.path});// 添加到链接列表中
                linkToken.hidden = false;
                linkToken.content = exportName;
                linkToken.markup = '![[]]';
                // console.log(`处理图片链接: ${linkPart} (typst/vuepress/quarto格式)`);
            }
        },
    ]
});

LinkParser.registerRule({
    name: "EmbedNoteRule",
    description: "处理嵌入笔记链接",
    priority: 'ext_name',
    shouldProcess: (linkPart) => {
        return true;
    },
    processors: [
        {
            description: "定义解析嵌入笔记链接的处理器，适用所有输出格式",
            formats: ['typst', 'vuepress', 'quarto'], // 仅支持typst和quarto格式
            processor: (linkPart, parser, mdState, linkToken) => {
                
                if(!parser.isRecursiveEmbedNote){ //TODO: 考虑深度拷贝时，拷贝excalidraw文件
                    new Notice(`嵌入笔记链接未开启递归解析: ${linkPart}`);
                    console.log(`嵌入笔记链接未开启递归解析: ${linkPart}`);
                    return;
                }
                const embedNoteFile = parser.findLinkPath(linkPart);
                if(embedNoteFile === null || embedNoteFile.extension !== 'md'){
                    new Notice(`未找到嵌入笔记链接: ${linkPart}`);
                    console.log(`未找到嵌入笔记链接: ${linkPart}`);
                    return;
                }

                if(parser.isExcalidrawNote(embedNoteFile)){
                    let exportName = path.basename(embedNoteFile.path);// 获取附件名(带扩展名)
                    if(parser.isRenewExportName){
                        exportName = parser.addHexId(exportName);
                    }
                    parser.exportConfig?.excalidraw_export_type === 'svg'?
                    exportName = exportName.replace(/\./g,'_').replace(/_md$/, '.svg'):
                    exportName = exportName.replace(/\./g,'_').replace(/_md$/, '.png'); 
                    

                    parser.linkList.push({export_name: exportName, source_path: embedNoteFile.path, type: 'excalidraw'});// 添加到链接列表中
                    linkToken.hidden = false;
                    linkToken.content = exportName;
                    linkToken.markup = '![[]]';
                    return;
                }
                parser.pushNoteFile(embedNoteFile.path);
                const noteInfo = parser.embedNoteCache[embedNoteFile.path];
                const headingText = getHeadingText(noteInfo, linkPart.split('#').slice(1));
                mdState.md.block.parse(
                    headingText,
                    mdState.md,
                    mdState.env,
                    mdState.tokens
                );
                parser.popNoteFile();
            }
        },
        {
            description: "定义解析媒体链接的处理器，专用于plain格式，输出原文",
            formats: ['plain'], // 专门处理plain格式
            processor: (linkPart, parser, mdState, linkToken) => {
                linkToken.content = linkPart;
                linkToken.markup = '![[]]';
            }
        },
    ]
});

/**
 * ## Obsidian 文件查找 API 使用说明
 * 
 * ### 处理带标题索引的链接
 * Obsidian 官方提供了专门处理带标题索引链接的 API：
 * 
 * #### 1. parseLinktext(linktext: string)
 * - 解析 wikilink 链接文本为组件部分
 * - 返回：`{ path: string; subpath: string; }`
 * - 示例：`parseLinktext("笔记名#标题1#标题2")` 返回 `{ path: "笔记名", subpath: "#标题1#标题2" }`
 * 
 * #### 2. getLinkpath(linktext: string) - 推荐使用
 * - 将链接文本转换为链接路径（只获取文件路径部分）
 * - 示例：`getLinkpath("笔记名#标题1#标题2")` 返回 `"笔记名"`
 * 
 * ### 正确的处理流程：
 * ```typescript
 * import { getLinkpath } from 'obsidian';
 * 
 * // 对于带标题索引的链接，如 "笔记名#标题1#标题2"
 * const cleanPath = getLinkpath(linkText);  // 得到 "笔记名"
 * const targetFile = app.metadataCache.getFirstLinkpathDest(cleanPath, sourceFile.path);
 * ```
 * 
 * ### 其他文件查找 API：
 * - `app.metadataCache.getFirstLinkpathDest(linkPath, sourcePath)` - 推荐的文件查找方法
 * - `app.metadataCache.getLinkpathDest(linkPath, sourcePath)` - 返回所有匹配文件
 * - `app.vault.getFileByPath(fullPath)` - 通过完整路径获取文件
 * - `app.metadataCache.resolvedLinks` - 已解析链接的缓存对象
 */