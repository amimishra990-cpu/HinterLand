# HINTERLAND — Design System

**Document status:** Approved visual and interaction language  
**Version:** 1.3 — warm editorial theme and scroll-scene motion record  
**Last updated:** 2026-11-08  
**Companion documents:** [PRODUCT_SPEC.md](./PRODUCT_SPEC.md), [USER_FLOWS.md](./USER_FLOWS.md), [ASSET_CREDITS.md](./ASSET_CREDITS.md)

---

## 1. Brand foundation

**Name:** Hinterland  
**Tagline:** The work behind the work.

Hinterland is the context, preparation, and follow-through behind professional work. The interface should feel like a well-made working document: warm paper, precise typography, firm rules, and quiet confidence.

### 1.1 Brand attributes

| Attribute | What it means visually | What it must never become |
| --- | --- | --- |
| Editorial | Strong typographic hierarchy, generous margins, rules, considered composition | A magazine pastiche with decorative clutter |
| Sophisticated | Restrained color, exact spacing, confident typography | Luxury ornament or corporate stiffness |
| Warm | Ivory and stone surfaces, terracotta and gold accents, human language | Beige nostalgia or low-contrast illegibility |
| Professional | Clear states, predictable controls, visible evidence, no hype | Enterprise grayness or dashboard density |
| Human-centered | The user's words and judgment lead; the system explains itself | Anthropomorphic assistant theatrics |

### 1.2 Product promise translated into interface behavior

- **Context continuity:** every task shows which project and sources it uses.
- **Intent preservation:** the original draft and stated intention remain visible.
- **Proactive assistance:** gaps and risks are surfaced as findings, not buried in prose.
- **Personalized improvement:** suggestions explain themselves and remain editable.
- **Connected workflow:** preparation, refinement, documentation, and knowledge share one visual grammar.
- **Knowledge retention:** approved records look durable, dated, and traceable.

### 1.3 Absolute visual exclusions

Do not use:

- Purple-blue AI gradients.
- Neon cyan.
- Glowing neural networks.
- Random floating AI symbols.
- Excessive glassmorphism.
- Generic AI landing page templates.
- Gradient text.
- Glowing orbs, particles, or "intelligence" animations.
- Robot mascots or anthropomorphic assistant avatars.
- Sparkles as a shorthand for AI.
- Chat-first layouts for tasks that are not conversations.
- Confetti, streak counters, or gamified productivity tropes.
- Dark "cyber" surfaces with luminous accents.
- Decorative 3D blobs, abstract meshes, or isometric tech illustrations.
- Stock imagery of people pointing at floating interfaces.

The permitted 3D exception is the six-stage scroll story defined in Sections 8.2 and 2.6. It must use real desk materials, readable document objects, and a scroll-bound narrative. Decorative 3D blobs, abstract meshes, and isometric tech illustrations remain excluded.

The public site and interactive workspace use a warm editorial palette. The 3D story alone uses a restrained charcoal-and-forest scene so the desk materials read clearly; it is not a separate product theme. Neon, luminous rim light, scanlines, terminal motifs, and full-screen bloom remain prohibited.

If an element would look at home on a generic AI startup page, remove it.

---

## 2. Color

### 2.1a Implemented theme: warm editorial public site

**Status:** shipped. The public website uses the specified brand colors, with a warm paper ground and Charcoal Ink text.

| Role | Token | Hex | Notes |
| --- | --- | --- | --- |
| Page ground | `--color-ivory` | `#F5F2E9` | Main background |
| Primary type | `--color-ink` | `#222C25` | Headings and body text |
| Primary action | `--color-forest` | `#304E3E` | Buttons, links, focus and selected states |
| Secondary accent | `--color-sage` | `#AAB5A1` | Quiet fills and supporting graphics; not small text on ivory |
| Emphasis | `--color-terracotta` | `#C47B5B` | Accents, rules and large indicators |
| Emphasis | `--color-gold` | `#C9AD75` | Fine rules and decorative marks; use a darker text token for small copy |
| Quiet surface | `--color-stone` | `#E5E1D6` | Cards, section backgrounds and dividers |

Rules:

1. **Gold and sage are not body-text colors on ivory.** Use Charcoal Ink or Forest Green for readable copy; reserve Antique Gold and Muted Sage for rules, fills and large decorative marks.
2. **No purple-blue gradient or neon.** Keep surfaces warm and restrained; no luminous AI motifs or dark cyber UI.
3. **The 3D scene is the dark-surface exception.** It uses Charcoal Ink, Forest Green, Warm Ivory labels and Antique Gold details for legible physical materials.
4. **Section tints stay subtle** and must not reduce the readability of copy.

Implementation notes:

- `@theme inline` in `src/app/globals.css` maps the exact palette into reusable Tailwind tokens.
- `body` is transparent; the warm page color and subtle background wash are applied to `html`.
- `.app-theme` preserves the dedicated workspace tokens and layout.

### 2.1b Implemented theme: warm-light workspace

