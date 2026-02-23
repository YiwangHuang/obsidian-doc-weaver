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


// /**
//  * 代码块处理器
//  */
// export class CodeBlockProcessor implements BlockProcessor {
//     rules: Rule[] = [
//         {
//             formats: ['typst', 'quarto', 'vuepress'],  // 所有格式都需要代码块处理
//             process: (md: MarkdownIt) => {
//                 // 获取默认的 fence 渲染器
//                 const defaultFence = md.renderer.rules.fence!;

//                 // 自定义 fence 渲染规则
//                 md.renderer.rules.fence = (tokens: Token[], idx: number, options: any, env: any, self: any) => {
//                     const token = tokens[idx];
//                     const lang = token.info.trim();
                    
//                     // 调用默认的 fence 渲染器
//                     const html = defaultFence(tokens, idx, options, env, self);
                    
//                     // 添加自定义的包装器
//                     return `<div class="code-block" data-lang="${lang}">${html}</div>`;
//                 };
//             }
//         }
//     ];

//     postProcessors: PostProcessor[] = [
//         {
//             formats: ['typst'],  // typst 格式的后处理
//             process: (html: string) => {
//                 // 在这里添加 typst 特定的代码块后处理逻辑
//                 return html;
//             }
//         },
//         {
//             formats: ['quarto'],  // quarto 格式的后处理
//             process: (html: string) => {
//                 // 在这里添加 quarto 特定的代码块后处理逻辑
//                 return html;
//             }
//         },
//         {
//             formats: ['vuepress'],  // vuepress 格式的后处理
//             process: (html: string) => {
//                 // 在这里添加 vuepress 特定的代码块后处理逻辑
//                 return html;
//             }
//         }
//     ];
// } 