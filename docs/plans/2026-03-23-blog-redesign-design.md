# Blog Redesign — Design Document

## Problem
Blog pages use generic Shadcn Card components with zero animations, flat typography, and no visual effects. The rest of the site is a premium cinematic experience with Framer Motion, clamp typography, grain overlay, handwritten accents, and red (#ff2936) accent color.

## Solution

### Blog Listing Page
- Hero with `.text-section-title` + handwritten accent in cursive
- Category filter chips (style matches projects page filters)
- Featured post block (full-width, cover image + large title)
- Cinematic cards: dark bg, dashed borders, hover animations, handwritten numbers
- Staggered `whileInView` entrance animations with `[0.16, 1, 0.3, 1]` easing

### Blog Article Page
- Hero with cover image + vignette overlay + large title
- Reading progress bar (red, 2px, sticky top)
- Editorial layout: `max-w-3xl`, `text-editorial`, generous spacing
- Styled blockquotes with red left border
- TOC sidebar on desktop (sticky, generated from h2/h3)
- Author block with dashed separator
- Related posts (2-3 cards by same category)
- Share buttons (Telegram, VK, copy link)

### Backend Changes
- `cover_image` (Text, nullable) field on BlogPost model
- `is_featured` (Boolean, default False) field on BlogPost model
- Alembic migration for new fields
- Updated Pydantic schemas and API endpoints

### Design Principles
- Monochrome palette + red (#ff2936) accent only
- Film grain texture active on all pages
- Custom easing: `[0.16, 1, 0.3, 1]`
- Handwritten font (Comic Sans cursive) for decorative elements
- Minimal border-radius (`rounded-none`)
- Editorial-scale typography with `clamp()` sizing
