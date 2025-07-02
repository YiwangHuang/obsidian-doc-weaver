import { moment } from 'obsidian';

/**
 * 文本匹配结果接口
 */
export interface TextMatch {
    text: string;
    matches: string[];
}

/**
 * 文本片段类型，可以是普通字符串或匹配结果
 */
export type TextSegments = (string | TextMatch)[];

/**
 * 多语言文本接口
 */
export interface LocalizedTextOptions {
    en: string;
    zh?: string;
    ja?: string;
    ko?: string;
    fr?: string;
    de?: string;
    es?: string;
    pt?: string;
    ru?: string;
    it?: string;
    ar?: string;
    hi?: string;
    th?: string;
    vi?: string;
}

/**
 * 获取当前语言设置
 * @returns 当前语言代码
 */
function getCurrentLanguage(): string {
    try {
        return moment.locale().split('-')[0]; // 'zh-cn' -> 'zh'
    } catch {
        return 'en'; // 默认英语
    }
}

/**
 * 获取本地化文本
 * @param options 多语言文本选项，en为必选
 * @returns 根据当前语言返回对应文本，匹配不到返回英语
 */
export function getLocalizedText(options: LocalizedTextOptions): string {
    const lang = getCurrentLanguage();
    return options[lang as keyof LocalizedTextOptions] || options.en;
}

/**
 * 按匹配项分割文本，用于辅助文本处理
 * @param text 要分割的文本
 * @param regex 用于匹配的正则表达式
 * @returns 分割后的文本片段数组
 */
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