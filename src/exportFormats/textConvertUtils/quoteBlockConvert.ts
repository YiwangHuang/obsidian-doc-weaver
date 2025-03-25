import * as url from 'url';
/**
 * 定义引用块的类型，可以是字符串或引用块对象
 */
export type QuoteContent = string | QuoteBlock;

/**
 * 引用块接口定义
 */
export interface QuoteBlock {
    level: number;           // 引用的层级
    contents: QuoteContent[]; // 内容可以是字符串或嵌套的引用块
}

/**
 * 解析Markdown引用块的内容
 * @param text - 包含引用的文本内容
 * @returns 解析后的引用内容数组
 */
export function parseQuoteBlocks(text: string): QuoteContent[] {
    const lines = text.split('\n');
    const result: QuoteContent[] = [];
    let blockStack: QuoteBlock[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const quoteMatch = line.match(/^(>+)(?:\s)?(.*)/); // (?:\s)? 匹配一个可选的空格字符

        if (quoteMatch) {
            const level = quoteMatch[1].length;
            const content = quoteMatch[2];

            if (blockStack.length === 0) {
                // 创建新的顶层引用块
                const newBlock: QuoteBlock = {
                    level,
                    contents: [content]
                };
                result.push(newBlock);
                blockStack.push(newBlock);
            } else {
                const currentBlock = blockStack[blockStack.length - 1];
                
                if (level > currentBlock.level) {
                    // 创建新的嵌套引用块
                    const newBlock: QuoteBlock = {
                        level,
                        contents: [content]
                    };
                    currentBlock.contents.push(newBlock);
                    blockStack.push(newBlock);
                } else if (level === currentBlock.level) {
                    // 继续当前引用块
                    currentBlock.contents.push(content);
                } else {
                    // 返回上一级：回溯栈直到找到对应层级的块
                    while ( // 修改：保留至少一个块在栈中 blockStack.length > 1 &&
                        blockStack[blockStack.length - 1].level > level) {
                        blockStack.pop();
                    }
                    // 找到合适的块后，添加内容
                    blockStack[blockStack.length - 1].contents.push(content);
                }
            }
        } else {
            // 普通文本行，清空块栈
            result.push(line);
            blockStack = [];
        }
    }

    return result;
}


export function quoteBlocksToMd(contents: QuoteContent[]): string {
    return contents.map(content => {
        if (typeof content === 'string') {
            return content;
        } else {
            // 获取第一个内容来确定引用块类型
            const firstContent = content.contents[0];
            
            let remainingContents = content.contents;

            // 如果第一个内容是字符串，检查是否包含特殊标记
            if (typeof firstContent === 'string') {
                // 匹配可能的标记模式，例如 [!note] 或 [!warning]
                const match = firstContent.match(/^\[!(.+)\]([+-])?(.*)/);
                if (match) {
                    const typeInfo = `callout-${match[1].toLowerCase()}`;
                    const isCollapse = match[2]=="+" ? "false" : "true";
                    const collapseInfo = match[2] ? ` collapse=${isCollapse}` : "";
                    const titleInfo = match[3] ? ` title="${match[3].trim()}"` : "";
                    // 移除第一行的标记
                    remainingContents = content.contents.slice(1);
                    return `\n::: {.${typeInfo}${titleInfo}${collapseInfo}}\n\n${quoteBlocksToMd(remainingContents)}\n\n:::`;
                }
            }

            // 生成引用块
            return `\n::: callout\n\n${quoteBlocksToMd(remainingContents)}\n\n:::`;
        }
    }).join('\n');
}

/**
 * 将解析后的引用内容转换回Markdown文本
 * @param contents - 引用内容数组
 * @param level - 当前引用层级（用于递归）
 * @returns 格式化的Markdown文本
 */
export function quoteContentsToMarkdown(contents: QuoteContent[], level = 0): string {
    return contents.map(content => {
        if (typeof content === 'string') {
            return level > 0 ? `${'>'.repeat(level)} ${content}` : content;
        } else {
            // 处理引用块
            return content.contents
                .map(item => quoteContentsToMarkdown([item], content.level))
                .join('\n');
        }
    }).join('\n');
}

// 用tsx模块测试，这段代码只会在直接运行该文件时执行
if (import.meta.url === url.pathToFileURL(process.argv[1]).href){
const markdownText = `
普通文本
> 一级引用
>> 二级引用第一行
>> 二级引用第二行
>>> 三级引用
> 回到一级引用
>> 第二个二级引用第一行
>>  - 第二个二级引用第二行
普通文本结束
> [!note]- try
> 这是一个注释
>> 这是嵌套的内容

> [!warning]
> 这是一个警告
`;

const parsed = parseQuoteBlocks(markdownText);
// console.log(JSON.stringify(parsed, null, 2));
console.log(quoteBlocksToMd(parsed));
}