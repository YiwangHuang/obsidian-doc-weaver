#import "@preview/mitex:0.2.5": * // 支持latex公式
#import "@preview/tablem:0.3.0": tablem // 支持Markdown表格
#import "custom_format.typ": *

// 自定义callout隐藏类型，预设hidden_types以包含更多隐藏类型
#let callout = callout.with(hidden_types: ("todo"))

// 切换underline是否显示内容
#let underline = underline.with(show_content: true)

// 设置分栏(grid)的默认间距
#let grid = grid.with(gutter: 1em)

#let conf(
  title: none,
  author: (),
  date:"",
  doc,
) = {
  set text(
    // 分别设置中英文字体
    font: (
      (name: "Times New Roman", covers: "latin-in-cjk"), // 英文字体
      (name: "Times New Roman", covers: regex("[0-9]")), // 数字字体
      "Songti SC", // 其他字体，默认：宋体
      "Microsoft YaHei", // 备用字体：微软雅黑（Windows系统）
      "PingFang SC", // 备用字体：苹方简体（macOS系统）
      "LXGW WenKai", // 作者推荐字体：霞鹜文楷
    ),
    lang: "zh",
    size: 10pt
  )

  // 设置标题编号
  set heading(numbering: "1.1.1")

  // 设置页面边距
  // set page(margin: (
  // top: 1.2cm,
  // right: 1.5cm,
  // bottom: 2cm, 
  // left: 1.5cm   
  // ))
  // 在这里添加所有的 show 规则
  // 
  
  // 设置重点强调文本的样式
  show strong: it => text(
    weight: "bold",
    fill: red.darken(20%), 
    it.body
  )

  // 设置强调文本的样式
  show emph: it => text(
    fill: purple.darken(20%),
    style: "italic",
    it.body
  )

  set align(center) // 设置标题居中
  text(17pt, weight: "bold")[#title]
  
  // 显示作者信息
  if author != () {
    v(0em) // 添加标题和作者之间的垂直间距，为0时起到换行的作用
    text(12pt, weight: "medium")[
      #if type(author) == "array" {
        author.join("   ") // 如果是多个作者，用空格分隔
      } else {
        author // 单个作者直接显示
      }
    ]
  }

  if date != "" {
    v(0em) // 添加标题和作者之间的垂直间距，为0时起到换行的作用
    text(12pt, weight: "medium")[#date]
  }
  
  // v(0.2em) // 添加作者和正文之间的垂直间距
  set align(left) // 设置正文靠左对齐
  columns(1,doc) // 在这里修改全文的分栏数，1表示单栏，2表示双栏

}
