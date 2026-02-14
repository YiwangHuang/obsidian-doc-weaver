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

#underline[#mi[`v`]dffdf]。

== 方案一测试：基于 place + line 的精确定位方案

// 测试基础的 place + line 实现
这是普通文本，#context {
  let body = [下划线文本]
  let stroke = 0.5pt + black
  let offset = -5pt
  let measured = measure(body)
  [#body]
  place(
    dx: 15pt, 
    dy: offset,
    line(length: measured.width, stroke: stroke)
  )
}，后面继续文本。

// 测试不同偏移量
测试不同偏移量：#context {
  let body = [offset=1pt]
  let stroke = 0.6pt + black
  let offset = 1pt
  let measured = measure(body)
  [#body]
  place(
    dx: 0pt, 
    dy: offset,
    line(length: measured.width, stroke: stroke)
  )
}，#context {
  let body = [offset=3pt]
  let stroke = 0.6pt + black
  let offset = 3pt
  let measured = measure(body)
  [#body]
  place(
    dx: 0pt, 
    dy: offset,
    line(length: measured.width, stroke: stroke)
  )
}，#context {
  let body = [offset=5pt]
  let stroke = 0.6pt + black
  let offset = 5pt
  let measured = measure(body)
  [#body]
  place(
    dx: 0pt, 
    dy: offset,
    line(length: measured.width, stroke: stroke)
  )
}

// 测试不同线条样式
测试不同线条样式：#context {
  let body = [细线0.3pt]
  let stroke = 0.3pt + black
  let offset = 2pt
  let measured = measure(body)
  [#body]
  place(
    dx: 0pt, 
    dy: offset,
    line(length: measured.width, stroke: stroke)
  )
}，#context {
  let body = [粗线1.5pt]
  let stroke = 1.5pt + black
  let offset = 2pt
  let measured = measure(body)
  [#body]
  place(
    dx: 0pt, 
    dy: offset,
    line(length: measured.width, stroke: stroke)
  )
}，#context {
  let body = [红色线条]
  let stroke = 0.6pt + red
  let offset = 2pt
  let measured = measure(body)
  [#body]
  place(
    dx: 0pt, 
    dy: offset,
    line(length: measured.width, stroke: stroke)
  )
}

// 测试虚线效果
测试虚线效果：#context {
  let body = [虚线下划线]
  let stroke = (paint: black, thickness: 0.6pt, dash: "dashed")
  let offset = 2pt
  let measured = measure(body)
  [#body]
  place(
    dx: 0pt, 
    dy: offset,
    line(length: measured.width, stroke: stroke)
  )
}

// 测试隐藏内容但保留下划线（模拟挖空效果）
测试挖空效果：#context {
  let body = [隐藏的内容]
  let content_to_show = text(fill: rgb(0, 0, 0, 0))[#body]  // 透明文字
  let stroke = 0.6pt + black
  let offset = 2pt
  let measured = measure(body)  // 仍然测量原始内容的宽度
  [#content_to_show]
  place(
    dx: 0pt, 
    dy: offset,
    line(length: measured.width, stroke: stroke)
  )
}，这里应该显示下划线但看不到文字。

// 测试多行文本的效果
测试长文本：#context {
  let body = [这是一段比较长的文本，可能会换行，我们来看看place+line方案在处理这种情况时的表现如何]
  let stroke = 0.6pt + blue
  let offset = 2pt
  let measured = measure(body)
  [#body]
  place(
    dx: 0pt, 
    dy: offset,
    line(length: measured.width, stroke: stroke)
  )
}

// 对比原生underline的效果
对比原生效果：#underline[原生underline效果]

== 方案二测试：基于 stack + line 的垂直堆叠方案

// 测试基础的 stack + line 实现
普通文本：#stack(
  dir: ttb,
  spacing: 3pt,
  [下划线文本],
  line(length: 100%, stroke: 0.6pt + black)
)

// 测试数学公式
数学公式：#stack(
  dir: ttb, 
  spacing: -2pt,
  [#mi[`v = sqrt(2gh)`]],
  line(length: 100%, stroke: 0.6pt + black)
)

== 方案三测试：基于 box + 边框的容器方案

// 测试基础的 box 边框实现
普通文本：#box(
  stroke: (bottom: 0.6pt + black),
  inset: (bottom: 2pt)
)[下划线文本]

// 测试数学公式
数学公式：#box(
  stroke: (bottom: 0.6pt + black), 
  inset: (bottom: 2pt)
)[#mi[`E = mc^2`]]

== 方案四测试：混合方案（根据需求选择最佳策略）

// 普通文本使用 box 方案
普通文本（box方案）：#box(
  stroke: (bottom: 0.6pt + black),
  inset: (bottom: 2pt)
)[简单下划线]

// 需要精确控制时使用 place 方案  
精确控制（place方案）：#context {
  let body = [精确定位]
  let stroke = 0.6pt + red
  let offset = 2pt
  let measured = measure(body)
  [#body]
  place(
    dx: 0pt,
    dy: offset, 
    line(length: measured.width, stroke: stroke)
  )
}

// 数学公式使用最适合的方案
数学公式（box方案）：#box(
  stroke: (bottom: 0.6pt + blue),
  inset: (bottom: 2pt)
)[#mi[`int_0^infty e^(-x^2) dx = sqrt(pi)/2`]]

数学公式（place方案）：#context {
  let body = [#mi[`sum_(n=1)^infty 1/n^2 = pi^2/6`]]
  let stroke = 0.6pt + green
  let offset = 2pt
  let measured = measure(body)
  [#body]
  place(
    dx: 0pt,
    dy: offset,
    line(length: measured.width, stroke: stroke)
  )
}

== 各方案对比总结

#callout(
  type: "info",
  title: [方案对比 / Comparison],
  [
    - *方案一 (place+line)*: 精确控制，支持 evade 参数，适合复杂需求
    - *方案二 (stack)*: 结构简单，适合多行文本，但可能影响行间距
    - *方案三 (box边框)*: 最简洁，自动适应宽度，最接近原生效果
    - *方案四 (混合)*: 根据场景选择最优方案，兼顾性能和效果
  ]
)


== Underline 语法演示 / Underline Syntax Demo

这是#underline[基础下划线]和#underline(show_content: false)[基础下划线]挖空效果的例子。

挖空公式：#underline__builtin(stroke: 5pt + black)[#mi[`v`]dffdf]。

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

