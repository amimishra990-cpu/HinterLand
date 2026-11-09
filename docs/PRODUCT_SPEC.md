# HINTERLAND — Product Specification

**Brand:** Hinterland  
**Tagline:** The work behind the work.  
**Document status:** Approved source of truth for the MVP  
**Version:** 1.0  
**Last updated:** 2026-11-08  
**Owner:** Product

---

## 1. Product identity

Hinterland is a context-aware professional productivity and intelligence platform. It connects professional communication, meeting preparation, meeting documentation, project understanding, personalized development, and knowledge management.

The central idea is that professional information should not be treated as isolated messages, documents, and meetings. Hinterland understands the relationship between a user's current task, previous discussions, project objectives, documents, and decisions.

Hinterland helps people:

- Express their thoughts more clearly.
- Prepare meaningful contributions before meetings.
- Identify missing information and relevant questions.
- Convert meetings into structured outcomes.
- Understand projects and their documents.
- Preserve useful knowledge for future work.
- Improve their professional communication over time.

Hinterland assists human judgment. It does not replace it.

### 1.1 Positioning statement

For students, early-career professionals, startup teams, corporate employees, managers, and academic teams who lose continuity across messages, meetings, and documents, Hinterland is a professional copilot that connects intent, context, and outcomes. Unlike isolated writing assistants and meeting summarizers, Hinterland preserves the thread between what a person meant, what their project needs, what was decided, and what happens next.

### 1.2 Brand promise

Hinterland makes the invisible work behind clear communication visible and reusable: the context gathering, the missing question, the decision trail, and the follow-through.

### 1.3 Brand expression

Hinterland's visual direction is editorial, sophisticated, warm, professional, and human-centered. It must avoid the stereotypical AI aesthetic: no purple-blue gradients, neon cyan, glowing neural networks, floating AI symbols, excessive glassmorphism, or generic AI landing-page templates.

The identity uses Warm Ivory `#F5F2E9`, Charcoal Ink `#222C25`, Forest Green `#304E3E`, Muted Sage `#AAB5A1`, Terracotta `#C47B5B`, Antique Gold `#C9AD75`, and Soft Stone `#E5E1D6`. Headings use Newsreader; interface and body text use DM Sans; icons use Lucide. The full visual and interaction specification is in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

---

## 2. Problem statement

People in academic and professional environments frequently struggle with:

- Expressing ideas clearly.
- Contributing meaningful points during meetings.
- Understanding ongoing projects.
- Identifying missing arguments and information.
- Maintaining continuity across discussions.
- Converting conversations into actionable outcomes.
- Keeping documentation consistent.

Most AI tools solve isolated tasks such as grammar correction, document generation, and meeting summarization. They often fail to connect:

- User intentions.
- Previous discussions.
- Project objectives.
- Communication preferences.
- Documents and meeting notes.
- Previous decisions.

The consequences are miscommunication, repeated work, missed discussion points, inconsistent documentation, and loss of project continuity.

### 2.1 Root causes

1. **Fragmented context.** The information needed to write well or contribute well is spread across files, inboxes, chats, and meetings.
2. **Intent loss.** Editing tools improve prose without understanding what the author is trying to achieve or protect.
3. **No memory of decisions.** Meetings produce conversations, not durable records; past conclusions are hard to retrieve.
4. **Generic assistance.** Recommendations are not grounded in a specific project, audience, or prior discussion.
5. **Weak evidence discipline.** Generated summaries can invent owners, deadlines, or decisions that were never stated.

---

## 3. Proposed solution

Hinterland is a unified professional copilot that uses user-provided context, including:

- Project documents.
- Meeting agendas.
- Previous meeting notes.
- Project objectives.
- Previous decisions.
- User-approved communication examples.

The system:

- Refines communication without changing the original intention.
- Identifies ambiguous statements.
- Suggests missing arguments and relevant questions.
- Improves professional documents.
- Generates meeting talking points.
- Converts discussion notes into summaries and action items.
- Maintains a searchable repository of approved information.
- Adapts to the user's communication preferences.

All generated content is reviewable before it is saved or shared. All generated claims about decisions, owners, and deadlines must be traceable to supplied information.

### 3.1 The context loop

Hinterland's product logic is a loop, not a set of disconnected tools:

