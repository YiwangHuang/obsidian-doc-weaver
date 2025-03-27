import MarkdownIt from 'markdown-it';
import { TFile } from 'obsidian';
import type  MyPlugin  from '../../../main';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { exportToPngAbs } from '../../lib/excalidrawUtils';
import { NoteInfo, getNoteInfo } from '../../lib/noteResloveUtils';
import { generateHexId } from '../../lib/commonUtils';

// import './processors/InlineFormatProcessor';

export const mediaExtensions = ['mp4','mp3','m4a',]
export const imageExtensions = ['png','jpg','jpeg','gif','svg','webp']

// 支持的输出格式类型
export type OutputFormat = 'quarto' | 'vuepress' | 'typst' | 'plain';

export const extensionNameOfFormat: Record<OutputFormat, string> = {
    'quarto': 'qmd',
    'vuepress': 'md',
    'typst': 'typ',
    'plain': 'md'
}

export type LinkType = 'media' | 'image' | 'markdown' | 'excalidraw' | 'unknown' | 'missing';

export type LinkInfo = {
    path: string;
    raw_text: string;
    export_name: string;
    type: LinkType;
    alias?: string;
    heading_names?: string[];
    file?: TFile;
}

export type MditRule = (converter: BaseConverter|AdvancedConverter) => void;
export type StringProcessor = (text: string, converter?: BaseConverter|AdvancedConverter) => string;

export interface ConverterProcessor {
    name: string;
    formats: OutputFormat[];
    description?: string;
    detail?: string;
    preProcessor?: StringProcessor;
    mditRuleSetup?: MditRule;
    postProcessor?: StringProcessor;
}

export class BaseConverter {
    
    private static Processors: ConverterProcessor[] = [];

    public static registerProcessor(processor: ConverterProcessor) {
        this.Processors.push(processor);
    }

    public md: MarkdownIt;
    private preProcessors: StringProcessor[];
    private postProcessors: StringProcessor[];
    public attachmentDir: string;

    public format: OutputFormat;

    // plugin 和 file 仅在使用tsx测试时可以为空
    constructor(attachmentDir = 'assets') {
        this.md = new MarkdownIt();
        this.preProcessors = [];
        this.postProcessors = [];
        this.attachmentDir = attachmentDir;
        this.setFormat('typst');// 默认使用typst格式
    }

    public pushProcessorsByFormat(processors: ConverterProcessor[],format: OutputFormat) {
        this.format = format;
        processors.forEach(p => {
            if (p.formats.includes(format)) {
                // 添加前置处理器
                p.preProcessor && this.preProcessors.push(p.preProcessor);
                // 设置 markdown-it 规则
                p.mditRuleSetup?.(this);
                // 添加后置处理器
                p.postProcessor && this.postProcessors.push(p.postProcessor);
            }
        });
    }
    public setFormat(format: OutputFormat) {
        this.format = format;
        this.preProcessors = [];
        this.md = new MarkdownIt();
        this.postProcessors = [];
        this.pushProcessorsByFormat(BaseConverter.Processors, format);
    }
    // 独立出来方便在linkProcessor.ts中对嵌入笔记的文本进行前处理
    public preProcess(text: string): string{
        for (const processor of this.preProcessors) {
            text = processor(text, this);
        }
        return text;
    }

    /**
     * 将文本转换为指定格式
     * @param text 要转换的文本
     * @param format 要转换的格式，默认为当前格式TODO: 需要考虑format为空的情况
     * @returns 转换后的文本
     */
    public async convert(text: string, format?: OutputFormat): Promise<string> {
        format && this.setFormat(format);
        // 串行处理所有前置处理器
        text = this.preProcess(text);
        
        text = this.md.render(text);
        
        // 串行处理所有后置处理器
        for (const processor of this.postProcessors) {
            text = processor(text, this);
        }
        
        return text;
    }
}

export class AdvancedConverter extends BaseConverter{

