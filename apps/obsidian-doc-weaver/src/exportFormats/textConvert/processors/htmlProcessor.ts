import { BaseConverter } from '../textConverter';
// import { debugLog } from '../../../lib/debugUtils';

BaseConverter.registerProcessor({
    name: 'htmlProcessor',
    formats: ['typst'],
    description: '处理HTML格式',
    mditRuleSetup: (converter: BaseConverter) => {
        // TODO: 处理在未配对的标签
        // 保存原始的html_inline渲染规则
        // const origin_html_inline_renderer = converter.md.renderer.rules.html_inline;
        
        // // 自定义html_inline渲染规则
        // converter.md.renderer.rules.html_inline = (tokens, idx, options, env, self) => {
        //     const content = tokens[idx].content;
            
        //     // 处理特定的HTML内容
        //     // 处理下划线标签
        //     if (content.trim() === '<u>') {
        //         return `#underline[`;
        //     } else if (content.trim() === '</u>') {
        //         return `]`;
        //     }
            
        //     // 如果没有匹配特定规则，则使用原始规则处理
        //     if (origin_html_inline_renderer) {
        //         return origin_html_inline_renderer(tokens, idx, options, env, self);
        //     }
            
        //     // 如果没有原始规则，则直接返回内容
        //     return content;
        // };
        // 示例typst语法：#link("https://example.com")[See example.com]
        // TODO: 处理link_open和link_close之间为零的情况
        converter.md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
            const token = tokens[idx];
            const href = token.attrGet('href');
            
            return `#link("${href?href:''}")[`;
        };
        converter.md.renderer.rules.link_close = () => "]";
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