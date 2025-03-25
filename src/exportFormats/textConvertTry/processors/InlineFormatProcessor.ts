import MarkdownIt from 'markdown-it';
import { BaseConverter } from '../textConverter';
import * as url from 'url';


BaseConverter.registerProcessor({
    name: 'plain',
    formats: ['plain'],
    description: '纯文本格式',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md = PlainMarkdownIt();
    }
});

BaseConverter.registerProcessor({
    name: 'inlineFormatProcessor',
    formats: ['quarto', 'vuepress', 'typst'],
    description: '处理内联格式',
    mditRuleSetup: (converter: BaseConverter) => {
        // 禁用列表规则
        converter.md.disable(['list']);

        // 保留html标签
        converter.md.set({html: true});

        // 段落规则
        converter.md.renderer.rules.paragraph_open = () => "";
        converter.md.renderer.rules.paragraph_close = () => "\n\n";
    }
});

BaseConverter.registerProcessor({
    name: 'simpleReplace_typst',
    formats: ['typst'],
    description: '需要后处理替换<br>为#linebreak()',
    mditRuleSetup: (converter: BaseConverter) => {
        // 标题规则
        converter.md.renderer.rules.heading_open = (tokens, idx) => {
            const level = tokens[idx].markup.length;
            return `${"=".repeat(level)} `;
        };
        converter.md.renderer.rules.heading_close = () => "\n\n";

        // 加粗规则
        converter.md.renderer.rules.strong_open = () => "*";
        converter.md.renderer.rules.strong_close = () => "*";

        // 斜体规则
        converter.md.renderer.rules.em_open = () => "_";
        converter.md.renderer.rules.em_close = () => "_";

        converter.md.renderer.rules.s_open = () => "#strike[";
        converter.md.renderer.rules.s_close = () => "]";
        // 添加高亮规则

        // 添加下划线规则
        converter.md.inline.ruler.after('backticks', 'underline', (state, silent) => {
            const start = state.pos;
            
            // 检查是否以<u>开头
            if (state.src.slice(start, start + 3) !== '<u>') {
                return false;
            }
            
            // 寻找结束标签
            const endPos = state.src.indexOf('</u>', start + 3);
            if (endPos === -1) {
                return false;
            }
            
            // 如果是静默模式，直接返回true
            if (silent) {
                return true;
            }
            
            // 创建tokens
            state.push('underline_open', 'u', 1);
            
            // 解析标签内的文本
            const oldPos = state.pos;
            const oldMax = state.posMax;
            state.pos = start + 3;
            state.posMax = endPos;
            state.md.inline.tokenize(state);
            state.pos = oldPos;
            state.posMax = oldMax;
            
            state.push('underline_close', 'u', -1);
            
            // 更新解析位置
            state.pos = endPos + 4;
            return true;
        });

        // 添加下划线渲染规则
        converter.md.renderer.rules.underline_open = () => "#underline[";
        converter.md.renderer.rules.underline_close = () => "]";

        // typst会把没有转义的括号理解成代码，添加文本处理规则，处理括号的转义
        converter.md.renderer.rules.text = (tokens, idx) => {
            // 获取文本内容并替换所有类型的括号
            const text = tokens[idx].content;
            return text
                .replace(/\(/g, '\\(')
                .replace(/\)/g, '\\)')
                .replace(/\[/g, '\\[')
                .replace(/\]/g, '\\]')
                .replace(/\{/g, '\\{')
                .replace(/\}/g, '\\}');
        };

        // 添加处理iframe的规则
        converter.md.renderer.rules.html_block = (tokens, idx) => {
            const content = tokens[idx].content;
            
            // 检查是否是iframe标签
            if (content.includes('<iframe')) {
                // 提取src属性
                const srcMatch = content.match(/src="([^"]+)"/);
                if (srcMatch && srcMatch[1]) {
                    // 返回typst格式的链接
                    return `#link("${srcMatch[1]}")[*外部链接*] \n\n`;
                }
            }
            
            // 如果不是iframe或没有src，返回空字符串
            return content;
        };
    },
    postProcessor: (text: string) => {
        return text.replace(/<br>/g, "#linebreak()");
    }
});

BaseConverter.registerProcessor({
    name: 'simpleReplace_quarto',
    formats: ['quarto'],
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.disable(['heading','emphasis']);//
    }
});




if (import.meta.url === url.pathToFileURL(process.argv[1]).href){
    const text = `
# 标题
## 子标题

- **列表项1**
- *列表<u>项2</u>*

A.选项一<br>
B.选项二<br>
`;
    console.log(new BaseConverter().convert(text,'typst'));
    console.log(new BaseConverter().convert(text,'quarto'));
}


/**
 * 创建一个无规则的 MarkdownIt 实例
 * 只保留最基本的 paragraph 规则，并将其配置为输出纯文本
 * @returns {MarkdownIt} 配置好的 MarkdownIt 实例
 */
function PlainMarkdownIt(): MarkdownIt {
    // 创建一个 zero preset 实例
    const md = new MarkdownIt('zero');

    // 禁用所有内置规则，除了 paragraph（因为 paragraph 是基础规则，不能完全禁用）
    md.disable([
        // block
        'code',
        'fence',
        'heading',
        'hr',
        'html_block',
        'lheading',
        'list',
        'reference',
        'table',
        
        // inline
        'autolink',
        'backticks',
        'emphasis',
        'entity',
        'escape',
        'html_inline',
        'image',
        'link',
        'newline',
        'text'
    ]);

    // 自定义 paragraph 的渲染规则，使其输出纯文本
    md.renderer.rules.paragraph_open = () => '';  // 段落开始不输出任何内容
    md.renderer.rules.paragraph_close = () => '\n\n';  // 段落结束输出两个换行
    md.renderer.rules.text = (tokens, idx) => tokens[idx].content;  // 文本内容原样输出

    return md;
}