**Status:** shipped at `/app`. The workspace is a deliberately quieter warm-paper surface for long reading and form work, sharing the brand hues, typography, and Lucide icon language with the public site.

The theme is scoped to `.app-theme` in `src/app/app-theme.css`; it does not alter the public dark tokens.

| Role | Token | Hex | Notes |
| --- | --- | --- | --- |
| Workspace ground | `--app-bg` | `#F3EEE2` | Warm paper, fixed radial gold/forest tint |
| Panel | `--app-panel` | `#FFFCF4` | Cards, dialogs, top bar |
| Soft panel | `--app-panel-soft` | `#FAF5E9` | Nested surfaces, excerpts, list rows |
| Strong panel | `--app-panel-strong` | `#F0E8D7` | Chips, icon wells, pressed states |
| Primary type | `--app-ink` | `#222C25` | Charcoal Ink |
| Secondary type | `--app-ink-soft` | `#465247` | Body copy and labels |
| Muted type | `--app-muted` | `#6D776C` | Metadata and hints |
| Hairline | `--app-line` | `#E2DAC8` | Dividers and card borders |
| Strong hairline | `--app-line-strong` | `#C9BEA7` | Inputs and dashed upload areas |
| Primary action | `--app-forest` | `#2F4D3D` | Filled buttons, active nav, focus ring |
| Deep action | `--app-forest-deep` | `#223A2D` | Primary hover |
| Forest wash | `--app-forest-soft` | `#E7EDE4` | Approved/decision surfaces |
| Gold label | `--app-gold` | `#9C7833` | Eyebrows, tabs, rules |
| Gold wash | `--app-gold-soft` | `#F5EAD2` | Demo notice, warnings, badges |
| Terracotta | `--app-terracotta` | `#A35A3C` | Ambiguity warnings, destructive notes |
| Navy | `--app-navy` | `#2F4368` | Decision-log badge |
| Burgundy | `--app-burgundy` | `#7A3A50` | Refinement badge |

Rules:

1. **No glass, glow, or dark-mode leakage.** Workspace surfaces are opaque paper. Blur is used only on the sticky top bar.
2. **Gold is a label color, not a primary action fill.** Primary actions are Forest; gold marks eyebrows, active tabs, and demo notices.
3. **Status is always labelled.** Forest = approved/active/ready; gold = review/attention; terracotta = open/needs a decision.
4. **Form controls are 14px with visible focus.** Inputs use a 3px Forest focus ring at 14% opacity.
5. **Motion is interface-only.** No GSAP, 3D, ambient fields, or scroll-scrubbed entrances inside `/app`. Only 120–220ms hover, drawer, dialog, toast, and skeleton motion is used; all of it is disabled under reduced motion.
6. **Public and workspace share type and icon language.** Newsreader for page and section titles, DM Sans for UI, Lucide at 11–18px. The workspace does not reuse marketing display sizes.

### 2.1 Brand palette (original specification)

The following is the approved light-theme palette and remains the source of the brand hues. Section 2.1a records how it is currently applied on the public site.

| Token | Hex | Name | Primary use |
| --- | --- | --- | --- |
| `--color-ivory` | `#F5F2E9` | Warm Ivory | Page background, text on dark surfaces |
| `--color-ink` | `#222C25` | Charcoal Ink | Primary text, dark surfaces, high-emphasis rules |
| `--color-forest` | `#304E3E` | Forest Green | Primary actions, active navigation, links, headings on light |
| `--color-sage` | `#AAB5A1` | Muted Sage | Decorative fills, dividers, disabled surfaces, iconography on dark |
| `--color-terracotta` | `#C47B5B` | Terracotta | Accent marks, attention borders, active indicators, data highlights |
| `--color-gold` | `#C9AD75` | Antique Gold | Fine rules, editorial numerals, selected-source markers, focus on dark |
| `--color-stone` | `#E5E1D6` | Soft Stone | Raised surfaces, input fills, table headers, quiet blocks |

### 2.2 Contrast and usage rules

Approximate contrast ratios, calculated from the specified hex values:

| Pair | Ratio | Permitted use |
| --- | --- | --- |
| Charcoal Ink on Warm Ivory | ~12.9:1 | Body text, headings, icons |
| Forest Green on Warm Ivory | ~8.2:1 | Body text, links, headings, button text |
| Warm Ivory on Forest Green | ~8.2:1 | Primary button labels, dark surfaces |
| Charcoal Ink on Soft Stone | ~11.1:1 | Text on raised surfaces |
| Charcoal Ink on Terracotta | ~4.35:1 | Large text (18.66px bold or 24px regular and above) and non-text UI only |
| Terracotta on Warm Ivory | ~3.0:1 | Borders, icons, large text, graphical indicators; not small body text |
| Muted Sage on Warm Ivory | ~1.9:1 | Decorative only; never text |
| Antique Gold on Warm Ivory | ~1.9:1 | Decorative rules and marks only; never text |
| Antique Gold on Forest Green | ~4.25:1 | Focus ring on dark surfaces, graphical indicators |

