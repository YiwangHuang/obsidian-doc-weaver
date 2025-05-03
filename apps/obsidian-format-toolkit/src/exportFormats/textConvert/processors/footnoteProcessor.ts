import { BaseConverter } from '../textConverter';
import footnote from 'markdown-it-footnote';

// 基本脚注处理器 - 注册footnote插件
BaseConverter.registerProcessor({
    name: 'footnote',
    formats: ['quarto', 'typst', 'plain'],
    description: '处理脚注语法',
    detail: '支持解析和渲染 [^1] 格式的脚注',
    mditRuleSetup: (converter: BaseConverter) => {
        // 使用markdown-it-footnote插件解析脚注
        converter.md.use(footnote);
    }
});

// 为Typst格式定制脚注渲染规则
BaseConverter.registerProcessor({
    name: 'footnoteRenderRule_typst',
    formats: ['typst'],
    description: '自定义Typst格式的脚注渲染规则',
    mditRuleSetup: (converter: BaseConverter) => {
        const md = converter.md;
        const footnoteDict: {[id: string]: string} = {};// 字典方式存储脚注信息，更高效的查找
        let IDsRendered: string[] = []; // 记录已经渲染的脚注ID
        
        md.core.ruler.push('collect_footnote_info', (state) => {
            // 重置已渲染ID数组
            IDsRendered = [];
            // console.log('collect_footnote_info');
            const tokens = state.tokens;
            // 在这里遍历并分析tokens
            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i].type === 'footnote_open') {
                    if (tokens[i+2].type === 'inline' && tokens[i+2].content) { //
                        const id = tokens[i].meta.id;
                        const content = tokens[i+2].content;
                        tokens[i+2].content = ''; // 清空内容，避免重复渲染(typst会自动生成脚注区域)
                        footnoteDict[id] = content;
                    }
                }
            }
            console.log(footnoteDict);
            return true;
        });

        // 添加脚注引用的渲染规则
        md.renderer.rules.footnote_ref = (tokens, idx) => {
            const id = tokens[idx].meta.id;
            
            // 检查脚注ID是否已存在，如果不存在则添加到列表中
            if (IDsRendered.includes(id)) {
                return `@${id}`;
            }
            IDsRendered.push(id);
            return `#footnote[${md.renderInline(footnoteDict[id])}]`;
        };

        // 使用特殊标记包围脚注块，便于后处理识别删除
        md.renderer.rules.footnote_block_open = () => {
            return '<!-- FORMAT_TOOLKIT_FOOTNOTE_START -->';
        };

        md.renderer.rules.footnote_block_close = () => {
            return '<!-- FORMAT_TOOLKIT_FOOTNOTE_END -->';
        };
    },
    // 添加后处理函数移除脚注块
    postProcessor: (text: string) => {
        // 移除自定义标记之间的所有内容（包括标记本身）
        return text.replace(/<!-- FORMAT_TOOLKIT_FOOTNOTE_START -->[\s\S]*?<!-- FORMAT_TOOLKIT_FOOTNOTE_END -->/g, '');
    }
});