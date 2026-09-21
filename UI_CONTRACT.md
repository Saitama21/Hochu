# UI Contract — Bottom Dock

This is a release contract for mobile bottom navigation.

- Dock/navigation is fixed to the browser/app viewport, independent from Safari toolbar geometry.
- Use `position: fixed`, `left: 50%`, `transform: translateX(-50%)`, and `bottom: var(--dock-bottom)`.
- Never use `env(safe-area-inset-bottom)` to position the dock.
- Safe area is allowed only for content reserve/padding outside the dock.
- Never calculate dock bottom from `visualViewport`, `innerHeight`, `outerHeight`, Safari controls, or app-shell height.
- Phone profile 390–430 px: `--dock-bottom:2px`, `--dock-width:87%`, `--dock-height:68px`.
- Reference behavior: `Beta-test-`.
- CI must pass before release.
