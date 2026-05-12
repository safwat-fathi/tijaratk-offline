# Tijaratk Brand and UI Design Guidelines

> Arabic-first brand and UI design system for Tijaratk.

---

# 1. Brand Personality

Tijaratk should feel:

- Simple
- Trustworthy
- Modern
- Organized
- Friendly
- Arabic-first
- Mobile-first

The visual identity should communicate:

```text
تجارتك أسهل. تجارتك أونلاين.
```

---

# 2. Logo Philosophy

The Tijaratk logo is built around:

- Modern Arabic geometric styling
- Thick rounded strokes
- High readability
- Minimal abstraction
- Scalable mobile-first design

The symbol should suggest connected commerce, organized ordering, and local merchant simplicity.

---

# 3. Logo Clear Space

Minimum clear space around the logo:

```text
1x = height of accent square
```

No text or UI elements should enter this area.

---

# 4. Brand Consistency Rules

Always maintain:

- Same green palette
- Rounded geometry
- Thick icon strokes
- Arabic-first hierarchy
- Minimal composition

Never:

- Stretch the logo
- Add outlines
- Add random gradients
- Rotate the symbol
- Use unapproved colors

---

# 5. Official Slogan

```text
تجارتك أسهل. تجارتك أونلاين.
```

---

# 6. Color Palette

## Primary Dark Green

Used for primary branding, main buttons, headers, app icons, and brand surfaces.

```css
#0F5A3D
rgb(15, 90, 61)
```

## Accent Green

Used for active states, highlights, accent elements, CTAs, and success indicators.

```css
#27AE60
rgb(39, 174, 96)
```

## Soft Mint

Used for background sections, light cards, hover surfaces, and subtle dashboard areas.

```css
#E8F5ED
rgb(232, 245, 237)
```

## Off White

Used for main app backgrounds, cards, modals, and clean surfaces.

```css
#F7F8F6
rgb(247, 248, 246)
```

## Charcoal

Used for main text, body copy, dashboard typography, and secondary UI elements.

```css
#222B2E
rgb(34, 43, 46)
```

---

# 7. Status Colors

```css
New order: #2D9CDB
Confirmed: #27AE60
Out for delivery: #F2C94C
Completed: #219653
Cancelled: #EB5757
Error: #EB5757
Warning: #F2C94C
Success: #27AE60
Info: #2D9CDB
```

---

# 8. Typography System

## Arabic Typeface

Primary Arabic font: `IBM Plex Sans Arabic`

Used for headings, UI labels, navigation, dashboard typography, and marketing content.

## English Typeface

Primary English font: `Poppins`

Used for English headings, numbers, tables, Latin UI text, and marketing assets.

---

# 9. Typography Scale

```css
H1: 48px / 700 / 120%
H2: 36px / 700 / 120%
H3: 28px / 600 / 130%
Large body: 18px / 400 / 160%
Regular body: 16px / 400 / 160%
Small body: 14px / 400 / 150%
```

Arabic text should keep generous line height and avoid compressed layouts.

```css
line-height: 160%;
```

---

# 10. Arabic UI Writing Style

Arabic UI copy should be short, friendly, clear, operational, and conversational.

Good examples:

```text
تم تأكيد الطلب
أضف منتج جديد
تم إرسال الطلب
```

Avoid overly formal or technical copy:

```text
تمت عملية معالجة الطلب بنجاح
```

---

# 11. Iconography System

Icons should be rounded, minimal, high contrast, geometric, and easy to recognize at small sizes.

```css
stroke-width: 2.5px;
stroke-linecap: round;
stroke-linejoin: round;
```

Avoid thin outlines, complex detail, sharp corners, decorative packs, 3D effects, and excessive details.

---

# 12. App Icon Guidelines

## Dark Version

```css
background: #0F5A3D;
logo: #FFFFFF;
accent: #27AE60;
```

Used for mobile apps, PWA icons, desktop shortcuts, and social avatars.

## Light Version

```css
background: #F7F8F6;
logo: #0F5A3D;
```

Used for dashboard surfaces, documentation, and internal tools.

## Green Version

```css
background: #27AE60;
logo: #FFFFFF;
```

Used for marketing, stickers, QR cards, and merchant materials.

---

# 13. Favicon Guidelines

Minimum size:

```text
16x16
```

Preferred sizes:

