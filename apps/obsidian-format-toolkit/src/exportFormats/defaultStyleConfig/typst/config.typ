#import "@preview/mitex:0.2.5": * // LaTeX math support / 支持 LaTeX 公式
#import "@preview/tablem:0.3.0": tablem // Markdown-style tables / 支持 Markdown 表格
#import "DW_styles.typ": *

// Customize hidden callout types via hidden_types / 通过 hidden_types 参数自定义需要隐藏的 callout 类型
// #let callout = callout.with(hidden_types: ("todo", "info"))

// Toggle whether underline shows content / 切换下划线是否显示内容
#let DW_underline = DW_underline.with(show_content: true)

// Default gutter for grid / 设置分栏（grid）的默认间距
#let grid = grid.with(gutter: 1em)

#let conf(
  title: none,
  author: (),
  date:"",
  doc,
) = {
  set text(
    // Fonts for Latin/digits/CJK / 分别设置英文/数字/中文字体
    font: (
      (name: "Times New Roman", covers: "latin-in-cjk"), // Latin font / 英文字体
      (name: "Times New Roman", covers: regex("[0-9]")), // Digits font / 数字字体
      "Songti SC", // CJK fallback (default: Songti SC) / 其他字体，默认：宋体
      "Microsoft YaHei", // Fallback: Microsoft YaHei (Windows) / 备用字体：微软雅黑（Windows 系统）
      "PingFang SC", // Fallback: PingFang SC (macOS) / 备用字体：苹方简体（macOS 系统）
      "LXGW WenKai", // Recommended: LXGW WenKai / 作者推荐字体：霞鹜文楷
    ),
    lang: "zh",
    size: 10pt
  )

  // Heading numbering / 设置标题编号
  set heading(numbering: "1.1.1")

  // Page margins / 设置页面边距
  // set page(margin: (
  // top: 1.2cm,
  // right: 1.5cm,
  // bottom: 2cm, 
  // left: 1.5cm   
  // ))
  // Add all show rules here / 在这里添加所有 show 规则
  // 
  
  // Center images by default / 设置图片默认居中显示
  show image: it => align(center, it)
  
  // Strong text style / 设置重点强调文本样式
  show strong: it => text(
    weight: "bold",
    fill: red.darken(20%), 
    it.body
  )

  // Emphasis text style / 设置强调文本样式
  show emph: it => text(
    fill: purple.darken(20%),
    style: "italic",
    it.body
  )

  set align(center) // Center-align title / 设置标题居中
  text(17pt, weight: "bold")[#title]
  
  // Render author / 显示作者信息
  if (author != "") {
    v(0em) // Vertical spacing between title and author (0 acts as line break) / 添加标题和作者之间的垂直间距，为 0 时起到换行的作用
    text(12pt, weight: "medium")[
        #author // Render single author / 单个作者直接显示
    ]
  }

  if date != "" {
    v(0em) // Vertical spacing between title and date (0 acts as line break) / 添加标题和日期之间的垂直间距，为 0 时起到换行的作用
    text(12pt, weight: "medium")[#date]
  }
  
  // v(0.2em) // Vertical spacing between header and body / 添加作者与正文之间的垂直间距
  set align(left) // Left-align body / 设置正文靠左对齐
  columns(1,doc) // Set column count (1=single, 2=two) / 在这里修改全文分栏数，1 表示单栏，2 表示双栏

}
