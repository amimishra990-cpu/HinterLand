# HINTERLAND — Privacy and Reliability

**Document status:** Mandatory controls for the MVP and all future releases  
**Version:** 1.0  
**Last updated:** 2026-11-08  
**Audience:** Engineering, product, security, legal  
**Companion documents:** [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md), [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)

---

## 1. Purpose and scope

Hinterland processes professional documents, meeting notes, transcripts, drafts, and decisions. This material can contain confidential business information and personal data about users and third parties.

This document defines the privacy, security, traceability, and reliability controls that are mandatory for the MVP. These are product requirements, not optional hardening. A feature that violates them is not shippable.

The controls apply to:

- Application code and database schema.
- AI provider configuration and prompts.
- File storage and deletion.
- Logging, analytics, and support operations.
- User-facing copy and consent flows.
- Future features, which must extend rather than weaken these controls.

---

## 2. Mandatory principles and controls

| # | Principle | Required control | Verification |
| --- | --- | --- | --- |
| P1 | Users control which documents and records are accessible | Owner-only access; explicit source selection for every generation; deletion for sources, records, projects, and account data | Authorization tests; deletion tests; UI review |
| P2 | One user's documents are never exposed to another | RLS on every owner-scoped table; private storage with owner-prefixed paths; server-side ownership checks; composite owner foreign keys | Two-user integration tests for every table and storage path |
| P3 | Meeting recording respects participant consent | Recording is not implemented in the MVP. Any future recording requires informed consent, participant notice, a consent record, and the ability to stop and delete | Feature gate; legal review before implementation |
| P4 | AI-generated decisions, deadlines, and actions are traceable | Evidence references to exact source excerpts; server-side quote validation; item-level evidence panel | Evidence validation tests; fixture review |
| P5 | Missing or uncertain details are explicitly identified | "Not specified" fields; "Needs confirmation" for relative dates; unresolved-item warnings | UI and schema review; fixture tests |
| P6 | Never invent responsible individuals or deadlines | Prompt policy plus server-side grounding enforcement that blanks unsupported values; approval blocked until resolved | Adversarial fixture tests; code review |
| P7 | Human approval before saving or sharing | Transactional approval state machine; no generation path writes to knowledge; no external sending or sharing in the MVP | State-machine tests; E2E approval tests |
| P8 | Protect stored documents and personalization data | Encryption in transit and at rest; private storage; least-privilege access; opt-in personalization; no content in logs | Infrastructure review; logging review; access review |

---

## 3. Data inventory and classification

### 3.1 Data categories

| Category | Examples | Classification | Purpose |
| --- | --- | --- | --- |
| Account data | Email address, authentication identifiers, display name | Confidential personal data | Authentication and account management |
| Project metadata | Project name, description, objectives, dates | Confidential | Context and organization |
| Source files | PDF and DOCX files | Confidential; may contain personal data | Document context |
| Extracted text and chunks | Parsed document text, page references | Confidential; may contain personal data | Context assembly, evidence, search |
| Meeting material | Notes, transcripts, agenda, supplied attendee text, meeting date | Confidential; may contain third-party personal data | Preparation and documentation |
| Drafts and generations | Refined text, preparation briefs, extracted records | Confidential | Review before approval |
| Approved records | Summaries, decisions, open questions, actions, evidence; approved preparation briefs and refinement variants | Confidential | Knowledge repository and approved meeting context |
| Personalization data (post-MVP) | Approved style examples, explicit feedback, style profile | Confidential personal data | Communication adaptation |
| Operational metadata | AI run feature/model/version/status/token counts, latency, error codes | Internal | Reliability, cost, audit |
| Audit events | Approval, deletion, security actions, actor, timestamp | Internal | Accountability and security |
| Session and security logs | Request ID, user ID, route, status, IP where required | Internal; potentially personal data | Security and operations |
| Rate-limit data | Per-user request counts and windows | Internal | Abuse and cost control |

In the MVP, only approved meeting records are published to the knowledge repository. Approved preparation briefs and refinement variants remain with their source context and are not searchable as knowledge.

### 3.2 Sensitive data assumptions