Rules:

1. **Terracotta is an accent, not a body-text color.** On Ivory, use it for icons, rules, large emphasis, and interaction indicators. For error text, use Charcoal Ink with a terracotta icon and border.
2. **Muted Sage and Antique Gold never carry text.** They are material colors, not information colors.
3. **Do not rely on color alone.** Every status includes a label, and where relevant an icon or shape difference.
4. **Primary actions use Forest Green with Warm Ivory text.** Terracotta is not the primary button fill.
5. **Focus indicators use Forest Green on light surfaces and Antique Gold on Forest Green surfaces.** They must remain visible at 2px with a 2px offset.

### 2.3 Derived accessibility tokens

Two derived colors extend the palette for accessible text and non-text contrast:

```css
--accent-ink: #D8B878; /* gold lifted from Antique Gold for small text on deep surfaces */
--border-strong: #4B6154; /* forest-lit edge on deep green surfaces */
```

`--accent-ink` is used for small accent text, numerals, and icons on the dark implementation, where Antique Gold itself would sit too close to the surface. It is not a new brand colour and must not replace Gold for large display emphasis. On the workspace's Warm Ivory surfaces, Charcoal Ink and Forest Green carry text instead.

`--border-strong` is used for input boundaries and other essential UI edges where the subtle green border would not meet non-text contrast. The subtle border remains `#22352C` for non-essential separation.

### 2.4 Semantic tokens

```css
:root {
  /* Brand palette */
  --color-ivory: #F5F2E9;
  --color-ink: #222C25;
  --color-forest: #304E3E;
  --color-sage: #AAB5A1;
  --color-terracotta: #C47B5B;
  --color-gold: #C9AD75;
  --color-stone: #E5E1D6;

  /* Implemented public-site surfaces (royal dark theme) */
  --background: #07130F;
  --foreground: #EFE7D7;
  --card: #0B1A15;
  --popover: #0D1E18;
  --primary: #C9A45C;
  --primary-foreground: #0B1410;
  --secondary: #AAB5A1;
  --secondary-foreground: #07130F;
  --muted: #14241D;
  --muted-foreground: #B9C1B3;
  --accent: #C9A45C;
  --accent-ink: #D8B878;
  --destructive: #C58A74;
  --border: #22352C;
  --input: #3B5044;
  --ring: #C9A45C;

  /* Implemented semantic tokens */
  --surface-page: #07130F;
  --surface-raised: #0C1C16;
  --surface-quiet: #0A1813;
  --surface-inverse: #F5F2E9;
  --text-primary: #EFE7D7;
  --text-secondary: #C9A45C;
  --text-inverse: #07130F;
  --border-subtle: #22352C;
  --border-strong: #4B6154;
  --border-accent: #C9A45C;
  --rule-editorial: rgba(201, 164, 92, 0.26);
  --focus-ring: #C9A45C;
}
```

The workspace (`/app`) keeps the original Warm Ivory light palette through `--app-*` tokens in `src/app/app-theme.css`. The public site uses the approved royal dark theme above. Both share the brand palette and the Newsreader/DM Sans pairing; neither uses purple-blue gradients or neon effects.

Hover and active variants must stay within the palette family and maintain contrast. Do not introduce saturated blues, violets, or cyans for states.

### 2.5 Color distribution

For the implemented dark theme, aim for approximately:

- 70% deep emerald and green-black surfaces (`#07130F`, `#0B1A15`, `#16271F`).
- 18% Warm Ivory type at 70–100% strength and gold structure.
- 7% Terracotta, Sage, and Gold accents combined.
- 5% Burgundy, Navy, and Plum atmosphere, always blurred and low-opacity.

No section should read as a single flat colour. The ambient layer and the per-section radial tints provide slow tonal variation while the reading surface stays stable.

For the original light theme, the distribution was approximately 70% Warm Ivory and Soft Stone, 20% Charcoal Ink and Forest Green, and 10% combined accents.

### 2.6 Experience surface palette

The 3D section uses a deeper, theatrical extension of the same family. It must read as a warm, royal workspace after hours, never as a neon or science-fiction interface.

```css
:root {
  --stage-deep: #06120e; /* deepest background */
  --stage-mid: #0f2a21;  /* lifted forest shade */
  --stage-gold: #d6b87c; /* gold light, rules, stage labels on deep */
}
```

| Pair | Approximate ratio | Permitted use |
| --- | --- | --- |
| Warm Ivory on Stage Deep | ~15:1 | Stage titles, body copy, progress labels |
| Stage Gold on Stage Deep | ~9:1 | Eyebrows, numerals, focus indicators, fine rules |
| Terracotta on Stage Deep | ~5.5:1 | Thread, attention marks, non-text accent |

Rules:

- The surface gradient runs from `#06120E` through `#07130F` to `#0D241C`, with restrained gold and terracotta radial light. No purple, cyan, magenta, neon, chromatic aberration, or full-screen bloom.
- Warm ivory, aged paper, brass, travertine, and dark leather are the only material notes. The desk should look like furniture, not a hologram.
- The terracotta/gold thread is the only connective visual motif. No floating orbs, neural networks, particles, or glowing brains.
- Gold is a material and light color. Gold body text is limited to short labels on the deep stage; long copy uses Warm Ivory at 70% or higher.
- The scene never becomes the only carrier of meaning: the same six stages are always present as typeset copy.

Accent color should feel intentional, not sprayed across the interface.

---

## 3. Typography

### 3.1 Families

| Role | Family | Weights | Notes |
| --- | --- | --- | --- |
| Editorial headings | **Newsreader** | 400, 500, 600, italic 400 | Serif with literary character; use for page titles, section titles, and key numerals |
| Interface and body | **DM Sans** | 400, 500, 600, 700 | Clear, warm geometric sans; use for UI, forms, labels, tables, and body copy |
| Code and evidence excerpts | System monospace stack | 400, 500 | Only for literal technical identifiers or fixed-width excerpts; never as a brand voice |

Fallback stacks:

```css
--font-heading: var(--font-newsreader), "Iowan Old Style", Georgia, serif;
--font-serif: var(--font-newsreader), "Iowan Old Style", Georgia, serif;
--font-sans: var(--font-dm-sans), "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, "SFMono-Regular", Consolas, monospace;
```

### 3.2 Hierarchy

| Style | Family | Size / line height | Weight | Use |
| --- | --- | --- | --- | --- |
| Display | Newsreader | 64 / 68 desktop, 44 / 48 mobile | 500 | Landing hero only |
| H1 | Newsreader | 44 / 50 desktop, 34 / 40 mobile | 500 | Page title |
| H2 | Newsreader | 32 / 38 | 500 | Major section |
| H3 | Newsreader | 24 / 30 | 500 | Record section, card title |
| Lead | DM Sans | 20 / 32 | 400 | Introductory paragraph |
| Body | DM Sans | 16 / 26 | 400 | Default reading and UI copy |
| Body small | DM Sans | 14 / 22 | 400 | Metadata, helper text |
| Label | DM Sans | 12 / 16 | 600 | Form labels, uppercase micro-labels with 0.08em tracking |
| Numeric display | Newsreader | 40 / 44 | 500 | Editorial counts and dates |
| Data | DM Sans | 14 / 22 | 400 | Tables; enable tabular numerals |

Rules:

- Use a maximum reading measure of 68 characters for prose and 60 characters for forms.
- Never set body copy below 14px; 16px is the default.
- Use italic Newsreader sparingly for editorial emphasis, not for UI status.
- Uppercase labels are reserved for small structural labels, not sentences.
- Do not use letter-spacing on body text. Do not condense or stretch type.
- Numerals in tables and dates use `font-variant-numeric: tabular-nums`.
- Headings are sentence case. Product copy is not title case except proper nouns.

### 3.3 Editorial devices

- Thin hairline rules above section headings.
- Sequenced numerals in Newsreader for steps, records, and evidence.
- Generous space before headings, tighter space after.
- Margin notes on wide screens for source and evidence context, collapsing to inline blocks on narrow screens.
- A restrained monogram may be used for the brand mark; no icon-plus-wordmark AI cliché.

---

## 4. Layout and spacing

### 4.1 Grid

- Page container: maximum 1280px.
- Content container: maximum 1120px.
- Reading column: 680px.
- Form column: 560px.
- Desktop app shell: 248px project sidebar, 64px top bar.
- 12-column grid with 24px gutters on desktop, 16px on tablet, 16px page margins on mobile.

### 4.2 Spacing scale

| Token | Value | Typical use |
| --- | --- | --- |
| `--space-1` | 4px | Icon offset, tight inline gap |
| `--space-2` | 8px | Label to control, chip padding |
| `--space-3` | 12px | Compact component padding |
| `--space-4` | 16px | Default component gap |
| `--space-5` | 24px | Card padding, form groups |
| `--space-6` | 32px | Section gap |
| `--space-7` | 48px | Major section separation |
| `--space-8` | 64px | Page-level breathing room |
| `--space-9` | 96px | Landing sections only |

Use an 8px rhythm for layout; 4px is permitted for optical corrections.

### 4.3 Breakpoints

| Name | Width | Behavior |
| --- | --- | --- |
| Compact | 0–479px | Single column; sidebar becomes a drawer; review panes stack |
| Mobile | 480–767px | Single column; sticky approval bar |
| Tablet | 768–1023px | Two-column forms; sidebar collapses to icons or drawer |
| Desktop | 1024–1279px | Full app shell; side-by-side review |
| Wide | 1280px+ | Wider margins, optional margin notes |

### 4.4 Density

Hinterland is comfortable, not sparse. Control heights are 40px default and 32px compact. Table rows are 52px default and 44px compact. Do not use landing-page whitespace inside working screens.

---