    public links: LinkInfo[]; // 链接附件信息
    public plugin: MyPlugin;
    private noteFileStack: TFile[] = []; // 文件处理栈，用于跟踪文件处理层级
    public embedNoteCache: Record<string, NoteInfo> = {}; // 嵌入笔记缓存
    public isRecursiveEmbedNote = true; // 是否递归解析嵌入笔记
    public isRenewExportName = false; // 是否为附件生成新的导出名称，默认不生成(使用原名称作为导出名)
    constructor(plugin: MyPlugin, file: TFile, attachmentDir = 'assets') {
        super(attachmentDir);
        this.links = [];
        this.plugin = plugin;
        this.embedNoteCache = {};
        this.noteFileStack.push(file);
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
     * @param file 要切换到的新文件
     * @returns 是否成功切换到新文件
     */
    public pushNoteFile(filepath: string): boolean {
        const file = this.plugin.app.vault.getFileByPath(filepath);
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
     * 预先用异步函数解析嵌入笔记的信息(包括其中的所有嵌套嵌入)到embedNoteCache。
     * 这样调用 markdown-it 时，可以用同步函数处理embedNoteCache(markdown-it 仅支持同步函数)。
     * @param noteFile 需要解析的笔记文件
     * 
     * 函数功能：
     * 1. 获取指定笔记的元数据信息
     * 2. 将笔记信息缓存到embedNoteCache中
     * 3. 递归解析笔记中的所有嵌入内容
     */
    public async resolveEmbedNoteInfo(noteFile: TFile): Promise<void>{
        if(this.embedNoteCache[noteFile.path]) return;// 避免因两个笔记互相嵌入而陷入无限递归
        
        const noteInfo = await getNoteInfo(this.plugin, noteFile);
        this.embedNoteCache[noteFile.path] = noteInfo;
        const embeds = noteInfo.cachedMetadata.embeds;
        if(embeds){
            for(const embed of embeds){
                const linkInfo = this.getLinkInfo(embed.link, noteFile);
                if(linkInfo.type === 'markdown'){
                    await this.resolveEmbedNoteInfo(linkInfo.file as TFile);
                }
            }
        }
    }

    public async convert(text: string, format?: OutputFormat): Promise<string> {
        await this.resolveEmbedNoteInfo(this.getCurrentNoteFile() as TFile)// 子类的mditRuleSetup会处理嵌入笔记, 需要用到resolveEmbedNoteInfo
        return await super.convert(text, format);
    }
    /**
     * 获取附件路径和文件类型
     * @param linkText 附件文件名
     * @param isRenewExportName 是否生成新的导出名称
     * @returns 附件路径和文件类型
     * TODO: 考虑增加一个可选参数，用于指定解析的起始文件(起始路径不一定非得是this.currentFile.path)
     * TODO: 考虑用app.metadataCache.getFirstLinkpathDest()来实现路径搜索
     */ 
    public getLinkInfo(linkText: string, sourceNoteFile: TFile = this.getCurrentNoteFile() as TFile): LinkInfo {
        let resolvedLinks: Record<string, Record<string, number>> = {};
        resolvedLinks = this.plugin.app.metadataCache.resolvedLinks;
        const linksOfCurrentFile = resolvedLinks[sourceNoteFile.path];
        if(linksOfCurrentFile){
            // 遍历所有键，检查是否以fileName结尾
            for (const key of Object.keys(linksOfCurrentFile)) {
                if(key.endsWith(linkText) || key.endsWith(linkText.split('#')[0]+'.md')){
                    const linkFile = this.plugin.app.vault.getFileByPath(key) as TFile;
                    let extType: LinkType = 'unknown';
                    let exportName: string = path.basename(key);
                    if(this.isRenewExportName){
                        exportName = addHexId(exportName);
                        console.log(`${linkText} -> ${exportName}`);
                    }
                    if(imageExtensions.includes(linkFile.extension)){
                        extType = 'image';
                    }
                    else if(mediaExtensions.includes(linkFile.extension)){
                        extType = 'media';
                    }
                    else if(linkFile.extension === 'md'){
                        if(key.endsWith('.excalidraw.md')){
                            exportName = exportName.replace(/\./g,'_').replace(/_md$/, '.png');
                            
                            extType = 'excalidraw';
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

    public pushLinkToLinks(link: LinkInfo): void{
        for (const item of this.links) {
            if (item.path === link.path) {
                return;
            }
            if (item.export_name === link.export_name) {
                link.export_name = addHexId(link.export_name); //link作为Object，可在函数中直接修改
            }
        }
        this.links.push(link);
    }

    public copyAttachment(exportTargetDirAbs: string): void{
        for (const link of this.links) {
            if(link.type === 'media' && this.format === 'typst'){
                continue
            }
            const attachmentDirAbs = path.join(exportTargetDirAbs, this.attachmentDir);
            // 确保目标目录存在
            if (!fs.existsSync(attachmentDirAbs)) {
                fs.mkdirSync(attachmentDirAbs, { recursive: true });
            }
            if(link.type === 'excalidraw'){
                if((this.plugin.app as any).plugins.plugins["obsidian-excalidraw-plugin"]){
                    exportToPngAbs(this.plugin, link.path, path.join(attachmentDirAbs, link.export_name));
                }
                continue;
            }

            if(link.type === 'markdown'){continue;}//TODO: 开发完markdown的link处理后，不会再遇到这种情况，需要删除

            try{
                
                fs.copyFileSync(this.plugin.getPathAbs(link.path), path.join(attachmentDirAbs, link.export_name));
            }catch(error){
                console.error(`Error copying file: ${error}`);
            }
        }
    }
}

// 处理文件名,在扩展名前插入随机数
function addHexId(filename: string, hexNum= 2): string {
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

/*
按匹配项分割文本，用于辅助文本处理
*/

export interface TextMatch {
    text: string;
    matches: string[];
}

type TextSegments = (string | TextMatch)[];

export function splitTextByMatches(text: string, regex: RegExp): TextSegments {
    const segments: TextSegments = [];
    let lastIndex = 0; // 记录上一次匹配结束的位置
    
    // 使用 RegExp.exec() 来迭代所有匹配项
    let match: RegExpExecArray | null;
    // 确保正则表达式有全局标志，否则会导致死循环
    const globalRegex = new RegExp(regex.source, regex.flags + (regex.global ? '' : 'g'));
    
    while ((match = globalRegex.exec(text)) !== null) {
        // 如果匹配位置前有未匹配的文本，将其添加到segments
        if (match.index > lastIndex) {
            segments.push(text.slice(lastIndex, match.index));
        }
        
        // 将匹配项添加为TextMatch对象
        segments.push({
            text: match[0],
            matches: match.slice(0) // 包含完整匹配和所有捕获组
        });
        
        lastIndex = globalRegex.lastIndex;
    }
    
    // 处理最后一个匹配之后的剩余文本
    if (lastIndex < text.length) {
        segments.push(text.slice(lastIndex));
    }
    
    return segments;
}

// 用tsx模块测试，这段代码只会在直接运行该文件时执行
if (import.meta.url === url.pathToFileURL(process.argv[1]).href){
    const md = new MarkdownIt();
    const text = `
# 标题
## 子标题
- **列表项1**
- *列表项2*
`;
    console.log(new BaseConverter().convert(text));
    console.log(md.core.ruler.getRules(''));  // 核心规则
    console.log(md.block.ruler.getRules('')); // 块级规则
    console.log(md.inline.ruler.getRules('')); // 内联规则
}