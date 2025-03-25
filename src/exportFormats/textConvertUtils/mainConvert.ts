import { convertMditToQmd_col,convertMditToQmd_tab } from "./mditBlockConvert";
import { parseQuoteBlocks,quoteBlocksToMd } from "./quoteBlockConvert";
import { splitTextByMatches, TextMatch } from "./mditBlockConvert";

export function convertMDtoQMD(text: string): string {
    text = toMarkdownLink(text);
    text = adjustCodeBlock(text);
    text = convertMditToQmd_col(text);
    text = convertMditToQmd_tab(text);
    text = quoteBlocksToMd(parseQuoteBlocks(text));
    text = latexadjust(text);
    return text;
}

/**
 * 将 Obsidian 的 WikiLink 图片引用格式转换为标准 Markdown 格式
 * @param text - 包含 WikiLink 格式图片引用的文本
 * @returns 转换后的标准 Markdown 格式文本
 */
export function toMarkdownLink(text: string): string {
text = text.replace(/!\[\[([^|]+?\.(?:png|jpeg|jpg|gif|mp4))\]\]/g, "![](./assets/$1)");
text = text.replace(
    /!\[\[([^|]+?\.(?:png|jpeg|jpg|gif|mp4))\|(\d+?)\]\]/g,
    "![](./assets/$1){width=$2}"
);
text = text.replace(
    /!\[\[([^|]+?\.(?:png|jpeg|jpg|gif|mp4))\|(.+?)\]\]/g,
    "![$2](./assets/$1)"
);
return text;
}

/**
 * 调整代码块的语言标注格式
 * @param text - 包含代码���的文本
 * @returns 转换后的文本
 */
export function adjustCodeBlock(text: string): string {
text = text.replace(/```(js|python|mermaid)/g, "```{$1}");
return text;
}

/**
 * 调整LaTeX公式的格式
 * - 将 align 环境转换为 aligned 环境
 * - 确保独立公式块 ($$ $$) 上下都有空行
 * @param text - 包含LaTeX公式的文本
 * @returns 转换后的文本
 */
function latexadjust(text: string): string {
    // 转换 align 环境为 aligned 环境
    text = text.replace("\\begin{align}", "\\begin{aligned}");
    text = text.replace("\\end{align}", "\\end{aligned}");
    // 使用 splitTextByMatches 处理独立公式块
    const segments = splitTextByMatches(text, /\$\$[\s\S]+?\$\$/g);
    
    return segments.map((segment: string | TextMatch) => {
        if (typeof segment === 'string') {
            return segment;
        }

        const formula = segment.text;
        // 检查公式前后是否需要添加空行
        let result = formula;
        
        // 如果公式前面不是空行，添加空行
        if (!/\n\s*\n$/.test(text.substring(0, text.indexOf(formula)))) {
            result = '\n' + result;
        }
        
        // 如果公式后面不是空行，添加空行
        if (!/^\n\s*\n/.test(text.substring(text.indexOf(formula) + formula.length))) {
            result = result + '\n';
        }
        
        return result;
    }).join('');
}