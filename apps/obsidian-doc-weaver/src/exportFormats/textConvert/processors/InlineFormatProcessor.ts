import MarkdownIt from 'markdown-it';
import { BaseConverter } from '../textConverter';

BaseConverter.registerProcessor({
    name: 'plain',
    formats: ['plain'],
    description: '纯文本格式',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md = PlainMarkdownIt();
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

        // 添加下划线渲染规则
        converter.md.renderer.rules.underline_open = () => "#underline[";
        converter.md.renderer.rules.underline_close = () => "]";

        // 添加自定义 typst_symbol 类型的渲染规则，避免 # 被转义
        converter.md.renderer.rules.typst_symbol = (tokens, idx) => {
            return tokens[idx].content; // 直接输出内容，不进行转义处理
        };

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
                .replace(/\}/g, '\\}')
                .replace(/\*/g, '\\*')
                .replace(/_/g, '\\_')
                .replace(/#/g, '\\#')
                // TODO: 尝试找个更优雅的方案，比如在所有]后加/
                .replace(/\./g, '\\.'); // 防止typst把.理解成代码

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
    name: 'simpleReplace_latex',
    formats: ['latex'],
    description: '需要后处理替换<br>为#linebreak()',
    mditRuleSetup: (converter: BaseConverter) => {
        // 加粗规则
        converter.md.renderer.rules.strong_open = () => "\\textbf{";
        converter.md.renderer.rules.strong_close = () => "}";

        // 斜体规则
        converter.md.renderer.rules.em_open = () => "\\textit{";
        converter.md.renderer.rules.em_close = () => "}";
    }
});


BaseConverter.registerProcessor({
    name: 'simpleReplace_HMD',
    formats: ['HMD','quarto'],
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.disable(['heading','emphasis']);//
    }
});

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