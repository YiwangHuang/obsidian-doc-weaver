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
  title: "Typst 格式演示 / Typst Format Demo",
  author: ("张三", "李四"),
  date: "date of today",
)

= 基础语法演示 / Basic Syntax Demo

1. *重点强调文本*：`*重点强调文本*`或`#strong[重点强调文本]`
2. _强调文本_：`_强调文本_`或`#emph[强调文本]`

= 自定义格式演示 / Custom Format Demo

== Callout 语法演示 / Callout Syntax Demo

#callout(
  type: "tip",
  title: [提示 / Tip],
  [
    继承自obsidian的callout语法，支持多种类型：note、tip、info、question、done、todo 等。
    Inherit from obsidian's callout syntax, supporting multiple types: note, tip, info, question, done, todo, etc.
  ]
)

```typst
#callout(
  type: "tip",
  title: [提示 / Tip],
  [
    继承自obsidian的callout语法，支持多种类型：note、tip、info、question、done、todo 等。
    Inherit from obsidian's callout syntax, supporting multiple types: note, tip, info, question, done, todo, etc.
  ]
)
```

== 双栏布局演示 / Double Column Layout Demo



== Underline 语法演示 / Underline Syntax Demo

这是#underline[基础下划线]和#underline(show_content: false)[　　　　]挖空效果的例子。
This is an example of #underline[basic underline] and #underline(show_content: false)[　　　　] blank fill effect.

== 配置文件控制 / Configuration File Control

在 `config.typ` 中可以通过以下语句精细控制格式：
You can fine-tune the formatting with these statements in `config.typ`:

```typst
// 设置 callout 的隐藏类型
#let callout = callout.with(hidden_types: ("todo"))

// 设置 underline 的默认显示内容
#let underline = underline.with(show_content: true)

// 设置字体和样式
set text(font: ("LXGW WenKai", "Arial"), size: 10.8pt)

// 自定义 strong 文本样式
show strong: it => text(weight: "bold", fill: red.darken(20%), it.body)
```

通过修改这些设置，可以全局控制文档的格式和行为。
By modifying these settings, you can globally control the document's formatting and behavior.

= 推荐第三方包 / Recommended Third-Party Packages

== Latex 公式支持 / Latex Formula Support

#mitex[`\begin{cases}
mg'\frac{l}{2}=\frac{1}{2}mv_{3}^{2} \\
F_{m}-mg' = m\frac{v_{3}^{2}}{l}
\end{cases}
\Rightarrow F_{m} = 2mg'=\frac{4}{\sqrt{ 3 }}mg`]


记小球在等效重力场中做圆周运动速度最小值为 #mi[`v'`]，#mi[`A`] 点的临界初速度为 #mi[`v_{4}`]

== Markdown 表格支持 / Markdown Table Support

#tablem[
  | 列1 | 列2 | 列3 |
  | --- | --- | --- |
  | 数据1 | 数据2 | 数据3 |
  | 数据4 | 数据5 | 数据6 |
]

