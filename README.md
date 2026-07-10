# BLine Documentation

[![Built with MkDocs Material](https://img.shields.io/badge/Built%20with-MkDocs%20Material-526CFE?logo=material-for-mkdocs&logoColor=white)](https://squidfunk.github.io/mkdocs-material/)
[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD--3--Clause-blue.svg)](./LICENSE)

Tutorial and reference documentation for [BLine Web](https://github.com/edanliahovetsky/BLine-Web) and [BLine-Lib](https://github.com/edanliahovetsky/BLine-Lib), an FRC geometric path-authoring and following workflow for holonomic drivetrains.

- [Read the live documentation](https://bline-docs.pages.dev/)
- [Open BLine Web](https://bline-web.pages.dev/)
- [Download the latest documentation PDF](https://github.com/edanliahovetsky/BLine-Docs/releases/latest/download/BLine-Docs.pdf)
- [Join the Chief Delphi discussion](https://www.chiefdelphi.com/t/introducing-bline-a-new-rapid-polyline-autonomous-path-planning-suite/509778)

## Documentation approach

The site is organized around a first-path tutorial, controller tuning, current BLine Web workflows, source-grounded BLine-Lib integration, practical recipes, and exact reference material. Current UI media uses the latest supported BLine Web release and latest officially released FRC field.

See [DOCS_SPEC.md](DOCS_SPEC.md) for the maintenance standard, including source verification and GIF size/accessibility requirements.

## Local development

Python 3.9 or newer is required.

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
mkdocs serve
```

Open `http://127.0.0.1:8000`.

Build the static site without PDF export:

```bash
mkdocs build
```

Build the site and PDF:

```bash
ENABLE_PDF_EXPORT=1 mkdocs build
```

`site/` is generated output and must remain untracked. Cloudflare Pages builds it from `main`; the GitHub workflow publishes `site/BLine-Docs.pdf` to the rolling `latest` release.

## Project structure

```text
BLine-Docs/
├── docs/               # Markdown, current screenshots/GIFs, CSS, and JavaScript
├── overrides/          # MkDocs theme overrides
├── DOCS_SPEC.md        # Public documentation quality standard
├── mkdocs.yml          # Site navigation and build configuration
└── requirements.txt    # Python documentation dependencies
```

## Contributing

1. Read [DOCS_SPEC.md](DOCS_SPEC.md).
2. Verify public API, JSON, and runtime behavior against BLine-Lib source.
3. Verify labels and workflows against the current public BLine Web source/build.
4. Update affected visuals in the same change and remove superseded media.
5. Run `mkdocs build` and check changed pages at desktop and narrow widths.

The previous PySide `BLine-GUI` repository is legacy context only; current documentation and media cover BLine Web.

## License

BLine documentation is released under the BSD 3-Clause License.
