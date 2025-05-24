import MarkdownIt from 'markdown-it';
import { TFile } from 'obsidian';
import type  MyPlugin  from '../../main';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { exportToPng, exportToSvg } from '../../lib/excalidrawUtils';
import { ExportConfig } from '../settings';
import * as placeholders from '../../lib/constant';
import { LinkParser } from './linkParser';

// 支持的输出格式类型
export type OutputFormat = 'quarto' | 'vuepress' | 'typst' | 'plain';

export const extensionNameOfFormat: Record<OutputFormat, string> = {
    'quarto': 'qmd',
    'vuepress': 'md',
    'typst': 'typ',
    'plain': 'md'
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

    public plugin: MyPlugin;
    public entryNote: TFile;
    public exportConfig: ExportConfig|null = null; 
    public linkParser: LinkParser; // 链接解析器
    
    constructor(plugin: MyPlugin, file: TFile, attachmentDir = 'assets') {
        super(attachmentDir);
        this.plugin = plugin;
        this.entryNote = file;
        this.linkParser = new LinkParser(this);
    }

    /**
     * replacePlaceholders方法，替换模板中的占位符为实际值
     * @param template 包含占位符的字符串模板
     * @returns 替换后的字符串
     */
    public replacePlaceholders(template: string): string {
        // 替换模板中的占位符
        return placeholders.replaceDatePlaceholders(template
            .replaceAll(placeholders.VAR_VAULT_DIR, this.plugin.VAULT_ABS_PATH)
            .replaceAll(placeholders.VAR_NOTE_DIR, path.dirname(this.plugin.getPathAbs(this.entryNote.path)))
            .replaceAll(placeholders.VAR_NOTE_NAME, this.entryNote.basename));
    }

    public async convert(text: string, format?: OutputFormat): Promise<string> {
        await this.linkParser.resolveEmbedNoteInfo(this.entryNote)// 子类的mditRuleSetup会处理嵌入笔记
        return await super.convert(text, format);
    }

    /**
     * 拷贝附件到目标目录
     * @param exportTargetDirAbs 导出目标目录的绝对路径
     */
    public copyAttachment(exportTargetDirAbs: string): void{
        const links = this.linkParser.linkList;
        const attachmentDirAbs = path.join(exportTargetDirAbs,this.attachmentDir);
        if(!fs.existsSync(attachmentDirAbs)){
            fs.mkdirSync(attachmentDirAbs, { recursive: true });
        }
        for (const link of links) {
            if(link.type === 'excalidraw' && this.exportConfig !== null){
                if((this.plugin.app as any).plugins.plugins["obsidian-excalidraw-plugin"]){
                    if(this.exportConfig.excalidraw_export_type === 'svg'){
                        exportToSvg(this.plugin, link.source_path, path.join(attachmentDirAbs, link.export_name));
                    }
                    else{
                        exportToPng(this.plugin, link.source_path, path.join(attachmentDirAbs, link.export_name), this.exportConfig.excalidraw_png_scale);
                    }
                }
                continue;
            }
            try{
                fs.copyFileSync(this.plugin.getPathAbs(link.source_path), path.join(attachmentDirAbs, link.export_name));
            }catch(error){
                console.error(`Error copying file: ${error}`);
            }
        }
    }
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