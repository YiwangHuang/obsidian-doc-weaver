import MarkdownIt from "markdown-it";
import type Token = require('markdown-it/lib/token');
// 导入markdown-it-container插件
import container from "markdown-it-container";

// 创建 Markdown-it 实例
const md = new MarkdownIt();

// 自定义渲染规则
md.renderer.rules.paragraph_open = () => ""; // Typst 不需要段落起始标记
md.renderer.rules.paragraph_close = () => "\n\n"; // Typst 段落结束为两个换行

md.renderer.rules.heading_open = (tokens, idx) => {
  const level = tokens[idx].markup.length; // 根据 # 的个数判断标题级别
  return `${"#".repeat(level)} `;
};
md.renderer.rules.heading_close = () => "\n\n"; // Typst 标题结束为两个换行

// 添加 strong 标记的渲染规则
md.renderer.rules.strong_open = () => "*"; // Typst 使用单个星号表示粗体
md.renderer.rules.strong_close = () => "*";

// 添加自定义容器的渲染规则
md.use(container, 'info', {
  // 容器的验证函数
  validate: function(params: string) {
    return params.trim().match(/^info\s*(.*)$/);
  },

  // 容器的渲染函数
  render: function (tokens: Token[], idx: number) {
    // 获取容器的参数（标题）
    const m = tokens[idx].info.trim().match(/^info\s*(.*)$/);
    
    // 处理容器的开始标记
    if (tokens[idx].nesting === 1) {
      // 开始标记
      return '#box(\n  title: "' + (m?.[1] || 'Info') + '",\n  [\n';
    } else {
      // 结束标记
      return '  ]\n)\n\n';
    }
  }
});

// 示例文本，添加了自定义容器的示例
const markdownText = `
# Title
This is a **bold** text.

:::info Custom Title
This is a custom info box content.
Multiple lines are supported.
:::

:::info
This is another info box without title.
:::
`;

// 输出为 Typst 格式
const typstOutput = md.render(markdownText);
console.log(typstOutput);