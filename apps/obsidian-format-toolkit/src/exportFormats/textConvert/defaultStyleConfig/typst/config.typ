#import "@preview/mitex:0.2.4": * // 支持latex公式
#import "@preview/tablem:0.1.0": tablem // 支持Markdown表格
#import "custom_format.typ": *

#let underline = underline.with(show_content: false)

#let conf(
  title: none,
  author: (),
  doc,
) = {
  set text(font: "LXGW WenKai", lang: "zh", size: 10.8pt) //这里设置字体与语言
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

  set align(left) // 设置正文靠左对齐
  columns(1,doc) // 在这里修改全文的分栏数，1表示单栏，2表示双栏
}
