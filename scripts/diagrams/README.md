# Documentation diagram generators

Run diagram generators from the repository root. Each script writes its corresponding SVG into `docs/assets/images` so the source used to construct the diagram is reviewed and versioned with the rendered asset.

```bash
python scripts/diagrams/generate_acceleration_end_domain.py
python scripts/diagrams/generate_controller_mental_model.py
python scripts/diagrams/generate_cross_track_response.py
python scripts/diagrams/generate_handoff_comparison.py
python scripts/diagrams/generate_path_element_layers.py
python scripts/diagrams/generate_rotation_profile_response.py
python scripts/diagrams/generate_translation_p_response.py
```

After regenerating a diagram, inspect it on the rendered documentation page at desktop and narrow widths. Check every label, leader, arrowhead, and diagram boundary for overlap or clipping before committing it.