- Transcripts and notes may include personal data about people who are not Hinterland users.
- Documents may contain confidential commercial, financial, legal, or research information.
- Users are responsible for having the right to upload and process the material they provide.
- The product does not intentionally process special-category data, but it cannot prevent users from including it. Prompts and interface copy must not encourage unnecessary sensitive data.
- No AI feature may be used to make automated decisions about a person's employment, credit, health, or legal status.

### 3.3 Data minimization

- Collect only the email and profile data needed for authentication and display.
- Send only selected, project-scoped context to the AI provider.
- Do not send unrelated projects, account history, or files the user did not select.
- Do not store prompts, full documents, or generated content in application logs.
- Do not add analytics that capture document text, message content, or transcripts.
- Personalization is opt-in and limited to approved examples and explicit feedback.

---

## 4. Access control

### 4.1 Enforcement layers

| Layer | Control |
| --- | --- |
| Authentication | Supabase Auth; authenticated session required for all application routes; secure, HTTP-only, SameSite cookies |
| Application authorization | Every Route Handler derives the owner from the session and verifies ownership of the project, document, meeting, or record |
| Database | Row-level security on every owner-scoped table; composite foreign keys include `owner_id` |
| Storage | Private bucket; path begins with the authenticated user ID; short-lived signed URLs |
| Service role | Isolated server-only module; never exposed to the client; used only where user-session access is insufficient |
| Administrative access | No internal admin UI in the MVP. Any future support access requires explicit user authorization, least privilege, and audit logging |

### 4.2 Rules

1. Never accept an `owner_id` from a request body or query string.
2. Never rely on a hidden UI control for authorization.
3. Return `404` rather than confirming the existence of another user's resource.
4. Use the user's session for normal operations so RLS remains active.
5. Service-role operations must be individually justified, logged, and tested.
6. Storage objects are never public. Signed URLs expire quickly and are not logged.
7. Session expiration rejects the mutation; the client may preserve an unsaved local draft, but no server write occurs.

### 4.3 Cross-project isolation

- Context assembly loads only the active project's selected sources and approved records.
- There is no cross-project retrieval in the MVP.
- Moving or copying content between projects is not implemented.
- Future team or organization features must define sharing explicitly; they must not silently broaden access.

---

## 5. AI processing and third-party data handling

### 5.1 What is sent to the AI provider

- The task input (draft, notes, agenda, or transcript).
- The user's stated intention, audience, or meeting goal.
- The project name, description, and objectives.
- Only the sources and approved records explicitly selected or included by the context assembler for that project.
- The system policy and task prompt.

### 5.2 What is not sent

- Other projects.
- Unselected documents.
- Account credentials or authentication tokens.
- Billing data.
- Analytics or support conversations.
- Other users' data.

### 5.3 Provider requirements

Before an AI provider is used in production:

1. Document the provider, model, and subprocessors in the privacy notice.
2. Confirm whether inputs are used for model training and disable training where the provider offers that control.
3. Configure the shortest available data-retention setting consistent with reliability needs.
4. Review the provider's data processing terms and security posture.
5. Confirm the data residency and cross-border transfer implications.
6. Ensure the provider does not make autonomous decisions or take actions on the user's behalf.
7. Record the approved configuration in the provider adapter and deployment documentation.

If these conditions cannot be met, the provider must not be used for user content.

### 5.4 No model training by Hinterland

Hinterland does not train or fine-tune a custom model on user content. Generated suggestions come from an existing LLM API using the context described above.

### 5.5 AI transparency to users

The interface must:

- Label generated content as generated until approved.
- Show which sources were used.
- Explain when context was insufficient or truncated.
- Distinguish verified evidence from unverified evidence.
- State that the user must review decisions, owners, and deadlines.
- Link to the privacy notice and data controls.

The product must not imply that the AI has independent knowledge of the user's project beyond the supplied context.

### 5.6 Prompt injection

Uploaded documents and pasted notes are untrusted data. Defenses:

- Documents are delimited and labeled as data, not instructions.
- The system policy explicitly forbids following instructions found inside source material.
- The model has no tools, network access, file-writing ability, or approval authority.
- Authorization is enforced outside the model and cannot be changed by prompt content.
- Output is validated and sanitized before rendering.
- Any content that appears to target the AI is treated as ordinary source text and may be surfaced to the user as suspicious input in a future enhancement.
- Prompt-injection fixtures are part of the evaluation suite.

