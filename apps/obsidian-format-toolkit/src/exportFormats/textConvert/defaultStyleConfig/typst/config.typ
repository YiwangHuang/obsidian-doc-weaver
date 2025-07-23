#import "@preview/mitex:0.2.4": * // 支持latex公式
#import "@preview/tablem:0.1.0": tablem // 支持Markdown表格
#import "custom_format.typ": *

#let underline = underline.with(show_content: true)

// 自定义callout版本，预设hidden_types为包含更多隐藏类型
#let callout = callout.with(hidden_types: ("todo"))

#let conf(
  title: none,
  author: (),
  date:"",
  doc,
) = {
  set text(
    font: (
      "LXGW WenKai",          // 主字体：霞鹜文楷
      "Noto Sans CJK SC",     // 备用字体1：思源黑体简体中文
      "Source Han Sans SC",   // 备用字体2：思源黑体简体中文（别名）
      "Microsoft YaHei",      // 备用字体3：微软雅黑（Windows系统）
      "PingFang SC",          // 备用字体4：苹方简体（macOS系统）
      "SimHei",               // 备用字体5：黑体（Windows系统）
      "DejaVu Sans",          // 备用字体6：通用西文字体
      "Arial"                 // 备用字体7：系统默认字体
    ), 
    lang: "zh", 
    size: 10.8pt
  )
  set grid(gutter: 1em)  // 设置分栏(grid)的默认间距
  // set page(margin: (
  // top: 1.2cm,
  // right: 1.5cm,
  // bottom: 2cm, 
  // left: 1.5cm   
  // ))
  // 在这里添加所有的 show 规则
  show strong: it => text(
    weight: "bold",
    fill: red.darken(20%),
    // fill: rgb("#ff64cb").darken(20%),
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
