# CLAUDE.md — The Coin Ledger

A moneymaking wiki for the Evolved PWI private server. Read this before editing so changes match the existing design, layout, and code style.

## Project shape

- **`Last.html` is the whole site.** It's one hand-edited file: `<head>` meta/SEO, a single `<style>` block, static HTML for each "page", one main `<script>` holding data and logic, and a small separate **watchdog** `<script>` at the end. Don't use a framework or bundler, and don't split it into more files.
- **`prerender.js`** (Playwright) opens `Last.html`, waits for `window.__ledgerInitialized === true`, and saves the rendered DOM to `dist/index.html`. The page's scripts still run on top of that output.
- **`.github/workflows/deploy.yml`**: every push to `main` runs `npm run prerender` and deploys `dist/` to GitHub Pages.
- **External services:** Google Fonts, Formspree (contact form, `FORMSPREE_ENDPOINT`), and Firebase Realtime DB (optional Dailies sync, `FIREBASE_DB_URL`). There are no other dependencies. Don't add JS libraries or CDNs.

### Verifying an edit
1. Run the prerender, which fails loudly if init breaks: `npm install && npm run prerender`. In the cloud env, use the preinstalled Chromium and don't run `playwright install`.
2. Open the page and check the console (F12). `validateCategories()` logs data warnings there.
3. Check it at both **phone width (<700px)** and **desktop (≥880px)**, because the layout changes a lot between them (see Layout).

---

## Design system

### Mood
Dark, calm, and "ledger-like": warm gold accents on deep blue-black, a serif for display text, and monospace for anything data-like or UI-chrome. It's quiet by default, and gold marks interaction or importance. There are no light theme, no shadows except on floating panels, and no bright colors outside the palette.

### Color tokens (`:root`), always use the variables
| Token | Value | Use |
|---|---|---|
| `--bg` | `#14161F` | Page background |
| `--bg-alt` | `#1A1D29` | Card rows, inputs inside panels, task rows, empty states |
| `--panel` | `#1F2330` | Panels, modal, dropdowns, search input, row hover |
| `--panel-hover` | `#262B3B` | Hover inside a panel list |
| `--rule` | `#333850` | Standard 1px borders |
| `--rule-soft` | `#262A38` | Row dividers, subtle separators |
| `--gold` | `#C89B4A` | Accent borders, active fill, focus outlines, ◈ ornaments |
| `--gold-bright` | `#E3BD73` | Hover text, titles, key values |
| `--jade` | `#4E9B86` | Success status only (plus the faint background glow) |
| `--bronze` | `#B5722E` | Error / destructive hover (delete, remove, disconnect) |
| `--text` | `#ECE8DD` | Primary text |
| `--text-dim` | `#9498A8` | Secondary text, default button text |
| `--text-faint` | `#656B80` | Labels, meta, placeholders, icons at rest |