---

## 6. Traceability and grounding

### 6.1 Evidence requirements

| Generated element | Evidence requirement | If absent |
| --- | --- | --- |
| Decision | Excerpt showing that a decision was made | Item marked unsupported; approval blocked until resolved |
| Action item description | Excerpt describing the action | Item marked unsupported |
| Responsible individual | Explicit reference tying a person to the action | Owner set to null; "Not specified"; needs confirmation |
| Deadline | Explicit date or time reference tied to the action | Deadline set to null; "Not specified"; needs confirmation |
| Relative deadline ("next Friday") | Preserved as stated | Marked "Needs confirmation"; not converted to a date |
| Discussion point | Excerpt supporting the point | Marked ungrounded or removed |
| Summary statement | Source material supports the statement | Marked as unsupported summary |
| Refinement project fact | Excerpt from selected context | Flagged as an unsupported claim; not inserted as fact |

### 6.2 Server-side verification

The model's assertions about evidence are never trusted.

1. The model returns a quote and a source/chunk identifier.
2. The server normalizes the quote and the cited chunk (NFKC, whitespace collapse, case-fold).
3. The server requires the normalized quote to appear in the normalized chunk.
4. The server sets the verification status.
5. Unverified evidence is visibly flagged and blocks approval for commitments.
6. Unsupported owners and deadlines are blanked, regardless of model confidence.

### 6.3 Uncertainty language

Use explicit, consistent language:

- "Not specified in the supplied notes."
- "Needs confirmation."
- "This point is a suggestion, not something stated in the selected sources."
- "The supplied context did not contain enough information to answer this."

Do not use vague hedging that obscures whether a fact is supported.

### 6.4 Conflicts

- Conflicting decisions, dates, or owners are surfaced as conflicts, not resolved silently.
- Both supporting excerpts are shown.
- The user must resolve the conflict before record approval.
- The system does not choose the "more likely" version.

### 6.5 Source deletion and evidence retention

- If a source is deleted, the approved record remains.
- Evidence excerpt text necessary to preserve the record's traceability may be retained inside the record.
- The source link is marked "Deleted."
- The record does not claim that a live source still exists.

---

## 7. Human approval

### 7.1 Invariants

1. Generation never writes directly to the knowledge repository.
2. Generation never sends, posts, or shares content externally.
3. Approval requires an authenticated owner action.
4. Approval is transactional and audited.
5. Approval is idempotent; retries cannot create duplicates.
6. Approval requires resolution of unsupported or unresolved items.
7. Approved records are immutable snapshots; revisions create a new version.
8. There is no bulk auto-approve.
9. There is no "approve all" action that bypasses item review.

### 7.2 What the user is approving

The approval interface must state:

- The artifact type.
- The project and meeting.
- That the record will be saved to the project's knowledge repository.
- That nothing will be sent or shared externally.
- Any acknowledged limitations, such as a deleted source or an unconfirmed date.

### 7.3 Sharing

The MVP has no external sharing mechanism. Copying text is a direct user action outside the system. Record export and any future sharing feature must preserve the approval provenance and require an explicit action.

---

## 8. Meeting recording and consent

Recording is not implemented in the MVP. This section defines the non-negotiable requirements for any future implementation.

- Obtain informed consent from participants as required by applicable law before recording.
- Provide clear notice that recording and AI processing will occur.
- Record who consented, when, and to what scope.
- Allow a participant to withdraw consent and stop recording.
- Never use a covert meeting bot or join a meeting without disclosure.
- Define retention and deletion for audio and transcripts before launch.
- Provide an accessible way to delete recordings and derived content.
- Conduct a jurisdiction-specific legal review.
- Do not treat consent as implied by attendance.

Until these controls exist, no audio or live recording feature may ship.

---

## 9. Personalization data

Personalization is post-MVP. When introduced:

- It must be opt-in.
- Users must be able to view, remove, and reset examples and learned preferences.
- Personalization data stays scoped to the owner and project context.
- It must not be used for employment evaluation, ranking, or profiling.
- It must not infer sensitive attributes.
- It must not override the user's explicit intention.
- Feedback must be separable from content; deleting an example must remove its influence on future suggestions.
- The privacy notice must explain what is stored and how it is used.

