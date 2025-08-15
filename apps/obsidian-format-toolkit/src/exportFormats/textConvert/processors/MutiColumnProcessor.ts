import MarkdownIt from 'markdown-it';
// import StateBlock from 'markdown-it/lib/rules_block/state_block.mjs';
import { BaseConverter } from '../textConverter';
import type { RuleBlock } from "markdown-it/lib/parser_block.mjs";

BaseConverter.registerProcessor({
    name: 'multiColumnParserRule',
    formats: ['quarto', 'typst'],
    description: '自定义分栏格式解析规则',
    mditRuleSetup: (converter: BaseConverter) => {
        columnsPlugin(converter.md);
    }
});


BaseConverter.registerProcessor({
    name: 'multiColumnRendererRule_typst',
    formats: ['typst'],
    description: '自定义分栏格式渲染规则',
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules.mditCol_tabs_open = (tokens, idx) => {
            const token = tokens[idx];
            const widths = token.meta?.columnWidths;

            const result = '#grid(\n' + (widths?`columns: (${widths.join(',').replace(/%/g, 'fr')}),\n`:'');
            return result;
        };
        converter.md.renderer.rules.mditCol_tabs_close = () => ')\n';
        converter.md.renderer.rules.mditCol_tab_open = () => '[\n';
        converter.md.renderer.rules.mditCol_tab_close = () => '],\n';
    }
});

BaseConverter.registerProcessor({
    name: 'multiColumnRendererRule_quarto',
    formats: ['quarto'],
    mditRuleSetup: (converter: BaseConverter) => {
        converter.md.renderer.rules.columns_open = () => ':::: columns\n';
        converter.md.renderer.rules.columns_close = () => '::::\n';
        converter.md.renderer.rules.column_open = (tokens, idx) => {
            const token = tokens[idx];
            const width = token.attrGet('width');

            const result = `::: {.column width="${width}"}\n`;
            return result;
        };
        converter.md.renderer.rules.column_close = () => ':::\n';
    }
});

interface ColRuleStore {
    state: string | null;
    columnIndex?: number;
    columnWidths?: string[];
}

const colRuleStore: ColRuleStore = {
    state: null,
}

function columnsPlugin(md: MarkdownIt) {
  const name = "mditCol";
  md.block.ruler.before('fence', `${name}_tabs`, getColsRule(name, colRuleStore), {
      alt: ["paragraph", "reference", "blockquote", "list"],
  });
  md.block.ruler.before('fence', `${name}_tab`, getColRule(name, colRuleStore), {
      alt: ["paragraph", "reference", "blockquote", "list"],
  });
}

/**
 * 创建Columns容器规则解析器的工厂函数
 * @param name - Columns容器的名称
 * @param store - 存储当前解析状态的对象
 * @returns RuleBlock - markdown-it的块级规则函数
 */