```text
32x32
64x64
128x128
256x256
512x512
```

Use the symbol only, no text, high contrast, and preserved internal spacing.

---

# 14. Spacing System

Tijaratk uses an 8px spacing grid.

```css
4px
8px
12px
16px
24px
32px
48px
64px
96px
```

---

# 15. Layout Density Rules

Prioritize breathing room, visual clarity, large spacing, and obvious sections.

```css
Minimum card padding: 20px;
Section spacing: 32px;
```

---

# 16. Grid System

```css
Mobile: 4 columns / 16px gutters / 16px outer padding
Tablet: 8 columns / 24px gutters / 24px outer padding
Desktop: 12 columns / 32px gutters / 32px outer padding
```

---

# 17. Breakpoints

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

# 18. Radius System

```css
XS: 4px;
SM: 8px;
MD: 12px;
LG: 20px;
XL: 24px;
```

Usage:

- `4px`: tiny badges and small indicators
- `8px`: chips, tags, and compact inputs
- `12px`: buttons, inputs, dropdowns, and pills
- `20px`: cards, modals, and product containers
- `24px`: app icons, onboarding panels, and hero containers

---

# 19. Shadow System

```css
Soft card shadow: 0 4px 20px rgba(0,0,0,0.06);
Floating surface shadow: 0 12px 40px rgba(0,0,0,0.12);
```

---

# 20. UI Style Principles

The UI should feel calm, spacious, obvious, fast, and non-technical.

Avoid heavy dashboards, dense tables, complex analytics appearance, and over-designed gradients.

---

# 21. Recommended UI Backgrounds

```css
Primary app background: #F7F8F6;
Section background: #E8F5ED;
Dark branding surface: #0F5A3D;
```

Usage:

- White backgrounds: dashboards, forms, and content-heavy screens
- Soft mint backgrounds: onboarding, highlights, empty states, and sections
- Dark green backgrounds: hero sections, marketing banners, app icons, and splash screens

---

# 22. Accessibility and Readability

- Maintain strong contrast ratios
- Prefer dark text on light surfaces
- Avoid light green text on white backgrounds
- Minimum body text size is `14px`
- Minimum touch target size is `44px`
- Avoid compressed Arabic text
- Use strong contrast and generous spacing

---

# 23. Button System

## Primary Button

Used for main actions, checkout, confirm order, and save actions.

```css
background: #0F5A3D;
color: #FFFFFF;
border-radius: 12px;
padding: 14px 20px;
font-weight: 600;
```

Hover:

```css
background: #0B4A32;
```

## Secondary Button

Used for secondary actions, edit actions, details, and filters.

```css
background: #E8F5ED;
color: #0F5A3D;
border-radius: 12px;
padding: 14px 20px;
font-weight: 600;
```

## Ghost Button

Used for navigation, minor actions, and inline interactions.

```css
background: transparent;
color: #0F5A3D;
```

---

# 24. Input Fields

## Standard Input

```css
background: #FFFFFF;
border: 1px solid #DDE5E1;
border-radius: 12px;
padding: 14px 16px;
font-size: 16px;
```

## Focus State

```css
border-color: #27AE60;
box-shadow: 0 0 0 4px rgba(39,174,96,0.12);
```

## Error State

```css
border-color: #E74C3C;
```

---

# 25. Cards

## Standard Card

Used for orders, products, analytics, and customer cards.

```css
background: #FFFFFF;
border-radius: 20px;
padding: 20px;
box-shadow: 0 4px 20px rgba(0,0,0,0.06);
```

## Product Card

Includes product image, product name, price, and quick add action.

```css
background: #FFFFFF;
border-radius: 20px;
padding: 16px;
gap: 12px;
```

---

# 26. Navigation

## Mobile Navigation

Prefer bottom navigation with 4 to 5 items maximum and large touch targets.

```css
height: 72px;
icon-size: 24px;
```

Active state:

```css
color: #0F5A3D;
font-weight: 600;
```

Inactive state:

```css
color: #7B8A8E;
```

---

# 27. Modals

Modals should feel lightweight, focused, and mobile-native.

Mobile bottom sheet radius:

```css
border-radius: 24px 24px 0 0;
```

Modal padding:

```css
padding: 24px;
```

---

# 28. Status Badges

Order statuses should be color-coded, immediately scannable, and readable from distance.

