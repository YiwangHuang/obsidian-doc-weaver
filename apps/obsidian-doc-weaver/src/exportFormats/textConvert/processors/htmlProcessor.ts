import { BaseConverter } from '../textConverter';
// import { debugLog } from '../../../lib/debugUtils';

BaseConverter.registerProcessor({
    name: 'htmlProcessor',
    formats: ['typst', 'latex'],
    description: '处理某些特定HTML格式',
    mditRuleSetup: (converter: BaseConverter) => {
        // 在core阶段遍历所有token，将匹配的html_block/html_inline替换为自定义token
        converter.md.core.ruler.push('html_processor', (state) => {
            for (let i = 0; i < state.tokens.length; i++) {
                const token = state.tokens[i];

                // 处理html_block：识别iframe标签并替换为自定义token
                if (token.type === 'html_block') {
                    if (token.content.includes('<iframe')) {
                            const srcMatch = token.content.match(/src="([^"]+)"/);
                            token.type = 'DW_iframe_link';
                            token.content = srcMatch?.[1]||'';
                            // token.meta = { src: srcMatch[1] };
                    }
                }

                // 处理inline token中的html_inline子token
                if (token.type === 'inline' && token.children) {
                    for (let j = 0; j < token.children.length; j++) {
                        const child = token.children[j];
                        if (child.type === 'html_inline' && child.content === '<br>') {
                            child.type = 'DW_linebreak';
                            // child.content = '';
                        }
                    }
                }
            }
        });

        // 为自定义token注册渲染规则
        converter.md.renderer.rules.typst_iframe_link = (tokens, idx) => {
            const src = tokens[idx].meta?.src || '';
            return `#link("${src}")[*外部链接*] \n\n`; //TODO: 外部链接应是可调参数
        };

        converter.md.renderer.rules.typst_linebreak = () => {
            return '#linebreak()';
        };
    }
});

BaseConverter.registerProcessor({
    name: 'htmlRendererRule_typst',
    formats: ['typst'],
    description: '自定义HTML渲染规则',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules.DW_iframe_link = (tokens, idx) => {
            return `#link("${tokens[idx].content}")[*iframe link*] \n\n`; //TODO: 外部链接应是可调参数
        };
        converter.md.renderer.rules.DW_linebreak = () => {
            return '#linebreak()';
        };
    }
});

BaseConverter.registerProcessor({
    name: 'htmlRendererRule_latex',
    formats: ['latex'],
    description: '自定义HTML渲染规则',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules.DW_iframe_link = (tokens, idx) => {
            return `\\href{${tokens[idx].content}}{\\textbf{iframe link}} \n\n`; //TODO: 外部链接应是可调参数
        };
        converter.md.renderer.rules.DW_linebreak = () => {
            return '\\newline';
        };
    }
});



// 在HMD的block类型的html后增加额外的换行符，确保Markdown区块能被正确解析
BaseConverter.registerProcessor({
    name: 'htmlProcessor_HMD',
    formats: ['HMD'],
    description: '处理HTML格式',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules.html_block = (tokens, idx, options, env, self) => {
            return tokens[idx].content + '\n\n';
        };
    }
});


// BaseConverter.registerProcessor({
//     name: 'htmlProcessor_HMD',
//     formats: ['HMD'],
//     description: '处理HTML格式',
//     mditRuleSetup: (converter: BaseConverter) => {
//         converter.md.renderer.rules.html_inline = (tokens, idx, options, env, self) => {
//             const token = tokens[idx];
//             if (token.content.trim().startsWith('</iframe')) {
//                 debugLog('htmlProcessor_HMD: html_inline: iframe close');
//                 return self.renderToken(tokens, idx, options) + '\n\n';
//             }
//             return self.renderToken(tokens, idx, options);
//         };
//     }
// });

// 动态注册html处理器已经移动到textConverter.ts中