## 5. Surfaces, borders, and texture

Implemented dark theme:

- **Page:** `#07130F` on `html`; `body` is transparent above a fixed ambient field.
- **Ambient field:** five blurred colour fields (emerald, navy, burgundy, plum, gold) at `z-index: -10`, `mix-blend-mode: screen`, animated on transforms only. They are decorative, non-interactive, and removed under reduced motion.
- **Section shell:** `.section-shell` adds a low-strength radial tint, a gold/burgundy hairline, and a small diamond mark. Tones are emerald, burgundy, navy, plum, and gold. Section tints are CSS-only — no extra DOM layers per section.
- **Raised card:** `#16271F` or `#0B1A15` with a 1px `rgba` ivory border at 10–15%. Hover lifts 3px, strengthens the border to gold, and deepens the shadow.
- **Inverse / deepest surface:** `#06110D` for the footer and the 3D stage.
- **Editorial rule:** 1px hairline at `rgba(201,164,92,.22)`.
- **Texture:** a very subtle paper grain generated as an SVG turbulence pattern at 4.5% opacity. It must not reduce text contrast, must not animate, and must be removable through a single token. Do not use bitmap paper stock.
- **Shadows:** restrained and functional only, tuned for dark surfaces.
- **Radii:** 2–20px; 2–6px for most editorial surfaces.
- **Borders:** 1px default; 2px only for attention or focus. Never glowing borders.
- **No glassmorphism.** No backdrop blur except where a dialog needs separation, and then a solid scrim is preferred.

Original light-theme specification:

- **Page:** Warm Ivory, flat.
- **Raised card:** Soft Stone or Ivory with a 1px Soft Stone border. One elevation only; nested cards are prohibited.
- **Inverse surface:** Charcoal Ink with Warm Ivory text, used for the landing footer, toasts, and occasional editorial callouts. Not for large working areas.
- **Editorial rule:** 1px hairline at 28% Ink over Ivory; use between major sections.
- **Shadows:** `--shadow-1: 0 1px 2px rgba(34, 44, 37, 0.06);` and `--shadow-2: 0 8px 24px rgba(34, 44, 37, 0.10);` for dialogs only.

---

## 6. Iconography

- Use **Lucide** icons only.
- Stroke width: 1.5px.
- Sizes: 16px inline, 20px controls, 24px navigation and headers.
- Icons inherit text color. Accent icons may use Terracotta or Forest.
- Every icon-only button has an accessible name and a visible tooltip on hover and focus.
- Do not use Sparkles, Bot, Brain, or similar icons to signify AI. Use task-specific icons: `FileText`, `PenLine`, `Users`, `Search`, `BookOpen`, `Calendar`, `Check`, `AlertCircle`, `CircleHelp`.
- Do not mix icon families. Do not use filled icons alongside outline icons except for a clear state difference.
- Decorative icons are hidden from assistive technology.

---

## 7. Components

### 7.1 Buttons

| Variant | Appearance | Use |
| --- | --- | --- |
| Primary | Forest background, Ivory label, 2px radius, 40px height | One primary action per region |
| Secondary | Transparent, 1px Forest border, Forest label | Supporting actions |
| Quiet | No border, Ink or Forest label | Tertiary actions |
| Attention | Transparent, 1px Terracotta border, Ink label, Terracotta icon | Destructive or attention actions, followed by a confirmation |
| Inverse | Ivory background, Ink label, on Ink surfaces | Actions on dark surfaces |

States: rest, hover, active, focus-visible, disabled, loading. Loading locks the label width and disables repeat submission. Disabled controls remain legible; do not rely on faint text alone.

### 7.2 Form controls

- Label above the field; optional marker written as "Optional," never a bare asterisk.
- Helper text below the label or field, 14px, Forest.
- Error state: Terracotta 1px border, `AlertCircle` icon, Ink error text, and an `aria-describedby` link. Error is never color-only.
- Textareas resize vertically by default.
- Character and token limits are shown before the limit is reached.
- Inputs use Soft Stone fill or Ivory with a strong border; never a white field on Ivory.
- Focus ring: 2px Forest with 2px offset.
- Placeholders are examples, never labels.

### 7.3 Status chips

Status chips are rectangular, 2px radius, 12px uppercase label with an icon where useful.

| Status | Treatment | Text |
| --- | --- | --- |
| Draft | Gold 1px border, Ink text, `PenLine` icon | "Draft" |
| In review | Terracotta 1px border, Ink text, `CircleHelp` or `Eye` icon | "In review" |
| Approved | Forest 1px border, Forest text, `Check` icon | "Approved" |
| Unsupported | Terracotta fill at low tint, Ink text, `AlertCircle` icon | "Needs evidence" |
| Unspecified | Soft Stone fill, Ink text, dashed underline | "Not specified" |
| Superseded | Soft Stone fill, Forest text, `History` icon | "Superseded" |

### 7.4 Evidence citation