const getColsRule = (name: string, store: ColRuleStore): RuleBlock => (state, startLine, endLine, silent) => {
    // 获取当前行的起始和结束位置
    let start = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    // 快速检查第一个字符，过滤掉大多数非容器块
    if (state.src[start] !== ":") return false;
    let pos = start + 1;

    // 检查标记字符串的其余部分（连续的冒号）
    while (pos <= max) {
      if (state.src[pos] !== ":") break;
      pos++;
    }

    const markerCount = pos - start;

    // 标记至少需要3个冒号
    if (markerCount < 3) return false;

    // 提取标记和参数
    const markup = state.src.slice(start, pos);
    const params = state.src.slice(pos, max);

    // 解析容器名称
    const paramList = params.split("|").map(param => param.trim());

    // 检查容器名称是否匹配
    const containerMatch = findFirstMatch(paramList, ["mditCol", "col"]);
    if (!containerMatch) return false;

    // 如果处于静默模式（只验证语法），找到开始标记就返回true
    if (silent) return true;

    let nextLine = startLine;
    let autoClosed = false;

    // 搜索块的结束位置
    while (
      // 未闭合的块应该在文档末尾自动闭合
      // 块也可能在父级块结束时自动闭合
      nextLine < endLine
    ) {
      nextLine++;
      start = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      // 如果遇到负缩进的非空行，应该停止列表
      if (start < max && state.sCount[nextLine] < state.blkIndent)
        // 例如：
        // - ```
        //  test
        break;

      if (
        // 匹配开始字符":"
        state.src[start] === ":" &&
        // 结束围栏的缩进应该少于4个空格
        state.sCount[nextLine] - state.blkIndent < 4
      ) {
        // 检查标记的其余部分
        for (pos = start + 1; pos <= max; pos++)
          if (state.src[pos] !== ":") break;

        // 结束围栏必须至少与开始围栏一样长
        if (pos - start >= markerCount) {
          // 确保后面只有空格
          pos = state.skipSpaces(pos);

          if (pos >= max) {
            // 找到了！
            autoClosed = true;
            break;
          }
        }
      }
    }

    // 保存原始状态并设置新状态，使子tab可以被识别
    const originalStore = {...store};

    store.state = name; // 设置状态，允许子tab被解析
    // 重置列索引，确保每个新的columns容器都从0开始
    store.columnIndex = -1; // 初始化为-1，这样第一个@col会递增到0

    // 解析列宽
    const widthRegex = RegExp(/^width\((.*?)\)$/);
    const colWidths = findFirstMatch(paramList, [widthRegex]);
    if (colWidths) {
        // 使用 processColumnWidths 函数处理和验证列宽值
        const extractedWidths = colWidths.match(widthRegex)?.[1];
        if (extractedWidths) {
            store.columnWidths = processColumnWidths(extractedWidths);
        }
    }

    // 保存当前状态，以便稍后恢复
    const oldParent = state.parentType;
    const oldLineMax = state.lineMax;

    // @ts-expect-error: 我们正在创建一个名为"${name}_tabs"的新类型
    state.parentType = `${name}_tabs`;

    // 这将防止延迟续行超出我们的结束标记
    state.lineMax = nextLine - (autoClosed ? 1 : 0);

    // 创建tabs容器的开始token
    const openToken = state.push(`${name}_tabs_open`, "div", 1);
    // openToken.tag = 'div';
    openToken.attrSet('style', `display: flex; flex-wrap: nowrap;`); // TODO: 修改AnyBlock的多栏样式，添加flex-wrap: nowrap;
    openToken.markup = markup;
    openToken.block = true;
    openToken.info = containerMatch;

    // openToken.meta = { id: id.trim() }; // 保存容器ID
    openToken.map = [startLine, nextLine - (autoClosed ? 1 : 0)];

    
    if (store.columnWidths) {
        // openToken.attrSet('widths', store.columnWidths.join(',')); // 考虑删除
        openToken.meta = {
            columnWidths: store.columnWidths,
        }
    }

    // 递归解析tabs容器内的内容
    state.md.block.tokenize(
      state,
      startLine + 1,
      nextLine - (autoClosed ? 1 : 0),
    );

    // 恢复原始状态 - 修复：正确恢复全局store对象的属性
    Object.assign(store, originalStore);

    // 创建tabs容器的结束token
    const closeToken = state.push(`${name}_tabs_close`, "div", -1);
    // closeToken.tag = 'div';
    closeToken.markup = state.src.slice(start, pos);
    closeToken.block = true;

    // 恢复解析器状态
    state.parentType = oldParent;
    state.lineMax = oldLineMax;
    state.line = nextLine + (autoClosed ? 1 : 0);

    return true;
  };

const COL_MARKER = `@col`;

/**
 * 创建Col规则解析器的工厂函数
 * @param name - Col容器的名称
 * @param store - 存储当前解析状态的对象
 * @returns RuleBlock - markdown-it的块级规则函数
 */
