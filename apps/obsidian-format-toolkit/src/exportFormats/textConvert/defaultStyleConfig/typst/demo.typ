#import "config.typ": *

#show: doc => conf(
  title: "Typst 格式演示 / Typst Format Demo",
  author: ("张三", "李四"),
  date: "date of today",
  doc,
)

= 自定义格式演示 / Custom Format Demo

== Callout 语法演示 / Callout Syntax Demo

#callout(
  type: "tip",
  title: [学习提示 / Learning Tip],
  [
    这是一个提示框，支持多种类型：note、tip、info、question、done、danger 等。
    This is a callout that supports multiple types: note, tip, info, question, done, danger, etc.
  ]
)

#callout(
  type: "done",
  title: [任务完成 / Task Completed],
  [
    配置完成！/ Configuration completed!
  ]
)

// 这个 todo 类型不会显示，因为在 config.typ 中被隐藏
// This todo type won't display because it's hidden in config.typ
#callout(
  type: "todo",
  title: [待办事项 / Todo],
  [
    这个内容不会显示 / This content won't show
  ]
)

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