Recurring literals (reuse these, don't invent new ones):
- `#14161F` as **text on a gold fill** (active chip, pinned button, hovered primary button).
- Gold tints: `rgba(200,155,74,0.1–0.12)` for a soft "selected" background, `0.22` for its hover, and `0.4` for a tinted border.
- Page glow: two radial gradients, gold at `rgba(200,155,74,0.07)` top-left and jade at `rgba(78,155,134,0.05)` top-right. Full-screen pages (landing, rates, notes, dailies) use `0.09` / `0.07`.
- Floating panel shadow: `0 8px 24px rgba(0,0,0,0.35)`.
- Modal backdrop: `rgba(10,11,16,0.7)` + `backdrop-filter: blur(3px)`. Sticky topbar: `rgba(20,22,31,0.92)` + `blur(10px)`.

### Typography (three families, strict roles)
- **Fraunces** (serif, 600) for display only: brand mark (22px), landing title (38px), page titles (34px), category `h2` (19px), modal title (19px, gold-bright), and the "no results" message.
- **Inter** (400/500/600) for body text, entry names (14px/500), notes, descriptions, and text inputs.
- **IBM Plex Mono** (400/500) for all UI chrome and data: buttons, chips, labels, counts, levels, rewards, frequencies, drop %, rates, status lines, and domains.
- **Small caps-style labels** use Plex Mono at 10.5px, `text-transform: uppercase`, `letter-spacing: 0.06em`, and `--text-faint`. Examples are modal field labels, panel titles, the desktop table head, and note stat labels. Page subtitles ("EVOLVED PWI") are 12px mono with `0.08em` tracking.
- Sizes are small and precise, with half-pixel values common (9.5, 10.5, 11.5, 12.5, 13.5). Data cells are 12.5px (12px under 700px). Line-height is 1.4–1.6 for prose.

### Shape & spacing
- **Radii:** `999px` pills for every button and chip, `8px` for inputs, cards, dropdowns, and the empty state, `10px` for large panels (modal, note items, rates list, sync box, profile form), and `6px` for small inner boxes (task rows, daily checkbox, links in the modal).
- **Borders** are always 1px, using `--rule` normally or `--rule-soft` for dividers. Use dashed borders only for empty states and the "+N more" chip.
- **Motion:** `0.12s–0.15s ease` for color/border/background, and `0.3s cubic-bezier(0.4, 0, 0.2, 1)` for expand/collapse (note accordions animate `grid-template-rows: 0fr → 1fr`).
- **Focus:** `outline: 2px solid var(--gold)` with a 1–3px offset on `:focus-visible`. Inputs drop the outline and switch `border-color` to `--gold`.

### Ornament & icons
- **◈** is the brand glyph. It appears before the brand mark (`::before`), as the landing mark, and centered on the gold-tapered rule between category blocks. Reuse it; don't add new decorative glyphs.
- Icons are **inline Material Design SVG paths**, `fill="currentColor"`, `aria-hidden="true"`, so they take the text color. Topbar button icons are 12px (11px mobile) and `--text-faint` at rest, turning gold on hover. Shared icon strings live in constants (`PIN_ICON_SVG`, `FLAME_ICON_SVG`).
- Text glyphs used as controls: `✕` (close/remove), `▲ ▼` (reorder), `✓` (checked), `↗` (external link), `→` / `←` (enter/back).

### Component patterns (copy the closest existing one)
- **Secondary / ghost pill** (`.chip`, topbar buttons, `.notes-page-back`, `.dailies-reset-btn`): transparent, `--rule` border, `--text-dim`. Hover → gold border and gold-bright text.
- **Primary pill** (`.landing-enter`, `.rates-page-back`, `.contact-form-submit`, sync buttons, `.profile-form-save-btn`): transparent, `--gold` border, gold-bright text. Hover → gold fill with `#14161F` text.
- **Active / selected:** `.chip.active` and `.pin-btn.pinned` get a solid gold fill with dark text. Softer selected states (`.modal-pin-btn.pinned`, `.dailies-streak.complete`, copy-checklist pill) use a gold border, a 0.12 gold tint, and gold-bright text.
- **Tertiary text action** (cancel, delete, disconnect, "how this works"): no border, mono 11.5px, underlined, `--text-faint`. Destructive ones hover to `--bronze`.
- **Floating panel / dropdown** (`.ref-panel`, `.copy-checklist-panel`, `.dailies-add-results`): `--panel` background, `--rule` border, 8px radius, the shadow above, and toggled by an `.open` class.
- **Panel card** (`.note-item`, `.rates-page-list`, `.dailies-sync`, `.profile-form`): `--panel` background, `--rule` border, 10px radius, 14–18px padding.
- **Label + value field:** a small-caps mono label above a 13.5–14px Inter value (`.modal-field`, `.note-stat`).
- **Reward chips:** tiny mono pills. `.reward-chip-gold` (gold border, tint, bold) is only for currency (Event Gold / Cubi Gold), and `.reward-chip-more` is dashed and italic with the overflow in `title`.
- **Status text:** mono 11–12px `--text-faint`, with `.success` → `--jade` and `.error` / `.sync-status-error` → `--bronze`.
- Visibility is toggled with `.hidden` (pages) or `.open` / `.expanded` (panels). Prefer class toggles over inline `style.display`, except where existing code already uses it.

---

## Layout

### Page model
Everything is in `Last.html`, and "navigation" swaps which top-level container is visible:
1. `#landing` is a fixed full-screen gate (◈, title, "EVOLVED PWI", tagline, live stats, "Enter the Ledger →").
2. `#appShell` holds the sticky `.topbar` and `<main>`, which is the wiki itself. Clicking the brand mark returns to the landing.
3. `#ratesPage`, `#notesPage`, `#dailiesPage` are full pages. `show*Page()` hides `#appShell` and unhides the page, and "← Back to the Ledger" reverses it.
4. `#modalBackdrop` / `#modalPanel` show entry details (max 440px, 80vh scroll).

New full pages should follow the **Rates/Notes/Dailies pattern**: a centered column (`max-width` 420–640px) with an SVG mark (30px, gold), a Fraunces title, a mono "EVOLVED PWI" subtitle, content, and then a back pill. The Dailies page deliberately reuses `.notes-page*` classes for this chrome, so do the same.

### Topbar
Content is capped at `max-width: 1200px` (same as `main`, 20px side padding). It contains the brand mark, a pill row of actions (Rates, References, Notes, Dailies with a count badge) absolutely positioned top-right, a full-width search, and a "Sort:" chip row. The category filter chips sit at the top of `<main>`, not in the topbar.

### Entries: two layouts, three breakpoints
- **< 880px (card grid):** `.entry-table` is `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`. Each `.row` is a bordered `--bg-alt` card and each field shows an inline label via `::before` ("Level  ", "Reward  ", …). The `.pin-btn` moves to the card's top-right corner.
- **≥ 880px (aligned table):** `.row` becomes a grid with **one shared** `grid-template-columns` (5 columns: name, level/location, reward/boss, freq/drop, notes/title) so every row lines up without a `<table>`. `.row.head` becomes visible, the `::before` labels are turned off, and rows are divided by a hairline instead of boxed. If you add or remove a column, update the head row, `renderRow`, the grid template, **and** the `::before` label list.
- **< 700px (mobile tweaks):** topbar actions drop into normal flow under the brand as a single non-wrapping, horizontally scrollable row with smaller buttons. Category chips tighten, data text drops to 12px, and note stats collapse to one column.

Category blocks are separated by a gold gradient rule with a centered ◈ (`.category-block + .category-block`). Each category has a serif `h2` and a mono "N methods" count.

---

## Data model (inside the main `<script>`, "DATA" section)

- Each category is its own self-contained `const X_ENTRIES = [ ... ];` closed with a `// ---- end X_ENTRIES ----` comment, then registered in `CATEGORIES` (`{ key, name, entries }`). `CATEGORIES` order is page order. `CATEGORY_CHIP_ORDER` separately controls filter-chip order.
- Entry fields: `name`, `level`, `reward`, `freq` (required); `stages` (`"E"|"M"|"L"`, currently unused); `egValue` (number or `null`; set it explicitly, never parse it from `reward`); `notes`; optional `abbr` (shown only in Dungeons/Instances), `link` / `link2`, `tasks` (`{task, kills, rewards[]}`), `breakdown` (`{task, title, rewards[]}`), and short display overrides `rewardShort`, `notesShort`, `locationShort` (the modal always shows the full text).
- **Mold Farming is special:** `notes` is `"<Location> · <Title>"` (split on `" · "`), and `freq` holds the drop %. The columns and labels change to Location / Boss/Mob / Drop Chance / Title. Keep the weapon-specific "Legendary <X>" titles as-is.
- An entry that belongs in two categories is defined **once** as a shared `const X_ENTRY` and referenced from both arrays. Don't copy-paste it.
- Task reward strings use the `"15x Item Name"` format so `aggregateTaskRewards()` can sum them.
- Other editable data blocks: `REFERENCES` (one per source domain), `NOTES` (`{title, body}` or `{title, stats[], defaultOpen}`), and `EXCHANGE_RATES` (update `lastUpdated`, and use `"—"` rather than guessing).
- **Pins are keyed by `name + "||" + categoryKey`** in localStorage. Renaming an entry or category key silently orphans users' pinned Dailies, so avoid renames or note the impact.

## Code conventions

- Vanilla ES6+, and HTML is built with template strings assigned to `innerHTML`. Pass user or data text going into attributes through `escapeAttr()` / `escapeHtml()`.
- Section banners use `// ====...` with an ALL-CAPS title, and subsections use `// ---- NAME ----`. Comments are generous and explain **why** (including reverted approaches). Keep that density when you touch nearby code.
- CSS stays in the single `<style>` block, grouped by feature under `/* ---- NAME ---- */` banners, with each media query next to the feature it modifies. Class names are kebab-case and feature-prefixed (`dailies-*`, `note-item-*`, `modal-*`).
- Every `localStorage` access is wrapped in `try/catch`. Storage keys are prefixed `coinLedger*`.
- Init runs inside one `try` block that ends by setting `window.__ledgerInitialized = true`. `showFatalError()` and the separate watchdog script show on-screen errors. Keep the watchdog tiny and independent, and keep new init steps inside the `try` before the flag is set, or prerender will time out.
- Dailies reset at **18:00 America/New_York** (`currentResetBucket`). The Dailies page copy says "20:00 server time" for this same reset. Keep the code and the copy in sync if either changes.

## Content voice

Plain, factual, player-to-player. Use game abbreviations as the community does (EG, Cubi Gold, R9, FWS). Cite sources via `link` and `REFERENCES`. Flag uncertain data with a `// FLAGGED:` comment instead of guessing. Use en dashes for ranges (`1–10`) and `·` as the inline separator.
