# Frontend Brand UI Guidelines Implementation

## Goal

Bring the frontend UI into alignment with `frontend/DESIGN.md` through global tokens, shared UI primitives, and focused route/component migrations.

## Scope

- Update global fonts to `IBM Plex Sans Arabic` and `Poppins`.
- Expand global CSS variables and Tailwind theme tokens for brand colors, status colors, spacing, radius, shadows, focus rings, and dark surfaces.
- Add shared UI primitives for buttons, inputs, cards, badges, chips, icon buttons, empty states, and loading states.
- Migrate core app shell, auth screens, marketing pages, dashboard navigation, orders, customers, storefront, and tracking pages away from off-brand ad-hoc styling.
- Reuse shared components where practical and keep changes minimal where a full rewrite would be risky.
- Run lint/type-check after changes.

## Notes

- Avoid package changes.
- Keep existing behavior and data flows intact.
- Prefer tokenized Tailwind classes and shared primitives over one-off styles.
