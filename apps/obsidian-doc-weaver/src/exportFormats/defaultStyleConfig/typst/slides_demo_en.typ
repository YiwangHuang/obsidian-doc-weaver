#import "slides_config.typ": *

#show: DW_slides.with(
  title: [Doc Weaver Slides Demo],
  subtitle: [Typst × Touying],
  author: [Author],
  date: datetime.today(),
  institution: [Doc Weaver],
)

= Outline <touying:hidden>

#outline(title: none, indent: 1em, depth: 2)

= Introduction

== About this template

This file is a demo of the *Typst slides* preset for the Obsidian plugin *Doc Weaver*.

The plugin exports Markdown notes to Typst source and uses the *Touying* framework to produce slide PDFs.

To change theme or styles, edit `slides_config.typ`.

== Dependencies

=== Touying

#link("https://touying-typ.github.io/")[Touying] is a Typst package for slides: page breaks, animations, themes, and more.

This template uses the #link("https://touying-typ.github.io/zh/docs/themes/metropolis/")[Metropolis theme], clean and suitable for everyday use.

=== DW\_styles.typ

`DW_styles.typ` is Doc Weaver’s local style file. It defines shared style functions (e.g. callout, DW_underline) used by both the slides and article templates.

=== Other packages

- `mitex`: LaTeX math
- `tablem`: Markdown-style tables
- `numbly`: heading numbering

= Basic usage

== Page breaks

In Touying, `=` creates a section title slide and `==` creates a titled content slide.

#pagebreak()

Use `#pagebreak()` to insert a manual page break. This is the content on the new page.

== Animation

Use `#pause` to reveal content step by step:

First: this line appears immediately.

#pause

Second: this appears after one step.

#pause

Third: this appears after another step.
