/**
 * 自己实现数学公式解析插件
 * 支持两种格式：
 * 1. 行内公式：$formula$
 * 2. 独立公式块：$$formula$$
 */
import MarkdownIt from 'markdown-it';
import * as url from 'url';

import { BaseConverter, splitTextByMatches, TextMatch } from '../textConverter';

BaseConverter.registerProcessor({
    name: 'mathParserRule',
    formats: ['quarto', 'vuepress', 'typst'],
    description: '自定义数学公式解析规则',
    preProcessor: (text: string) => {    
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
    },
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.use(mathPlugin);
    }
});

BaseConverter.registerProcessor({
    name: 'mathRendererRule_typst',
    formats: ['typst'],
    description: '自定义数学公式渲染规则',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules.math_block = (tokens, idx) => {
            return `\n#mitex[\`${tokens[idx].content.trim()}\`]\n`;
        };
        converter.md.renderer.rules.math_inline = (tokens, idx) => {
            return `#mi[\`${tokens[idx].content.trim()}\`]`;
        };
    }
});


BaseConverter.registerProcessor({
    name: 'mathRendererRule_quarto',
    formats: ['quarto'],
    description: '自定义数学公式渲染规则',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules.math_block = (tokens, idx) => {
            return `\n$$\n${tokens[idx].content.trim()}\n$$\n\n`;
        };
        converter.md.renderer.rules.math_inline = (tokens, idx) => {
            return `$${tokens[idx].content.trim()}$`;
        };
    }
});

/**
 * 数学公式解析插件
 * 支持两种格式：
 * 1. 行内公式：$formula$
 * 2. 独立公式块：$$formula$$
 */
function mathPlugin(md: MarkdownIt) {
    // 检查前后字符是否合法（不是数字或反斜杠）
    const isValidBoundary = (str: string, pos: number, isStart: boolean) => {
        const char = isStart ? (pos > 0 ? str[pos - 1].charCodeAt(0) : false) 
                           : (str[pos] && str[pos].charCodeAt(0));
        return !char || char === 0x20  // 空格
                    || (!isStart && (char === 0x2e  // 句点
                                || char === 0x2c    // 逗号
                                || char === 0x3b))  // 分号
                    || (char !== 0x5c   // 不是反斜杠
                        && (char < 0x30 || char > 0x39));  // 不是数字
    };

    // 添加独立公式块规则
    md.block.ruler.after('fence', 'math_block', (state, startLine, endLine, silent) => {
        const startPos = state.bMarks[startLine] + state.tShift[startLine];
        const str = state.src;

        const getLine = (lineNum: number) => {
            return str.slice(state.bMarks[lineNum], state.eMarks[lineNum]).trim();
        }

        // 检查开始标记
        if (!str.startsWith('$$', startPos)) {
            return false;
        }

        // 寻找结束标记
        const lines: string[] = [];
        let nextLine = startLine;
        let findEnd = false;
        while (nextLine < endLine) {
            // 考虑独立公式内容和标识符全部在一行的情况，例如$$\sin\theta$$
            // TODO: 可以舍去该特性，也还有优化空间
            if (nextLine === startLine) {
                const match = getLine(nextLine).trim().match(/^\$\$([\s\S]+?)\$\$$/);
                if (match) {
                    lines.push(match[1]);
                    findEnd = true;
                    break;
                }
            }
            if (nextLine > startLine) {
                // 获取当前行
                const line = getLine(nextLine);
                if (line === '$$') {
                    findEnd = true;
                    break;
                } else if (line.endsWith('$$')) { //TODO:
                    findEnd = true;
                    lines.push(line.slice(0, -2));
                    break;
                }
                lines.push(line);
            }
            nextLine++;
        }

        // 没找到结束标记
        if (!findEnd) {
            return false;
        }

        if (silent) {
            return true;
        }

        // 创建token
        const token = state.push('math_block', 'math', 0);
        token.block = true;
        token.content = lines.join('\n');
        token.markup = '$$';
        token.map = [startLine, nextLine + 1];

        state.line = nextLine + 1;
        return true;
    });

    // 添加行内公式规则
    md.inline.ruler.after('escape', 'math_inline', (state, silent) => {
        if (state.src[state.pos] !== '$') {
            return false;
        }

        const str = state.src;
        const start = state.pos;
        
        // 检查起始位置是否合法
        if (!isValidBoundary(str, start, true)) {
            return false;
        }

        // 寻找结束标记
        const end = str.indexOf('$', start + 1);
        if (end === -1) {
            return false;
        }

        // 检查结束位置是否合法
        if (!isValidBoundary(str, end + 1, false)) {
            return false;
        }

        // 检查内容是否为空或只有空白字符
        const content = str.slice(start + 1, end).trim();
        if (!content) {
            return false;
        }

        if (silent) {
            return true;
        }

        // 创建token
        const token = state.push('math_inline', 'math', 0);
        token.content = content;
        token.markup = '$';

        state.pos = end + 1;
        return true;
    });
}







if (import.meta.url === url.pathToFileURL(process.argv[1]).href){
    const text = `
$$
\\sin\\theta$$

> [!note]- 解答
> 这是一个注释块

> $$
> E = mc^2
> $$
>

> 

$123$
`;
    const md = new MarkdownIt()

    md.renderer.rules.math_inline_double = function(tokens, idx) {
        return '$$' + tokens[idx].content + '$$';
    };

    // md.disable(['blockquote']);
    console.log(md.parse(text,{}));
    console.log(md.render(text));
    console.log(md.inline.ruler.getRules('math_inline_double'));
    // console.log([].join('\n'));
    // console.log(md.block.ruler.getRules(''))
    // console.log(new BaseConverter().convert(text, 'typst'));
}