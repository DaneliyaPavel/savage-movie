---
name: frontend-quality
description: Ensures frontend code is production-ready with intentional design, tasteful animations, and responsive layouts. Delivers working code, not plans. Avoids generic boilerplate and preserves existing design systems. Use when working with frontend files (ts, tsx, js, jsx, html, css, scss) or when creating UI components, pages, or styling.
---

# Frontend Quality Standards

## Core Principles

**Deliver working code, not plans.** Make reasonable assumptions when not blocked. Complete implementations to a runnable state.

**Avoid "AI slop."** Every design choice should be intentional:

- Typography: Choose fonts that serve the content, not defaults
- Colors: Use meaningful color palettes that enhance UX
- Spacing: Consistent, purposeful rhythm
- No generic boilerplate or placeholder content

**Preserve existing design systems.** Before creating new components:

1. Check for existing UI components in `components/ui/`
2. Use existing design tokens (CSS variables, Tailwind config)
3. Follow established patterns and conventions
4. Only introduce new patterns when necessary

## Design Guidelines

### Typography

- Use existing font families from the design system
- Establish clear hierarchy (headings, body, captions)
- Ensure readable line heights and letter spacing
- Test at different viewport sizes

### Colors

- Use CSS variables (e.g., `var(--primary)`, `var(--accent)`)
- Maintain contrast ratios for accessibility
- Support both light and dark modes
- Avoid hardcoded color values

### Motion & Animations

- Use Framer Motion for animations (project standard)
- Keep animations tasteful and purposeful:
  - Subtle transitions (200-300ms)
  - Ease-in-out timing functions
  - Avoid excessive motion that distracts
- Respect `prefers-reduced-motion` media query

### Responsive Design

- Mobile-first approach
- Test at breakpoints: mobile (320px+), tablet (768px+), desktop (1024px+)
- Use Tailwind responsive utilities (`sm:`, `md:`, `lg:`, `xl:`)
- Ensure touch targets are at least 44x44px on mobile
- Test horizontal scrolling doesn't occur unintentionally

## Implementation Checklist

Before considering code complete:

- [ ] Code runs without errors
- [ ] Uses existing design system components/tokens
- [ ] Responsive on mobile and desktop
- [ ] Animations are subtle and purposeful
- [ ] No hardcoded colors (use CSS variables)
- [ ] Typography follows established hierarchy
- [ ] No placeholder text or generic boilerplate
- [ ] Accessibility: proper semantic HTML, ARIA labels where needed
- [ ] Dark mode support (if applicable)

## Common Patterns

### Using Existing Components

```tsx
// ✅ Good: Use existing Button component
import { Button } from "@/components/ui/button"

<Button variant="default" size="lg">Submit</Button>

// ❌ Avoid: Creating new button styles from scratch
<button className="px-4 py-2 bg-blue-500">Submit</button>
```

### Color Usage

```tsx
// ✅ Good: Use design tokens
<div className="bg-primary text-primary-foreground">
<div className="text-accent">

// ❌ Avoid: Hardcoded colors
<div className="bg-[#ff2936]">
```

### Responsive Layouts

```tsx
// ✅ Good: Mobile-first responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ Avoid: Desktop-only layouts
<div className="grid grid-cols-3 gap-4">
```

### Animations

```tsx
// ✅ Good: Subtle, purposeful animation
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>

// ❌ Avoid: Excessive or distracting motion
<motion.div
  animate={{
    rotate: [0, 360],
    scale: [1, 1.2, 1],
  }}
  transition={{ repeat: Infinity, duration: 2 }}
>
```

## When to Break Rules

Only introduce new patterns when:

- No existing component meets the need
- The new pattern solves a specific UX problem
- The pattern can be reused elsewhere
- It aligns with the overall design language

When introducing new patterns, document them and consider adding to the design system.