- Displayed as a small numbered reference: `[1]`, `[2]`.
- Forest text with a hairline underline; 20px minimum hit area.
- Opens a side panel with the exact quote, source title, page or section, and whether the server verified it.
- Verified: `Check` icon and "Verified against source."
- Unverified: `AlertCircle` icon and "Could not verify this excerpt." Approval is blocked for affected commitments.
- Source deleted: "Source deleted. The approved excerpt is retained in this record."
- Never show a citation that has no resolvable target.

### 7.5 Source tray and inclusion manifest

- Persistent on generation screens, typically a right column on desktop and a collapsible section on mobile.
- Lists selected sources with type, date, and size.
- Shows what was included, what was truncated, and what was excluded for budget reasons.
- Provides an "Add context" control and a per-source remove control.
- Uses a quiet, factual tone: "3 sources included. One document was shortened to fit the context limit."

### 7.6 Review layout

- Desktop: original or source pane on the left, generated or editable content in the center, evidence panel on the right.
- Tablet: two panes with evidence in a drawer.
- Mobile: sequential panes with a sticky approval bar.
- Original text and stated intention are never hidden from the refinement view.
- The approval bar states exactly what will be saved: "Approve and save to Project Name → Knowledge."

### 7.7 Record sections

Each meeting record section has:

1. A Newsreader heading with a hairline rule.
2. A count in Newsreader numerals.
3. A short description of what belongs in the section.
4. Items with type, content, evidence, and review controls.
5. An empty state that explains whether the source contained no items or extraction was incomplete.

### 7.8 Item controls

- Accept, edit, remove, and reclassify are visible on hover and focus, and always available through a menu.
- Reclassify options use plain language: "This was a proposal, not a decision."
- Merging duplicate items requires selecting both and confirming.
- Edits trigger evidence revalidation and show the result immediately.

### 7.9 Empty states

- Use a short Newsreader heading, one explanatory sentence, and one primary action.
- No illustrations of robots or abstract networks.
- Example: "No sources yet. Add a project document, agenda, or previous notes to give Hinterland context." Action: "Add source."

### 7.10 Loading and progress

- Describe the work: "Reading document," "Assembling context," "Checking evidence."
- Use a simple 2px progress rule or a static skeleton in Soft Stone. No shimmering gradients.
- Generation streams into a labeled region with `aria-live="polite"`.
- Cancellation is available for long-running generation where technically possible.
- Never show fabricated progress percentages.

### 7.11 Dialogs

- Workspace dialogs: Warm Ivory panel (`--app-panel`), 1px Warm Stone border, 6px radius, deep ink scrim. Public dialogs use the dark raised surface (`--popover`) with Ivory text.
- Title in Newsreader, body in DM Sans.
- Destructive confirmation names the object and requires an explicit action; project deletion requires typing the project name.
- Focus is trapped, Escape closes non-destructive dialogs, and focus returns to the trigger.

### 7.12 Toasts

- Workspace toasts use the Warm Ivory panel with an Ink label and a coloured left edge; public toasts use the dark raised surface with Ivory text. 4px radius, bottom-left on desktop and bottom-center on mobile.
- Used for confirmations and recoverable errors, never for approval itself.
- Maximum one toast at a time; no stacks.
- Auto-dismiss only for non-critical confirmation, with a pause on hover and focus.

### 7.13 Tables and lists

- Table headers use 12px uppercase labels, Soft Stone header fill, Ink text.
- Row separators are 1px Soft Stone; no zebra striping.
- Numeric columns align right and use tabular numerals.
- Row actions are reachable by keyboard.
- On mobile, tables become stacked definitions, not horizontally scrolling secrets.

### 7.14 Navigation

- Desktop sidebar: project switcher, workspace tabs, settings, account.
- Active tab: Forest text, 2px Terracotta left indicator, Soft Stone background.
- Hover: Soft Stone background, no movement.
- Mobile: a drawer with the same hierarchy; focus trapped while open.
- Breadcrumbs use text and separators, not icons.
- The current project is always visible in the top bar.

**Implemented workspace navigation:** the desktop sidebar is 256px wide and collapses to a 72px icon rail at `md` and above; below `md` it becomes a 282px drawer over a 42% ink scrim. Active items use a Forest fill with Warm Ivory text and a gold icon. Group labels are 9.5px uppercase muted text. The top bar holds breadcrumbs, search, notifications, help, settings, and the profile menu; it is 56px tall plus a dismissible 27px demo notice.

### 7.15 Brand mark

- Wordmark set in Newsreader with modest letter-spacing; optionally preceded by a simple editorial mark such as a fine square or rule.
- No glowing orb, neural node, gradient monogram, or abstract "H" built from particles.
- Minimum clear space equals the height of the capital H.
- The tagline is set in DM Sans small caps or sentence case, never both.

---

## 8. Motion

### 8.1 Interface motion

