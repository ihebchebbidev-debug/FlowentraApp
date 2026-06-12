# Website Builder Awwwards Upgrade — Phased Plan

You picked: **all three (templates + builder + components) in one sweep, Awwwards-grade, all 27 templates**. That's genuinely ~5–10K lines of high-craft work, so I'll run it in **5 passes**, shipping value at the end of each. You can react/redirect between passes.

## Design language (locked across all 27 templates)

A shared system so the catalog feels like one studio designed it, with per-vertical voice:

- **Type:** display × body pairings chosen per vertical (Cormorant + Karla for luxury, Bebas + Barlow for sports, Instrument Serif + Work Sans for editorial, JetBrains Mono + Work Sans for tech, etc.)
- **Color:** semantic tokens only, palettes from the curated presets per vertical
- **Composition moves:** asymmetric hero, oversized type, sticky side-labels, sectioned numbered chapters (01/02/03), generous negative space, controlled density variant for ecommerce/dashboard
- **Motion:** fade-in + scale-in on scroll, parallax accents, marquee/ticker for promos, hover-scale on cards
- **Imagery:** real-feeling photography via existing `IMG`/`AVATAR` registries, expanded where needed

## Pass 1 — Foundations (this turn)

1. **Component library upgrades** — 3 new high-impact variants used across many templates:
   - `Hero` → add `asymmetric-split`, `editorial-numbered`, `oversized-type` variants
   - `Testimonials` → add `editorial-quote` (single huge pull-quote) and `logo-wall` variants
   - `Features` → add `numbered-chapters` and `bento-mixed` variants
2. **Builder polish (high-leverage only this pass):**
   - `TemplateGalleryPage` — category filter chips, search, hover preview improvements, "new" badge
   - `SiteEditor` — better empty state, breadcrumb header, refined inspector spacing
3. **Re-expand the two minified templates** (`travelAgency`, `weddingPlanner`) to readable multi-line + apply new design language as the reference implementation.

## Pass 2 — Flagship template upgrades (5 templates)

`premiumEcommerce`, `saasStartup`, `realEstate`, `lawFirm`, `restaurant` — each rebuilt with its locked typography pair, palette, and at least 2 of the new section variants. These set the visual bar.

## Pass 3 — Service & creative verticals (10 templates)

`creativeAgency`, `photography`, `portfolio`, `consulting`, `weddingPlanner`, `beautySalon`, `fashionBoutique`, `travelAgency`, `internationalBusiness`, `fitnessGym`.

## Pass 4 — Local-business & care verticals (10 templates)

`cafeBakery`, `carRepair`, `cleaningService`, `dentalOffice`, `medicalClinic`, `nonprofit`, `paintBodyShop`, `petCare`, `churchMinistry`, `education` + the 3 contact pages.

## Pass 5 — Builder feature polish

- Drag-drop affordance refinements in `SiteEditor`
- Keyboard shortcuts panel (`?` overlay) — many shortcuts already exist in `useKeyboardShortcuts`, just need surfacing
- Refined `PublishDialog` / `ExportOptionsDialog` UX
- Live "device preview" toggle (desktop/tablet/mobile) in editor toolbar
- Polished `SiteCards` (used by `SiteManager`)

## Technical notes

- All visual values go through existing semantic CSS tokens — no hardcoded `text-white`/`bg-black`.
- New block variants are added to existing preset files, not new files, so the renderer auto-picks them up.
- Templates import the same `IMG`/`AVATAR`/`themes` registries — no asset drift.
- Each pass keeps the file shape backward-compatible so existing user sites don't break.

## What I'll ship in this turn (Pass 1)

End of this turn you'll see: 3 component variants live, gallery + editor polish, both stub templates expanded to ~250 lines using the new design language. Then I'll ping you to start Pass 2.

Reply **"go"** to start Pass 1, or tell me to reorder/cut anything.