#!/usr/bin/env python3
"""Generate the acceleration-limit endpoint diagram used by the tuning guide."""

from pathlib import Path
from textwrap import dedent


REPO_ROOT = Path(__file__).resolve().parents[2]
OUTPUT = REPO_ROOT / "docs/assets/images/tuning/acceleration-end-domain.svg"


SVG = dedent(
    """\
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" role="img" aria-labelledby="title desc">
      <title id="title">Acceleration limit effect near a path endpoint</title>
      <desc id="desc">A desired speed curve falls toward zero. A high acceleration limit follows it closely while a low acceleration limit lags through the endpoint and delays correction.</desc>
      <rect width="1200" height="560" rx="18" fill="#f8fafc"/>
      <text x="62" y="52" fill="#0f172a" font-family="system-ui, sans-serif" font-size="28" font-weight="700">Low acceleration can hurt the endpoint</text>
      <text x="1138" y="48" text-anchor="end" fill="#475569" font-family="system-ui, sans-serif" font-size="15">Illustrative command response — not robot data</text>

      <g transform="translate(92 90)" font-family="system-ui, sans-serif">
        <rect width="1016" height="380" rx="14" fill="#ffffff" stroke="#cbd5e1"/>
        <line x1="78" y1="55" x2="78" y2="320" stroke="#64748b" stroke-width="2"/>
        <line x1="78" y1="235" x2="950" y2="235" stroke="#64748b" stroke-width="2"/>
        <text x="50" y="70" text-anchor="end" fill="#475569" font-size="14">forward</text>
        <text x="50" y="240" text-anchor="end" fill="#475569" font-size="14">zero</text>
        <text x="50" y="309" text-anchor="end" fill="#475569" font-size="14">reverse</text>
        <text x="510" y="356" text-anchor="middle" fill="#475569" font-size="15">time approaching and correcting around the endpoint</text>
        <text transform="translate(22 190) rotate(-90)" text-anchor="middle" fill="#475569" font-size="15">commanded translation speed</text>

        <rect x="585" y="56" width="185" height="263" fill="#fef3c7" opacity="0.65"/>
        <text x="678" y="82" text-anchor="middle" fill="#92400e" font-size="15" font-weight="700">endpoint-control region</text>

        <path d="M80 90 L420 90 C505 90 545 128 585 174 C620 215 655 235 700 235 C735 235 760 255 790 272 C825 292 865 278 950 242" fill="none" stroke="#0f172a" stroke-width="4" stroke-dasharray="10 8"/>
        <path d="M80 92 L420 92 C505 94 550 136 590 178 C625 215 658 234 702 235 C740 237 767 258 795 270 C835 284 875 270 950 243" fill="none" stroke="#16a34a" stroke-width="7" stroke-linecap="round"/>
        <path d="M80 92 L480 92 C570 94 650 120 720 168 C780 208 832 244 900 260 C925 264 942 260 950 254" fill="none" stroke="#dc2626" stroke-width="7" stroke-linecap="round"/>

        <text x="630" y="40" fill="#b91c1c" font-size="16" font-weight="700">low limit: command cannot change quickly enough</text>
        <line x1="817" y1="309" x2="830" y2="279" stroke="#16a34a" stroke-width="2"/>
        <text x="650" y="330" fill="#15803d" font-size="16" font-weight="700">higher limit: PID correction remains responsive</text>
      </g>

      <g transform="translate(90 510)" font-family="system-ui, sans-serif" font-size="15">
        <line x1="0" y1="0" x2="44" y2="0" stroke="#0f172a" stroke-width="4" stroke-dasharray="10 8"/><text x="56" y="5" fill="#334155">PID request</text>
        <line x1="180" y1="0" x2="224" y2="0" stroke="#16a34a" stroke-width="7"/><text x="236" y="5" fill="#334155">higher acceleration limit</text>
        <line x1="465" y1="0" x2="509" y2="0" stroke="#dc2626" stroke-width="7"/><text x="521" y="5" fill="#334155">lower acceleration limit</text>
      </g>
    </svg>
    """
)


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(SVG, encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
