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