import Token from 'markdown-it/lib/token.mjs';
// import { BlockProcessor, Rule, PostProcessor } from '../textConverter';
import { BaseConverter } from '../textConverter';

BaseConverter.registerProcessor({
    name: 'codeProcessor_typst',
    formats: ['typst'],
    description: '处理代码块',
    mditRuleSetup: (converter: BaseConverter) => {

        // 内联代码渲染规则
        converter.md.renderer.rules.code_inline = (tokens, idx) => {
            return `\`${tokens[idx].content}\``;
        };

        // 自定义 fence 渲染规则
        converter.md.renderer.rules.fence = (tokens: Token[], idx: number) => {
            const token = tokens[idx];
            const lang = token.info.trim();
            // 直接返回原始格式
            return `\`\`\`${lang}\n${token.content}\`\`\`\n\n`;
        };
    }
});

BaseConverter.registerProcessor({
    name: 'codeBlockProcessor_quarto',
    formats: ['quarto'],
    description: '处理代码块',
    mditRuleSetup: (converter: BaseConverter) => {
        // 自定义 fence 渲染规则
        converter.md.renderer.rules.fence = (tokens: Token[], idx: number) => {
            const token = tokens[idx];
            const lang = token.info.trim();
            // 直接返回原始格式(语言类型套上花括号)
            return `\`\`\`{${lang}}\n${token.content}\`\`\`\n\n`;
        };
    }
});