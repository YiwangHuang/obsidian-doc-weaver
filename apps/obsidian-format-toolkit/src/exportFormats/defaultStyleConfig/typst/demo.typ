#import "config.typ": *

// 设置代码块的样式
#import "@preview/codly:1.3.0": *
#import "@preview/codly-languages:0.1.1": *
#show: codly-init.with()
#codly(languages: codly-languages)

// 设置行内代码的背景色
#show raw.where(block: false): box.with(
  fill: luma(240),
  inset: (x: 3pt, y: 0pt),
  outset: (y: 3pt),
  radius: 2pt,
)

#show: conf.with(
  title: "Typst 格式演示",
  author: ("张三", "李四"),
  date: "date of today",
)


= 前言

本文件用于展示 Doc Weaver 的 Typst 导出效果。插件会将 Obsidian 中的 Markdown 笔记、嵌入笔记与附件（如图片与绘图）整理为结构化的 Typst 文档，便于进一步排版并生成 PDF。

你可以把它当作默认主题的示例与回归用例：常见的标题、代码块、表格与 callout 等语法会在导出后尽量保持一致；对于部分内容增强类插件（例如 AnyBlock、Excalidraw）的产物，Doc Weaver 也会做适配处理以获得更稳定的输出。

若需调整字体、标题编号或各类块的样式，请修改 `config.typ` 与 `custom_format.typ` 后重新导出即可。


= 第三方包依赖

本 Demo 依赖以下第三方包，第一次打开时会自动安装：

```typst
// LaTeX 公式支持（行内公式 #mi、块级公式 #mitex）
#import "@preview/mitex:0.2.5": *

// Markdown 风格表格
#import "@preview/tablem:0.3.0": tablem

// GitHub Octicons 图标（用于 callout 图标）
#import "@preview/octique:0.1.0": *

// 代码块语法高亮与样式
#import "@preview/codly:1.3.0": *
#import "@preview/codly-languages:0.1.1": *
```

= 配置说明

本模板的所有自定义格式都定义在 `custom_format.typ` 文件中，并通过 `config.typ` 进行配置。你可以在 `config.typ` 中修改以下内容来全局控制文档的格式和行为。

== 基础配置

```typst
// 隐藏指定类型的 callout
#let callout = callout.with(hidden_types: ("todo"))

// 全局切换 underline 是否显示内容
#let underline = underline.with(show_content: true)

// 设置字体和样式
set text(font: ("LXGW WenKai", "Arial"), size: 10.8pt)

// 自定义重点强调文本样式
show strong: it => text(weight: "bold", fill: red.darken(20%), it.body)
```

== 标题编号自定义方案

#callout(
  type: "tip",
  title: [说明],
  [复制以下代码到 `config.typ` 中即可使用对应的标题编号方案。]
)

=== 从第三级开始编号

```typst
#set heading(numbering: (..nums) => {
  let level = nums.pos().len()
  if level <= 2 { none }
  else { numbering("1.1", ..nums.pos().slice(2)) }
})
```

=== 仅特定级别编号

```typst
#set heading(numbering: (..nums) => {
  let level = nums.pos().len()
  if level == 2 { numbering("1", ..nums.pos().slice(1)) }
  else { none }
})
```

=== 混合编号

```typst
#set heading(numbering: (..nums) => {
  let level = nums.pos().len()
  if level == 1 { none }
  else if level == 2 { numbering("I", ..nums.pos().slice(1)) }
  else if level == 3 { numbering("a.", ..nums.pos().slice(2)) }
  else if level == 4 { numbering("(1)", ..nums.pos().slice(3)) }
})
```

= Doc Weaver 自定义格式

== Callout

#callout(
  type: "tip",
  title: [提示],
  [
    继承自 Obsidian 的 callout 语法，支持 note、tip、info、warning、danger 等 27 种类型。
  ]
)

```typst
#callout(
  type: "tip",
  title: [提示],
  [继承自 Obsidian 的 callout 语法，支持多种类型。]
)
```

=== 全部 Callout 类型展示

```typst
#callout(type: "note", title: [笔记], [这是一个普通笔记。])
```
#callout(type: "note", title: [笔记], [这是一个普通笔记。])

```typst
#callout(type: "seealso", title: [另见], [参见相关内容。])
```
#callout(type: "seealso", title: [另见], [参见相关内容。])