- Micro feedback: 120ms.
- Panels and drawers: 180ms.
- Dialogs: 240ms.
- Easing: `cubic-bezier(0.2, 0, 0, 1)` for entrances; `ease-out` for exits.
- Animate opacity and small transforms only. Do not animate layout in ways that displace reading position.
- Respect `prefers-reduced-motion`: remove transforms, keep instant state changes.
- Streaming text appears as plain text, without per-character animation.

### 8.2 Scroll-driven experience

The six-stage 3D section is the single intentional exception to the interface rules above. It is a story surface, not a control surface.

- **One pinned section.** The experience is pinned once between the workflow and product preview. There are no competing pins or smooth-scroll libraries, and normal page scrolling is never hijacked.
- **Scroll is the only timeline.** The GSAP ScrollTrigger progress is scrubbed; there is no autoplay, no idle camera tour, and no looping story. If the user stops scrolling, the story stops.
- **Text stays readable.** Stage copy is ordinary DOM text with a readable contrast ratio. The canvas is decorative and `aria-hidden`; the same six stages appear in a static sequence when the scene is unavailable.
- **Floating copy.** Stage text drifts in place by roughly 8px over 6.4s. The motion is slow, small, and non-informational. It is removed under reduced motion.
- **Scene motion.** Object positions, rotations, scales, visibility, thread growth, drawer opening, and camera keys are sampled from scroll progress and damped. Pointer parallax is limited to a small offset and never moves the page.
- **Constrain the palette.** Motion must not introduce glow pulses, chromatic effects, or animated gradients. Lighting is static except for the very slight anchor pulse on the context thread.
- **Fallback is a state, not a failure message.** Below 1024px, with reduced motion, or without WebGL, the section renders the static six-stage sequence at full quality. No error banner is required unless the scene had already mounted and failed.
- **Performance budget.** DPR is capped at 1.6, shadows are 1024px, the loop pauses offscreen, and model assets stay local. Motion quality must not come at the cost of scroll responsiveness.

### 8.3 Editorial motion and atmosphere

The marketing site keeps section content visible without JavaScript-driven entrance
animations. The interactive desk scene owns its own GSAP lifecycle so it cannot
mutate separately hydrating page content. Ambient and in-place CSS motion remains
decorative and respects reduced-motion preferences.

| Layer | Implementation | Purpose |
| --- | --- | --- |
| Ambient field | `.ambient-aurora`, `.ambient-sweep`, `.ambient-blob*` in `globals.css`; `src/components/layout/ambient-field.tsx` | Slow rotating jewel-tone aurora, drifting gold light sweep, and seven blurred fields |
| Section atmosphere | `.section-shell` + `.tone-emerald/burgundy/navy/plum/gold` | Radial tint, gold/burgundy hairline, diamond mark |
| In-place float | `.drift-word`, `.flow-arrow-*`, `.thread-dot`, `.hero-orbit`, `.hero-spark` | Keywords and ornaments hover in place |
| Scroll progress | header `scaleX` bar | Quiet reading-position indicator |

Motion rules:

1. **Keep content readable.** Marketing copy is visible in the initial server-rendered page; no animation can delay access to it.
2. **Scroll is the only scene timeline.** GSAP ScrollTrigger is limited to the pinned 3D experience described above.
3. **Respect reduced motion.** Ambient and in-place CSS animations are disabled under `prefers-reduced-motion`.
4. **The tone stays editorial.** Ornaments are rules, lines, and subtle material movement; no particles, neural nets, or sci-fi HUD graphics.

### 8.4 Reduced motion

With `prefers-reduced-motion: reduce`:

- The 3D canvas is not mounted.
- The 3D canvas is not mounted and no scroll-driven animation is initialized.
- Ambient fields, orbit rotation, spark float, drift words, connectors, and all decorative keyframes are disabled.
- The static stage sequence is shown, including object chips and gaps.
- Colour, hierarchy, and layout are unchanged — motion is the only thing removed.

---

## 9. Accessibility

Target: **WCAG 2.2 AA** for all core flows.

### 9.1 Requirements

- All functionality is keyboard operable.
- Focus is always visible, with at least 3:1 contrast against adjacent colors.
- Focus is not obscured by sticky bars or overlays.
- Every input has a programmatic label.
- Errors are announced and linked to fields; an error summary appears at the top of long forms.
- Status changes use `aria-live` appropriately without excessive announcements.
- Status is conveyed by text and icon, not color alone.
- Text can resize to 200% without loss of content or function.
- Content reflows at 320px width without horizontal scrolling, except data tables, which transform.
- Touch targets are at least 24×24px (AA) and preferably 44×44px.
- Skip-to-content link is the first focusable element.
- Modals trap focus and restore it on close.
- Icon-only controls have accessible names.
- Tables have captions and proper headers.
- No time-limited interactions except session expiry, which warns before sign-out.
- Reduced motion is honored.
- Evidence panels and side-by-side views have a linear, screen-reader-friendly reading order.

### 9.2 Contrast verification

The palette has known low-contrast colors. The following are prohibited:

- Sage text on Ivory or Stone.
- Gold text on Ivory or Stone.
- Terracotta small text on Ivory or Stone.
- Ivory text on Sage or Gold.
- Any status indicated only by a colored border.

Automated contrast checks run in CI for core components; manual review covers dynamic surfaces.

---

## 10. Voice and content style

### 10.1 Voice

Calm, precise, literate, and direct. Hinterland speaks like a thoughtful senior colleague: specific, never performative.

### 10.2 Rules

- Use short, declarative sentences.
- Name what happened and what the user can do.
- Say "suggested," "based on the selected sources," and "not specified in your notes."
- Refer to the product as Hinterland, not "the AI."
- Never claim certainty the system does not have.
- Never imply the system has judgment, feelings, or authority.
- Avoid corporate filler and AI hype: "unleash," "supercharge," "revolutionize," "magic," "10x," "seamless," "effortless."
- Avoid anthropomorphism: "I think," "I feel," "I went ahead and."
- Use sentence case for headings and buttons.
- Prefer active voice.
- Do not use exclamation marks in product UI.

### 10.3 Examples

| Context | Use | Avoid |
| --- | --- | --- |
| Generation start | "Reading 2 sources and preparing your brief." | "AI magic in progress..." |
| Missing owner | "Not specified in the supplied notes." | "Unknown" or a guessed name |
| Approval | "Approve and save to Client Review → Knowledge." | "Submit" |
| Refusal | "This request cannot be completed with the selected sources." | Silent empty output |
| Error | "The document could not be read. It may be image-only. Try a text-based PDF." | "Something went wrong." |
| Privacy | "Only this project's selected sources are used." | "Your data is 100% secure." |
| Personalization | "Use this version as a style example." | "Teach the AI your voice." |

---

## 11. Landing page direction

The landing page is an editorial argument, not a feature carousel.

### 11.1 Composition

1. **Masthead:** wordmark left, sign-in right, one hairline rule.
2. **Hero:** large Newsreader headline, tagline as a short lead, one primary action. Asymmetric layout with generous left margin. No stock imagery.
3. **The problem:** a short editorial passage about fragmented context, set in a measured column.
4. **The loop:** the six-step context loop rendered as typeset steps with numerals and rules, not floating icons.
5. **The connected workspace:** one scroll-driven 3D desk story in six stages, using the experience surface palette. Copy remains the primary carrier; the scene is an enhancement.
6. **Product evidence:** real interface fragments showing evidence references, "Not specified," and an approval bar. Do not fabricate screenshots of features that do not exist.
7. **Principles:** a compact list of intent preservation, evidence, and human approval.
8. **Audience:** one restrained section naming the primary users.
9. **Close:** tagline, primary action, footer with wordmark and legal links.

### 11.2 Hero copy direction

- Headline: a clear statement about connected professional work.
- Subhead: the promise, in one or two sentences.
- Primary action: "Start a project" or "Create an account."
- No "AI-powered" badge. No fake customer logos. No invented testimonials or metrics.

---

## 12. Responsive behavior summary

| Area | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| App navigation | Persistent sidebar | Collapsible sidebar | Drawer |
| Project tabs | Horizontal | Horizontal, scrollable with visible affordance | Drawer or select |
| Generation view | Context tray + editor | Context tray collapsible | Context section above editor |
| Review | Three panes | Two panes + evidence drawer | Sequential + sticky approval bar |
| Tables | Full table | Reduced columns | Stacked definitions |
| Dialogs | Centered | Centered | Full-height sheet |
| Record sections | Two-column metadata | Single column with metadata aside | Single column |
| 3D experience | Pinned scene at 1024px+ with motion enabled | Static six-stage sequence | Static six-stage sequence |

No feature is available only on desktop. The 3D presentation is an enhancement; every stage, object, and gap remains available as text on every screen and with reduced motion.

---

## 13. Design review checklist

Before a screen is considered complete:

- [ ] The active project is unambiguous.
- [ ] The primary action is singular and clearly labeled.
- [ ] Draft, review, and approved states are visually and semantically distinct.
- [ ] "Not specified" is visually distinct from a confirmed value.
- [ ] Every generated claim that needs evidence has a working citation.
- [ ] Sources used and exclusions are visible.
- [ ] The original intention remains visible in refinement.
- [ ] Nothing implies automatic sending, sharing, or saving.
- [ ] No prohibited AI visual language is present.
- [ ] Palette tokens are used; no off-brand colors were introduced.
- [ ] Text contrast meets AA for its size.
- [ ] Keyboard and screen-reader paths are complete.
- [ ] Empty, loading, error, and permission states exist.
- [ ] Destructive actions require explicit confirmation.
- [ ] Responsive layouts at 320px, 768px, and 1280px are verified.
- [ ] Reduced motion is respected.
- [ ] The 3D story is readable without the canvas, and the static sequence is present at narrow widths and under reduced motion.
- [ ] The 3D scene uses no prohibited AI visual language and introduces no colors outside the experience palette.
- [ ] Copy is calm, specific, and free of hype.
