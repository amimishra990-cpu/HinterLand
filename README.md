# HINTERLAND

**The work behind the work.**

Hinterland is a context-aware professional workspace that connects communication refinement, meeting preparation, meeting documentation, document intelligence, and knowledge retrieval around a single project thread.

This repository contains the **public website with an interactive 3D scroll experience** and a **full-stack workspace** at `/app` backed by Supabase Auth, Postgres with row-level security, and a private storage bucket. Documents are extracted in the browser (PDF.js, Mammoth, Tesseract.js OCR), stored per page in a private page index, and searchable through PostgreSQL full-text search. AI features run server-side and are live on the deployment through an OpenAI-compatible Gemini endpoint.

**Live deployment:** [https://hinter-land.vercel.app](https://hinter-land.vercel.app) — Vercel project `hinter-land` connected to `main`; Supabase Auth, Postgres, storage, Gemini, and custom SMTP are configured for the production domain.

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Requirements

- Node.js **22+** for deployment (`@supabase/supabase-js` declares `>=22`; Next.js
  itself requires `>=20.9`). The build, typecheck, ESLint, and Vitest suite in
  this repository were verified on Node 24.22.1; use Node 22 or 24 LTS for
  production.
- npm 10+

Tailwind CSS 4 is pinned to `4.2.4` because later 4.3.x releases ship an ESM-only `magic-string` dependency that fails under Turbopack's current module evaluation.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript with `--noEmit` |
| `npm test` | Run the Vitest unit suite (`src/**/__tests__`) |

---

## Routes

| Route | Description |
| --- | --- |
| `/` | Complete public website: overview, problem, six features, workflow, six-stage 3D experience, interactive product previews, principles, use cases, technology and trust, roadmap, closing |
| `/app` | Workspace overview: quick actions, projects, meetings, documents, summaries, pending actions; each section shows an empty state until you add content |
| `/app/communication` | Message refinement with tone, audience, project context, alternatives, warnings, and change explanations |
| `/app/preparation` | Meeting brief builder: objective, agenda, date, project, document selection, prior notes |
| `/app/intelligence` | Meeting record from notes or a consented transcript, with edit, approval, save, and export |
| `/app/projects` | Project context and a document library with source labels, search, filters, upload, pasted text, preview, and analysis |
| `/app/knowledge` | Searchable repository of approved records with project, type, meeting, topic, and date filters |
| `/app/development` | Communication preferences, approved examples, suggestions, and feedback history |
| `/app/settings` | Account and workspace settings: profile, notifications, writing preferences, workspace reset, and permanent account deletion |
| `/app/help` | Tool index, FAQ, keyboard shortcuts, and data boundaries |
| `/workspace` | Static preview workspace retained from the marketing site |

Navigation links are section anchors on `/` and root-relative from other routes. The workspace uses a persistent sidebar on desktop, a collapsible rail at tablet widths, and a modal drawer on mobile.

---

## Workspace

The workspace at `/app` is an authenticated experience backed by Supabase. Every
read and write is owner-scoped by row-level security, and uploaded files live in
a private bucket whose object paths must start with the user's id.

**What works**

- Email/password authentication, email verification, password reset, session
  cookies, and a signed-out gate.
- Sidebar navigation, collapsible desktop rail, mobile drawer, breadcrumbs,
  profile menu, notifications, and `Ctrl/⌘ K` workspace search.
- Communication refinement with tone, audience, project context, alternatives,
  warnings, and a change log. Without provider credentials the generation
  request is rejected with a configuration message and saves no output.
- Preparation briefs assembled from the objective, agenda, documents, and prior
  notes, with explicit missing information and risks.
- Meeting record extraction with confirmed decisions, discussion, open
  questions, and actions; owners and deadlines are captured only when the source
  text states them.
- Record editing, approval gating, save, clipboard copy, and Markdown export.
- Document library search and filters, upload, preview, and analysis.
- Project management: create, rename, edit the objective, description, and
  status, archive and restore, and delete. Archiving keeps every linked record;
  deleting keeps documents and meetings but permanently removes the project's
  decisions and action items, and the confirmation states those consequences.
- Pasted context saved as a first-class source: name, project association,
  source label, full text, edit and delete. Pasted text is indexed for search
  and available to the AI workflows for its project.
- Source labels (`Document`, `Agenda`, `Previous notes`, `Transcript`, `Note`)
  stored in the database, shown on every row and preview, and usable as a
  library filter.
- A completely empty workspace for every new account, with a tailored empty
  state and next action in each overview and library section.
- Account deletion from settings: reauthentication with the current password,
  an explicit typed confirmation, removal of stored files before any database
  row is deleted, and deletion of the auth account through a `SECURITY DEFINER`
  function. Partial failures stop before data is lost and are reported.
- Workspace reset is separate from account deletion: it clears workspace
  content and stored files and leaves the empty account signed in.
- Document processing: selectable PDF text per page, DOCX paragraphs, and
  Tesseract.js OCR for scanned PDFs and photos. Rotation retries, low-confidence
  line marking, duplicate-page detection, repeated header/footer removal, and
  safe errors for empty, encrypted, corrupted, oversized, or unsupported files.
- A private page index (`document_pages`) with per-page text, extraction method,
  OCR confidence, uncertain lines, and rotation, readable from the document
  preview and from full-text search.
- Knowledge search across titles, content, projects, topics, meetings, and
  dates, plus "Search inside source documents" with page-level hits and links
  back to the document library.

**Current constraints**

- AI summary, analysis, comparison, and Q&A routes require an `AI_API_KEY` (or
  `OPENAI_API_KEY`) and `AI_MODEL` in the server environment. Without them a
  generation request is rejected with a configuration message and saves no
  output.
- Extraction runs in the browser. Files are uploaded to private storage only
  after a successful extraction, so unsupported or damaged files never reach the
  bucket.
- OCR accuracy depends on image quality. Pages whose confidence falls below the
  review threshold are saved with status `Needs review` and their low-confidence
  lines are listed; uncertain text is never presented as verified.

---

## Project structure

```text
src/
  app/
    layout.tsx          Root document shell, fonts, metadata, skip link
    globals.css         Brand tokens, public-site base styles, texture, motion rules
    app-theme.css       Scoped warm-light workspace theme
    (site)/             Public route group with marketing layout
      layout.tsx        Public header, ambient field, footer, scroll motion
      page.tsx          Public website composition
      workspace/page.tsx  Static preview workspace (sample data only)
    app/                App workspace route group
      layout.tsx        Workspace metadata and shell
      page.tsx          Overview with empty states
      communication/    Refinement workspace
      preparation/      Meeting brief workspace
      intelligence/     Meeting record workspace
      projects/         Projects and document library
      knowledge/        Knowledge repository
      development/      Preferences and approved examples
      settings/         Account and workspace settings
      help/             Help, FAQ, and shortcuts
  components/
    layout/             Site header, mobile sheet navigation, ambient field, footer
    marketing/          Website sections and interactive previews
    motion/             Shared GSAP scroll-motion setup and word splitting
    app/                Workspace shell, navigation, search, toasts, UI primitives
    communication/      Communication workspace
    preparation/        Preparation workspace
    intelligence/       Meeting intelligence workspace
    projects/           Projects and documents workspace
    knowledge/          Knowledge repository workspace
    development/        Personal development workspace
    settings/           Settings workspace
    shared/             Section heading, cards, badges, states, form fields
    ui/                 shadcn/ui primitives (button, dialog, tabs, tooltip, ...)
    3d/                 Scroll-driven scene, models, textures, fallbacks
  hooks/                Media query and scroll-progress hooks
  lib/
    document-processing/  File-kind validation, text helpers, PDF/DOCX/OCR extraction, tests
    ai/                   Server-only provider adapter, schemas, prompts, grounding
    supabase/             Browser, server, and admin clients plus bucket config
    api.ts                Shared route-handler context and error helpers
supabase/
  migrations/             Versioned schema, RLS, storage, and search migrations
public/
  models/               Locally hosted CC0 GLB models
  textures/             Paper grain and extracted model texture audit copies
docs/                   Product, design, architecture, privacy, API, and schema documents
```

Server Components are the default. Client components cover the public sticky header, mobile navigation, tabs, dialog/tooltip interactions, the product previews, the 3D experience, and the interactive workspace routes.

---

## Design system

The public site is a **warm ivory editorial** theme: a cream paper ground, deep emerald ink and actions, antique gold rules, and restrained sage, terracotta, and gold atmosphere. The workspace uses the same palette at a quieter density.

- **Core palette:** Warm Ivory `#F5F2E9`, Deep Emerald `#304E3E`, Antique Gold `#C9AD75`, Muted Sage `#AAB5A1`, Terracotta `#C47B5B`.
- **Atmosphere:** emerald and gold washes, hairline gradients, and section tints. Emerald is used for type and primary actions; gold is reserved for short labels, numerals, and rules.
- **Surfaces:** `#F5F2E9` page, `#FAF8F1` paper, `#E5E1D6` quiet stone, `#222C25` inverse. Body background is transparent so the fixed ambient layer shows through.
- **Type:** Newsreader for headings, DM Sans for body, loaded through `next/font/google`.
- **Surfaces and texture:** subtle borders, low shadows, a non-animated SVG paper-grain overlay at 2.5% opacity, and reduced-motion support.
- **Experience surface:** a deep emerald-to-black stage for the pinned 3D scene, inset against the light page.
- **Radii:** 2–20px, with 2–6px used for most editorial surfaces.

Semantic tokens live in `src/app/globals.css` under `@theme inline`. `--color-ink` is the type color, `--color-forest` the gold-leaning accent, and `--color-stone` a surface, so utilities such as `text-ink/70` and `bg-stone` re-theme globally without per-component overrides.

### Motion and atmosphere

The site uses a small shared motion layer rather than per-section animation code.

- **Ambient field** (`src/components/layout/ambient-field.tsx`): a slow rotating jewel-tone aurora, a drifting gold light sweep, and seven heavily blurred colour fields in emerald, navy, burgundy, plum, and gold, blended with `mix-blend-mode: screen`. Gold is merged into the page gradient so the paper ground warms as you scroll. They drift on long transform-only keyframes and sit at `z-index: -10` behind a transparent body, so they never intercept pointer input and never trigger repaint of text.
- **Cursor-reactive headings:** split heading words are magnetic. Moving the pointer over a word floats it toward the cursor by up to ~4.5px with a slight tilt, then releases smoothly. Only CSS custom properties are written, so there is no layout thrash.
- **Section atmosphere** (`.section-shell` and `.tone-*` in `globals.css`): each major section carries a quiet radial tint, a gold/burgundy hairline, and a small diamond mark. This gives the page a continuous tonal rhythm without stacking heavy DOM or gradients.
- **Scroll motion** (`src/components/motion/site-motion.tsx`): one GSAP ScrollTrigger setup drives all reveals. Headings split into word spans and rise in sequence; paragraphs, lists, and cards fade and lift with staggered delays; hairline rules draw from the left; decorative layers move at a shallow parallax. All triggers are `once: true` and work in both scroll directions.
- **Floating words:** key editorial words (`.drift-word`) hover in place by a few pixels on a slow CSS keyframe, never leaving their line box. Decorative connectors, orbit dots, and story sparks use the same restrained vocabulary.
- **Progressive enhancement:** an inline head script sets `html[data-motion="pending"]` only when reduced motion is not requested. CSS hides reveal targets only in that state; GSAP resolves them and sets `ready`, with a 4-second fallback to `off`. Without JavaScript the content is simply visible.
- **Reveal correctness:** every tween uses `gsap.fromTo` with explicit end values and `clearProps: "transform"`, so hidden pre-states can never become final states and hover transforms keep working after a reveal.
- **Reduced motion:** word splitting, ScrollTriggers, ambient drift, orbit rotation, spark float, and the 3D canvas are all disabled. Static copy, colour, and layout remain.

---

## 3D scroll experience

The home page includes a genuine interactive Three.js scene, not a video. It is pinned once between the workflow and product-preview sections and tells the same six-stage story as the adjacent copy:

1. Scattered information
2. Communication
3. Meeting preparation
4. Meeting intelligence
5. Project knowledge
6. The connected workspace

### How it works

- **Scroll-driven, no autoplay.** A GSAP ScrollTrigger timeline scrubs a shared progress ref; object positions, rotations, scales, visibility, the camera, the terracotta/gold thread, and the drawer opening are sampled from that value. Copy changes at six stage boundaries and is not updated every frame.
- **Real assets.** Three CC0 Poly Haven models are packed as local GLBs in `public/models/`. The desk, travertine, leather mat, lamp, pen, thread, and document faces are original procedural Three.js work. Documents are generated on a canvas so their sample content stays legible and consistent with the design system.
- **No runtime hotlinking.** All models and textures are served from this repository. No CDN, Sketchfab embed, or third-party texture request is made at runtime.
- **Pointer response.** Moving the pointer over the pinned panel adds a restrained camera and object parallax. It is decorative and does not block selection or scrolling.
- **Floating copy.** Stage text drifts by a few pixels in place. On reduced motion, all drift and transforms are removed.

### Technology

| Package | Role |
| --- | --- |
| `three` 0.187.0 | Renderer |
| `@react-three/fiber` 9.8.2 | React renderer, frame loop, camera |
| `@react-three/drei` 10.7.9 | `useGLTF`, `Environment`, `useProgress`, `RoundedBox` |
| `gsap` 3.15.1 + ScrollTrigger | Pinned timeline, scrubbed progress, cleanup |

Versions were checked against React 19 before installation. The scene is dynamically imported with `ssr: false`; WebGL never runs during server rendering.

### Fallbacks and performance

- The 3D scene mounts only at **1024px and above** with `prefers-reduced-motion: no-preference`. Everywhere else, the same six stages render as an accessible static sequence.
- WebGL support is checked before mounting. If WebGL is unavailable or the renderer throws, the section falls back to the static sequence automatically.
- A loading indicator reads real `useProgress` progress and stays until all models have loaded.
- Device pixel ratio is capped at 1.6, the shadow map is 1024px, and the frame loop switches to `demand` when the section is offscreen.
- Models total about 4.3 MB. Textures are embedded at 1k; audit copies are in `public/textures/polyhaven/`.
- The pinned canvas is `aria-hidden`; the full story is always present in readable copy, and a polite live region announces stage changes.

Asset sources, creators, licenses, file sizes, and direct download URLs are recorded in [docs/ASSET_CREDITS.md](docs/ASSET_CREDITS.md).

---

## Accessibility

The site targets **WCAG 2.2 AA**:

- Semantic landmarks, one `h1` per page, and a skip link.
- Visible focus indicators on all interactive elements.
- Keyboard-operable navigation, tabs, dialogs, and tooltips.
- Reduced-motion handling for scrolling, transitions, ambient fields, floating copy, and the 3D section.
- The 3D canvas is hidden from assistive technology; the six-stage story is available as readable text, and stage changes are announced politely.
- Static fallback content is present for narrow screens, reduced motion, and unavailable WebGL.
- Body and metadata text use Deep Emerald at the documented opacity on warm surfaces; gold is reserved for short labels, numerals, and rules. Section tints never sit behind long copy at a strength that would reduce contrast.
- Status is never conveyed by color alone; labels accompany every status.

The contrast audit was performed against the specified palette and the actual rendered surfaces. Automated CI contrast checks are not yet configured.

---

## Scope and honesty

The product rules in [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) are reflected in the interface copy and interaction design:

- Human approval comes before saving or sharing generated content.
- Owners and deadlines are never invented; unknown values are labeled explicitly.
- Findings link back to supplied material and, for indexed documents, to page numbers.
- Only approved meeting records enter the knowledge surface.
- Recording and transcription are shown as planned, consent-dependent work — not available features.
- AI-generated content is server-validated: every citation is checked against stored text, and unverified owners or deadlines are removed.
- OCR output is labelled with its method and confidence. Low-confidence pages are marked `Needs review` and never presented as verified.
- Row-level security, owner-scoped storage paths, and server-side authorization are enforced by the Supabase migrations in `supabase/migrations/`.

AI features remain inactive until provider credentials are added to the server
environment; the interface reports that state instead of fabricating output.

---

## Documentation

- [Product specification](docs/PRODUCT_SPEC.md)
- [Feature matrix](docs/FEATURE_MATRIX.md)
- [User flows](docs/USER_FLOWS.md)
- [Technical architecture](docs/TECHNICAL_ARCHITECTURE.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Privacy and reliability](docs/PRIVACY_AND_RELIABILITY.md)
- [Security implementation](docs/SECURITY_IMPLEMENTATION.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Asset credits](docs/ASSET_CREDITS.md)

---

## Current limitations

- AI generation requires `AI_API_KEY` (or `OPENAI_API_KEY`) and `AI_MODEL`; without them the AI routes report that the provider is not configured.
- Extraction and OCR run in the browser rather than in a background queue. Very large documents stop at the 50,000-character extraction cap, and OCR of long scans takes time proportional to page count.
- OCR confidence is a heuristic per-page/per-line signal; it flags likely errors but does not guarantee correctness. Review flagged pages before relying on them.
- Full-text search uses the PostgreSQL `english` configuration, so stemming for other languages is limited.
- DOCX files are indexed at the document level (no page index); PDFs and images are indexed per page.
- The 3D experience requires WebGL and a desktop-sized, motion-enabled viewport. Other environments get the complete static stage sequence.
- The three imported models have no animation clips; motion is procedural and driven by scroll. The scene is an illustrative representation of the product story, not a live application view.
- The production dependency audit is clean (`npm audit --omit=dev` reports 0). The `shadcn` CLI remains a dev dependency and carries advisories in its own transitive packages; it is not installed at runtime.
- The application has not been deployed publicly. [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) lists the required Supabase and hosting configuration.