Advanced personalization and coaching require a separate privacy review.

---

## 10. Retention, deletion, and data rights

### 10.1 Retention

| Data | Default retention | Notes |
| --- | --- | --- |
| Account and profile | Until account deletion | Deletion removes the account and owner-scoped content |
| Projects, sources, extracted text, chunks | Until user deletes the project or source | Derived text is deleted with the source |
| Drafts and unpublished generations | Until user deletes them or deletes the project | Exact draft-retention policy to be set before launch |
| Approved records and knowledge | Until user deletes them or deletes the project | Approved snapshots are durable by design |
| Audit events | Until account deletion, or longer only where required by law | Content-free metadata |
| AI run metadata | Until account deletion | No raw prompt or document content |
| Operational logs | Short, fixed operational window to be configured before launch | No document content |
| Backups | Per Supabase plan and configuration | Deleted data expires according to provider backup policy |
| Personalization data (future) | Until user removes it or deletes the account | Opt-in and resettable |

Exact log and backup windows must be documented before production launch. They may not be left implicit.

### 10.2 Deletion behavior

Deleting a source removes:

- The stored file.
- The extracted text.
- Document chunks.
- Search entries derived from it.
- Any signed URLs become invalid.

Deleting a record removes:

- The record and its items.
- Its knowledge index entry.
- Its search vector.

Deleting a project removes:

- All project-owned documents, meetings, drafts, records, and knowledge entries.
- All stored files under the project path.

Deleting an account removes:

- Owner-scoped content and files.
- Profile data.
- Personalization data, when implemented.
- The authentication identity.

Deletion operations:

- Require explicit confirmation.
- Report partial failures honestly and support retry.
- Never claim success before storage and database cleanup complete.
- Write a content-free audit event.
- Do not leave valid signed URLs or orphaned chunks.

### 10.3 Data access and portability

- Users can view and delete their content in the application.
- Users can request a copy of their account data through the contact channel in the privacy notice.
- Automated full-account export is not an MVP feature; requests are handled within the timeframe required by applicable law.
- Record export is a post-MVP product feature and is distinct from a privacy data-access request.

### 10.4 Backups and remanence

- Backups may retain deleted data until they expire under the provider's policy.
- Backup access is restricted and not used for product features.
- Restore procedures must not reintroduce deleted user content into an active account.
- The privacy notice must explain backup retention in plain language.

---

## 11. Logging, analytics, and monitoring

### 11.1 Log rules

- Log request ID, route, internal user ID, project ID, status, latency, and error code.
- Never log document text, prompts, generated content, transcripts, evidence quotes, emails, or secrets.
- Redact query strings that could contain sensitive content.
- Restrict log access to operations and security roles.
- Set a fixed retention window before launch.
- Sanitize provider error messages before storage or display.

### 11.2 Analytics

- Product analytics may record events (for example, "record approved") and coarse metadata.
- Analytics must not capture content, search queries containing sensitive terms, or document text.
- Search queries are sensitive; aggregate analysis must avoid reproducing them.
- Do not use third-party session recording, heatmaps, or keystroke capture.
- Any analytics processor must be listed in the privacy notice.

### 11.3 Monitoring

- Monitor authentication failures, rate-limit spikes, extraction failures, validation failures, and cross-tenant authorization denials.
- Alert on repeated `403`/`404` patterns that may indicate enumeration.
- Alert on unusual AI usage volume or cost.
- Monitor deletion failures and orphaned storage objects.

---

## 12. Threat model

### 12.1 Threats and controls

