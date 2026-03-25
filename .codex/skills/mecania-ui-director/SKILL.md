---
name: mecania-ui-director
description: Use when designing, reviewing, or refactoring MecaniaOS frontend screens so the product stays visually coherent, dark, modern, and operationally dense with a direction inspired by Taller Alpha without copying branding or proprietary assets.
---

# Mecania UI Director

Use this skill when the task involves UI design, frontend polish, visual refactors, component styling, layout consistency, dashboard improvements, or new screens for MecaniaOS.

## First read

Read [docs/ui-direction-taller-alpha.md](../../../docs/ui-direction-taller-alpha.md) before proposing or implementing UI changes.

## Goal

Keep MecaniaOS aligned to a single visual system:

- dark operational shell
- blue navigation emphasis
- green positive actions and totals
- compact cards and panels
- higher information density than a generic SaaS dashboard

## Workflow

1. Inspect the current screen and identify where it breaks the defined direction.
2. Prefer fixing shared tokens and primitives before patching one-off styles.
3. Preserve product-specific flows; only borrow the visual language, not exact competitor screens.
4. Before editing, identify which of these layers are affected:
   - global theme
   - shell/layout
   - primitives
   - page patterns
   - empty/loading/error states
5. Implement the smallest coherent change that moves the product toward the target system.
6. Verify desktop and mobile behavior.

## Default decisions

- Prefer dark navy surfaces over light cards.
- Prefer visible borders over heavy shadows.
- Prefer compact operational layouts over spacious marketing layouts.
- Prefer one strong primary action per section.
- Prefer semantic color usage; do not invent one-off colors.

## Component guidance

### Shell

- Sidebar should feel like a control rail, not a marketing nav.
- Header should provide context and actions, not a hero block.

### Cards

- Use layered dark surfaces.
- Keep headings short and metadata subdued.

### Forms

- Group dense fields into panels.
- Keep vehicle/client context visible when the flow depends on it.

### Lists and dashboards

- Favor filters, counters, statuses, and quick actions.
- Avoid large empty spaces and weak hierarchy.

## Hard rules

- Do not copy Taller Alpha branding, text, logos, or assets.
- Do not recreate competitor screens 1:1.
- Do not mix light and dark systems on the same protected screen without a deliberate reason.
- Do not add flashy gradients or motion that weaken the operational feel.

## Output expectations

When asked to review UI, report:

- visual inconsistencies
- hierarchy issues
- density/usability problems
- concrete component-level fixes

When asked to implement UI, prioritize:

1. tokens
2. shared primitives
3. layout
4. page-specific polish