```css
padding: 8px 12px;
border-radius: 999px;
font-size: 14px;
font-weight: 600;
```

---

# 29. Notifications

Notifications should feel helpful, operational, and quick.

Toast style:

```css
background: #222B2E;
color: #FFFFFF;
border-radius: 14px;
padding: 14px 18px;
```

---

# 30. Empty States

Empty states should feel encouraging, simple, and actionable.

Example:

```text
لسه مفيش طلبات.
شارك لينك الطلبات مع عملائك وابدأ تستقبل طلبات بسهولة.
```

---

# 31. Loading States

Loading states should feel calm, lightweight, and fast.

Preferred loading types:

- Skeleton cards
- Shimmer placeholders
- Subtle progress indicators

Avoid blocking spinners, full-screen loaders, and aggressive animations.

---

# 32. Motion and Animation

Animations should support clarity and feel smooth and lightweight.

Preferred motion types:

- Fade
- Scale
- Subtle slide
- Opacity transitions

Recommended timing:

```css
transition: 200ms ease;
```

Recommended durations:

```css
150ms
200ms
250ms
```

Avoid elastic motion, dramatic zoom, spinning transitions, excessive bounce, and playful motion.

---

# 33. Data Visualization

Analytics UI should feel practical, simple, and merchant-focused.

Recommended charts:

- Bar charts
- Simple line charts
- Daily summaries
- Weekly comparisons

Avoid 3D charts, dense tables, multi-axis charts, and technical metrics.

---

# 34. QR Code and Sticker Design

## QR Sticker

Preferred background:

```css
#FFFFFF
```

QR minimum margin:

```text
24px
```

Logo should appear top center or bottom center and never overlap the QR readability area.

## QR Container

```css
background: #FFFFFF;
padding: 20px;
border-radius: 20px;
```

Logo may appear above or below the QR code. Never place it inside the QR itself unless fully tested.

---

# 35. Splash Screen

Centered content:

- App icon
- Slogan
- Subtle motion

Background:

```css
background: #0F5A3D;
```

Slogan:

```text
تجارتك أسهل. تجارتك أونلاين.
```

---

# 36. Product Photography Direction

Use realistic local commerce photography, Egyptian neighborhood environments, natural lighting, human-centered interactions, and organized product presentation.

Preferred subjects:

- Grocery shelves
- Fruit and vegetable displays
- Merchants using phones
- Packaging orders
- WhatsApp ordering moments
- Delivery preparation
- QR sticker usage

Avoid corporate office imagery, Western startup culture visuals, luxury retail environments, futuristic AI graphics, and unrealistic ecommerce aesthetics.

---

# 37. Brand Photography Filters

Preferred image treatments:

- Soft contrast
- Warm tones
- Natural greens
- Realistic shadows

Avoid over-saturation, HDR effects, neon edits, and cyberpunk styles.

---

# 38. Illustration Style

If illustrations are used, they should follow a flat vector style with rounded shapes, soft shadows, a limited color palette, friendly composition, and minimal complexity.

Recommended themes:

- Orders flowing
- Organized commerce
- Merchant operations
- Product organization
- Delivery coordination

---

# 39. Brand Texture and Patterns

If decorative patterns are used, prefer subtle grids, rounded geometry, and abstract commerce-inspired patterns.

Avoid Arabic ornamentation, heavy Islamic motifs, and complex illustrations.

---

# 40. Dark Mode Guidelines

Dark mode should remain soft, readable, and comfortable.

```css
Dark surface: #10221B;
Dark card: #173028;
Dark text: #F7F8F6;
```

---

# 41. CSS Design Tokens

```css
:root {
  --color-primary: #0F5A3D;
  --color-accent: #27AE60;
  --color-soft: #E8F5ED;
  --color-bg: #F7F8F6;
  --color-text: #222B2E;

  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 24px;

  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 24px;
  --spacing-6: 32px;
  --spacing-7: 48px;
  --spacing-8: 64px;

  --shadow-soft: 0 4px 20px rgba(0,0,0,0.06);
  --shadow-float: 0 12px 40px rgba(0,0,0,0.12);
}
```

---

# 42. Design Checklist

Before publishing any UI or brand asset, verify:

- Correct green palette
- Rounded geometry
- Arabic-first hierarchy
- Minimal composition
- Clear spacing
- Thick icon style
- Strong readability
- Accessible contrast
- Mobile-first usability
