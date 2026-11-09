import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const primaryAudiences = [
  {
    role: "Students & early-career professionals",
    context:
      "Group projects, internships, and first professional roles.",
    change:
      "Clearer messages, prepared contributions, and a record of decisions that does not depend on memory.",
  },
  {
    role: "Startup teams",
    context:
      "Fast-moving product and business work where context lives in chat.",
    change:
      "One project thread from preparation to approved decisions, without inventing another documentation ritual.",
  },
  {
    role: "Corporate professionals & managers",
    context: "Cross-functional meetings, proposals, and reports.",
    change:
      "A credible point of view before the meeting and outcomes that remain traceable afterward.",
  },
  {
    role: "Researchers & academic teams",
    context:
      "Papers, proposals, reviews, and lab or program meetings.",
    change:
      "Preserved reasoning, cited prior decisions, and documentation that stays consistent across collaborators.",
  },
];

const futureAudiences = [
  {
    title: "Enterprises",
    detail:
      "Organization-wide context, administration, and cross-team permissions.",
  },
  {
    title: "Consultants & freelancers",
    detail:
      "Multiple client workspaces with stricter separation and export needs.",
  },
  {
    title: "Educational institutions",
    detail:
      "Cohort workflows, institutional policy, and role-based oversight.",
  },
];

export function AudienceSection() {
  return (
    <section
      id="use-cases"
      className="section-shell tone-emerald border-t border-ink/10"
    >
      <div className="mx-auto w-full max-w-[1120px] px-6 py-20 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
          <SectionHeading
            eyebrow="Use cases"
            title={
              <>
                Built for the work you are{" "}
                <em className="drift-word text-gold italic">already</em> doing.
              </>
            }
            lead="Hinterland is designed for people who carry context between messages, meetings, and documents as part of ordinary professional work."
          />
          <p
            data-reveal
            data-reveal-delay="0.1"
            className="max-w-sm border-l-2 border-gold pl-4 text-[12px] leading-6 text-ink/70 lg:justify-self-end lg:pb-1"
          >
            The MVP is a single-owner workspace. One person controls their
            projects, sources, records, and access. Cross-organization
            collaboration is not part of the MVP.
          </p>
        </div>

        <div
          data-reveal-stagger
          className="mt-12 grid border-t border-ink/15 sm:grid-cols-2"
        >
          {primaryAudiences.map((audience, index) => (
            <div
              key={audience.role}
              className={cn(
                "border-b border-ink/15 py-8",
                index % 2 === 0 ? "sm:pr-10" : "sm:border-l sm:border-ink/15 sm:pl-10"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="tnum text-[10px] font-semibold tracking-[0.1em] text-accent-ink">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="eyebrow text-ink/70">Primary audience</p>
              </div>
              <h3 className="mt-4 font-heading text-[24px] leading-snug text-ink">
                {audience.role}
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-ink/70">
                {audience.context}
              </p>
              <p className="mt-4 border-t border-ink/10 pt-3 text-[12px] leading-6 text-ink/70">
                <span className="font-semibold text-forest">
                  What changes ·{" "}
                </span>
                {audience.change}
              </p>
            </div>
          ))}
        </div>

        <div
          data-reveal
          className="mt-14 border border-dashed border-ink/25 bg-background p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-ink/70">Later audiences</p>
              <p className="mt-1.5 text-[12px] leading-5 text-ink/70">
                Part of the long-term vision. Not targeted by the MVP.
              </p>
            </div>
            <Badge variant="muted">Not in the MVP</Badge>
          </div>

          <div
            data-reveal-stagger
            className="mt-6 grid gap-6 sm:grid-cols-3"
          >
            {futureAudiences.map((audience) => (
              <div
                key={audience.title}
                className="border-l border-ink/15 pl-4"
              >
                <h3 className="font-heading text-[19px] leading-snug text-ink/80">
                  {audience.title}
                </h3>
                <p className="mt-1.5 text-[11.5px] leading-5 text-ink/70">
                  {audience.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
