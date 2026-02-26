import { BaseConverter } from '../textConverter';
import footnote from 'markdown-it-footnote';

// 基本脚注处理器 - 注册footnote插件
BaseConverter.registerProcessor({
    name: 'footnote',
    formats: ['quarto', 'typst', 'latex'],
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
            // console.log(footnoteDict);
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
        // TODO: 使用更原生的方法实现
        md.renderer.rules.footnote_block_open = () => {
            return '<!-- DOC_WEAVER_FOOTNOTE_START -->';
        };

        md.renderer.rules.footnote_block_close = () => {
            return '<!-- DOC_WEAVER_FOOTNOTE_END -->';
        };
    },
    postProcessor: (text: string) => {
        return text.replace(/<!-- DOC_WEAVER_FOOTNOTE_START -->[\s\S]*?<!-- DOC_WEAVER_FOOTNOTE_END -->/g, '');
    }
});

// 为LaTeX格式定制脚注渲染规则
BaseConverter.registerProcessor({
    name: 'footnoteRenderRule_latex',
    formats: ['latex'],
    description: '自定义LaTeX格式的脚注渲染规则',
    mditRuleSetup: (converter: BaseConverter) => {
        const md = converter.md;
        // 缓存脚注定义正文（按 footnote id 索引），供 footnote_ref 渲染时复用
        const footnoteDict: {[id: string]: string} = {};

        md.core.ruler.push('collect_footnote_info_latex', (state) => {
            const tokens = state.tokens;
            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i].type === 'footnote_open') {
                    const id = String(tokens[i].meta?.id);
                    let content = '';
                    let j = i + 1;
                    while (j < tokens.length && tokens[j].type !== 'footnote_close') {
                        if (tokens[j].type === 'inline' && tokens[j].content) {
                            content += content ? `\n${tokens[j].content}` : tokens[j].content;
                        }
                        j++;
                    }
                    if (content) {
                        footnoteDict[id] = content;
                    }
                }
            }
            return true;
        });

        md.renderer.rules.footnote_ref = (tokens, idx, _options, env) => {
            const meta = tokens[idx].meta ?? {};
            const rawId = meta.id;
            if (rawId === undefined || rawId === null) {
                return '';
            }
            const id = String(rawId);
            const subId = Number(meta.subId ?? 0);
            const footnoteContent = footnoteDict[id] ?? '';
            // markdown-it-footnote 会在 env 中给出每个脚注的总引用次数
            const footnotes = (env as { footnotes?: { list?: Array<{ count?: number }> } }).footnotes;
            const footnoteCount = footnotes?.list?.[Number(id)]?.count ?? 1;
            const isMultiRef = footnoteCount > 1;

            // subId > 0 表示同一脚注的第2次及以上引用，输出 \footref
            if (subId > 0) {
                return `\\footref{fn:${id}}`;
            }
            // 首次引用时仅在“后续还会被引用”时补 \label
            const label = isMultiRef ? `\\label{fn:${id}}` : '';
            return `\\footnote{${md.renderInline(footnoteContent)}${label}}`;
        };

        md.renderer.rules.footnote_block_open = () => {
            return '<!-- DOC_WEAVER_FOOTNOTE_START -->';
        };

        md.renderer.rules.footnote_block_close = () => {
            return '<!-- DOC_WEAVER_FOOTNOTE_END -->';
        };
    },
    postProcessor: (text: string) => {
        return text.replace(/<!-- DOC_WEAVER_FOOTNOTE_START -->[\s\S]*?<!-- DOC_WEAVER_FOOTNOTE_END -->/g, '');
    }
});