```typst
#callout(type: "abstract", title: [摘要], [这是摘要信息。])
```
#callout(type: "abstract", title: [摘要], [这是摘要信息。])

```typst
#callout(type: "summary", title: [总结], [这是总结信息。])
```
#callout(type: "summary", title: [总结], [这是总结信息。])

```typst
#callout(type: "tldr", title: [太长不读], [简短概括要点。])
```
#callout(type: "tldr", title: [太长不读], [简短概括要点。])

```typst
#callout(type: "info", title: [信息], [这是一条信息提示。])
```
#callout(type: "info", title: [信息], [这是一条信息提示。])

```typst
#callout(type: "todo", title: [待办], [这是一个待办事项。])
```
#callout(type: "todo", title: [待办], [这是一个待办事项。])

```typst
#callout(type: "tip", title: [小贴士], [这是一个实用小贴士。])
```
#callout(type: "tip", title: [小贴士], [这是一个实用小贴士。])

```typst
#callout(type: "hint", title: [提示], [这是一个提示。])
```
#callout(type: "hint", title: [提示], [这是一个提示。])

```typst
#callout(type: "important", title: [重要], [这是重要信息。])
```
#callout(type: "important", title: [重要], [这是重要信息。])

```typst
#callout(type: "success", title: [成功], [操作已成功完成。])
```
#callout(type: "success", title: [成功], [操作已成功完成。])

```typst
#callout(type: "check", title: [检查通过], [检查已通过。])
```
#callout(type: "check", title: [检查通过], [检查已通过。])

```typst
#callout(type: "done", title: [已完成], [任务已完成。])
```
#callout(type: "done", title: [已完成], [任务已完成。])

```typst
#callout(type: "question", title: [疑问], [这是一个待解决的问题。])
```
#callout(type: "question", title: [疑问], [这是一个待解决的问题。])

```typst
#callout(type: "help", title: [帮助], [需要帮助时请参考。])
```
#callout(type: "help", title: [帮助], [需要帮助时请参考。])

```typst
#callout(type: "faq", title: [常见问题], [这是一个常见问题。])
```
#callout(type: "faq", title: [常见问题], [这是一个常见问题。])

```typst
#callout(type: "warning", title: [警告], [请注意潜在风险。])
```
#callout(type: "warning", title: [警告], [请注意潜在风险。])

```typst
#callout(type: "caution", title: [小心], [操作时请谨慎。])
```
#callout(type: "caution", title: [小心], [操作时请谨慎。])

```typst
#callout(type: "attention", title: [注意], [请注意以下内容。])
```
#callout(type: "attention", title: [注意], [请注意以下内容。])

```typst
#callout(type: "failure", title: [失败], [操作未能成功。])
```
#callout(type: "failure", title: [失败], [操作未能成功。])

```typst
#callout(type: "missing", title: [缺失], [缺少必要的内容。])
```
#callout(type: "missing", title: [缺失], [缺少必要的内容。])

```typst
#callout(type: "danger", title: [危险], [此操作存在严重风险！])
```
#callout(type: "danger", title: [危险], [此操作存在严重风险！])

```typst
#callout(type: "error", title: [错误], [发生了一个错误。])
```
#callout(type: "error", title: [错误], [发生了一个错误。])

```typst
#callout(type: "bug", title: [缺陷], [发现了一个程序缺陷。])
```
#callout(type: "bug", title: [缺陷], [发现了一个程序缺陷。])

```typst
#callout(type: "example", title: [示例], [这是一个示例。])
```
#callout(type: "example", title: [示例], [这是一个示例。])

```typst
#callout(type: "quote", title: [引用], [引用自某人的话。])
```
#callout(type: "quote", title: [引用], [引用自某人的话。])

```typst
#callout(type: "cite", title: [引述], [引述参考文献。])
```
#callout(type: "cite", title: [引述], [引述参考文献。])

== Underline 下划线

基础下划线：#underline[这是下划线文本]

挖空效果：#underline(show_content: false)[隐藏的答案]

多行填空（自动计算行数）：
#underline(line_break: true, show_content: false)[这是一段隐藏内容，系统会根据文本长度自动计算需要的行数，为每行添加下划线]

```typst
// 基础下划线
#underline[这是下划线文本]

// 挖空效果（隐藏内容，仅显示下划线）
#underline(show_content: false)[隐藏的答案]

// 多行填空（自动计算行数）
#underline(line_break: true, show_content: false)[隐藏内容]
```
