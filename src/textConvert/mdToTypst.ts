import MarkdownIt from "markdown-it";
import type Token = require('markdown-it/lib/token');
import container from "markdown-it-container";


// 创建 Markdown-it 实例
const md = new MarkdownIt({
  html: false,
//   breaks: true
});

// 注册 container 插件
md.use(container);

// 自定义渲染规则
md.renderer.rules.paragraph_open = () => ""; // Typst 不需要段落起始标记
md.renderer.rules.paragraph_close = () => "\n\n"; // Typst 段落结束为两个换行

md.renderer.rules.heading_open = (tokens, idx) => {
  const level = tokens[idx].markup.length; // 根据 # 的个数判断标题级别
  return `${"=".repeat(level)} `;
};
md.renderer.rules.heading_close = () => "\n\n"; // Typst 标题结束为两个换行

// 添加 strong 标记的渲染规则
md.renderer.rules.strong_open = () => "*"; // Typst 使用单个星号表示粗体
md.renderer.rules.strong_close = () => "*";

// 添加 em 标记的渲染规则
md.renderer.rules.em_open = () => "_";
md.renderer.rules.em_close = () => "_";

// 添加 code 标记的渲染规则
md.renderer.rules.code_inline = (tokens, idx) => {
  const content = tokens[idx].content;
  return `\`${content}\``;
};

// 添加代码块渲染规则
md.renderer.rules.fence = (tokens, idx) => {
  const content = tokens[idx].content;
  // 保持原始Markdown代码块格式
  return `\`\`\`${tokens[idx].info}\n${content}\`\`\`\n`;
};




// 添加表格渲染规则
md.renderer.rules.table_open = () => {
    // 存储表格状态
    tableState.isFirstRow = true;
    tableState.columnCount = 0;
    return "#tablem[\n";
};

md.renderer.rules.table_close = () => "]";

// 创建表格状态对象
const tableState = {
    isFirstRow: true,
    columnCount: 0
};

// 处理表格行
md.renderer.rules.tr_open = () => "";
md.renderer.rules.tr_close = (tokens: Token[], idx: number) => {
    const result = "|\n";
    // 如果是第一行，添加分隔行
    if (tableState.isFirstRow) {
        tableState.isFirstRow = false;
        return result + "|" + "---------|".repeat(tableState.columnCount) + "\n";
    }
    return result;
};

// 处理表格单元格
md.renderer.rules.th_open = () => {
    if (tableState.isFirstRow) tableState.columnCount++;
    return "| ";
};
md.renderer.rules.th_close = () => " ";
md.renderer.rules.td_open = () => "| ";
md.renderer.rules.td_close = () => " ";

// 忽略这些标签的渲染
md.renderer.rules.thead_open = () => "";
md.renderer.rules.thead_close = () => "";
md.renderer.rules.tbody_open = () => "";
md.renderer.rules.tbody_close = () => "";

// 添加引用块渲染规则
md.renderer.rules.blockquote_open = (tokens, idx) => {
  // 检查是否是 callout 格式
  const content = tokens[idx + 1]?.content || '';
  const calloutMatch = content.match(/^\[(.*?)\]\s*(.*)/);
  
  if (calloutMatch) {
    console.log(tokens[idx + 1]);
    // 是 callout 格式，提取类型和标题
    const [, type, title] = calloutMatch;
    // 移除第一行的 callout 标记
    tokens[idx + 1].content = content.split('\n').slice(1).join('\n');
    return `#callout(type: "${type}", title: "${title}")[\n`;
  } else {
    // 普通引用块，使用默认的 info 类型
    return `#callout(type: "info")[\n`;
  }
};

md.renderer.rules.blockquote_close = () => "]\n\n";

const markdownText = `
## Title
This is a **bold** text with inline math $E = mc^2$ formula.

This is a *italic* text.

> [!note] 这是一个笔记
> 这是笔记的内容。
> 可以有多行。

> 这是普通引用块
> 没有特殊标记的引用。

Here's a display math formula:
$$
\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}
$$

\`\`\`typst
This is a code block.
\`\`\`

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;

// 递归打印token及其子token的函数
function printTokens(tokens: Token[], level = 0) {
    tokens.forEach(token => {
    // 打印当前token的缩进和基本信息
    console.log('  '.repeat(level) + JSON.stringify({
        type: token.type,
        tag: token.tag,
        content: token.content,
        markup: token.markup,
        info: token.info,
        nesting: token.nesting
    }));
    // 如果token有children则归打印
    if (token.children && token.children.length > 0) {
        console.log('  '.repeat(level) + 'Children:');
        printTokens(token.children, level + 1);
    }
    });
}

// 解析markdown并打印所有token
printTokens(md.parse(markdownText, {}));
console.log(md.render(markdownText));