```
Project objectives and documents
        ↓
Preparation for a specific discussion
        ↓
Communication refined for a specific audience
        ↓
Meeting discussed and documented
        ↓
Approved decisions, actions, and open questions
        ↓
Knowledge repository
        ↓
Context for the next discussion
```

Every feature either consumes context from this loop or adds reviewed, reusable context back into it.

---

## 4. Users

### 4.1 Primary users

| Persona | Context | Core needs | Current failure mode |
| --- | --- | --- | --- |
| Student or early-career professional | Group projects, internships, first professional roles | Communicate clearly, contribute in meetings, understand expectations | Holds back in discussions; writes messages that are unclear or over-explained |
| Startup team member | Fast-moving product and business work | Keep decisions, rationale, and follow-ups in one thread | Context lives in chat; decisions are revisited; documentation is inconsistent |
| Corporate employee or manager | Cross-functional meetings, proposals, reports | Prepare a credible point of view; convert meetings into accountable outcomes | Meetings end without durable records; arguments have gaps |
| Researcher or academic team | Papers, proposals, reviews, lab or program meetings | Preserve reasoning, cite prior decisions, keep documentation consistent | Feedback and rationale are scattered across notes and email |

### 4.2 Potential future users

- Enterprises.
- Consultants and freelancers.
- Educational institutions.

These segments are not targeted by the MVP and must not drive MVP scope.

### 4.3 Jobs to be done

1. "Help me say what I mean, in a way this audience will understand."
2. "Help me walk into this meeting with something useful to contribute."
3. "Turn this messy conversation into decisions, owners, and next steps I can trust."
4. "Help me see what this project's documents are missing."
5. "Let me find what we already decided without rereading everything."
6. "Help me communicate better over time without flattening my voice."

### 4.4 User capabilities assumed

- Comfort using a web application.
- Ability to supply documents, pasted notes, or transcripts.
- Willingness to review generated output before it is stored or shared.

No specific industry, organization size, or paid-plan assumption applies to the MVP.

---

## 5. Product principles

These principles are binding on design, engineering, and copywriting.

1. **Intent preservation.** Refinement improves clarity, structure, tone, and persuasiveness without changing what the user meant. The original text and stated intention remain visible.
2. **Evidence over inference.** Decisions, owners, and deadlines are only recorded when explicitly supported by supplied information. Unknowns are labeled, not filled in.
3. **Human approval.** Generated content is a draft. Nothing is saved to the knowledge repository or shared without explicit user approval.
4. **Context continuity.** Approved project information remains available to later work. Context does not silently cross project boundaries.
5. **Honest uncertainty.** The system distinguishes confirmed facts, inferences, and unknowns in both content and interface.
6. **Privacy by default.** Users control which documents and records are accessible; one user's material is never exposed to another.
7. **Calm, editorial craft.** The interface should feel like a considered professional tool, not a generic AI product.
8. **Assistance, not authorship.** The user remains the author and decision-maker. Hinterland proposes; the user disposes.

---

## 6. Core product capabilities

The six capabilities below are the product's permanent functional definition. Their MVP status is specified in Section 8 and in [FEATURE_MATRIX.md](./FEATURE_MATRIX.md).

### 6.1 Feature 01 — Context-aware communication refinement

**Purpose:** Improve a draft while preserving the author's intention and adapting it to a specific audience.

**Inputs:**
- Original message, email, proposal, or discussion points.
- Optional stated intention ("I want them to approve the timeline without sounding defensive").
- Optional audience description.
- Selected project context and prior approved records.

**Required behavior:**
- Preserve the original meaning and intention.
- Identify ambiguous or potentially misunderstood wording.
- Improve clarity, structure, tone, and persuasiveness.
- Suggest alternative versions for different audiences.
- Explain why the original wording might be ineffective.

**Outputs:**
- A refined version that preserves intent.
- One or more audience-specific alternatives.
- An explanation of changes and identified risks of misreading.
- Ambiguity and clarity findings.
- Evidence references to any project context used.

**Guardrails:**
- Do not invent facts, commitments, metrics, or agreements.
- Do not silently change the requested outcome of the message.
- Do not present stylistic preference as objective correctness.

**MVP status:** Core MVP.

### 6.2 Feature 02 — Intelligent meeting preparation

**Purpose:** Help a user contribute meaningfully to an upcoming discussion.

