import { BaseConverter } from '../textConverter';
import type Token from 'markdown-it/lib/token.mjs';


// TODO: 在typst下，添加一个处理表格空单元格的规则。我们需要修改表格单元格的渲染规则，检查内容是否为空。
BaseConverter.registerProcessor({
    name: 'tableProcessor',
    formats: ['typst'],
    description: '处理表格',
    detail: '为保证typst格式正确，尽量不要使用不成对各类的括号',
    mditRuleSetup: (converter: BaseConverter) => {

        // 创建表格状态对象
        const tableState = {
            isFirstRow: true,
            columnCount: 0
        };

        // 添加表格渲染规则
        
        converter.md.renderer.rules.table_open = (tokens: Token[], idx: number) => {
            // 存储表格状态
            tableState.isFirstRow = true;
            tableState.columnCount = 0;

            // 检查表格中的所有inline类型token
            let currentIdx = idx + 1;  // 从table_open后的token开始
            while (currentIdx < tokens.length && tokens[currentIdx].type !== 'table_close') {
                const token = tokens[currentIdx];
                if (token && token.type === 'inline' && (!token.children || token.children.length === 0)) {
                    // 为空单元格添加一个自定义的typst_symbol类型的token作为子token
                    token.children = [{
                        type: 'typst_symbol',
                        tag: '',
                        attrs: null,
                        map: null,
                        nesting: 0,
                        level: 0,
                        children: null,
                        content: '#sym.space',//#h(1em)
                        markup: '',
                        info: '',
                        meta: {},
                        block: false,
                        hidden: false,
                        attrIndex: () => -1,
                        attrPush: () => {},
                        attrSet: () => {},
                        attrGet: () => null,
                        attrJoin: () => ''
                    }];
                }
                currentIdx++;
            }

            return "#tablem[\n";
        };

        converter.md.renderer.rules.table_close = () => "]\n\n";

        // 处理表格行
        converter.md.renderer.rules.tr_open = () => "";
        converter.md.renderer.rules.tr_close = (tokens: Token[], idx: number) => {
            const result = "|\n";
            // 如果是第一行，添加分隔行
            if (tableState.isFirstRow) {
                tableState.isFirstRow = false;
                return result + "|" + "---------|".repeat(tableState.columnCount) + "\n";
            }
            return result;
        };

        // 处理表格单元格
        converter.md.renderer.rules.th_open = () => {
            if (tableState.isFirstRow) tableState.columnCount++;
            return "| ";
        };
        converter.md.renderer.rules.th_close = () => " ";
        converter.md.renderer.rules.td_open = () => "| ";
        converter.md.renderer.rules.td_close = () => " ";

        // 忽略这些标签的渲染
        converter.md.renderer.rules.thead_open = () => "";
        converter.md.renderer.rules.thead_close = () => "";
        converter.md.renderer.rules.tbody_open = () => "";
        converter.md.renderer.rules.tbody_close = () => "";
    }
});

/**
 * LaTeX 表格处理器
 * 使用 tabular 环境渲染表格，根据 Markdown 对齐标记生成列对齐规格。
 * 表头自动加粗，使用 \hline 分隔表头与表体。
 */
BaseConverter.registerProcessor({
    name: 'tableProcessor_latex',
    formats: ['latex'],
    description: '处理 LaTeX 表格渲染',
    mditRuleSetup: (converter: BaseConverter) => {
        const md = converter.md;

        const tableState = {
            alignments: [] as string[],
            isHeader: false,
            currentCol: 0,
        };

        md.renderer.rules.table_open = (tokens: Token[], idx: number) => {
            tableState.alignments = [];
            // 前扫 thead 中的 th_open，读取 style 属性确定各列对齐方式
            let scanIdx = idx + 1;
            while (scanIdx < tokens.length && tokens[scanIdx].type !== 'thead_close') {
                const token = tokens[scanIdx];
                if (token.type === 'th_open') {
                    const style = token.attrGet('style') || '';
                    if (style.includes('center')) {
                        tableState.alignments.push('c');
                    } else if (style.includes('right')) {
                        tableState.alignments.push('r');
                    } else {
                        tableState.alignments.push('l');
                    }
                }
                scanIdx++;
            }

            const colSpec = tableState.alignments.join(' ');
            return `\\begin{tabular}{${colSpec}}\n\\hline\n`;
        };

        md.renderer.rules.table_close = () => '\\hline\n\\end{tabular}\n\n';

        md.renderer.rules.thead_open = () => {
            tableState.isHeader = true;
            return '';
        };
        md.renderer.rules.thead_close = () => {
            tableState.isHeader = false;
            return '';
        };

        md.renderer.rules.tbody_open = () => '';
        md.renderer.rules.tbody_close = () => '';

        md.renderer.rules.tr_open = () => {
            tableState.currentCol = 0;
            return '';
        };
        md.renderer.rules.tr_close = () => {
            if (tableState.isHeader) {
                return ' \\\\\n\\hline\n';
            }
            return ' \\\\\n';
        };

        md.renderer.rules.th_open = () => {
            const sep = tableState.currentCol > 0 ? ' & ' : '';
            tableState.currentCol++;
            return sep + '\\textbf{';
        };
        md.renderer.rules.th_close = () => '}';

        md.renderer.rules.td_open = () => {
            const sep = tableState.currentCol > 0 ? ' & ' : '';
            tableState.currentCol++;
            return sep;
        };
        md.renderer.rules.td_close = () => '';
    }
});

BaseConverter.registerProcessor({
    name: 'tableRendererRule_HMD',
    formats: ['HMD','quarto'],
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.disable(['table']);
    }
});