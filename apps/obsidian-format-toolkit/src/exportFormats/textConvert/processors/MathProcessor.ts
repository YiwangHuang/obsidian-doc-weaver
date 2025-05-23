import { BaseConverter } from '../textConverter';
import tm from 'markdown-it-texmath';
import * as url from 'url';

// 不渲染，直接返回tex公式原文
const passthrough = {
    renderToString: (tex: string) => tex
};

BaseConverter.registerProcessor({
    name: 'mathParserRule',
    formats: ['quarto', 'typst'],
    description: '自定义数学公式解析规则',
    preProcessor: (text: string) => {
        const lines = text.split('\n');
        let nesting = -1;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(/^([\t >]*)\$\$[ \t]*$/);
            if (match) {
                // console.log(match);
                nesting *= -1;
                if (nesting == 1) {
                    lines[i] = match[1] +'\n'+ line;
                } else {
                    lines[i] = line + '\n'+ match[1];
                }
            }
        }
        // console.log(lines.join('\n'));
        return lines.join('\n');
    },
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.use(tm, {
            engine: passthrough, // 还可设置为katex
            delimiters: 'dollars'
        });
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


if (import.meta.url === url.pathToFileURL(process.argv[1]).href){
    const text = `
$$
E = mc^2
$$

$123$
`;
    console.log(new BaseConverter().convert(text, 'quarto'));
    console.log(new BaseConverter().convert(text, 'typst'));
}