**Inputs:**
- Meeting agenda.
- Previous meeting notes.
- Project documents.
- Project objectives.
- Optional user goals for the meeting.

**Required behavior:**
- Understand the discussion context.
- Generate relevant talking points.
- Suggest questions and arguments.
- Identify missing information and potential risks.
- Highlight subjects requiring clarification.
- Organize contributions into a logical sequence.

**Outputs:**
- Ordered talking points.
- Questions to ask, grouped by theme.
- Arguments and supporting references.
- Gaps, risks, and clarification topics.
- A recommended contribution sequence.

**Guardrails:**
- Distinguish what the supplied material states from what is suggested.
- Do not invent stakeholder positions or prior agreements.
- Show which sources informed each point.

**MVP status:** Core MVP.

### 6.3 Feature 03 — Meeting intelligence and documentation

**Purpose:** Convert discussion notes or transcripts into structured, reviewable outcomes.

**Inputs:**
- Pasted transcript or meeting notes.
- Optional meeting metadata (title, date, agenda, attendee list as supplied by the user).

**Required extraction:**
- Key discussion points.
- Confirmed decisions.
- Unresolved questions.
- Action items.
- Responsible individuals, only when explicitly supported.
- Deadlines, only when explicitly supported.

**Required generated outputs:**
- Meeting summary.
- Professional meeting minutes (secondary scope).
- Follow-up documents (secondary scope).

**Review requirement:** Users must review and approve generated records before saving or sharing. Approval applies to the complete record and to individual items.

**Guardrails:**
- Never invent responsible individuals or deadlines.
- If a speaker is unidentified, do not guess an identity.
- If an action has no explicit owner or date, record it as unassigned or undated and mark it for user attention.
- Decisions must cite the passage that supports them.

**MVP status:** Core MVP for summary, decisions, open questions, action items, review, approval, and save. Minutes and follow-up documents are secondary improvements.

### 6.4 Feature 04 — Project and document intelligence

**Purpose:** Help users understand whether project documents are complete, coherent, and connected to prior work.

**Inputs:**
- Reports, proposals, presentations, and other professional documents.
- Project objectives.
- Prior approved meetings and decisions.

**Required analysis:**
- Missing arguments.
- Logical gaps.
- Inconsistencies.
- Unclear reasoning.
- Missing supporting information.

**Required connections:**
- Link documents with relevant meetings, objectives, and previous decisions.

**MVP status:** Secondary improvement. The MVP supports document ingestion and uses documents as context, but does not include a dedicated document-analysis workspace.

### 6.5 Feature 05 — Personalized professional development

**Purpose:** Help users improve communication over time through approved examples and explicit feedback.

**Required behavior:**
- Learn writing style and tone from user-approved examples and explicit feedback.
- Provide personalized suggestions.
- Identify unnecessary complexity.
- Highlight unclear phrasing.
- Identify weak argument structure.
- Explain improvements.
- Adapt to different audiences without enforcing one communication style.

**Guardrails:**
- Personalization is opt-in and inspectable.
- Users can remove examples and reset learned preferences.
- Hinterland does not score a person's professional worth or enforce a single "correct" style.

**MVP status:** Secondary improvement in a minimal form (approved examples and explicit thumbs-up/down feedback). Advanced personalization and coaching are long-term.

### 6.6 Feature 06 — Contextual knowledge repository

**Purpose:** Turn approved project records into reusable organizational memory.

**Required behavior:**
- Create a searchable repository of approved project records and meeting documentation.
- Organize records by project, meeting, date, and topic.
- Allow users to search previous discussions.
- Find decisions and action items.
- Retrieve previous meeting summaries.
- Connect related project information.
- Export records.

**MVP status:** Core MVP for saving approved meeting records, organizing by project/meeting/date/topic, and keyword search. Related-information connections and export are secondary improvements.

---

## 7. Key differentiators

Hinterland must consistently communicate six differentiators.

1. **Context continuity.** Previous information remains relevant to future work; approved records become usable context.
2. **Intent preservation.** Communication improves without changing intended meaning; the original intention remains visible.
3. **Proactive assistance.** Missing points, gaps, and clarification needs are identified before they create problems.
4. **Personalized improvement.** Suggestions adapt to the user's communication style and audience.
5. **Connected workflow.** Preparation, communication, documentation, projects, and knowledge are one continuous loop.
6. **Knowledge retention.** Discussions become approved, searchable, reusable information rather than disposable transcripts.

