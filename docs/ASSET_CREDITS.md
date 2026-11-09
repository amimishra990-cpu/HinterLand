# HINTERLAND — Asset Credits

**Document status:** Asset and license register  
**Version:** 1.0  
**Last updated:** 2026-11-08  
**Scope:** Fonts, icons, imagery, brand assets, and third-party software used or planned for the product

---

## 1. Purpose

This register records the origin and license of every visual and third-party asset in Hinterland. It exists so the project can:

- Attribute creators correctly.
- Meet redistribution obligations.
- Avoid unlicensed stock imagery, fonts, or generated assets.
- Replace placeholders before release.
- Audit third-party dependencies.

The public website now ships with a registered set of visual assets. Three CC0 Poly Haven models are stored locally in `public/models/`, their embedded textures have been extracted to `public/textures/polyhaven/` for auditability, and an original paper-grain SVG is in use. The register below records what is in use, what is planned, and the obligations that apply. No model or texture is requested from a third-party origin at runtime.

---

## 2. Asset policy

1. Every asset must have a recorded source and license before it is committed.
2. No asset may be copied from a website, search result, or competitor without a verified license.
3. No stock photography or illustration is used unless a license entry is added first.
4. Generated imagery must be recorded with the tool, date, and usage rights.
5. Fonts and icons must be used within their licenses; font files are not modified or renamed.
6. Placeholder assets are labeled and listed for replacement.
7. The register is reviewed before any public deployment.
8. Brand-name trademark clearance is a separate legal task and is not established by this document.

---

## 3. Typography

### 3.1 Newsreader

| Field | Detail |
| --- | --- |
| Role | Editorial headings, page titles, key numerals |
| Designer / foundry | Production Type |
| Source | Google Fonts — https://fonts.google.com/specimen/Newsreader |
| License | SIL Open Font License 1.1 (OFL-1.1) |
| Delivery | Self-hosted through Next.js font loading, or files in `public/fonts/` |
| Modifications | None planned. Do not modify or rename font files. |
| Obligations | Include the OFL license text and copyright notice when font files are redistributed. Do not sell the fonts by themselves. Reserved font names may not be used for modified versions. |
| Status | Approved for use; verify upstream license text before public release |

### 3.2 DM Sans

| Field | Detail |
| --- | --- |
| Role | Interface, body text, labels, tables |
| Designer / foundry | Colophon Foundry |
| Source | Google Fonts — https://fonts.google.com/specimen/DM+Sans |
| License | SIL Open Font License 1.1 (OFL-1.1) |
| Delivery | Self-hosted through Next.js font loading, or files in `public/fonts/` |
| Modifications | None planned. Do not modify or rename font files. |
| Obligations | Include the OFL license text and copyright notice when font files are redistributed. Do not sell the fonts by themselves. Reserved font names may not be used for modified versions. |
| Status | Approved for use; verify upstream license text before public release |

### 3.3 Font handling rules

- Prefer framework font loading so font files are self-hosted at build time rather than requested from a third-party runtime.
- Include the OFL license files in the repository when font binaries are stored or redistributed.
- Do not use a font from an unlicensed download site.
- Do not convert the fonts into a proprietary brand asset or claim authorship.
- Keep fallback stacks as defined in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

---

## 4. Iconography

### 4.1 Lucide

| Field | Detail |
| --- | --- |
| Role | Interface icons |
| Maintainer | Lucide contributors |
| Source | https://lucide.dev |
| Package | `lucide-react` (version pinned in `package.json` at implementation) |
| License | ISC License |
| Modifications | Use icons as provided through the package; do not alter stroke paths |
| Obligations | Retain the ISC copyright and permission notice in the dependency license inventory. Attribution is not required in the UI, but the license must be preserved. |
| Status | Approved for use |

Rules:

- Use Lucide only; do not mix icon families.
- Do not use Sparkles, Bot, Brain, or neural-network-style icons as AI shorthand.
- Decorative icons are hidden from assistive technology.
- Icon-only controls require accessible names.

---

## 5. Texture and surface assets

### 5.1 Paper grain

