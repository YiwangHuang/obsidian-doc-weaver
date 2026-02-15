import { TFile, Notice } from "obsidian";
import type { AdvancedConverter } from "./textConverter";
import { getNoteInfo, NoteInfo } from "../../lib/noteResloveUtils";
import * as path from 'path';
import { generateHexId } from "../../lib/idGenerator";
import { getHeadingText } from '../../lib/noteResloveUtils';
import type { OutputFormat } from "./textConverter";
import type { Token, StateBlock } from "markdown-it";
import { getLocalizedText } from '../../lib/textUtils';
import { debugLog } from "../../lib/debugUtils";

// import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs';
// import type Token from 'markdown-it/lib/token.mjs';
// 适配"moduleResolution": "bundler"

import { getLinkpath } from "obsidian";
// 定义视频、音频和图片扩展名列表
export const videoExtensions = ['mp4', 'mkv', 'mov', 'avi', 'wmv', 'flv', 'webm', 'm4v']

export const audioExtensions = ['mp3', 'wav', 'aac', 'm4a', 'flac']

export const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'pdf', 'tiff', 'tif', 'bmp', 'avif', 'heic', 'heif']

export type LinkConfig = {
    source_path_rel_vault: string; // 源文件路径，相对于vault根目录
    output_filename: string; // 导出文件名，包含扩展名      
    type?: 'video' | 'audio' | 'image' | 'markdown' | 'excalidraw';
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
    private linkMap: Map<string, LinkConfig> = new Map(); // 链接附件信息，以source_path为键
    public isRecursiveEmbedNote = true; // 是否递归解析嵌入笔记
    public renameExportAttachment = false; // 是否为附件生成新的导出名称，默认不生成(使用原名称作为导出名)
    private noteFileStack: TFile[] = []; // 文件处理栈，用于跟踪文件处理层级
    public embedNoteCache: Record<string, NoteInfo> = {}; // 嵌入笔记缓存
    public embedNoteCount = 0; // 嵌入笔记数量，期望在Notice中显示

    constructor(converter: AdvancedConverter) {
        this.converter = converter;
        this.noteFileStack = [converter.entryNote];
    }

    /**
     * 获取导出目录，相对于vault根目录
     * @returns 导出目录，相对于vault根目录
     */
    get exportConfig() {
        return this.converter.exportPreset;
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
        this.embedNoteCount++;
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
     * 
     * 处理流程：
     * 1. 第一个部分：文件识别（ext_name -> no_ext_name）
     * 2. 后续部分：装饰器处理（decorator -> alias）
     */
    public parseLink(linkText: string, mdState: StateBlock, linkToken: Token): void {
        const linkParts = linkText.split('|');
        
        // 定义处理阶段
        enum ProcessingStage {
            FILE_IDENTIFICATION = 'file_identification',  // 文件识别阶段
            DECORATION = 'decoration'                      // 装饰器处理阶段
        }
        
        let currentStage = ProcessingStage.FILE_IDENTIFICATION;
        
        for (const part of linkParts) {
            const result = this.processPart(part, currentStage, mdState, linkToken);
            
            // 如果文件识别成功，后续部分进入装饰器阶段
            if (result.processed && currentStage === ProcessingStage.FILE_IDENTIFICATION) {
                currentStage = ProcessingStage.DECORATION;
            }
            
            // 如果处理了alias，停止处理后续部分
            if (result.stopProcessing) {
                break;
            }
            
            // 记录未处理的部分
            if (!result.processed) {
                debugLog(`Link part not processed: ${part}`);
            }
        }
    }

    /**
     * 处理单个链接部分
     * @param part 链接部分
     * @param stage 当前处理阶段
     * @param mdState markdown状态
     * @param linkToken 链接token
     * @returns 处理结果：{processed: 是否处理成功, stopProcessing: 是否停止处理后续部分}
     */
    private processPart(
        part: string, 
        stage: 'file_identification' | 'decoration', 
        mdState: StateBlock, 
        linkToken: Token
    ): {processed: boolean, stopProcessing: boolean} {
        // 根据阶段确定要执行的规则优先级
        const prioritiesToCheck = stage === 'file_identification' 
            ? ['ext_name', 'no_ext_name'] as const
            : ['decorator', 'alias'] as const;
        
        for (const priority of prioritiesToCheck) {
            const rules = LinkParser.rules.filter(rule => rule.priority === priority);
            
            for (const rule of rules) {
                if (rule.shouldProcess(part)) {
                    // 执行匹配的处理器
                    const executed = this.executeProcessors(rule, part, mdState, linkToken);
                    
                    if (executed) {
                        // 如果是alias处理，停止所有后续处理
                        if (priority === 'alias') {
                            return { processed: true, stopProcessing: true };
                        }
                        return { processed: true, stopProcessing: false };
                    }
                }
            }
        }
        
        return { processed: false, stopProcessing: false }; // 未找到匹配的规则
    }

    /**
     * 执行规则的处理器
     * @param rule 规则
     * @param part 链接部分
     * @param mdState markdown状态
     * @param linkToken 链接token
     * @returns 是否有处理器被执行
     */
    private executeProcessors(
        rule: LinkParseRule, 
        part: string, 
        mdState: StateBlock, 
        linkToken: Token
    ): boolean {
        const matchingProcessors = rule.processors
            .filter(processor => processor.formats.includes(this.converter.format));
        
        if (matchingProcessors.length > 0) {
            matchingProcessors.forEach(processor => 
                processor.processor(part, this, mdState, linkToken)
            );
            return true;
        }
        
        return false;
    }

    /**
     * 处理文件名,在文件名前插入随机数
     * @param filename 原始文件名
     * @param hexNum 随机数的十六进制位数，默认为2
     * @returns 处理后的文件名
     */
    public addHexId(filename: string, hexNum= 2): string {
        return `${generateHexId(hexNum)}_${filename}`;
        // // 基本扩展名，匹配: .txt, .png, .jpg, .mp3, .mp4
        // const basicExt = /\.([a-zA-Z0-9]+)$/;
        // //多重扩展名，匹配: .tar.gz, .min.js, .d.ts
        // const multiExt = /\.([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*)$/;
        
        // if(filename.match(multiExt)){
        //     // 在扩展名前插入随机数
        //     return filename.replace(multiExt, `_${generateHexId(hexNum)}.$1`);
        // }
        // // 在基本扩展名前插入随机数
        // return filename.replace(basicExt, `_${generateHexId(hexNum)}.$1`);
    }

    /**
     * 获取所有链接的数组形式（用于向后兼容）
     * @returns 链接配置数组
     */
    public get linkList(): LinkConfig[] {
        return Array.from(this.linkMap.values());
    }

    /**
     * 安全地添加链接到linkMap，避免添加重复的链接信息
     * 重复判断基于source_path，同一个源文件只会被添加一次
     * @param linkConfig 要添加的链接配置
     * @returns 如果成功添加返回true，如果已存在则返回false
     */
    public addLink(linkConfig: LinkConfig): void {
        this.linkMap.set(linkConfig.source_path_rel_vault, linkConfig);
    }

    /**
     * 格式化输出导出信息摘要，用于在Notice中显示
     * @param outputPath 输出文件路径（可选）
     * @returns 格式化的导出信息字符串
     */
    public formatExportSummary(outputPath?: string): string {
        const lines: string[] = [];
        
        // 添加输出路径信息
        if (outputPath) {
            lines.push(`${getLocalizedText({en: 'Export path', zh: '导出路径'})}: ${outputPath}`);
        }
        
        const totalLinks = this.linkMap.size;
        
        // 添加嵌入笔记统计
        if (this.embedNoteCount > 0) {
            lines.push(`\n${getLocalizedText({en: 'Embedded notes count', zh: '嵌入笔记数量'})}: ${this.embedNoteCount}`);
        }
        
        // 如果有链接，统计并显示详细分类
        if (totalLinks > 0) {
            const linkStats: Record<string, number> = {};
            
            // 直接遍历Map的值，统计分类
            for (const link of this.linkMap.values()) {
                let category: string;
                
                if (link.type === 'excalidraw') {
                    // 对于excalidraw类型，根据导出格式特别分类
                    const issvg = this.exportConfig?.excalidrawExportType === 'svg';
                    category = issvg ? 'Excalidraw->SVG' : 'Excalidraw->PNG';
                } else {
                    // 对于其他类型，直接使用导出文件名的扩展名（去掉点号）
                    const extension = path.extname(link.output_filename).toLowerCase();
                    category = extension ? extension.substring(1).toUpperCase() : 'no-extension';
                }
                
                // 统计数量
                linkStats[category] = (linkStats[category] || 0) + 1;
            }
            
            lines.push(`\n${getLocalizedText({en: 'Attachments count', zh: '附件数量'})}: ${totalLinks}`);
            
            // 按扩展名排序显示
            const categories = Object.entries(linkStats).sort(([a], [b]) => a.localeCompare(b));
            
            for (const [category, count] of categories) {
                lines.push(`  ${category}: ${count}`);
            }
        }
        
        return lines.join('\n');
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
            formats: ['typst', 'HMD', 'quarto','plain'],
            processor: (linkPart, parser, mdState, linkToken) => {
                const attachmentPath = parser.findLinkPath(linkPart);
                if(attachmentPath === null){
                    new Notice(`未找到图片链接: ${linkPart}`);
                    return;
                }
                let exportName = path.basename(attachmentPath.path);// 获取附件名(带扩展名)
                // 将文件名中的空格替换为下划线，避免路径问题
                exportName = exportName.replace(/\s/g, '_');
                if(parser.renameExportAttachment){
                    exportName = parser.addHexId(exportName);
                }
                parser.addLink({output_filename: exportName, source_path_rel_vault: attachmentPath.path, type: 'image'});// 添加到链接列表中
                linkToken.hidden = false;
                linkToken.content = exportName;
                linkToken.markup = '![[]]';
                linkToken.meta = {...linkToken.meta, attchmentType: 'image'};
            }
        },
    ]
});