### 7.1 Category contrast

| Common tool category | What it does | What Hinterland adds |
| --- | --- | --- |
| Grammar and style checkers | Correct local prose issues | Project context, audience adaptation, intent preservation, and explanation |
| General writing assistants | Generate or rewrite text | Grounding in project documents and prior decisions; explicit ambiguity findings |
| Meeting summarizers | Summarize a transcript | Preparation before the meeting, reviewable decisions and actions, traceability, and reusable knowledge |
| Note-taking apps | Store notes | Structured extraction, approval workflow, and context-aware retrieval |
| Project management tools | Track tasks | Converts discussion into accountable records while preserving source evidence |

---

## 8. Minimum viable product

The initial functional MVP must contain exactly these five capabilities:

1. **Context input.** Upload project documents, agendas, and previous notes.
2. **Meeting preparation.** Generate talking points, relevant questions, and potential gaps.
3. **Communication refinement.** Accept a user draft and return context-aware alternatives.
4. **Meeting documentation.** Convert pasted notes or transcripts into summaries, decisions, and action items.
5. **Knowledge storage.** Save approved summaries into categorized project folders and retrieve them through search.

### 8.1 Supporting capabilities required by the MVP

These are not separate headline features, but the five MVP capabilities cannot satisfy the product principles without them:

- Account authentication and owner-scoped data isolation.
- Project workspaces with objectives.
- PDF and DOCX text extraction, plus pasted text input.
- Explicit source selection for each generation.
- Evidence references from generated output to supplied sources.
- "Not specified" handling for missing owners, dates, and decisions.
- Review, edit, approve, and discard states for generated content.
- Approved meeting-record storage with project, meeting, date, and topic organization.
- Keyword search across approved records.
- Audit trail of approvals.
- Deletion of documents, records, and account data.

### 8.2 Explicitly out of MVP scope

The following are future enhancements and must not be required for MVP acceptance:

- Audio recording.
- Live meeting assistance.
- Advanced personalization.
- Direct cloud-drive integrations (including Google Drive).
- Organization-wide integrations.
- Real-time collaboration.
- Team workspaces and sharing.
- Semantic or vector search.
- OCR for scanned documents.
- Mobile-native applications.
- Autonomous sending or publishing of generated content.
- Custom model training or fine-tuning.

### 8.3 MVP acceptance statement

The MVP is acceptable when a single user can, within one project:

1. Add a PDF or DOCX document, an agenda, and previous notes.
2. Generate and review meeting preparation grounded in those sources.
3. Refine a draft with intent preservation and audience alternatives.
4. Paste meeting notes and obtain a structured summary with decisions, open questions, and actions.
5. See clearly which items lack explicit owners or deadlines.
6. Approve the record and find it later by keyword search.
7. Confirm that no other account can access the project, its documents, or its records.

---

## 9. Non-goals

Hinterland is not:

- A replacement for human judgment, management, or accountability.
- A system of record for HR performance evaluation.
- An autonomous agent that sends messages or makes commitments on a user's behalf.
- A general-purpose chatbot.
- A transcription or recording product in the MVP.
- A task-management suite with sprints, boards, or resource planning.
- A document editor with full word-processing capabilities.
- A guarantee of factual correctness in supplied source material.
- A custom-trained language model.

---

## 10. Success measures

Targets will be set after a pilot. The MVP must instrument the following measures from the first release.

### 10.1 Product outcome measures

- **Prep usefulness:** Share of prepared talking points or questions the user keeps, edits, or marks useful.
- **Refinement acceptance:** Share of refinement variants the user copies or approves.
- **Documentation completion:** Share of started meeting records that reach approved status.
- **Approval effort:** Median number of substantive edits between generated record and approval.
- **Retrieval success:** Share of knowledge searches that result in opening a record.
- **Return use:** Share of users who return to an existing project within 14 days.

### 10.2 Trust and reliability guardrails

- **Evidence coverage:** Share of recorded decisions, action owners, and deadlines with a valid evidence reference. Target: 100% for owners and deadlines.
- **Unsupported-claim rate:** Share of generated records containing a claim not supported by supplied material. Target: 0 in evaluation fixtures.
- **Cross-tenant exposure:** Number of confirmed cross-account exposures. Target: 0.
- **Approval bypass:** Number of records saved without explicit approval. Target: 0.
- **Generation failure transparency:** Share of failed generations that surface a clear error rather than a partial, unlabeled result. Target: 100%.

