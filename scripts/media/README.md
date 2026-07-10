# Documentation media generators

The homepage overview is derived from `BLine-Web/assets/readme/bline-web-demo.gif`, the full animation embedded by the maintainer's GitHub profile README.

From the BLine-Docs repository root, run:

```bash
bash scripts/media/generate_homepage_simulation.sh \
  /path/to/BLine-Web/assets/readme/bline-web-demo.gif
```

The script preserves the full sequence, crops the machine-specific status strip, keeps the 960 px documentation width and near-12 fps cadence, optimizes the GIF, and regenerates both reduced-motion/print posters. The homepage's duration-only exception is defined in `DOCS_SPEC.md`; all other visual-media requirements still apply.
