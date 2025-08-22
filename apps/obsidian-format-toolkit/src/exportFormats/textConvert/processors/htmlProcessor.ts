import { BaseConverter } from '../textConverter';
import { parse } from 'html-parse-string';
import { HtmlProcessorOptions } from '../../../toggleTagWrapper/types';

BaseConverter.registerProcessor({
    name: 'htmlProcessor',
    formats: ['typst'],
    description: '处理HTML格式',
    mditRuleSetup: (converter: BaseConverter) => {
        // TODO: 处理在未配对的标签
        // 保存原始的html_inline渲染规则
        const origin_html_inline_renderer = converter.md.renderer.rules.html_inline;
        
        // 自定义html_inline渲染规则
        converter.md.renderer.rules.html_inline = (tokens, idx, options, env, self) => {
            const content = tokens[idx].content;
            
            // 处理特定的HTML内容
            // 处理下划线标签
            if (content.trim() === '<u>') {
                return `#underline[`;
            } else if (content.trim() === '</u>') {
                return `]`;
            }
            
            // 如果没有匹配特定规则，则使用原始规则处理
            if (origin_html_inline_renderer) {
                return origin_html_inline_renderer(tokens, idx, options, env, self);
            }
            
            // 如果没有原始规则，则直接返回内容
            return content;
        };
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



export function registerHtmlProcessor(converter: BaseConverter, configs: HtmlProcessorOptions[]) {
    converter.registerProcessor({
        name: 'htmlProcessor',
        formats: ['typst'],
        description: '处理HTML格式',
        mditRuleSetup: (converter: BaseConverter) => {
            // 在inline阶段之后添加自定义规则，处理所有inline token中的html_inline类型
            converter.md.core.ruler.after('inline', 'html_processor', (state) => {
                // 遍历所有tokens
                for (let i = 0; i < state.tokens.length; i++) {
                    const token = state.tokens[i];
                    
                    // 处理所有inline类型的token
                    if (token.type === 'inline' && token.children) {
                        // 遍历inline token内的所有子token
                        for (let j = 0; j < token.children.length; j++) {
                            const childToken = token.children[j];
                            
                            // 处理html_inline类型的token
                            if (childToken.type === 'html_inline') {
                                // 尝试解析HTML内容
                                try {
                                    const parsedHtml = parse(childToken.content);
                                    
                                    // 如果解析成功且有结果
                                    if (parsedHtml && parsedHtml.length > 0) {
                                        const htmlNode = parsedHtml[0];
                                        
                                        // 遍历所有配置，查找匹配的标签
                                        for (const config of configs) {
                                            // 检查标签类型是否匹配
                                            if (htmlNode.name === config.tagType) {
                                                // 查找class属性
                                                const classAttr = htmlNode.attrs.find(attr => attr.name === 'class');
                                                
                                                // 检查class是否匹配
                                                if (classAttr && classAttr.value === config.tagClass) {
                                                    // 判断是开始标签还是结束标签
                                                    if (childToken.content.startsWith('</')) {
                                                        // 结束标签，使用后缀
                                                        childToken.content = "]";
                                                    } else {
                                                        // 开始标签，使用前缀
                                                        childToken.content = config.typstPrefix + "[";
                                                    }
                                                    break; // 找到匹配的配置后跳出循环
                                                }
                                            }
                                        }
                                    }
                                } catch (error) {
                                    // 解析失败时保持原内容不变
                                    console.warn('HTML解析失败:', error);
                                }
                            }
                        }
                    }
                }
            });
        }
    });
}