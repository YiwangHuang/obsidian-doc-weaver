import { TFile, Notice } from "obsidian";
import type { AdvancedConverter } from "./textConverter";
import { getNoteInfo, NoteInfo } from "../../lib/noteResloveUtils";
import * as path from 'path';
import { generateHexId } from "../../lib/idGenerator";
import { getHeadingText } from '../../lib/noteResloveUtils';
import type { OutputFormat } from "./textConverter";
import type { Token, StateBlock } from "markdown-it";
// 定义媒体和图片扩展名列表
export const mediaExtensions = ['mp4','mp3','m4a',]
export const imageExtensions = ['png','jpg','jpeg','gif','svg','webp']

// 定义链接类型
export type LinkType = 'media' | 'image' | 'markdown' | 'excalidraw' | 'unknown' | 'missing';

export type LinkConfig = {
    source_path: string; // 源文件路径，相对于vault根目录
    export_name: string; // 导出文件名，包含扩展名      
    type?: LinkType;
}

// 定义链接信息接口
export type LinkInfo = {
    path: string;
    raw_text: string;
    export_name: string;
    type: LinkType;
    alias?: string;
    heading_names?: string[];
    file?: TFile;
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
        
        // 可选：按优先级排序
        // this.rules.sort((a, b) => {
        //     const order = ['ext_name', 'no_ext_name', 'decorator', 'alias'];
        //     return order.indexOf(a.priority) - order.indexOf(b.priority);
        // });
    }

    private converter: AdvancedConverter;
    
    // 从AdvancedConverter迁移的属性
    public linkList: LinkConfig[] = []; // 链接附件信息
    public links: LinkInfo[] = []; // 链接附件信息
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
     * @returns 附件路径，如果未找到则返回null
     */
    public findAttachmentPath(linkText: string): string|null {
        const linksOfCurrentFile = this.converter.plugin.app.metadataCache.resolvedLinks[this.getCurrentNoteFile().path];
        if(linksOfCurrentFile){
            for(const key of Object.keys(linksOfCurrentFile)){
                if(key.endsWith(linkText)){
                    return key;
                }
            }
        }
        return null;
    }
    
    public findEmbedNotePath(linkText: string): string|null {
        const linksOfCurrentFile = this.converter.plugin.app.metadataCache.resolvedLinks[this.getCurrentNoteFile().path];
        if(linksOfCurrentFile){
            for(const key of Object.keys(linksOfCurrentFile)){
                if(key.endsWith(linkText.split('#')[0]+'.md')){
                    return key;
                }
            }
        }
        return null;
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
                const linkInfo = this.getLinkInfo(embed.link, noteFile); // TODO: 使用简单实现的替换掉getLinkInfo
                if(linkInfo.type === 'markdown'){
                    await this.resolveEmbedNoteInfo(linkInfo.file as TFile);
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
     * 获取附件路径和文件类型
     * @param linkText 附件文件名
     * @param sourceNoteFile 源笔记文件（默认为当前处理文件）
     * @returns 附件路径和文件类型
     */
    public getLinkInfo(linkText: string, sourceNoteFile: TFile = this.getCurrentNoteFile()): LinkInfo {
        const linksOfCurrentFile = this.converter.plugin.app.metadataCache.resolvedLinks[sourceNoteFile.path];// 获取当前文件的所有链接信息
        if(linksOfCurrentFile){
            // 遍历所有键，检查是否以fileName结尾
            for (const key of Object.keys(linksOfCurrentFile)) {
                if(key.endsWith(linkText) || key.endsWith(linkText.split('#')[0]+'.md')){
                    const linkFile = this.converter.plugin.app.vault.getFileByPath(key) as TFile;
                    let extType: LinkType = 'unknown';
                    let exportName: string = path.basename(key);
                    if(this.isRenewExportName){
                        exportName = this.addHexId(exportName);
                        console.log(`${linkText} -> ${exportName}`);
                    }
                    if(imageExtensions.includes(linkFile.extension)){
                        extType = 'image';
                    }
                    else if(mediaExtensions.includes(linkFile.extension)){
                        extType = 'media';
                    }
                    else if(linkFile.extension === 'md'){
                        if(key.endsWith('.excalidraw.md') && this.converter.exportConfig !== null){
                            extType = 'excalidraw';
                            this.converter.exportConfig.excalidraw_export_type === 'svg'?
                                exportName = exportName.replace(/\./g,'_').replace(/_md$/, '.svg') :
                                exportName = exportName.replace(/\./g,'_').replace(/_md$/, '.png'); 
                        }
                        else{
                            if(this.isRenewExportName){
                                exportName = path.basename(key)// markdown文件涉及嵌套，导出名称应保持不变
                            }
                            extType = 'markdown';
                        }
                    }
                    return {path: key, raw_text: linkText, export_name: exportName, file: linkFile, type: extType};
                }
            }
        }
        return {path: linkText, raw_text: linkText, export_name: linkText, type: 'missing'};
    }

    /**
     * 将新链接添加到链接列表中，确保没有重复
     * @param link 要添加的新链接信息
     */
    public pushLinkToLinks(link: LinkInfo): void {
        for (const item of this.links) {
            if (item.path === link.path) {
                return;
            }
            if (item.export_name === link.export_name) {
                link.export_name = this.addHexId(link.export_name); //link作为Object，可在函数中直接修改
            }
        }
        this.links.push(link);
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
 * 
 * 1. 注册一个处理图片扩展名的规则
 * ```typescript
 * LinkParser.registerRule({
 *     name: "ImageExtensionRule",
 *     description: "处理图片链接",
 *     priority: 'ext_name',
 *     filter: (linkPart) => imageExtensions.some(ext => linkPart.toLowerCase().endsWith('.' + ext)),
 *     processors: [
 *         {
 *             formats: ['typst', 'quarto'], // 仅支持typst和quarto格式
 *             processor: (linkPart, parser) => {
 *                 // 处理图片链接的逻辑
 *                 console.log(`处理图片链接: ${linkPart} (typst/quarto格式)`);
 *             }
 *         },
 *         {
 *             formats: ['vuepress', 'plain'], // 支持vuepress和plain格式
 *             processor: (linkPart, parser) => {
 *                 // 为vuepress和plain格式处理图片链接
 *                 console.log(`处理图片链接: ${linkPart} (vuepress/plain格式)`);
 *             }
 *         }
 *     ]
 * });
 * ```
 * 
 * 2. 注册一个处理别名的规则
 * ```typescript
 * LinkParser.registerRule({
 *     name: "AliasRule",
 *     description: "处理链接别名",
 *     priority: 'alias',
 *     filter: () => true, // 所有未处理的部分都视为别名
 *     processors: [
 *         {
 *             formats: ['typst'], // 仅支持typst格式
 *             processor: (linkPart, parser) => {
 *                 console.log(`为Typst格式处理别名: ${linkPart}`);
 *             }
 *         },
 *         {
 *             formats: ['quarto', 'vuepress', 'plain'], // 支持其他所有格式
 *             processor: (linkPart, parser) => {
 *                 console.log(`为其他格式处理别名: ${linkPart}`);
 *             }
 *         }
 *     ]
 * });
 * ```
 * 
 * 3. 使用parseLink方法解析链接
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
            formats: ['typst', 'vuepress', 'quarto','plain'], // 仅支持typst和quarto格式
            processor: (linkPart, parser, mdState, linkToken) => {
                const attachmentPath = parser.findAttachmentPath(linkPart);
                if(!attachmentPath){
                    // linkToken.meta.linkType = 'missing';
                    new Notice(`未找到图片链接: ${linkPart}`);
                    console.log(`未找到图片链接: ${linkPart}`);
                    return;
                }
                let exportName = path.basename(attachmentPath);// 获取附件名(带扩展名)
                if(parser.isRenewExportName){
                    exportName = parser.addHexId(exportName);
                }
                parser.linkList.push({export_name: exportName, source_path: attachmentPath});// 添加到链接列表中
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
                const embedNotePath = parser.findEmbedNotePath(linkPart);
                if(!embedNotePath){
                    new Notice(`未找到嵌入笔记链接: ${linkPart}`);
                    console.log(`未找到嵌入笔记链接: ${linkPart}`);
                    return;
                }

                if(parser.isExcalidrawNote(embedNotePath)){
                    let exportName = path.basename(embedNotePath);// 获取附件名(带扩展名)
                    if(parser.isRenewExportName){
                        exportName = parser.addHexId(exportName);
                    }
                    parser.exportConfig?.excalidraw_export_type === 'svg'?
                    exportName = exportName.replace(/\./g,'_').replace(/_md$/, '.svg'):
                    exportName = exportName.replace(/\./g,'_').replace(/_md$/, '.png'); 
                    

                    parser.linkList.push({export_name: exportName, source_path: embedNotePath, type: 'excalidraw'});// 添加到链接列表中
                    linkToken.hidden = false;
                    linkToken.content = exportName;
                    linkToken.markup = '![[]]';
                    return;
                }
                parser.pushNoteFile(embedNotePath);
                const noteInfo = parser.embedNoteCache[embedNotePath];
                const headingText = getHeadingText(noteInfo, linkPart.split('#').slice(1));
                // parser.parse(headingText);
                mdState.md.block.parse(
                    headingText,
                    mdState.md,
                    mdState.env,
                    mdState.tokens
                );
                parser.popNoteFile();
            }
        },
    ]
});