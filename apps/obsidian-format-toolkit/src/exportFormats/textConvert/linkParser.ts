import { TFile } from "obsidian";
import type { AdvancedConverter } from "./textConverter";
import { getNoteInfo, NoteInfo } from "../../lib/noteResloveUtils";
import * as path from 'path';
import { generateHexId } from "../../lib/idGenerator";

// 定义媒体和图片扩展名列表
export const mediaExtensions = ['mp4','mp3','m4a',]
export const imageExtensions = ['png','jpg','jpeg','gif','svg','webp']

// 定义链接类型
export type LinkType = 'media' | 'image' | 'markdown' | 'excalidraw' | 'unknown' | 'missing';

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

export class LinkParser {
    private converter: AdvancedConverter;
    
    // 从AdvancedConverter迁移的属性
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
        if(this.embedNoteCache[noteFile.path]) return;// 避免因两个笔记互相嵌入而陷入无限递归
        
        const noteInfo = await getNoteInfo(this.converter.plugin, noteFile);
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
    
    /**
     * 获取附件路径和文件类型
     * @param linkText 附件文件名
     * @param sourceNoteFile 源笔记文件（默认为当前处理文件）
     * @returns 附件路径和文件类型
     */
    public getLinkInfo(linkText: string, sourceNoteFile: TFile = this.getCurrentNoteFile()): LinkInfo {
        let resolvedLinks: Record<string, Record<string, number>> = {};
        resolvedLinks = this.converter.plugin.app.metadataCache.resolvedLinks;
        const linksOfCurrentFile = resolvedLinks[sourceNoteFile.path];
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

    parse(text: string): string {
        return text;
    }
}