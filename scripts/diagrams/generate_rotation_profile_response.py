#!/usr/bin/env python3
"""Generate the profiled rotation response comparison used by the tuning guide."""

from pathlib import Path
from textwrap import dedent


REPO_ROOT = Path(__file__).resolve().parents[2]
OUTPUT = REPO_ROOT / "docs/assets/images/tuning/rotation-profile-response.svg"


SVG = dedent(
    """\
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 520" role="img" aria-labelledby="title desc">
      <title id="title">Profiled rotation tuning response examples</title>
      <desc id="desc">Three plots compare robot heading with a heading target that progresses from zero to ninety degrees: sustained lag, useful tracking, and overshoot.</desc>
      <rect width="1200" height="520" rx="18" fill="#f8fafc"/>
      <text x="60" y="48" fill="#0f172a" font-family="system-ui, sans-serif" font-size="26" font-weight="700">Profiled rotation: follow a moving heading target</text>
      <text x="1140" y="46" text-anchor="end" fill="#475569" font-family="system-ui, sans-serif" font-size="15">Illustrative — BLine geometric profile</text>
      <g font-family="system-ui, sans-serif">
        <g transform="translate(55 80)">
          <rect width="340" height="350" rx="12" fill="#ffffff" stroke="#cbd5e1"/>
          <text x="170" y="34" text-anchor="middle" fill="#0f172a" font-size="20" font-weight="700">Sustained lag</text>
          <line x1="52" y1="62" x2="52" y2="295" stroke="#64748b" stroke-width="2"/><line x1="52" y1="295" x2="315" y2="295" stroke="#64748b" stroke-width="2"/>
          <path d="M52 282 C100 278 155 235 210 155 C245 105 280 86 315 82" fill="none" stroke="#0f172a" stroke-width="4" stroke-dasharray="9 7"/>
          <path d="M52 284 C115 283 168 264 218 216 C260 177 288 144 315 130" fill="none" stroke="#2563eb" stroke-width="6"/>
          <text x="155" y="145" fill="#b91c1c" font-size="15">actual heading stays behind</text>
          <text x="182" y="324" text-anchor="middle" fill="#475569" font-size="14">path progress</text><text transform="translate(19 183) rotate(-90)" text-anchor="middle" fill="#475569" font-size="14">heading (deg)</text>
        </g>
        <g transform="translate(430 80)">
          <rect width="340" height="350" rx="12" fill="#ffffff" stroke="#cbd5e1"/>
          <text x="170" y="34" text-anchor="middle" fill="#0f172a" font-size="20" font-weight="700">Useful tracking</text>
          <line x1="52" y1="62" x2="52" y2="295" stroke="#64748b" stroke-width="2"/><line x1="52" y1="295" x2="315" y2="295" stroke="#64748b" stroke-width="2"/>
          <path d="M52 282 C100 278 155 235 210 155 C245 105 280 86 315 82" fill="none" stroke="#0f172a" stroke-width="4" stroke-dasharray="9 7"/>
          <path d="M52 284 C105 281 161 242 215 163 C250 112 283 90 315 84" fill="none" stroke="#2563eb" stroke-width="6"/>
          <text x="168" y="145" fill="#15803d" font-size="15">small, controlled error</text>
          <text x="182" y="324" text-anchor="middle" fill="#475569" font-size="14">path progress</text><text transform="translate(19 183) rotate(-90)" text-anchor="middle" fill="#475569" font-size="14">heading (deg)</text>
        </g>
        <g transform="translate(805 80)">
          <rect width="340" height="350" rx="12" fill="#ffffff" stroke="#cbd5e1"/>
          <text x="170" y="34" text-anchor="middle" fill="#0f172a" font-size="20" font-weight="700">Overshoot / chatter</text>
          <line x1="52" y1="62" x2="52" y2="295" stroke="#64748b" stroke-width="2"/><line x1="52" y1="295" x2="315" y2="295" stroke="#64748b" stroke-width="2"/>
          <path d="M52 282 C100 278 155 235 210 155 C245 105 280 86 315 82" fill="none" stroke="#0f172a" stroke-width="4" stroke-dasharray="9 7"/>
          <path d="M52 284 C103 281 150 230 195 142 C230 75 252 61 268 91 C282 122 293 65 315 84" fill="none" stroke="#2563eb" stroke-width="6"/>
          <text x="165" y="265" fill="#b91c1c" font-size="15">actual heading crosses target</text>
          <text x="182" y="324" text-anchor="middle" fill="#475569" font-size="14">path progress</text><text transform="translate(19 183) rotate(-90)" text-anchor="middle" fill="#475569" font-size="14">heading (deg)</text>
        </g>
      </g>
      <g transform="translate(60 466)" font-family="system-ui, sans-serif" font-size="15"><line x1="0" y1="0" x2="42" y2="0" stroke="#0f172a" stroke-width="4" stroke-dasharray="9 7"/><text x="54" y="5" fill="#334155">profiled target heading</text><line x1="260" y1="0" x2="302" y2="0" stroke="#2563eb" stroke-width="6"/><text x="314" y="5" fill="#334155">measured robot heading</text></g>
    </svg>
    """
)


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(SVG, encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
