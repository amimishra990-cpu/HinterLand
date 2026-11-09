import { SectionHeading } from "@/components/shared/section-heading";

const fragments = [
  {
    title: "A message explains the delay.",
    place: "Inbox · 14 replies",
    detail:
      "The reasoning is there, buried under a thread of follow-ups and side conversations.",
  },
  {
    title: "A meeting note records a concern.",
    place: "Notes app · untitled",
    detail:
      "Useful context, saved somewhere no one will think to reopen before the next meeting.",
  },
  {
    title: "A document holds the objective.",
    place: "Shared drive · v4 final",
    detail:
      "The goal exists, separated from the discussion that shaped it and the people it affects.",
  },
  {
    title: "A decision is made out loud.",
    place: "Conference room · no record",
    detail:
      "The room agrees. The project record stays empty, so the decision has no durable source.",
  },
  {
    title: "The same question is reopened.",
    place: "New thread · starting again",
    detail:
      "The work repeats because the thread between the question, the answer, and the decision was never kept.",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="section-shell tone-burgundy border-t border-ink/10">
      <div className="mx-auto w-full max-w-[1120px] px-6 py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeading
              eyebrow="The gap"
              title={
                <>
                  Good work gets lost between{" "}
                  <em className="drift-word text-gold italic">
                    conversations
                  </em>
                  .
                </>
              }
              lead="The information usually exists. What disappears is the thread between it: the reason behind a request, the concern under a note, the commitment made in a meeting."
            />

            <div data-reveal className="mt-10 border-l-2 border-gold pl-5">
              <p className="font-heading text-[21px] leading-snug text-ink/85 italic">
                “The information exists. The continuity doesn&rsquo;t.”
              </p>
            </div>

            <p
              data-reveal
              data-reveal-delay="0.1"
              className="mt-8 max-w-sm text-[13px] leading-6 text-ink/70"
            >
              Isolated tools improve individual messages and summaries. They do
              not preserve the relationship between intention, context, and
              outcome.
            </p>
          </div>

          <div>
            <div data-reveal className="flex items-baseline justify-between gap-4 border-b border-ink/15 pb-3">
              <p className="eyebrow">Where the thread breaks</p>
              <p className="text-[10.5px] tracking-[0.1em] text-ink/70 uppercase">
                Five common handoffs
              </p>
            </div>

            <ol data-reveal-stagger className="relative mt-2">
              {fragments.map((fragment, index) => (
                <li
                  key={fragment.title}
                  className="grid grid-cols-[2.25rem_1fr] gap-4 border-b border-ink/10 py-6 last:border-b-0 sm:grid-cols-[2.75rem_1fr] sm:gap-5"
                >
                  <span className="tnum pt-0.5 font-heading text-2xl text-accent-ink">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="font-heading text-[20px] leading-snug text-ink">
                        {fragment.title}
                      </h3>
                      <span className="text-[10px] tracking-[0.08em] text-ink/70 uppercase">
                        {fragment.place}
                      </span>
                    </div>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-ink/70">
                      {fragment.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div data-reveal className="mt-10 border-y border-ink/15 py-7">
              <p className="max-w-xl text-balance font-heading text-[26px] leading-snug text-ink">
                Repeated work is rarely a discipline problem.{" "}
                <span className="drift-word text-gold italic">
                  It is a continuity problem.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
