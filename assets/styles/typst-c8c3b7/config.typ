#import "@preview/mitex:0.2.4": * // 支持latex公式
#import "@preview/tablem:0.1.0": tablem // 支持Markdown表格

#let conf(
  title: none,
  author: (),
  doc,
) = {
  set text(font: "LXGW WenKai", lang: "zh")

  set align(center)
  text(17pt, weight: "bold")[#title]

  set align(left)
  columns(1,doc)
}

// 定义 callout 格式, collapse 属性备用
#let callout(type: "note", title: none, collapse: none, body) = {
  let icon = if type == "note" { "ℹ" }
    else if type == "warning" { "⚠" }
    else if type == "danger" { "🚫" }
    else if type == "tip" { "💡" }
    else { ">" }
  
  let color = if type == "note" { blue }
    else if type == "warning" { yellow }
    else if type == "danger" { red }
    else if type == "tip" { green }
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
        [ *#title* #linebreak()]
      }
      #body
    ]
  )
}