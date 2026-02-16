# Doc Weaver

[English](./README.md) | [中文](./README.zh.md)

## What's Doc Weaver?

Doc Weaver is an Obsidian plugin that exports **Markdown notes and their attachments** into **structured documents**, such as Typst, HMD, and LaTeX (in development).

## Highlights

- **Multiple export formats**: Typst, HMD (Hybrid Markdown), LaTeX (in development), etc.
- **Structured export**: collects embedded assets, bundles them, and rewrites links/paths for the target output.
- **Obsidian embeds supported**: handles embedded notes.
- **Customizable styling**: ships default style configs and supports overrides/extensions.
- **Floating toolbar**: improves the editing and exporting experience (select, preview, export, etc.).
- **Works with other plugins**: integrates with content-enhancement plugins such as AnyBlock and Excalidraw.
- **Batch export**: batch export from the file explorer context menu.

## Supported export formats

- **Typst**: great for typesetting and generating PDF.
- **HMD (Hybrid Markdown)**: Markdown for downstream processing/publishing (often contains lots of HTML), designed for VuePress / VitePress / Reveal.js, etc.
- **LaTeX** (in development)
- **Pandoc** (planned)

## Integrations (content-enhancement plugins)

- **AnyBlock**: exports selected AnyBlock blocks (e.g. columns and callouts).
- **Excalidraw**: automatically exports Excalidraw drawings.

## Feedback & contribution

- Issues and feature requests are welcome.
- PRs are welcome.

## TODO

- [ ] Provide multiple default presets for the same export format
- [ ] Export to LaTeX documents
- [ ] Export to Pandoc documents
- [ ] Export to Quarto documents

## License

GPL-3.0. See `LICENSE`.
