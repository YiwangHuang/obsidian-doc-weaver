import MarkdownIt from 'markdown-it';
import { TFile, Notice } from 'obsidian';
import type  DocWeaver  from '../../main';
// import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { exportToPng, exportToSvg } from '../../lib/excalidrawUtils';
import { ExportConfig, OutputFormat } from '../types';
import * as placeholders from '../../lib/constant';
import { LinkParser } from './linkParser';
import { tagWrapperInfo, TagConfig } from '../../toggleTagWrapper';
import { debugLog } from '../../lib/debugUtils';
import { getLocalizedText } from '../../lib/textUtils';
import { normalizeCrossPlatformPath } from "../../lib/pathUtils";
import { parse } from 'html-parse-string';


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
    
    // 静态处理器，用于全局注册
    private static Processors: ConverterProcessor[] = [];
    
    // 实例级别的处理器，用于实例特定的注册
    private instanceProcessors: ConverterProcessor[] = [];

    // 静态处理器注册方法
    public static registerProcessor(processor: ConverterProcessor) {
        this.Processors.push(processor);
    }

    // 实例级别的处理器注册方法
    public registerProcessor(processor: ConverterProcessor) {
        this.instanceProcessors.push(processor);
    }

    public md: MarkdownIt;
    private preProcessors: StringProcessor[];
    private postProcessors: StringProcessor[];
    /** 导出配置对象 */
    private exportConfig: ExportConfig;

    public format: OutputFormat;
    /**
     * 构造函数
     * @param exportConfig 导出配置对象，可选。从中读取attachment_ref_template等配置
     */
    constructor(exportConfig: ExportConfig) {
        this.md = new MarkdownIt();
        this.preProcessors = [];
        this.postProcessors = [];
        // 从ExportConfig中读取attachment_ref_template，若未提供则使用默认值
        this.exportConfig = exportConfig;
        this.setFormat(this.exportConfig.format);// 默认使用typst格式
    }
    
    public get exportPreset(): ExportConfig {
        return {...this.exportConfig};
    }
    /**
     * 根据格式推送处理器到当前实例
     * @param processors 要处理的处理器数组
     * @param format 输出格式
     */
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
    /**
     * 设置输出格式并重新加载所有处理器
     * @param format 输出格式
     */
    public setFormat(format: OutputFormat) {
        this.format = format;
        this.preProcessors = [];
        this.md = new MarkdownIt();
        this.postProcessors = [];
        
        // 先加载静态处理器
        this.pushProcessorsByFormat(BaseConverter.Processors, format);
        // 再加载实例级别的处理器
        this.pushProcessorsByFormat(this.instanceProcessors, format);
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

    public plugin: DocWeaver;
    public entryNote: TFile;
    public linkParser: LinkParser; // 链接解析器
    
    /**
     * 构造函数
     * @param plugin 插件实例
     * @param file 当前处理的文件
     * @param exportConfig 导出配置对象，可选。从中读取attachment_ref_template等配置
     */
    constructor(plugin: DocWeaver, file: TFile, exportConfig: ExportConfig) {
        super(exportConfig);
        this.plugin = plugin;
        this.entryNote = file;
        this.linkParser = new LinkParser(this);
        this.addActiveHtmlProcessor();
    }

    public resetLinkParser(){
        this.linkParser = new LinkParser(this);
    }

    // 获取当前激活的html处理器
    public addActiveHtmlProcessor(){
        const tagConfigs = this.plugin.settingList[tagWrapperInfo.name]?.tags as TagConfig[];

        const activeTagConfigs = tagConfigs.filter(tag => tag.enabled);
        this.registerHtmlProcessor(this, activeTagConfigs);
    }

    /**
     * 仅替换「不依赖其他占位符」的独立占位符（vaultDir / noteDir / noteName / date）。
     * 作为依赖型占位符解析链的起点，避免递归调用 replacePlaceholders 导致死循环。
     */
    private replaceIndependentPlaceholders(template: string): string {
        return placeholders.replaceDatePlaceholders(template
            .replaceAll(placeholders.VAR_VAULT_DIR, this.plugin.VAULT_ABS_PATH)
            .replaceAll(placeholders.VAR_NOTE_DIR, path.dirname(this.plugin.getPathAbs(this.entryNote.path)))
            .replaceAll(placeholders.VAR_NOTE_NAME, this.entryNote.basename))
            .replaceAll(placeholders.VAR_PRESET_NAME, this.exportPreset.name);
    }

    /**
     * 返回按依赖优先级排序的依赖型占位符列表。
     * 排在前面的先被解析，后面的来源模板中可以引用前面已解析的占位符。
     * 新增依赖占位符只需在数组中按正确位置添加一项。
     */
    private getDependentPlaceholders(): Array<{ token: string; template: string }> {
        return [
            // Level 1：outputDir 仅依赖独立占位符
            { token: placeholders.VAR_OUTPUT_DIR, template: this.exportPreset.outputDirAbsTemplate },
            // Level 2+：未来若有依赖 outputDir 的占位符，按优先级追加在此
        ];
    }

    /**
     * 替换模板中的占位符为实际值。占位符分两类按顺序处理以避免死循环：
     * 1. 独立占位符：vaultDir / noteDir / noteName / date —— 先全部替换；
     * 2. 依赖占位符：按 getDependentPlaceholders() 的优先级顺序逐个解析，
     *    每个的来源模板用「独立占位符 + 前序已解析的依赖占位符」替换，绝不递归调用 replacePlaceholders。
     * @param template 包含占位符的字符串模板
     * @param content 处理后的笔记内容（可选），用于 {{content}}；无此参数时仅处理路径等占位符
     * @returns 替换后的字符串
     */
    public replacePlaceholders(template: string, content?: string): string {
        // 第一步：替换所有独立占位符
        let result = this.replaceIndependentPlaceholders(template);

        // 第二步：按优先级逐个解析依赖型占位符，resolvedValues 累积已解析值供后续依赖使用
        const resolvedValues = new Map<string, string>();
        for (const { token, template: srcTemplate } of this.getDependentPlaceholders()) {
            if (!result.includes(token)) continue;

            // 对来源模板先做独立占位符替换，再用前序已解析的依赖占位符替换
            let resolved = this.replaceIndependentPlaceholders(srcTemplate);
            for (const [prevToken, prevValue] of resolvedValues) {
                resolved = resolved.replaceAll(prevToken, prevValue);
            }

            resolvedValues.set(token, resolved);
            result = result.replaceAll(token, resolved);
        }

        // 第三步：处理 {{content}} 占位符或追加内容
        if (content !== undefined) {
            if (result.includes(placeholders.VAR_CONTENT)) {
                result = result.replaceAll(placeholders.VAR_CONTENT, content);
            } else {
                result = result + '\n' + content;
            }
        }
        return result;
    }

    public async convert(text: string, format?: OutputFormat): Promise<string> {
        await this.linkParser.resolveEmbedNoteInfo(this.entryNote)// 子类的mditRuleSetup会处理嵌入笔记
        return await super.convert(text, format);
    }

    /**
     * 拷贝附件到目标目录
     * @param output_dir_abs 导出目标目录的绝对路径
     * TODO: 改为直接接受attachment_dir_abs
     */
    public async copyAttachment(): Promise<void>{

        // 占位符（含 {{outputDir}}）统一由 replacePlaceholders 按「不依赖 → 依赖」顺序替换，避免重复调用与死循环
        const image_dir_abs = normalizeCrossPlatformPath(this.replacePlaceholders(this.exportPreset.imageDirAbsTemplate));
        const video_dir_abs = normalizeCrossPlatformPath(this.replacePlaceholders(this.exportPreset.videoDirAbsTemplate || this.exportPreset.imageDirAbsTemplate));
        const audio_dir_abs = normalizeCrossPlatformPath(this.replacePlaceholders(this.exportPreset.audioDirAbsTemplate || this.exportPreset.imageDirAbsTemplate));

        // function getAttachmentDirAbs(attachment_dir_abs_template: string): string{
        //     return normalizeCrossPlatformPath(
        //         this.replacePlaceholders(attachment_dir_abs_template)
        //         .replace(placeholders.VAR_OUTPUT_DIR, output_dir_abs));
        //     }

        function makeDirIfNotExists(dir_abs: string): void{
            if(!fs.existsSync(dir_abs)){
                fs.mkdirSync(dir_abs, { recursive: true });
            }
        }


        const links = this.linkParser.linkList;
        // const attachment_dir_abs = path.posix.join(output_dir_abs,this.attachment_ref_template);
        
        for (const link of links) {
            if(link.type === 'excalidraw'){
                if((this.plugin.app as any).plugins.plugins["obsidian-excalidraw-plugin"]){
                    if(this.exportPreset.excalidrawExportType === 'svg'){
                        makeDirIfNotExists(image_dir_abs);
                        await exportToSvg(this.plugin, link.source_path_rel_vault, path.posix.join(image_dir_abs, link.output_filename));
                    }
                    else{
                        makeDirIfNotExists(image_dir_abs);
                        await exportToPng(this.plugin, link.source_path_rel_vault, path.posix.join(image_dir_abs, link.output_filename), this.exportPreset.excalidrawPngScale);
                    }
                }
            }
            else if(link.type === 'image'){
                makeDirIfNotExists(image_dir_abs);
                fs.copyFileSync(this.plugin.getPathAbs(link.source_path_rel_vault), path.posix.join(image_dir_abs, link.output_filename));
            }
            else if(link.type === 'video'){
                makeDirIfNotExists(video_dir_abs);
                fs.copyFileSync(this.plugin.getPathAbs(link.source_path_rel_vault), path.posix.join(video_dir_abs, link.output_filename));
            }
            else if(link.type === 'audio'){
                makeDirIfNotExists(audio_dir_abs);
                fs.copyFileSync(this.plugin.getPathAbs(link.source_path_rel_vault), path.posix.join(audio_dir_abs, link.output_filename));
            }
            // else{
            //     makeDirIfNotExists(image_dir_abs);
            //     fs.copyFileSync(this.plugin.getPathAbs(link.source_path_rel_vault), path.posix.join(image_dir_abs, link.output_filename));
            // }
        }
    }

    // TODO: 增强该功能，期望能识别标签匹配关系
    /**
     * 注册HTML处理器到转换器实例
     * @param converter 文本转换器实例
     * @param configs 标签配置数组，包含标签类型、类名和Typst前缀等信息
     */
    registerHtmlProcessor(converter: BaseConverter, configs: TagConfig[]) {
        // 输出调试信息，显示注册的配置数量
        debugLog('注册自定义HTML处理器，配置数量:', configs.length);
        
        // 向转换器实例注册自定义处理器
        converter.registerProcessor({
            name: 'customHtmlProcessor',
            formats: ['typst', 'latex'],
            description: '处理HTML格式',
            mditRuleSetup: (converter: BaseConverter) => {
                // 在markdown-it的inline阶段之后添加自定义规则
                // 此时所有HTML标签已被识别为html_inline类型的token
                converter.md.core.ruler.after('inline', 'custom_html_processor', (state) => {
                    // 输出调试信息，显示待处理的token总数
                    console.log('自定义HTML处理器被调用，tokens数量:', state.tokens.length);

                    // 根据当前导出格式选择对应的模板字段
                    const templateKey: keyof TagConfig =
                        converter.format === 'latex' ? 'mapToLatex' : 'mapToTypst';
                    const formatLabel = converter.format === 'latex' ? 'LaTeX' : 'Typst';

                    // 遍历解析状态中的所有token
                    for (let i = 0; i < state.tokens.length; i++) {
                        const token = state.tokens[i];
                        
                        // 只处理inline类型的token且包含子元素
                        if (token.type === 'inline' && token.children) {
                            // 遍历inline token内的所有子token
                            for (let j = 0; j < token.children.length; j++) {
                                const childToken = token.children[j];
                                
                                // 只处理html_inline类型的token
                                if (childToken.type === 'html_inline') {
                                    // 先判断是否为结束标签（以</>开头）
                                    const isClosingTag = childToken.content.startsWith('</');
                                    
                                    // 准备用于解析的HTML内容
                                    let contentToParse = childToken.content;
                                    
                                    // 如果是结束标签，去掉斜杠以便正确解析标签名
                                    if (isClosingTag) {
                                        // 将 "</tagname>" 转换为 "<tagname>" 以便解析器识别标签名
                                        contentToParse = childToken.content.replace('</', '<');
                                    }
                                    
                                    // 尝试解析HTML内容
                                    try {
                                        const parsedHtml = parse(contentToParse);
                                        
                                        // 检查解析结果是否有效
                                        if (parsedHtml && parsedHtml.length > 0) {
                                            const htmlNode = parsedHtml[0];
                                            
                                            // 对配置进行排序：确保精确匹配（带class）优先于通用匹配（不带class）
                                            // 这样可以避免通用规则覆盖特定规则的情况
                                            // 例如：<u class="special"> 应该匹配带class的规则，而不是通用的<u>规则
                                            const sortedConfigs = [...configs].sort((a, b) => {
                                                const aHasClass = a.tagClass.trim() !== '';
                                                const bHasClass = b.tagClass.trim() !== '';
                                                
                                                // 精确匹配（带class）排在前面，通用匹配（不带class）排在后面
                                                if (aHasClass && !bHasClass) return -1;  // a优先
                                                if (!aHasClass && bHasClass) return 1;   // b优先
                                                return 0; // 保持原顺序
                                            });
                                            
                                            // 遍历排序后的配置，查找匹配的标签
                                            for (const config of sortedConfigs) {
                                                if (htmlNode.name === config.tagType) {
                                                    const template = config[templateKey] as string;

                                                    // 检查模板是否包含占位符
                                                    if (!template.includes(placeholders.VAR_TAG_CONTENT)) {
                                                        new Notice(getLocalizedText({
                                                            en: `Tag "${config.name}" ${formatLabel} template is missing placeholder ${placeholders.VAR_TAG_CONTENT}`,
                                                            zh: `标签 "${config.name}" 的 ${formatLabel} 模板缺少占位符 ${placeholders.VAR_TAG_CONTENT}`,
                                                        }));
                                                        break;
                                                    }
                                                    const [tplPrefix, tplSuffix] = template.split(placeholders.VAR_TAG_CONTENT);

                                                    if (isClosingTag) {
                                                        // 结束标签替换为模板后缀
                                                        childToken.content = tplSuffix ?? "";
                                                        break;
                                                    } else {
                                                        // 开始标签：需要检查 class 属性是否匹配
                                                        const classAttr = htmlNode.attrs.find(attr => attr.name === 'class');

                                                        let classMatches = false;
                                                        if (config.tagClass.trim() === '') {
                                                            classMatches = true;
                                                        } else {
                                                            classMatches = !!(classAttr && classAttr.value === config.tagClass);
                                                        }

                                                        if (classMatches) {
                                                            // 开始标签替换为模板前缀
                                                            childToken.content = tplPrefix;
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } catch (error) {
                                        // HTML解析失败时保持原内容不变，避免破坏文档
                                        console.warn('HTML解析失败:', error);
                                    }
                                }
                            }
                        }
                    }
                });
            }
        });
    }
}




// 用tsx模块测试，这段代码只会在直接运行该文件时执行
// if (import.meta.url === url.pathToFileURL(process.argv[1]).href){
//     const md = new MarkdownIt();
//     const text = `
// # 标题
// ## 子标题
// - **列表项1**
// - *列表项2*
// `;
//     console.log(new BaseConverter().convert(text));
//     console.log(md.core.ruler.getRules(''));  // 核心规则
//     console.log(md.block.ruler.getRules('')); // 块级规则
//     console.log(md.inline.ruler.getRules('')); // 内联规则
// }