| # | Threat | Vector | Control | Verification |
| --- | --- | --- | --- | --- |
| T1 | Cross-account data access | Forged project or record IDs | RLS, ownership checks, composite owner foreign keys, 404 responses | Two-user integration tests on every table |
| T2 | Cross-account file access | Guessed storage path or leaked signed URL | Private bucket, owner-prefixed policy, short expiry | Storage policy tests |
| T3 | Service-role key exposure | Bundling admin client into client code | Server-only isolation, environment validation, bundle inspection | Build and code review |
| T4 | Prompt injection | Instructions embedded in documents or notes | Untrusted-data delimiters, system policy, no tools, output validation, authorization outside the model | Adversarial fixtures |
| T5 | Stored XSS | Model output or source text containing HTML/scripts | Render plain text or sanitized Markdown; no raw HTML | Component and E2E tests |
| T6 | CSRF | Cross-site mutation requests | SameSite cookies, origin checks, authenticated mutations | Integration tests |
| T7 | Account enumeration | Auth and resource error differences | Generic errors; 404 for non-owned resources | Auth tests |
| T8 | Brute force and credential stuffing | Automated login attempts | Rate limits, monitoring, strong auth guidance | Load tests; auth logs |
| T9 | Cost abuse | Excessive AI or upload requests | Per-user quotas, payload limits, timeouts, monitoring | Rate-limit tests |
| T10 | Malicious document | Oversized files, parser exploits, decompression bombs | Type/signature checks, size caps, page caps, uncompressed-size limits for DOCX, patched libraries, no execution | Upload tests; dependency updates |
| T11 | Sensitive log leakage | Content accidentally logged | Structured logging allowlist; redaction; review | Log audit |
| T12 | Data remanence | Deleted records recoverable in indexes, chunks, or storage | Cascading deletes, index cleanup, storage deletion, backup policy disclosure | Deletion tests |
| T13 | Hallucinated commitments | Model invents owner, date, or decision | Evidence validation, grounding policy, approval block | Golden and adversarial fixtures |
| T14 | Unauthorized insider access | Operator reads user content | No admin UI; least privilege; restricted database access; audit | Access review |
| T15 | Supply-chain compromise | Malicious dependency | Lockfiles, pinned versions, audit checks, minimal dependencies | CI audit |
| T16 | Provider data misuse | Inputs used for training or retained excessively | Provider due diligence, configuration, contractual terms, disclosure | Provider review |
| T17 | SSRF through document processing | Remote references in files | No remote fetching during extraction; treat content as local data | Code review |
| T18 | Concurrent approval | Double submission or race | Transaction, row lock, expected version, idempotency key | Concurrency tests |

### 12.2 Non-negotiable security properties

- One owner's content cannot be read, searched, inferred, or downloaded by another owner.
- The AI model cannot authorize an action, access another project, or save content.
- No generated commitment reaches the knowledge repository without human approval and evidence validation.
- Deleted content is not served from the application or storage after deletion completes.
- Secrets never reach the browser.

---

## 13. Reliability engineering

### 13.1 Failure behavior

| Failure | User-visible behavior | System behavior | Data outcome |
| --- | --- | --- | --- |
| Upload interrupted | Clear failure; retry | No row marked ready; cleanup partial object | No partial source |
| Extraction timeout | "Could not finish reading this document" | Mark failed with retry; retain original file | No derived text presented |
| Scanned or image-only PDF | OCR-not-supported message | Mark `image_only` | Original retained; no false success |
| AI provider timeout | Retryable error | Abort; record failed run | No draft persisted as complete |
| AI provider rate limit | Retry guidance | Respect quota; no silent model switch | No draft |
| Invalid structured output | "Could not produce a reliable result" | One schema-repair attempt; then fail | No unvalidated draft |
| Evidence validation failure | Item flagged; approval blocked | Mark unverified; do not claim support | Draft remains reviewable |
| Truncated model output | "Result incomplete" | Mark incomplete; disallow approval as full record | Partial draft clearly labeled |
| Database error during generation | Save failed message | Do not show success; no knowledge entry | Consistent |
| Approval retry | Same result | Idempotency key returns existing approval | No duplicate record |
| Concurrent edit | Version conflict | `409` with refresh guidance | No lost update |
| Deletion partial failure | Partial failure with retry | Retry cleanup; report exactly what remains | No false success |
| Session expiry | Sign-in prompt | Reject mutation | No unauthorized write |
| AI outage | AI features unavailable; stored content readable | Degrade gracefully | No loss |

### 13.2 Integrity rules

- Approval is a single transaction that writes the approved snapshot, knowledge entry, and audit event.
- Row-level locks and expected versions prevent lost updates.
- Composite foreign keys prevent cross-owner references.
- Audit events are append-only from the client's perspective.
- Knowledge records are unique per source.
- Generated drafts and approved records are distinct; approval does not mutate the draft in place without versioning.
- Deletion is ordered so that database references and storage objects are handled consistently; failures are retried.

