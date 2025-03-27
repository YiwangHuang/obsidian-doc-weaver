import { BaseConverter } from '../textConverter';

/**
 * 段落处理器
 * 目的：处理段落格式，保留段落之间的换行
 */
BaseConverter.registerProcessor({
    name: 'paragraphProcessor',
    formats: ['quarto', 'vuepress', 'typst'],
    description: '处理段落格式',
    mditRuleSetup: (converter: BaseConverter) => {
        // 禁用列表规则
        // converter.md.disable(['list']);

        // 保留html标签
        converter.md.set({html: true});

        // 段落规则
        converter.md.renderer.rules.paragraph_open = () => "";
        converter.md.renderer.rules.paragraph_close = () => "\n\n";
    }
});

/**
 * 列表处理器
 * 目的：输出Markdown格式的列表，保留列表项的缩进和有序列表的自动编号
 */
BaseConverter.registerProcessor({
    name: 'listProcessor',
    formats: ['quarto', 'vuepress', 'typst'],
    description: '处理列表，保持原始格式',
    mditRuleSetup: (converter: BaseConverter) => {
        const md = converter.md;
        
        // 跟踪当前列表嵌套级别和各级别的类型
        const listLevels: { ordered: boolean, indent: number }[] = [];
        
        // 重写列表开始标记的渲染规则
        md.renderer.rules.bullet_list_open = () => {
            // 记录无序列表
            listLevels.push({ ordered: false, indent: listLevels.length });
            return '';
        };
        
        // 重写有序列表开始标记的渲染规则
        md.renderer.rules.ordered_list_open = () => {
            // 记录有序列表
            listLevels.push({ ordered: true, indent: listLevels.length });
            return '';
        };
        
        // 重写列表结束标记的渲染规则
        md.renderer.rules.bullet_list_close = () => {
            listLevels.pop();
            // 如果当前是嵌套列表的最后一级，添加一个换行
            return listLevels.length === 0 ? '\n' : '';
            // return '';
        };
        
        // 重写有序列表结束标记的渲染规则
        md.renderer.rules.ordered_list_close = () => {
            listLevels.pop();
            // 如果当前是嵌套列表的最后一级，添加一个换行
            return listLevels.length === 0 ? '\n' : '';
            // return '';
        };
        
        // 重写列表项开始的渲染规则
        md.renderer.rules.list_item_open = (tokens, idx) => {
            if (listLevels.length === 0) return '';
            
            // 获取当前列表级别信息
            const currentLevel = listLevels[listLevels.length - 1];
            
            // 根据列表级别创建适当的缩进
            const baseIndent = currentLevel.indent * 2;
            const indent = ' '.repeat(baseIndent);
            
            // 为有序列表添加序号，或为无序列表添加标记
            if (currentLevel.ordered) {
                // 使用token的序号属性（如果有）
                const orderNum = tokens[idx].info || '1';
                return `${indent}${orderNum}. `;
            } else {
                return `${indent}- `;
            }
        };
        
        // 重写列表项结束的渲染规则
        md.renderer.rules.list_item_close = () => {
            return '';
        };
        
        // 重写段落结束的渲染规则
        const originalParagraphClose = md.renderer.rules.paragraph_close || md.renderer.renderToken;
        md.renderer.rules.paragraph_close = (tokens, idx, options, env, self) => {
            // 如果在列表内部，返回换行符
            if (listLevels.length > 0) {
                return '\n';
            } else {
                // 不在列表内部，使用原先保存的渲染规则
                return originalParagraphClose(tokens, idx, options, env, self);
            }
        };
        

        // // 重写段落开始的渲染规则
        // md.renderer.rules.paragraph_open = () => {
        //     return '';
        // };
        
        // // 重写段落结束的渲染规则
        // md.renderer.rules.paragraph_close = () => {
        //     return '';
        // };
        
        // // 重写内联内容的渲染规则
        // md.renderer.rules.inline = (tokens, idx) => {
        //     return tokens[idx].content;
        // };
    },
    // // 后处理器移除所有HTML标签，确保纯文本输出
    // postProcessor: (html: string) => {
    //     return html.replace(/<\/?[a-z][^>]*>/gi, '');
    // }
});