| Field | Detail |
| --- | --- |
| Role | Subtle page texture |
| Method | Generated in-repo as an SVG `feTurbulence` pattern |
| Author | Hinterland project |
| License | Original project asset; no third-party license |
| Location | `public/textures/paper-grain.svg` (397 bytes) |
| Constraints | Fixed overlay at 4.5% opacity (`--paper-opacity: 0.045`), normal blend mode; must not reduce text contrast; no animation; removable through one token |
| Status | In use |

If a stock or generated bitmap texture replaces the in-repo pattern, it must be added to this register with its source, license, and date before use.

### 5.2 3D models — Poly Haven (CC0)

All three models were downloaded from [Poly Haven](https://polyhaven.com) as 1k GLTF packages through the Poly Haven file API, then packed to GLB with `gltf-transform copy`. The original remote URLs are not requested at runtime; the site loads only the local files below.

Poly Haven assets are released under **CC0 1.0 Universal**. The license was verified at [polyhaven.com/license](https://polyhaven.com/license): the assets may be used, modified, and redistributed, including commercially, without attribution. The creators below are credited as a courtesy.

| Asset | Creator | Source page | License | Local file | Bytes |
| --- | --- | --- | --- | --- | --- |
| Drawer Cabinet | Ulan Cabanilla | https://polyhaven.com/a/drawer_cabinet | CC0 1.0 | `public/models/drawer-cabinet.glb` | 1,140,032 |
| Binder Notebook | DaDrood | https://polyhaven.com/a/binder_notebook | CC0 1.0 | `public/models/binder-notebook.glb` | 1,887,996 |
| Office Notepads | Ulan Cabanilla | https://polyhaven.com/a/office_notepads | CC0 1.0 | `public/models/office-notepads.glb` | 1,325,564 |

Direct download sources used (1k GLTF packages, then converted to GLB):

- `https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/drawer_cabinet/drawer_cabinet_1k.gltf`
- `https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/binder_notebook/binder_notebook_1k.gltf`
- `https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/office_notepads/office_notepads_1k.gltf`

The pack conversion preserves the original meshes and embedded 1k textures.

Scene use:
- **Drawer Cabinet** — background archive object; its four drawer nodes open slightly in the final stage.
- **Binder Notebook** — open notebook on the desk and a closed binder for the organized workspace.
- **Office Notepads** — white A4 sheet, sticky sheet, and A4 stack from the asset. The yellow pads are not used because they fight the brand palette.

Texture audit copies: the GLBs contain embedded JPG textures, which is what the runtime uses. Extracted copies are kept under `public/textures/polyhaven/` so the source and license can be inspected without unpacking a binary. They are not requested separately at runtime.

| Extracted file | Bytes |
| --- | --- |
| `binder-notebook/binder_notebook_diff.jpg` | 533,256 |
| `binder-notebook/binder_notebook_metal-binder_notebook_rough.jpg` | 507,028 |
| `binder-notebook/binder_notebook_nor_gl.jpg` | 319,694 |
| `drawer-cabinet/drawer_cabinet_diff.jpg` | 150,011 |
| `drawer-cabinet/drawer_cabinet_metallic.png-drawer_cabinet_roughness.png.jpg` | 124,942 |
| `drawer-cabinet/drawer_cabinet_nor_gl.jpg` | 61,593 |
| `office-notepads/office_notepads_diff.jpg` | 460,873 |
| `office-notepads/office_notepads_nor_gl.jpg` | 393,394 |
| `office-notepads/office_notepads_rough.jpg` | 445,320 |

### 5.3 Procedural 3D content

The desk, travertine top, leather mat, lamp, brass pen, terracotta/gold context thread, halos, folder prop, and every document face are original procedural Three.js geometry and CanvasTexture artwork created in this repository. The document text is synthetic sample material written for the site; it does not reproduce any real client, meeting, or personal data. It is project-owned and is not a third-party asset.

**Asset limitation:** no external GLB was added for paper sheets, folders, or calendars. Those objects are procedural so their typography stays legible, matches the design system, and can display the product's sample content. This avoids shipping unreadable stock textures and keeps the total download small.

---

## 6. Brand assets

| Asset | Description | Origin | Status |
| --- | --- | --- | --- |
| Wordmark | "HINTERLAND" set in Newsreader with defined spacing | Original project work | In use |
| Editorial mark | Simple square or rule used with the wordmark | Original project work | In use |
| Tagline lockup | "The work behind the work." in DM Sans | Original project work | In use |
| Favicon | Local SVG mark at `src/app/icon.svg` | Original project work | In use |
| Color tokens | Specified brand palette | Project brief | Defined in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) |
| Product copy | All interface and marketing copy | Original project work | In use |

The brand name, wordmark, and tagline are project assets. Trademark availability and registration have not been verified. Legal clearance is required before public branding claims or registration.

---

## 7. Imagery and illustration

| Category | Current use | Policy |
| --- | --- | --- |
| Photography | None | Avoid generic stock imagery. Any future photograph requires a license entry and must not depict identifiable people without releases. |
| Illustration | None | Prefer typography, rules, and real interface fragments over decorative illustration. |
| AI-generated imagery | None | If used, record tool, prompt date, and applicable usage terms. Do not create fake product screenshots, fake customer logos, or synthetic testimonials. |
| 3D graphics | Three CC0 Poly Haven models plus original procedural desk, lamp, folders, documents, and thread in the scroll experience | Only registered CC0 or appropriately licensed assets. No runtime hotlinking. No glowing AI brains, purple holograms, neon networks, or random sci-fi objects. |
| Decorative icons and symbols | None beyond Lucide | No floating neural networks, orbs, or AI symbols. |

Product screenshots and interface compositions must show real, implemented UI. Do not fabricate screenshots of features that do not exist.

---

## 8. Third-party software

The following dependencies are in use or planned. Exact versions are pinned in `package.json` and the lockfile; licenses are confirmed from the installed packages and their license files.

| Software | Purpose | License | Notes |
| --- | --- | --- | --- |
| Next.js | Web framework | MIT | Retain license notice |
| React | UI library | MIT | Retain license notice |
| TypeScript | Language tooling | Apache-2.0 | Retain license and notices |
| Tailwind CSS | Utility styling | MIT | Retain license notice |
| Supabase JS client | Auth, database, storage client | MIT | Retain license notice |
| Supabase platform | Hosted Postgres, auth, storage | Apache-2.0 for the open-source platform; hosted service governed by Supabase terms | Service terms reviewed separately |
| Zod | Schema validation | MIT | Planned; not installed in the frontend demo |
| `radix-ui` | Accessible primitives for dialogs, tabs, sheets, and tooltips | MIT | Installed; retain license notice |
| `class-variance-authority` | Variant styling for UI primitives | Apache-2.0 | Installed; retain license notice |
| `tw-animate-css` | Animation utilities | MIT | Installed; retain license notice |
| `@tailwindcss/postcss` | Tailwind PostCSS integration | MIT | Installed development dependency |
| `shadcn` CLI | Component scaffolding | MIT | Installed development tooling |
| `cn` | Class-name helper used by UI primitives | MIT | Installed; retain license notice |
| `lucide-react` | Icons | ISC | Retain license notice |
| `three` 0.187.0 | 3D renderer | MIT | Installed; retain license notice |
| `@react-three/fiber` 9.8.2 | React renderer for Three.js | MIT | Installed; retain license notice |
| `@react-three/drei` 10.7.9 | Three.js helpers (`useGLTF`, Environment, etc.) | MIT | Installed; retain license notice |
| `gsap` 3.15.1 incl. ScrollTrigger | Scroll timeline and pinning | Standard “no charge” license — https://gsap.com/standard-license | Installed; review upstream terms before release |
| `mammoth` | DOCX text extraction | BSD-2-Clause | Retain copyright and license |
| PDF extraction library | PDF text extraction | To be selected | Must be recorded here before Phase 2 completion |
| Vitest | Unit and integration testing | MIT | Development dependency |
| Playwright | End-to-end testing | Apache-2.0 | Development dependency |
| axe-core | Accessibility testing, if used | MPL-2.0 | Development dependency; file-level copyleft obligations apply to modified files |

### 8.1 Dependency obligations

- Generate and maintain a third-party notices inventory from the lockfile before release.
- Do not remove license files from dependencies.
- Review licenses for any dependency that is added after this document.
- Avoid dependencies with incompatible or unclear licenses.
- Run a dependency audit in CI.
- An SBOM or machine-readable license report should be produced before a public release if distribution requires it.

---

## 9. Asset register

| ID | Asset | Location | Type | Source | License | Status |
| --- | --- | --- | --- | --- | --- | --- |
| A-001 | Newsreader font | Build-time font loading (`next/font/google`) | Font | Google Fonts / Production Type | OFL-1.1 | In use |
| A-002 | DM Sans font | Build-time font loading (`next/font/google`) | Font | Google Fonts / Colophon Foundry | OFL-1.1 | In use |
| A-003 | Lucide icons | Dependency | Icon set | lucide.dev | ISC | In use |
| A-004 | Paper grain texture | `public/textures/paper-grain.svg` | Texture | Original | Project-owned | In use |
| A-005 | Wordmark | Component-level typographic lockup | Brand | Original | Project-owned | In use |
| A-006 | Tagline lockup | Component-level typographic lockup | Brand | Original | Project-owned | In use |
| A-007 | Interface copy | Application source | Text | Original | Project-owned | In use |
| A-008 | Test fixtures | `tests/fixtures/` | Text and documents | Synthetic or anonymized | Project-owned | Planned |
| A-009 | PDF extraction library | Dependency | Software | To be selected | TBD | Blocked until selection |
| A-010 | Drawer Cabinet model | `public/models/drawer-cabinet.glb` | 3D model | Poly Haven / Ulan Cabanilla | CC0 1.0 | In use |
| A-011 | Binder Notebook model | `public/models/binder-notebook.glb` | 3D model | Poly Haven / DaDrood | CC0 1.0 | In use |
| A-012 | Office Notepads model | `public/models/office-notepads.glb` | 3D model | Poly Haven / Ulan Cabanilla | CC0 1.0 | In use |
| A-013 | Poly Haven texture audit copies | `public/textures/polyhaven/` | Textures | Extracted from A-010–A-012 | CC0 1.0 | In use (audit only) |
| A-014 | Procedural 3D scene assets | `src/components/3d/` | Geometry and textures | Original | Project-owned | In use |
| A-015 | Sample 3D document content | Generated at runtime | Text | Original, synthetic | Project-owned | In use |
| A-016 | Favicon mark | `src/app/icon.svg` | Brand | Original | Project-owned | In use |

No unregistered asset may be committed.

---

## 10. Test fixtures and sample content

- Fixtures must be synthetic or properly anonymized.
- Do not use real client documents, transcripts, names, or meeting notes.
- Do not use copyrighted articles, reports, or templates as fixtures.
- If a public-domain sample is used, record its source and public-domain status.
- Generated fixture text is project-owned and must not contain personal data.

---

## 11. Verification before release

Before any public deployment:

- [ ] Confirm the upstream license for each font and include the OFL text.
- [ ] Confirm the installed icon package license.
- [x] Verify and record the CC0 license for each Poly Haven model (2026-11-08).
- [x] Confirm every 3D model and texture is stored locally and not hotlinked at runtime.
- [ ] Confirm every dependency license from the lockfile.
- [ ] Record the selected PDF extraction library and its license.
- [ ] Confirm no stock or generated imagery is unregistered.
- [ ] Confirm no placeholder asset remains.
- [ ] Confirm the product does not use prohibited AI visual motifs.
- [ ] Confirm brand-name trademark clearance has been reviewed by legal.
- [ ] Confirm the privacy notice lists third-party processors separately from asset licenses.
- [ ] Add any new asset to the register before merge.

---

## 12. Attribution text

When attribution is required or appropriate, use a concise notices page or repository license inventory rather than cluttering the interface. A suitable wording for font notices is:

> Newsreader and DM Sans are used under the SIL Open Font License 1.1. Lucide icons are used under the ISC License. 3D models by Ulan Cabanilla and DaDrood are used under CC0 1.0 via Poly Haven. Full license texts are included with the distributed software.

No attribution is legally required for the CC0 models; the credit is retained as a courtesy and to keep provenance auditable. Do not claim endorsement by any font foundry, icon maintainer, model creator, or software vendor.

---

## 13. Open items

| Item | Owner | Needed by |
| --- | --- | --- |
| Verify OFL license text for both fonts | Engineering | Phase 1 |
| Select and register the PDF extraction library | Engineering | Phase 2 |
| Produce third-party notices inventory | Engineering | Phase 8 |
| Confirm brand-name trademark status | Legal | Before public launch |
| Confirm no unregistered imagery at launch | Design and engineering | Phase 8 |
