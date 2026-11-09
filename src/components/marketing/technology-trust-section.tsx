import { Fragment } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  Eye,
  Link2,
  LockKeyhole,
  Mic,
  ShieldCheck,
} from "lucide-react";
import { WordRevealText } from "@/components/shared/word-reveal";

const layers = [
  {
    name: "Frontend",
    detail: "Next.js, React, and TypeScript. Server components by default.",
  },
  {
    name: "Backend",
    detail: "Supabase Auth and a server-only API layer.",
  },
  {
    name: "AI processing",
    detail: "A provider-agnostic adapter with bounded, reviewable runs.",
  },
  {
    name: "Database",
    detail: "PostgreSQL with row-level security and owner isolation.",
  },
  {
    name: "Document storage",
    detail: "A private bucket with short-lived, owner-scoped access.",
  },
];

const trustItems: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
  tag?: string;
}> = [
  {
    icon: LockKeyhole,
    title: "User-controlled access",
    description:
      "Documents, records, and projects belong to one owner. Access is explicit, scoped, and revocable.",
  },
  {
    icon: Mic,
    title: "Consent-based recording",
    description:
      "Live audio capture is not in the MVP. When it arrives, recording will require clear consent from participants.",
    tag: "Future scope",
  },
  {
    icon: Eye,
    title: "Reviewable outputs",
    description:
      "Generated content is a draft. Nothing is saved to knowledge or shared until you explicitly approve it.",
  },
  {
    icon: Link2,
    title: "Traceability",
    description:
      "Decisions, owners, and deadlines carry a reference to the exact source excerpt and location.",
  },
  {
    icon: AlertCircle,
    title: "Uncertainty handling",
    description:
      "Missing owners or deadlines are marked “Not specified.” Unsupported claims are flagged, never filled in.",
  },
  {
    icon: ShieldCheck,
    title: "Access controls",
    description:
      "Row-level security and owner-scoped file access are enforced in the database and rechecked in server code.",
  },
];

export function TechnologyTrustSection() {
  return (
    <section id="trust" className="section-shell tone-emerald border-t border-ink/10 bg-deep text-ivory">
      <div className="mx-auto w-full max-w-[1120px] px-6 py-20 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
          <div>
            <div data-reveal className="flex items-center gap-3">
              <span aria-hidden="true" data-draw className="h-px w-8 bg-gold" />
              <p className="text-[10.5px] font-semibold tracking-[0.18em] text-gold uppercase">
                Technology & trust
              </p>
            </div>
            <h2
              data-word-reveal
              data-words-ready="true"
              className="mt-5 max-w-2xl text-balance font-heading text-[clamp(2rem,4vw,2.9rem)] leading-[1.08] text-ivory"
            >
              <WordRevealText>
                Built to be{" "}
                <em className="drift-word text-gold italic">trusted</em> with
                the work behind the work.
              </WordRevealText>
            </h2>
          </div>
          <p
            data-reveal
            data-reveal-delay="0.1"
            className="max-w-sm text-pretty text-[14px] leading-7 text-ivory/70 lg:justify-self-end lg:pb-1"
          >
            The architecture is deliberately conventional. Clear layers, one
            owner per workspace, and checks that happen on the server rather
            than in the interface.
          </p>
        </div>

        <div data-reveal className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ivory/15 pb-3">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-ivory/65 uppercase">
              Application architecture
            </p>
            <p className="text-[10px] tracking-[0.1em] text-ivory/60 uppercase">
              Frontend to storage
            </p>
          </div>

          <div
            data-reveal-stagger
            className="mt-6 grid lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch"
          >
            {layers.map((layer, index) => (
              <Fragment key={layer.name}>
                <div className="border border-ivory/20 bg-ivory/[0.035] p-4">
                  <p className="text-[9px] font-semibold tracking-[0.12em] text-gold uppercase">
                    Layer {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 font-heading text-lg leading-tight text-ivory">
                    {layer.name}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-5 text-ivory/65">
                    {layer.detail}
                  </p>
                </div>
                {index < layers.length - 1 ? (
                  <div className="flex items-center justify-center py-2 lg:px-1.5 lg:py-0">
                    <ArrowRight
                      aria-hidden="true"
                      strokeWidth={1.5}
                      className="flow-arrow-x hidden size-4 text-gold lg:block"
                      style={{ animationDelay: `${index * -0.35}s` }}
                    />
                    <ArrowDown
                      aria-hidden="true"
                      strokeWidth={1.5}
                      className="flow-arrow-y size-4 text-gold lg:hidden"
                      style={{ animationDelay: `${index * -0.35}s` }}
                    />
                  </div>
                ) : null}
              </Fragment>
            ))}
          </div>

          <p className="mt-4 text-[10.5px] leading-5 text-ivory/60">
            The public site is a preview. The workspace runs on Supabase Auth,
            PostgreSQL with row-level security, and a private document bucket.
            No AI model is connected.
          </p>
        </div>

        <div className="mt-16 border-t border-ivory/15 pt-12">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.14em] text-gold uppercase">
                Product commitments
              </p>
              <h3
                data-word-reveal
                data-words-ready="true"
                className="mt-4 max-w-sm text-balance font-heading text-[30px] leading-tight text-ivory"
              >
                <WordRevealText>
                  Trust is a product requirement, not a policy page.
                </WordRevealText>
              </h3>
              <p
                data-reveal
                data-reveal-delay="0.08"
                className="mt-4 max-w-sm text-[12.5px] leading-6 text-ivory/65"
              >
                These commitments shape what the interface shows, what the
                server checks, and what the product refuses to infer.
              </p>
            </div>

            <div
              data-reveal-stagger
              className="grid gap-x-8 gap-y-7 sm:grid-cols-2"
            >
              {trustItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="border-t border-ivory/15 pt-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon
                          aria-hidden="true"
                          strokeWidth={1.5}
                          className="size-4 text-gold"
                        />
                        <p className="text-[12.5px] font-medium text-ivory/90">
                          {item.title}
                        </p>
                      </div>
                      {item.tag ? (
                        <span className="shrink-0 border border-gold/50 px-1.5 py-0.5 text-[8px] font-semibold tracking-[0.08em] text-gold uppercase">
                          {item.tag}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-ivory/65">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