/**
 * 解析附件链接的公共逻辑：查找路径、生成导出名、添加到链接列表
 * @param linkPart 链接文本
 * @param parser 链接解析器实例
 * @param type 附件类型
 * @returns 导出文件名，失败时返回null
 */
function resolveAttachmentLink(linkPart: string, parser: LinkParser, type: LinkConfig['type']): string | null {
    const attachmentPath = parser.findLinkPath(linkPart);
    if (attachmentPath === null) {
        new Notice(`未找到${type}链接: ${linkPart}`);
        return null;
    }
    let exportName = path.basename(attachmentPath.path).replace(/\s/g, '_');
    if (parser.renameExportAttachment) exportName = parser.addHexId(exportName);
    parser.addLink({ output_filename: exportName, source_path_rel_vault: attachmentPath.path, type });
    return exportName;
}

/**
 * 创建视频/音频链接解析处理器（共用逻辑，按类型和开关字段区分）
 * @param type 附件类型 'video' | 'audio'
 * @param processFlag ExportConfig中对应的处理开关字段名
 */
function createMediaProcessors(type: 'video' | 'audio', processFlag: 'processVideo' | 'processAudio'): LinkProcessor[] {
    return [
        {
            description: `解析${type}链接，适用plain格式`,
            formats: ['plain'],
            processor: (linkPart, parser, _mdState, linkToken) => {
                const exportName = resolveAttachmentLink(linkPart, parser, type);
                if (!exportName) return;
                linkToken.hidden = false;
                linkToken.content = exportName;
                linkToken.markup = '![[]]';
                linkToken.meta = { ...linkToken.meta, attchmentType: type };
            }
        },
        {
            description: `解析${type}链接，专用于HMD/quarto/typst格式（受开关控制）`,
            formats: ['HMD', 'quarto', 'typst'],
            processor: (linkPart, parser, _mdState, linkToken) => {
                if (parser.exportConfig?.[processFlag]) {
                    const exportName = resolveAttachmentLink(linkPart, parser, type);
                    if (!exportName) return;
                    linkToken.hidden = false;
                    linkToken.content = exportName;
                    linkToken.markup = '![[]]';
                    linkToken.meta = { ...linkToken.meta, attchmentType: type };
                } else {
                    // 未启用处理开关时，隐藏链接并保留原文
                    linkToken.content = linkPart;
                    linkToken.hidden = true;
                    linkToken.markup = '![[]]';
                    linkToken.meta = { ...linkToken.meta, attchmentType: type };
                }
            }
        },
    ];
}

