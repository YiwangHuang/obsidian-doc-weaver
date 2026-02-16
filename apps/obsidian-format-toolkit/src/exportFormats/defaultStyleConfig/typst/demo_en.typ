#import "config.typ": *

// Code block styling / 代码块样式
#import "@preview/codly:1.3.0": *
#import "@preview/codly-languages:0.1.1": *
#show: codly-init.with()
#codly(languages: codly-languages)

// Inline code background / 行内代码背景
#show raw.where(block: false): box.with(
  fill: luma(240),
  inset: (x: 3pt, y: 0pt),
  outset: (y: 3pt),
  radius: 2pt,
)

#show: conf.with(
  title: "Typst Style Demo",
  author: "Author",
  date: "Date",
)


= Preface

This file demonstrates the Typst export produced by Doc Weaver. The plugin turns Obsidian Markdown notes, embedded notes, and attachments (such as images and drawings) into a structured Typst document for typesetting and PDF generation, and you can use it as the default theme reference.

Common constructs like headings, code blocks, tables, and callouts are preserved as much as possible. Doc Weaver also adapts outputs from content-enhancement plugins (for example AnyBlock and Excalidraw) to make the final rendering more stable.

To tweak fonts, heading numbering, or block styles, edit `config.typ` and `DW_styles.typ`, then export again.


= Third-party packages

This demo depends on the following packages. Typst will download them automatically the first time you open the file. If it does not render correctly, please wait a moment.

```typst
// LaTeX math (inline #mi, block #mitex)
#import "@preview/mitex:0.2.5": *

// Markdown-style tables
#import "@preview/tablem:0.3.0": tablem

// GitHub Octicons icons (used by callout icons)
#import "@preview/octique:0.1.0": *

// Code block highlighting and styling
#import "@preview/codly:1.3.0": *
#import "@preview/codly-languages:0.1.1": *
```

= Configuration

All custom styles in this template are defined in `DW_styles.typ` and configured via `config.typ`. You can edit `config.typ` to control the global formatting and behavior.

== Basic configuration

```typst
// Hide specified callout types
#let callout = callout.with(hidden_types: ("todo", "info"))

// Toggle whether underline shows content globally
#let DW_underline = DW_underline.with(show_content: true)

// Fonts and base text style
set text(font: ("LXGW WenKai", "Arial"), size: 10.8pt)

// Strong text style
show strong: it => text(weight: "bold", fill: red.darken(20%), it.body)
```

== Custom heading numbering

#callout(
  type: "tip",
  title: [Note],
  [Copy the snippets below into `config.typ` to enable the corresponding heading numbering scheme.]
)

=== Start numbering from level 3

```typst
#set heading(numbering: (..nums) => {
  let level = nums.pos().len()
  if level <= 2 { none }
  else { numbering("1.1", ..nums.pos().slice(2)) }
})
```

=== Number only specific levels

```typst
#set heading(numbering: (..nums) => {
  let level = nums.pos().len()
  if level == 2 { numbering("1", ..nums.pos().slice(1)) }
  else { none }
})
```

=== Mixed numbering

```typst
#set heading(numbering: (..nums) => {
  let level = nums.pos().len()
  if level == 1 { none }
  else if level == 2 { numbering("I", ..nums.pos().slice(1)) }
  else if level == 3 { numbering("a.", ..nums.pos().slice(2)) }
  else if level == 4 { numbering("(1)", ..nums.pos().slice(3)) }
})
```

= Doc Weaver styles

== Underline

Basic underline: #DW_underline[This is underlined text]

Blank (hide content): #DW_underline(show_content: false)[Hidden answer]

Multi-line blank (auto line count): #DW_underline(line_break: true, show_content: false)[This is hidden content. The system estimates how many lines are needed based on the text length and draws an underline for each line. This is hidden content. The system estimates how many lines are needed based on the text length and draws an underline for each line.]

== Callout

Inherits Obsidian callout syntax and supports 27 types such as note, tip, info, warning, and danger.

#callout(type: "note", title: [Note], [This is a regular note.])

#callout(type: "seealso", title: [See also], [See related content.])

#callout(type: "abstract", title: [Abstract], [This is an abstract.])

#callout(type: "summary", title: [Summary], [This is a summary.])

#callout(type: "tldr", title: [TLDR], [A brief takeaway.])

#callout(type: "info", title: [Info], [An informational message.])

#callout(type: "todo", title: [TODO], [A TODO item.])

#callout(type: "tip", title: [Tip], [A practical tip.])

#callout(type: "hint", title: [Hint], [A hint for you.])

#callout(type: "important", title: [Important], [Important information.])

#callout(type: "success", title: [Success], [The operation completed successfully.])

#callout(type: "check", title: [Checked], [All checks passed.])

#callout(type: "done", title: [Done], [The task is done.])

#callout(type: "question", title: [Question], [A question to resolve.])

#callout(type: "help", title: [Help], [Use this when you need help.])

#callout(type: "faq", title: [FAQ], [A frequently asked question.])

#callout(type: "warning", title: [Warning], [Beware of potential risks.])

#callout(type: "caution", title: [Caution], [Proceed carefully.])

#callout(type: "attention", title: [Attention], [Please note the following.])

#callout(type: "failure", title: [Failure], [The operation failed.])

#callout(type: "missing", title: [Missing], [Required content is missing.])

#callout(type: "danger", title: [Danger], [This action is risky!])

#callout(type: "error", title: [Error], [An error occurred.])

#callout(type: "bug", title: [Bug], [A bug was found.])

#callout(type: "example", title: [Example], [This is an example.])

#callout(type: "quote", title: [Quote], [Quoted from someone.])

#callout(type: "cite", title: [Citation], [Cited from a reference.])