### 13.3 Idempotency and concurrency

- Project creation and approval accept client idempotency keys.
- Approval checks the expected record version.
- Duplicate submissions return the original result rather than creating a second record.
- Streaming disconnects do not trigger automatic approval or retries that could duplicate writes.
- Rate limits are enforced server-side per user.

### 13.4 Model and prompt change control

- Prompt templates are versioned and recorded in `ai_runs`.
- Any prompt or model change must pass the evaluation suite before release.
- Model changes are treated as product changes, not silent configuration updates.
- A regression in evidence coverage blocks release.
- There is no automatic fallback to a model that has not been reviewed for data handling.

### 13.5 Cost controls

- Per-user quotas apply to AI requests.
- Context and output budgets are enforced.
- Oversized context is trimmed with a visible manifest.
- Usage is monitored by feature and provider.
- A cost anomaly disables new generation requests without affecting stored content, if necessary.

### 13.6 Backups and recovery

- The Supabase plan's backup and point-in-time recovery capabilities must be documented before launch.
- A restore drill is required before production use.
- Restores are tested in a non-production environment.
- Recovery procedures must preserve RLS and storage policies.
- No claim of guaranteed recovery is made until the drill passes.

---

## 14. Verification and evaluation

### 14.1 Automated tests

| Area | Test type | Required evidence |
| --- | --- | --- |
| Owner isolation | Integration | Two users cannot select, insert, update, or delete each other's rows on every table |
| Storage isolation | Integration | Signed URL and path access fail across users |
| Auth | Integration/E2E | Unauthenticated access is denied; sessions expire safely |
| Evidence validation | Unit | Exact normalized match passes; fabricated or altered quote fails |
| Grounding policy | Unit | Unsupported owners and deadlines are blanked; relative dates are not resolved |
| Approval invariants | Integration | Unresolved items block approval; duplicates are idempotent; audit is written |
| Search scope | Integration | Drafts and other owners' records never appear |
| Deletion | Integration | Content, chunks, indexes, and files are removed; partial failures are reported |
| File handling | Integration | Oversized, wrong-type, image-only, password-protected, and malformed files fail safely |
| Prompt injection | Evaluation | Embedded instructions do not change system behavior or authorization |
| Accessibility | Automated and manual | Core flows meet the design system checklist |
| Dependencies | CI audit | No known critical vulnerabilities in shipped dependencies |

### 14.2 AI evaluation suite

Fixtures must include:

- Transcripts with clear decisions, proposals, and unresolved debates.
- Actions with explicit owners and dates.
- Actions with owners but no dates.
- Actions with dates but no owners.
- Relative dates such as "next Friday."
- Multiple speakers with unresolved attribution.
- Conflicting decisions and dates.
- Documents containing prompt-injection attempts.
- Ambiguous drafts with multiple plausible intentions.
- Source material with no relevant content.

Release criteria for AI changes:

- Zero invented owners or deadlines across fixtures.
- 100% of recorded commitments have a verified evidence reference or an explicit "Not specified" state.
- Decisions are not fabricated from proposals or open debate.
- Every failure is explicit, never a silent ungrounded result.
- Human spot review of a sample of outputs before release.

### 14.3 Review cadence

- Run the full suite on every pull request affecting AI, authorization, approval, storage, or search.
- Run the owner-isolation suite on every schema migration.
- Re-run provider data-handling verification when the provider, model, or configuration changes.
- Re-run accessibility checks when components or tokens change.

---

## 15. Incident response

### 15.1 Severity examples

| Severity | Example |
| --- | --- |
| Critical | Confirmed cross-account exposure, leaked service-role key, unauthorized access to documents |
| High | Approval bypass, systematic invented commitments, storage bucket misconfiguration |
| Medium | Extended AI outage, partial deletion failure, rate-limit bypass |
| Low | Cosmetic privacy copy error, non-sensitive logging mistake |

### 15.2 Response steps

