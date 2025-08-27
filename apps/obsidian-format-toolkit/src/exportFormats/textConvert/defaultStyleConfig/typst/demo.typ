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

+ 让我们留下深刻印象的是她在困境中展现出的勇气。#linebreak()#underline[What impresses us most is that she showed great courage in the face of difficulties.]
+ 最关键的是我们要珍惜当下的时光。
#underline[What counts most is that we should cherish the present moment.]
3. 真正重要的是我们彼此之间的信任。
#underline[What matters truly is that we have trust in each other.]
4. 令人我们印象深刻的是他对工作的专注和热情。
#underline[What impresses us most is that he has great dedication and enthusiasm for his work.]
5. 最要紧的是我们在面对挑战时永不放弃。
#underline[What counts most is that we never give up when facing challenges.]
6. 最重要的是我们不断尝试。
#underline[What matters most is that we keep trying.]
7. 最重要的是你开心。
#underline[What matters most is that you're happy.]

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

这是#underline[基础下划线]和#underline(show_content: false)[基础下划线]挖空效果的例子。

This is an example of #underline[basic underline] and #underline(show_content: false)[basic underline] blank fill effect.
#linebreak()#linebreak()#linebreak()#linebreak()
// 自动计算行数的填空效果：根据内容长度自动确定行数
#underline(line_break: true)[请在此填写内容]

// 长内容自动多行：系统会根据文本长度自动计算需要的行数
#underline(line_break: true)[这是一段较长的文本内容，系统会自动检测文本在当前容器宽度下需要的行数，然后为每一行都添加占满宽度的下划线，实现完美的表单填空效果]


#text(fill: rgb("#27ad27"))[颜色]

// 隐藏内容的填空表单：仅显示对应行数的下划线
#underline(line_break: true, show_content: false)[隐藏的内容模板，会根据这段文字的长度自动计算行数隐藏的内容模板，会根据这段文字的长度自动计算行数隐藏的内容模板，会]


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

= 标题编号自定义方案 / Custom Heading Numbering Schemes

#callout(
  type: "tip",
  title: [说明 / Note],
  [
  复制到 `config.typ` 中，即可实现自定义的标题编号方案。
  Copy to `config.typ` to implement custom heading numbering schemes.
  ]
)


== 从第三级开始编号 / Start from Third Level

```typst
#set heading(numbering: (..nums) => {
  let level = nums.pos().len()
  if level <= 2 {
    // 第一、二级不编号
    none
  } else {
    // 第三级开始编号：1.1、2.1、3.1
    numbering("1.1", ..nums.pos().slice(2))
  }
})
```
== 仅特定级别编号 / Only Specific Levels Numbered

```typst
#set heading(numbering: (..nums) => {
  let level = nums.pos().len()
  if level == 2 {
    // 仅第二级编号
    numbering("1", ..nums.pos().slice(1))
  } else {
    // 其他级别不编号
    none
  }
})
```

== 混合编号 / Mixed Numbering

```typst
#set heading(numbering: (..nums) => {
  let level = nums.pos().len()
  if level == 1 {
    // 第一级不编号
    none
  } else if level == 2 {
    // 第二级：I、II、III
    numbering("I", ..nums.pos().slice(1))
  }else if level == 3 {
    // 第三级：a.、b.、c.
    numbering("a.", ..nums.pos().slice(2))
  } else if level == 4 {
    // 第四级：(1)、(2)、(3)
    numbering("(1)", ..nums.pos().slice(3))
  } 
})
```




要切换编号方案，请取消注释相应的代码块并注释掉当前方案。


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