const getColRule = (name: string, store: ColRuleStore): RuleBlock => (state, startLine, endLine, silent) => {
    // 如果当前状态不匹配，直接返回false
    if (store.state !== name) return false;

    // 获取当前行的起始位置和结束位置
    let start = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    /*
    * 快速检查第一个字符，
    * 这可以过滤掉大部分非tab块
    */
    if (state.src.charAt(start) !== "@") return false;

    let index;

    // 检查剩余的标记字符串是否匹配TAB_MARKER
    for (index = 0; index < COL_MARKER.length; index++){
        if (COL_MARKER[index] !== state.src[start + index]) return false;
    }

    // 提取标记字符串和信息字符串
    const markup = state.src.slice(start, start + index);
    // const info = state.src.slice(start + index, max);

    // 如果处于静默模式（只验证语法），找到开始标记就返回true
    if (silent) return true;

    let nextLine = startLine;
    let autoClosed = false;

    // 搜索块的结束位置
    while (
    // 未闭合的块应该在文档末尾自动闭合
    // 块也可能在父级块结束时自动闭合
    nextLine < endLine
    ) {
    nextLine++;
    start = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    // 如果遇到负缩进的非空行，应该停止列表
    if (start < max && state.sCount[nextLine] < state.blkIndent)
        // 例如：
        // - ```
        //  test
        break;

    if (
        // 匹配开始字符"@"
        state.src[start] === "@" &&
        // 标记的缩进不应该超过开始围栏的缩进
        state.sCount[nextLine] <= state.sCount[startLine]
    ) {
        let openMakerMatched = true;

        // 检查是否完全匹配TAB_MARKER
        for (index = 0; index < COL_MARKER.length; index++)
        if (COL_MARKER[index] !== state.src[start + index]) {
            openMakerMatched = false;
            break;
        }

        if (openMakerMatched) {
        // 找到匹配的结束标记！
        autoClosed = true;
        break;
        }
    }
    }

    // 保存当前状态，以便稍后恢复
    const oldParent = state.parentType;
    const oldLineMax = state.lineMax;

    // @ts-expect-error: 我们正在创建一个名为"tab"的新类型
    state.parentType = `tab`;

    // 这将防止延迟续行超出我们的结束标记
    state.lineMax = nextLine - (autoClosed ? 1 : 0);

    // 创建开始token
    const openToken = state.push(`${name}_tab_open`, "div", 1);

    // 递增列索引，确保每个@col获取正确的宽度索引
    store.columnIndex = (store.columnIndex ?? -1) + 1;

    // 设置token属性
    // openToken.tag = 'div';
    openToken.block = true;
    openToken.markup = markup;

    const width = store.columnWidths?.[store.columnIndex];
    if (width) {
        openToken.attrSet('style', `flex: 0 1 ${width};`);
        openToken.meta = {
            columnWidth: width,
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // if (id) openToken.meta.id = id.trim(); // 如果有ID，添加到meta中
    openToken.map = [startLine, nextLine - (autoClosed ? 1 : 0)];

    // 递归解析tab内容
    state.md.block.tokenize(
    state,
    startLine + 1,
    nextLine + (autoClosed ? 0 : 1),
    );

    // 创建结束token
    const closeToken = state.push(`${name}_tab_close`, "div", -1);
    // closeToken.tag = 'div';
    closeToken.block = true;
    closeToken.markup = "";

    // 恢复原始状态
    state.parentType = oldParent;
    state.lineMax = oldLineMax;
    state.line = nextLine + (autoClosed ? 0 : 1);

    return true;
};

/**
 * 在字符串数组中查找第一个与任一模式完全匹配的元素。
 * 
 * @param strings - 待检查的字符串数组。
 * @param patterns - 字符串或正则表达式组成的数组，用于匹配的模式。
 *                   如果是字符串，则进行完全相等判断；
 *                   如果是正则表达式，则必须显式包含 ^ 和 $ 才能实现完全匹配。
 * 
 * @returns 第一个匹配成功的字符串；若无匹配则返回 undefined。
 * 
 * 注意：
 * - RegExp.test(str) 默认是 **部分匹配**，即模式在字符串任意位置出现即可返回 true。
 *   如果需要完全匹配，应在正则表达式中加上 `^` 开头和 `$` 结尾。
 */
function findFirstMatch(
  strings: string[],
  patterns: (string | RegExp)[]
): string | undefined {
  for (const str of strings) {
    for (const pattern of patterns) {
      if (typeof pattern === "string") {
        if (str === pattern) return str; // 字符串模式，必须完全相等
      } else {
        // 正则模式：调用者应保证正则写法决定是完全还是部分匹配
        if (pattern.test(str)) return str;
      }
    }
  }
  return undefined;
}

/**
* 处理和验证列宽值
* 每个值应该是数字加%或px，不满足的一律保留数字并加%
* 
* @param colWidths - 原始列宽字符串，格式如 "78%,22%,10%"
* @returns 处理后的列宽数组，每个元素都是有效的宽度值
*/
function processColumnWidths(colWidths: string): string[] {
  // 分割列宽字符串并处理每个值
  return colWidths.split(',').map(width => {
      const trimmedWidth = width.trim();
      
      // 检查是否已经是有效的格式（数字+% 或 数字+px）
      const validWidthRegex = /^\d+(?:\.\d+)?(?:%|px)$/;
      
      if (validWidthRegex.test(trimmedWidth)) {
          // 已经是有效格式，直接返回
          return trimmedWidth;
      }
      
      // 提取数字部分
      const numberMatch = trimmedWidth.match(/^(\d+(?:\.\d+)?)/);
      if (numberMatch) {
          // 有数字部分，添加%单位
          return numberMatch[1] + '%';
      }
      
      // 没有数字部分，返回默认值
      return '100%';
  });
}

/*
测试文本
::: col|width(78%,22%,10%)
@col

Content for the first column.

::: info
Nested info block in first column
:::

Another paragraph in first column.
@col
Content for the second column.

Second paragraph in **second** column.

@col
Content for the third column.
:::
*/