### 10.3 Anti-metrics

These must not be optimized at the expense of the principles:

- Volume of generated words.
- Number of AI actions per session.
- Time spent inside Hinterland.
- Auto-approval rate.

---

## 11. Constraints and assumptions

### 11.1 Constraints

- AI processing uses an existing LLM API. No custom model training.
- The product must work with user-provided context rather than pre-indexed organizational data.
- The MVP is single-user and owner-scoped. Multi-user collaboration is not assumed.
- The MVP uses keyword search; semantic retrieval is a later enhancement.
- Meeting recording and live assistance are not implemented in the MVP.
- Google Drive and other cloud-drive integrations are not implemented in the MVP.
- Scanned PDFs require OCR, which is not in the MVP; such uploads must fail with a clear explanation.

### 11.2 Assumptions

- Users can provide documents or text that contain enough context for useful output.
- Users will review AI output before relying on it.
- A document's extracted text is representative of its meaningful content.
- Professional communication quality depends on audience and intent, not one universal style.
- Deployment supports server-side secrets and private object storage.

### 11.3 Dependencies

- A Supabase project (PostgreSQL, Auth, Storage).
- An LLM API account and key, selected before AI features are built.
- A deployment environment capable of running Next.js server routes.

---

## 12. Terminology

| Term | Definition |
| --- | --- |
| **Project** | The top-level container for objectives, documents, meetings, and approved knowledge. |
| **Context source** | A document, note, agenda, prior record, or objective explicitly selected for a generation. |
| **Context packet** | The bounded set of project context assembled for one AI request. |
| **Approved record** | A generated or edited artifact explicitly approved by the user for storage. |
| **Knowledge record** | An approved artifact available in the project's searchable repository. |
| **Evidence reference** | A link from a generated claim to a specific source excerpt and location. |
| **Evidence validation** | Server-side verification that a cited excerpt exists in the cited source. |
| **Variant** | An alternative version of refined communication for a stated audience. |
| **Review gate** | The required human step between generation and persistence or sharing. |
| **Unspecified** | A field that the supplied material does not support; displayed as "Not specified" rather than inferred. |
| **Intent** | The user's stated purpose or outcome for a piece of communication. |

---

## 13. Open product decisions

These do not block documentation, but must be resolved before the relevant phase in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

| Decision | Needed by | Default if unresolved |
| --- | --- | --- |
| LLM API provider and model | Phase 3 | Provider-agnostic adapter with a configured default |
| Supabase environment (hosted or local) | Phase 1 | Hosted development project with local migrations |
| Authentication method | Phase 1 | Email and password through Supabase Auth |
| Maximum upload size and page count | Phase 2 | 20 MB per file; extraction rejected above a configurable page limit |
| Export formats for approved records | Phase 9 | Markdown first; DOCX and PDF evaluated later |
| Deployment target | Phase 1 | Deployment-agnostic Next.js target with server-side secrets |

---

## 14. Long-term vision

Hinterland may eventually support:

- Deeper project integrations.
- Real-time meeting assistance.
- Team knowledge management.
- Personalized professional coaching.
- Organization-specific workflows.

The objective is to reduce avoidable misunderstandings and help people contribute more effectively. These capabilities are directional and are not commitments. They require separate specifications, privacy reviews, and architecture decisions, and they must not be implied as existing functionality. See [FEATURE_MATRIX.md](./FEATURE_MATRIX.md) for their classification as long-term planned.

---

## 15. Document map

| Document | Purpose |
| --- | --- |
| [FEATURE_MATRIX.md](./FEATURE_MATRIX.md) | Scope classification and traceability |
| [USER_FLOWS.md](./USER_FLOWS.md) | End-to-end flows, states, and failure handling |
| [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) | System design, data model, APIs, AI pipeline |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Brand, visual language, components, accessibility |
| [PRIVACY_AND_RELIABILITY.md](./PRIVACY_AND_RELIABILITY.md) | Mandatory privacy, security, and trust controls |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Ordered roadmap, milestones, and exit criteria |
| [ASSET_CREDITS.md](./ASSET_CREDITS.md) | Fonts, icons, software, and asset licensing |