// 注册视频链接解析规则
LinkParser.registerRule({
    name: "videoExtensionRule",
    description: "处理视频链接",
    priority: 'ext_name',
    shouldProcess: (linkPart) => videoExtensions.some(ext => linkPart.toLowerCase().endsWith('.' + ext)),
    processors: createMediaProcessors('video', 'processVideo'),
});

// 注册音频链接解析规则
LinkParser.registerRule({
    name: "audioExtensionRule",
    description: "处理音频链接",
    priority: 'ext_name',
    shouldProcess: (linkPart) => audioExtensions.some(ext => linkPart.toLowerCase().endsWith('.' + ext)),
    processors: createMediaProcessors('audio', 'processAudio'),
});

LinkParser.registerRule({
    name: "EmbedNoteRule",
    description: "处理嵌入笔记链接",
    priority: 'no_ext_name',
    shouldProcess: (linkPart) => {
        return true;
    },
    processors: [
        {
            description: "定义解析嵌入笔记链接的处理器，适用所有输出格式",
            formats: ['typst', 'HMD', 'quarto'], // 仅支持typst和quarto格式
            processor: (linkPart, parser, mdState, linkToken) => {
                
                if(!parser.isRecursiveEmbedNote){ //TODO: 考虑深度拷贝时，拷贝excalidraw文件
                    new Notice(`嵌入笔记链接未开启递归解析: ${linkPart}`);
                    return;
                }
                const embedNoteFile = parser.findLinkPath(linkPart);
                if(embedNoteFile === null || embedNoteFile.extension !== 'md'){
                    new Notice(`未找到嵌入笔记链接: ${linkPart}`);
                    return;
                }

                if(parser.isExcalidrawNote(embedNoteFile)){
                    let exportName = path.basename(embedNoteFile.path);// 获取附件名(带扩展名)
                    // 将文件名中的空格替换为下划线，避免路径问题
                    exportName = exportName.replace(/\s/g, '_');
                    if(parser.renameExportAttachment){
                        exportName = parser.addHexId(exportName);
                    }
                    parser.exportConfig?.excalidrawExportType === 'svg'?
                    exportName = exportName.replace(/\./g,'_').replace(/_md$/, '.svg'):
                    exportName = exportName.replace(/\./g,'_').replace(/_md$/, '.png'); 
                    

                    parser.addLink({output_filename: exportName, source_path_rel_vault: embedNoteFile.path, type: 'excalidraw'});// 添加到链接列表中
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

LinkParser.registerRule({
    name: "Scale",
    description: "处理显示大小",
    priority: 'decorator',
    shouldProcess: (linkPart) => {
        return true;
    },
    processors: [
        {
            description: "解析显示大小的处理器，目前只适用plain",
            formats: ['plain'], // 仅支持plain格式
            processor: (linkPart, parser, mdState, linkToken) => {
                // 将装饰器部分（如尺寸）追加到链接内容中
                linkToken.content += "|"+linkPart;
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