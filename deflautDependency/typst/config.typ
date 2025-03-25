#import "@preview/mitex:0.2.4": * // 支持latex公式
#import "@preview/tablem:0.1.0": tablem // 支持Markdown表格

#let conf(
  title: none,
  author: (),
  doc,
) = {
  set text(font: "LXGW WenKai", lang: "zh", size: 9pt) //这里设置字体与语言
  set grid(gutter: 1em)  // 设置分栏(grid)的默认间距

  set align(center) // 设置标题居中
  text(17pt, weight: "bold")[#title]

  set align(left) // 设置正文靠左对齐
  columns(1,doc) // 在这里修改全文的分栏数，1表示单栏，2表示双栏
}

// 定义 callout 格式, collapse 属性备用
#let callout(type: "note", title: none, collapse: none, body) = {
  // 定义哪些类型应该被隐藏
  let hidden_types = ("hidden", "hide", "none")
  
  // 如果type在hidden_types中，返回空内容
  if type in hidden_types { return [] }
  // svg 图标来源 https://feathericons.com/
  let icon = if type == "note" { "ℹ" }
    else if type == "warning" { image("assets/alert-circle.svg", height:0.9em) }
    else if type == "question" { image("assets/help-circle.svg", height:0.9em) }
    else if type == "tip" { image("assets/light-bulb.svg", height:0.9em) }
    else if type == "info" { image("assets/aperture.svg", height: 0.9em) }
    else if type == "done" { image("assets/feather.svg", height:0.9em) }
    else { ">" }
  
  let color = if  type == "done" { green }
    else if type == "warning" or type == "question" { orange }
    else if type == "danger" { red }
    else if type == "tip"or type == "note"  { blue }
    else if type == "info" { purple }
    else { gray }
  
  block(
    width: 100%,
    fill: color.lighten(90%),
    stroke: (left: 2pt + color),
    inset: 1em,
    radius: 4pt,
    [
      #box(icon) 
      #if title != none {
        [#title #linebreak()]
      }
      #body
    ]
  )
}

// 重定义下划线命令
#let underline(
  body,
  stroke: black,
  offset: 2pt,
  thickness: 0.6pt,
  show_content: true, // 控制是否显示内容文字，用于挖空
) = {
  context {
    let size = measure(body)
    box(
      baseline: offset, // 设置box的基线位置与文字对齐
      stack(
        dir: ttb,
        spacing: offset,
        if show_content { body } else { [] },
        line(
          length: size.width,
          stroke: (thickness + stroke)
        )
      )
    )
  }
}