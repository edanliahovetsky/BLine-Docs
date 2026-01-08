# BLine Documentation

[![Built with MkDocs Material](https://img.shields.io/badge/Built%20with-MkDocs%20Material-526CFE?logo=material-for-mkdocs&logoColor=white)](https://squidfunk.github.io/mkdocs-material/)
[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD--3--Clause-blue.svg)](./LICENSE)

> **This repository contains the documentation website for BLine.**  
> Looking for the actual code? See [BLine-Lib](https://github.com/edanliahovetsky/BLine-Lib) and [BLine-GUI](https://github.com/edanliahovetsky/BLine-GUI).

## 📖 Live Documentation

**[View the Documentation →](https://edanliahovetsky.github.io/BLine-Docs/)**

---

## What is BLine?

**BLine** is an open-source path generation and tracking suite designed for **holonomic drivetrains** (swerve, mecanum, etc.) in FRC. Built by students for students, it prioritizes simplicity and performance in time-constrained environments where quick iteration and rapid empirical testing prove advantageous.

### The BLine Suite

| Component | Description | Repository |
|-----------|-------------|------------|
| **BLine-GUI** | Visual path planning interface with real-time simulation | [GitHub](https://github.com/edanliahovetsky/BLine-GUI) |
| **BLine-Lib** | Java library for FRC robots with path-following algorithm | [GitHub](https://github.com/edanliahovetsky/BLine-Lib) |

### Key Advantages

- **97% reduction** in path computation time vs PathPlanner
- **66% reduction** in cross-track error at waypoints
- No precomputation required — paths execute immediately
- **Quick, forgiving and easy** controller tuning — works well even when sub-optimally tuned

📄 [Read the Full White Paper](https://docs.google.com/document/d/1Tc87YKWHtsEMEvmVDBD1Ww4e7vIUO2FyK3lwwuf-ZL4/edit?usp=sharing)

---

## 🛠️ Local Development

### Prerequisites

- Python 3.9+
- pip or pipx

### Setup

```bash
# Clone the repository
git clone https://github.com/edanliahovetsky/BLine-Docs.git
cd BLine-Docs

# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Serve Locally

```bash
mkdocs serve
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

### Build Static Site

```bash
mkdocs build
```

The static site will be generated in the `site/` directory.

---

## 📁 Project Structure

```
BLine-Docs/
├── docs/                    # Documentation source files
│   ├── index.md             # Homepage
│   ├── getting-started/     # Installation & quick start guides
│   ├── concepts/            # Core concepts (elements, constraints, etc.)
│   ├── gui/                 # GUI documentation
│   ├── lib/                 # Library documentation
│   ├── assets/              # Images and GIFs
│   │   └── gifs/            # Demo GIFs organized by section
│   ├── stylesheets/         # Custom CSS
│   └── javascripts/         # Custom JavaScript
├── overrides/               # MkDocs theme overrides
├── mkdocs.yml               # MkDocs configuration
├── requirements.txt         # Python dependencies
└── site/                    # Generated static site (gitignored in production)
```

---

## 🤝 Contributing

Contributions to improve the documentation are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b improve-docs`)
3. Make your changes
4. Test locally with `mkdocs serve`
5. Submit a pull request

### Documentation Guidelines

- Use clear, concise language
- Include code examples where helpful
- Add GIFs for visual features (place in `docs/assets/gifs/`)
- Follow the existing structure and formatting

---

## 🔗 Related Resources

- **[BLine-Lib on GitHub](https://github.com/edanliahovetsky/BLine-Lib)** — Java library source code
- **[BLine-GUI on GitHub](https://github.com/edanliahovetsky/BLine-GUI)** — GUI application source code
- **[Full Javadoc](https://edanliahovetsky.github.io/BLine-Lib/)** — API reference
- **[Chief Delphi Discussion](https://www.chiefdelphi.com/t/introducing-bline-a-new-rapid-polyline-autonomous-path-planning-suite/509778)** — Community discussion thread

---

## 📜 License

BLine is released under the **BSD 3-Clause License**.