1. Detect and confirm the incident.
2. Contain: revoke credentials, rotate keys, invalidate sessions, disable the affected feature, or restrict access.
3. Assess scope: which users, projects, records, and data categories are affected.
4. Preserve evidence without copying content unnecessarily.
5. Remediate the root cause and add a regression test.
6. Notify affected users and authorities as required by applicable law, with legal counsel.
7. Document a post-incident review with corrective actions and owners.

No public statement may claim a cause or scope before verification.

### 15.3 Key rotation

- Service-role keys and provider keys can be rotated without code changes.
- Rotation invalidates old credentials and is logged.
- A compromised key triggers immediate rotation and a review of access logs.

---

## 16. Honest limitations

The MVP does not provide, and must not claim:

- OCR for scanned or image-only documents.
- Antivirus or malware scanning of uploaded files.
- Semantic or vector search.
- Audio recording or live meeting assistance.
- Team sharing, roles, or organization-wide access.
- Cloud-drive integrations.
- Guaranteed factual accuracy of supplied documents or generated output.
- Legal, financial, medical, or professional advice.
- A compliance certification such as SOC 2 or ISO 27001.
- Guaranteed data residency beyond what the selected providers actually offer.
- Automated data export for privacy requests.
- Protection against a user deliberately entering data they are not permitted to process.

Known MVP limitations that must be disclosed in the interface or privacy notice where relevant:

- Only text-based PDFs and DOCX files are supported.
- Search uses English stemming and may perform poorly for other languages.
- The product is single-owner.
- AI output is probabilistic and requires human review.
- File scanning is not performed; users should only upload trusted material.
- Records may reference a source that was later deleted.

---

## 17. Legal and compliance posture

Hinterland is designed to support privacy obligations, but it is not certified compliant with any framework until an independent assessment says so.

Before production launch, the project must have:

- A privacy notice naming data categories, purposes, legal bases where applicable, retention, processors, and user rights.
- Terms of service.
- A data processing agreement with Supabase and the AI provider where required.
- A subprocessor list.
- A process for data-subject access, correction, deletion, and objection requests.
- A records-of-processing inventory.
- A jurisdiction and cross-border transfer assessment.
- A retention schedule for logs and backups.
- Legal review of consent flows, especially for any future recording.

Marketing and product copy must not claim "private," "secure," or "compliant" in absolute terms. Claims must be specific and verifiable.

---

## 18. User-facing transparency requirements

Every relevant screen must make the following clear:

1. **Generated content is generated.** It is labeled as a draft until approved.
2. **Sources are visible.** The user can inspect what context was used and what was excluded.
3. **Evidence is inspectable.** Every commitment links to its excerpt or states that evidence is missing.
4. **Uncertainty is explicit.** "Not specified" and "Needs confirmation" are visible states.
5. **Approval is required.** Nothing is saved to knowledge or shared without the user's action.
6. **AI processing is disclosed.** The privacy notice names the provider category and the data sent.
7. **Controls are available.** Users can delete sources, records, projects, and account data.
8. **Limitations are stated.** OCR, file scanning, language support, and single-owner scope are not hidden.

---

## 19. Governance

### 19.1 Ownership

| Area | Owner |
| --- | --- |
| Privacy notice and legal basis | Product and legal |
| Access control and RLS | Engineering and security |
| AI grounding and evaluation | Engineering and product |
| Incident response | Security lead |
| Provider due diligence | Engineering, security, and legal |
| Retention and deletion | Product and engineering |

### 19.2 Change triggers

This document must be reviewed and updated before shipping any change that:

- Adds a new data category or storage location.
- Adds an integration or subprocessor.
- Changes the AI provider, model, or data-retention configuration.
- Introduces sharing, team, or organization access.
- Introduces recording, audio, or live assistance.
- Introduces personalization or profiling.
- Changes the approval model.
- Changes deletion or retention behavior.

### 19.3 Release gate

The MVP may not be released unless:

- All P1–P8 controls are implemented and verified.
- Owner-isolation tests pass for every table and storage path.
- Approval invariants pass.
- AI evaluation fixtures show zero invented owners or deadlines.
- Deletion is verified end to end.
- The privacy notice and terms are in place.
- No marketing claim exceeds the honest limitations in Section 16.

These controls are permanent. They are not "phase 2 hardening."
