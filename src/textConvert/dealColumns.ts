import MarkdownIt from "markdown-it";
import StateBlock from 'markdown-it/lib/rules_block/state_block';

// 定义列数据的接口，用于存储列的状态和内容
interface ColumnData {
  type: 'column_open' | 'column_close';  // 列的开始或结束标记
  content?: string;                      // 列的内容（仅在column_close时使用）
  widths?: string[];                     // 列宽度数组
}

/**
 * 解析列属性字符串
 * @param marker 标记字符串，例如 "::: col|width(78%,22%)|align(left)"
 * @returns 属性数组，例如 ["col", "width(78%,22%)", "align(left)"]
 */
function parseColumnAttributes(marker: string): string[] {
  const colonMatch = marker.match(/^:::\s?(.+)$/);
  if (!colonMatch) return [];
  
  return colonMatch[1].split('|').map(attr => attr.trim());
}

/**
 * 自定义markdown-it插件，用于处理多列布局
 * 支持在列内嵌套其他围栏块
 * 语法示例：
 * ::: col|width(78%,22%)
 * @col
 * 第一列内容
 * ::: info
 * 嵌套的信息块
 * :::
 * @col
 * 第二列内容
 * ::: warning
 * 嵌套的警告块
 * :::
 * :::
 */
function columnsPlugin(md: MarkdownIt): void {
  // 在fence规则之前注册新的columns规则
  md.block.ruler.before('fence', 'columns', (
    state: StateBlock,
    startLine: number,
    endLine: number,
    silent: boolean
  ): boolean => {
    // 获取当前行的内容
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const marker = state.src.slice(start, max).trim();

    // 检查是否为columns块的开始标记
    if (!(/^:::\s?col/).test(marker)) return false;

    // 解析所有属性
    const attrs = parseColumnAttributes(marker);
    // 从属性数组中查找width属性
    const widthMatch = attrs.find(attr => /width\((.*?)\)/.test(attr))?.match(/width\((.*?)\)/);
    const widths = widthMatch ? widthMatch[1].split(',').map(w => w.trim()) : undefined;

    let nextLine = startLine + 1;
    const columns: ColumnData[] = [];     // 存储所有列的数据
    let currentContent: string[] = [];    // 存储当前列的内容
    let inColumn = false;                 // 标记是否在列内部
    let nestLevel = 0;                    // 追踪嵌套层级

    // 逐行解析内容，直到遇到结束标记
    while (nextLine < endLine) {
      const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineEnd = state.eMarks[nextLine];
      const line = state.src.slice(lineStart, lineEnd);  // 获取完整行内容
      const trimmedLine = line.trim();

      // 检查是否为围栏块标记
      if (trimmedLine.startsWith(':::')) {
        if (trimmedLine === ':::') {
          // 结束标记
          if (nestLevel === 0) {
            // 如果在列内且有内容，保存最后一列
            if (inColumn && currentContent.length > 0) {
              columns.push({ 
                type: 'column_close',
                content: currentContent.join('\n')
              });
            }
            break;
          } else {
            // 嵌套块的结束
            nestLevel--;
            currentContent.push(line);
          }
        } else {
          // 开始标记
          nestLevel++;
          currentContent.push(line);
        }
      } else if (trimmedLine === '@col' && nestLevel === 0) {
        // 只在最外层处理列标记
        if (inColumn) {
          columns.push({ 
            type: 'column_close',
            content: currentContent.join('\n')
          });
          currentContent = [];
        }
        columns.push({ 
          type: 'column_open',
          widths: widths // 保存宽度信息
        });
        inColumn = true;
      } else if (inColumn) {
        // 在列内部，收集内容
        currentContent.push(line);
      }
      nextLine++;
    }

    // 如果是验证模式，直接返回true
    if (silent) return true;

    // 更新解析器状态，移动到下一个待处理行
    state.line = nextLine + 1;

    // 创建columns容器的开始标记
    const columnsOpenToken = state.push('columns_open', 'div', 1);
    columnsOpenToken.attrSet('class', 'columns');
    if (widths) {
        columnsOpenToken.attrSet('widths', widths.join(','));
    }

    // 处理每个列
    let columnIndex = 0;
    columns.forEach((col) => {
      if (col.type === 'column_open') {
        // 创建列容器的开始标记
        const columnToken = state.push('column_open', 'div', 1);
        columnsOpenToken.attrSet('class', 'columns');
        // 设置列宽度
        const width = col.widths?.[columnIndex] || `${100 / columns.filter(c => c.type === 'column_open').length}%`;
        columnToken.attrSet('width', width);
        columnIndex++;
      } else if (col.type === 'column_close' && col.content) {
        // 直接在当前状态下解析内容
        state.md.block.parse(
          col.content,
          state.md,
          state.env,
          state.tokens
        );
        
        // 创建列容器的结束标记
        state.push('column_close', 'div', -1);
      }
    });

    // 创建columns容器的结束标记
    state.push('columns_close', 'div', -1);
    return true;
  });

  // 定义HTML渲染规则
  md.renderer.rules.columns_open = () => '<div class="columns">\n';
  md.renderer.rules.columns_close = () => '</div>\n';
  md.renderer.rules.column_open = (tokens, idx) => {
    const token = tokens[idx];
    const style = token.attrGet('style');
    return `<div class="column" style="${style}">\n`;
  };
  md.renderer.rules.column_close = () => '</div>\n';
}

// 创建markdown-it实例并应用插件
const md = new MarkdownIt();
md.use(columnsPlugin);

// 测试用例
const testMarkdown = `
::: col|width(78%,22%,10%)
@col
Content for the first column.

::: info
Nested info block in first column
:::

Another paragraph in first column.
@col
Content for the second column.

::: warning
Nested warning block in second column
:::

Second paragraph in **second** column.

@col
Content for the third column.
:::
`;

// 执行测试
const result = md.render(testMarkdown);
console.log(md.parse(testMarkdown, {}));
console.log(result);

export default columnsPlugin;