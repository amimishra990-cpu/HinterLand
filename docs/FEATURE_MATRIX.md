# HINTERLAND — Feature Matrix

**Document status:** Scope authority for the MVP  
**Version:** 1.0  
**Last updated:** 2026-11-08  
**Companion documents:** [PRODUCT_SPEC.md](./PRODUCT_SPEC.md), [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)

---

## 1. How to read this matrix

This document is the single source of truth for what is built now, what is deferred, and what is intentionally excluded.

| Classification | Meaning | Release impact |
| --- | --- | --- |
| **Core MVP** | Required for the first functional release. The product is not acceptable without it. | Blocking |
| **Secondary improvement** | Planned for the release immediately following the MVP. Valuable, but must not delay MVP acceptance. | Non-blocking |
| **Long-term planned** | Part of the product vision. Requires new product, legal, or infrastructure work. | Not scheduled |
| **Explicitly excluded** | Behavior the product must never perform, or scope that is deliberately rejected. | Prohibited / rejected |

The repository implements the MVP capabilities below against Supabase Auth,
Postgres with row-level security, and private storage. CTX-01, CTX-04, CTX-05, and
the account-deletion branch of TRUST-09 are implemented end to end: projects can
be created, renamed, archived, restored, and deleted with stated consequences;
pasted sources are stored, labelled, editable, searchable, and
project-associated; and account deletion removes stored files, owned rows, and
the auth account after password reauthentication. See
[TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md#0-as-built-implementation) for the as-built inventory.

### 1.1 Scope rule

The six features in the Product Specification define the product's permanent functional identity. The MVP implements five capabilities that draw on four of those six features. This is intentional, not a contradiction:

| Product feature | MVP status | MVP capability mapping |
| --- | --- | --- |
| 01 Context-aware communication refinement | Core MVP | MVP capability 3 |
| 02 Intelligent meeting preparation | Core MVP | MVP capability 2 |
| 03 Meeting intelligence and documentation | Core MVP (summary, decisions, actions, open questions, approval, save) | MVP capability 4 |
| 04 Project and document intelligence | Secondary improvement | Not in the five MVP capabilities |
| 05 Personalized professional development | Secondary improvement (minimal form); advanced is long-term | Not in the five MVP capabilities |
| 06 Contextual knowledge repository | Core MVP (save, organize, keyword search) | MVP capability 5 |

MVP capability 1 (context input) is a platform capability that enables features 01, 02, 03, and 06.

---

## 2. Core MVP

### 2.1 Context input and project foundation

| ID | Capability | Requirement | Depends on | Phase |
| --- | --- | --- | --- | --- |
| CTX-01 | Project workspaces | Create, rename, archive, and delete projects. Each project holds a name, optional description, and objectives. | Authentication | 1 |
| CTX-02 | PDF ingestion | Upload a text-based PDF, extract its text, store the original file privately, and display extraction status. Scanned or image-only PDFs fail with a clear OCR-not-supported message. | Storage, extraction | 2 |
| CTX-03 | DOCX ingestion | Upload a DOCX file, extract paragraph text, store the original file privately, and display extraction status. | Storage, extraction | 2 |
| CTX-04 | Pasted context | Paste agendas, previous notes, transcripts, or other text as a named context source. | Project workspaces | 2 |
| CTX-05 | Source labeling | Label a source as project document, agenda, previous notes, transcript, or general note. | Ingestion | 2 |
| CTX-06 | Document library | List sources with title, type, upload date, extraction status, and text size. Open a read-only extracted-text view. | Ingestion | 2 |
| CTX-07 | Explicit context selection | Choose which sources inform each generation. Show which sources were used and warn when the context budget is reached. | Document library | 3 |
| CTX-08 | Source deletion | Delete a source and its stored file and derived text. Warn when an approved record cites it. | Storage, records | 2 |

### 2.2 Communication refinement

| ID | Capability | Requirement | Depends on | Phase |
| --- | --- | --- | --- | --- |
| REF-01 | Draft and intention capture | Accept a draft and an optional stated intention and audience description. Keep the original visible. | Project context | 4 |
| REF-02 | Intent-preserving refinement | Produce a refined version that improves clarity, structure, tone, and persuasiveness without changing the stated intention. | AI foundation | 4 |
| REF-03 | Ambiguity findings | Identify ambiguous or potentially misunderstood wording and explain the risk. | AI foundation | 4 |
| REF-04 | Audience alternatives | Produce alternative versions for different audiences, each labeled with the audience assumption used. | AI foundation | 4 |
| REF-05 | Change explanation | Explain why the original wording may be ineffective and what each meaningful change addresses. | AI foundation | 4 |
| REF-06 | Grounding and fidelity | Cite project sources used. Flag any place where the draft relies on an unstated fact, commitment, metric, or agreement. | Evidence system | 4 |
| REF-07 | Approval gate | Refined text is a draft until the user explicitly approves or copies it. No automatic saving. | Review system | 4 |

### 2.3 Meeting preparation

| ID | Capability | Requirement | Depends on | Phase |
| --- | --- | --- | --- | --- |
| PREP-01 | Meeting record | Create a meeting with title, date, optional agenda source, and optional supplied attendee list. | Project context | 5 |
| PREP-02 | Talking points | Generate ordered talking points grounded in selected sources. | AI foundation | 5 |
| PREP-03 | Questions | Suggest relevant questions, grouped by theme, with the reason each matters. | AI foundation | 5 |
| PREP-04 | Gaps and risks | Identify missing information, potential risks, and subjects requiring clarification. | AI foundation | 5 |
| PREP-05 | Contribution sequence | Organize recommended contributions into a logical sequence. | AI foundation | 5 |
| PREP-06 | Source transparency | Show which sources informed each preparation item and mark suggestions that are not grounded in supplied material. | Evidence system | 5 |
| PREP-07 | Approval gate | Save a preparation brief only after explicit user approval. | Review system | 5 |

### 2.4 Meeting documentation

| ID | Capability | Requirement | Depends on | Phase |
| --- | --- | --- | --- | --- |
| DOC-01 | Notes or transcript input | Paste meeting notes or a transcript and associate it with a project and meeting. | CTX-04 | 6 |
| DOC-02 | Discussion points | Extract key discussion points with source evidence. | AI foundation | 6 |
| DOC-03 | Decisions | Extract confirmed decisions only. A proposal or unresolved debate is not a decision. | AI foundation | 6 |
| DOC-04 | Open questions | Extract unresolved questions and mark them as unresolved. | AI foundation | 6 |
| DOC-05 | Action items | Extract action items with explicit owner and deadline only when stated. Otherwise mark owner and/or deadline as "Not specified". | AI foundation | 6 |
| DOC-06 | Summary | Generate a concise meeting summary grounded in the supplied notes. | AI foundation | 6 |
| DOC-07 | Item-level review | Edit, accept, remove, or reclassify individual extracted items before record approval. | Review system | 6 |
| DOC-08 | Record approval | Approve the complete record only after review. Approval records the actor and timestamp. | Review system, audit | 6 |
| DOC-09 | Unreviewed items | Prevent approval while any item is flagged as unsupported or undecided, unless the user explicitly resolves it. | Review system | 6 |

### 2.5 Knowledge storage and retrieval

| ID | Capability | Requirement | Depends on | Phase |
| --- | --- | --- | --- | --- |
| KNOW-01 | Approved-only storage | Only approved meeting records enter the knowledge repository. Drafts remain separate; approved preparation briefs and refinement variants are not published to knowledge in the MVP. | DOC-08 | 6 |
| KNOW-02 | Categorization | Organize records by project, meeting, date, and topic tags. | Projects, meetings | 6 |
| KNOW-03 | Project folders | Browse approved records inside a project by type and date. | KNOW-01 | 6 |
| KNOW-04 | Keyword search | Search approved record titles and content. Filter by project, record type, date range, and topic. | Search index | 7 |
| KNOW-05 | Record detail | Open a record to view summary, decisions, open questions, actions, evidence, approval metadata, and source meeting. | KNOW-01 | 6 |
| KNOW-06 | Empty and no-result states | Explain when no approved records exist or no query matches, and suggest a broader query. | Search | 7 |

### 2.6 Trust, privacy, and platform requirements

These are core because the product principles are mandatory.

| ID | Capability | Requirement | Phase |
| --- | --- | --- | --- |
| TRUST-01 | Authentication | Users sign in through Supabase Auth. All application routes beyond the landing and auth pages require a session. | 1 |
| TRUST-02 | Owner isolation | Every project, source, meeting, draft, record, and knowledge item is scoped to one owner. Enforced in the database with row-level security and rechecked in server code. | 1 |
| TRUST-03 | Private file storage | Uploaded files live in a private bucket. Access uses short-lived signed URLs scoped to the owner. | 2 |
| TRUST-04 | Evidence references | Every decision, action owner, and deadline carries a reference to a source excerpt and location. | 3 |
| TRUST-05 | Evidence validation | The server verifies that cited excerpts exist in the cited source before presenting them as verified. Unverified items are visibly flagged. | 3 |
| TRUST-06 | No invented commitments | Server-side post-processing removes or blanks any owner, deadline, or decision that lacks evidence. | 3 |
| TRUST-07 | Human approval | No generated content is saved to knowledge or shared without explicit approval. | 3–6 |
| TRUST-08 | Audit trail | Record who approved what and when. Generation runs log feature, model, prompt version, source references, status, and usage metadata. | 3 |
| TRUST-09 | Deletion | Users can delete sources, records, projects, and their account data, including stored files and derived text. | 2–8 |
| TRUST-10 | Failure transparency | Generation and extraction failures surface a clear error and never silently substitute unsupported output. | 3 |
| TRUST-11 | Cost and abuse controls | Per-user rate limits and configurable context/output budgets apply to AI requests and uploads. | 3 |
| TRUST-12 | Accessibility | Core flows meet WCAG 2.2 AA expectations defined in the design system. | 8 |

---

## 3. Secondary improvements

These follow the MVP. They must not be pulled forward without a documented scope change.

| ID | Improvement | Description | Rationale for deferral | Dependency |
| --- | --- | --- | --- | --- |
| SEC-01 | Professional meeting minutes | Generate a formal minutes document from an approved meeting record. | MVP requires summary, decisions, and actions; minutes formatting is additive. | DOC-08 |
| SEC-02 | Follow-up documents | Draft a follow-up message or recap from an approved record. | Requires refinement and records to be stable first. | DOC-08, REF-02 |
| SEC-03 | Record export | Export approved records as Markdown first; evaluate DOCX and PDF later. | Search and retrieval satisfy the MVP storage capability. | KNOW-01 |
| SEC-04 | Document intelligence workspace | Analyze a selected document for missing arguments, logical gaps, inconsistencies, unclear reasoning, and missing support. | Feature 04 is not one of the five MVP capabilities. | CTX-02/03, AI foundation |
| SEC-05 | Document-to-project connections | Link documents to relevant meetings, objectives, and prior decisions. | Requires stable records and a relevance mechanism. | SEC-04, KNOW-01 |
| SEC-06 | Related knowledge suggestions | Suggest related approved records when viewing a document, meeting, or record. | Adds retrieval complexity beyond keyword search. | KNOW-04 |
| SEC-07 | Style examples | Let users mark approved writing as style examples used in later refinement. | Minimal personalization is explicitly post-MVP. | REF-07 |
| SEC-08 | Explicit feedback | Capture thumbs-up/down and an optional reason on generated suggestions. | Requires enough usage to be meaningful. | REF/PREP/DOC |
| SEC-09 | Basic style profile | Summarize observed tone and structure preferences from approved examples and feedback, visible and resettable by the user. | Advanced personalization is a long-term capability. | SEC-07, SEC-08 |
| SEC-10 | Record version history | Compare approved record versions and restore a prior version. | MVP retains the approved snapshot and audit event; diffing is additive. | DOC-08 |
| SEC-11 | Copy-ready formatting | Offer channel-aware plain-text formatting for email, chat, and documents. | Refinement works without channel-specific formatting. | REF-02 |
| SEC-12 | Bulk knowledge organization | Apply topics or move multiple records between topics. | Single-record organization is sufficient for MVP. | KNOW-02 |

---

## 4. Long-term planned

These are part of the product vision. They are not designed or scheduled. Each requires a separate specification, privacy review, and architecture decision.

| ID | Capability | Description | Why it is long-term |
| --- | --- | --- | --- |
| LT-01 | Audio recording | Record meetings with participant consent and store audio securely. | Consent, retention, and jurisdiction requirements need dedicated design. |
| LT-02 | Live meeting assistance | Real-time transcription and in-meeting prompts. | Requires streaming infrastructure, low latency, and new consent flows. |
| LT-03 | Advanced personalization | Longitudinal communication coaching and adaptive style modeling. | Requires sufficient approved data, evaluation, and user control safeguards. |
| LT-04 | Google Drive integration | Import and sync documents from Google Drive. | OAuth scopes, revocation, and third-party data handling require separate design. |
| LT-05 | Other cloud-drive integrations | Additional document providers. | Same as LT-04. |
| LT-06 | Semantic search | Embedding-based retrieval over approved knowledge. | MVP keyword search is sufficient; embeddings add cost and evaluation burden. |
| LT-07 | Team workspaces | Shared projects, roles, and permissions. | MVP privacy model is single-owner; sharing changes the entire authorization model. |
| LT-08 | Organization-wide integrations | Enterprise systems, SSO, directory sync, and admin controls. | Requires enterprise security and procurement readiness. |
| LT-09 | Real-time collaboration | Multiple users editing and reviewing records simultaneously. | Requires presence, conflict resolution, and new audit semantics. |
| LT-10 | Enterprise administration and compliance | Central policy, retention, audit export, and compliance reporting. | Requires legal and security programs beyond MVP. |
| LT-11 | Organization-specific workflows | Configurable templates, approval chains, and terminology. | Needs validated demand and a configuration model. |
| LT-12 | Team knowledge management | Shared organizational memory across projects. | Depends on team workspaces and access-control redesign. |
| LT-13 | Consultant and multi-client patterns | Separate client contexts with controlled cross-client isolation. | Depends on team and organization models. |

---

## 5. Cross-cutting requirements

These apply to every feature at every classification level.

| Requirement | Core MVP obligation | Applies to |
| --- | --- | --- |
| Intent preservation | Original text and stated intention remain visible beside refinements. | REF |
| Human approval | Generation never writes directly to knowledge or shares externally. | REF, PREP, DOC |
| Evidence traceability | Claims about decisions, owners, and deadlines link to a source excerpt. | PREP, DOC, KNOW |
| Uncertainty labeling | Unsupported fields display "Not specified" and are visually distinct. | PREP, DOC |
| Project isolation | Context is assembled only from the active project and owner. | All |
| Source transparency | The interface lists the sources used for each generation. | REF, PREP, DOC |
| Data minimization | Only user-selected, project-scoped content is sent to the AI provider. | All AI features |
| Deletion | Derived text, stored files, and records are removed when deleted. | All |
| Accessibility | Keyboard access, visible focus, labeled controls, non-color status cues. | All |
| Failure transparency | Errors, truncation, and unsupported sources are explicit. | All |

---

## 6. Explicitly excluded

### 6.1 Prohibited product behavior

Hinterland must never:

- Send, post, or publish content on a user's behalf automatically.
- Save generated content to the knowledge repository without explicit approval.
- Invent a responsible individual, deadline, decision, metric, or agreement.
- Present an inference as a confirmed fact.
- Record audio or a meeting without participant consent.
- Expose one user's documents or records to another user.
- Use one project's context in another project's generation without explicit user action.
- Present generated evidence that has failed server-side validation as verified.
- Silently degrade to ungrounded output when retrieval or generation fails.
- Train a custom model on user content.

### 6.2 Deliberately rejected scope

These are not product goals, even long-term:

- General-purpose conversational assistant.
- HR performance scoring or employee evaluation.
- Autonomous negotiation or commitment-making.
- Full document authoring suite.
- Project management boards, sprints, or resource planning.
- Built-in recording hardware or meeting-bot participation without consent.
- A universal "professional tone" that overrides user voice.
- Claims of factual correctness for supplied source material.
- Custom model training or fine-tuning.

---

## 7. MVP acceptance criteria

The MVP is accepted only when every criterion below is demonstrably true.

### 7.1 Context input

- A user can create a project, add a text-based PDF, add a DOCX, and paste notes.
- Extracted text is visible and associated with the correct source.
- A scanned PDF produces a clear OCR-not-supported error, not an empty success.
- Another authenticated user cannot open, list, download, or search any of these sources.

### 7.2 Meeting preparation

- A user selects an agenda and prior notes, then receives talking points, questions, gaps, risks, and a contribution sequence.
- Each item identifies its sources or is marked as a suggestion not grounded in supplied material.
- The brief is not saved until the user approves it.

### 7.3 Communication refinement

- A user supplies a draft, intention, and audience.
- The result includes a refined version, at least one audience alternative, ambiguity findings, and an explanation of changes.
- The original draft and intention remain visible.
- No unsupported fact, commitment, or metric is introduced.
- Nothing is saved automatically.

### 7.4 Meeting documentation

- A user pastes notes or a transcript and receives a summary, discussion points, decisions, open questions, and action items.
- Every owner and deadline is either explicitly supported by a cited excerpt or displayed as "Not specified".
- The user can edit or remove each item.
- Approval is blocked while unresolved unsupported items remain.
- Approval stores the record and an audit event.

### 7.5 Knowledge storage

- An approved summary appears in the correct project with meeting, date, and topics.
- Keyword search finds it by title and body text.
- Filters by project, record type, and date range work.
- A draft never appears in search results.
- Another user cannot retrieve it by search, direct URL, or API call.

---

## 8. Scope change control

1. Any addition to the Core MVP requires an update to this document and [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) before implementation.
2. Any secondary improvement pulled into the MVP requires an explicit entry in the implementation plan with a dependency and exit criterion.
3. Any capability that conflicts with Section 6 requires a product-principles review and is rejected by default.
4. Implementation may not introduce an integration, data source, or AI capability not described here without documenting it first.
5. The feature matrix and product specification must remain consistent; contradictions are resolved in favor of [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) until this document is amended.
