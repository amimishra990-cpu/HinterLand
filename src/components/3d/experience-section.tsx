"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { StaticStory } from "@/components/3d/static-story";
import {
  EXPERIENCE_SECTION_ID,
  STAGE_COUNT,
  storyStages,
  type StoryStage,
} from "@/components/3d/story-data";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { cn } from "@/lib/utils";
import { WordRevealText } from "@/components/shared/word-reveal";

const SceneCanvas = dynamic(
  () => import("@/components/3d/scene-canvas").then((module) => module.SceneCanvas),
  { ssr: false }
);

const accentText: Record<StoryStage["accent"], string> = {
  gold: "text-stage-gold",
  terracotta: "text-terracotta",
  sage: "text-sage",
};

export function ExperienceSection() {
  const enabled = useMediaQuery(
    "(min-width: 1024px) and (prefers-reduced-motion: no-preference)"
  );
  const [sceneFailed, setSceneFailed] = useState(false);
  const [inView, setInView] = useState(false);
  const showScene = enabled && !sceneFailed;
  const pointerRef = useRef({ x: 0, y: 0 });

  const { wrapperRef, pinRef, progressRef, stageIndex } = useScrollProgress({
    stageCount: STAGE_COUNT,
    enabled: showScene,
  });

  const activeStage = storyStages[stageIndex] ?? storyStages[0];

  const handleUnavailable = useCallback(() => {
    setSceneFailed(true);
  }, []);

  useEffect(() => {
    if (!showScene) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInView(entry.isIntersecting);
      },
      { rootMargin: "20% 0px 20% 0px", threshold: 0.01 }
    );

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [showScene, wrapperRef]);

  useEffect(() => {
    if (!showScene) return;
    const pin = pinRef.current;
    if (!pin) return;

    const onPointerMove = (event: PointerEvent) => {
      const rect = pin.getBoundingClientRect();
      pointerRef.current = {
        x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        y: ((event.clientY - rect.top) / rect.height) * 2 - 1,
      };
    };

    const reset = () => {
      pointerRef.current = { x: 0, y: 0 };
    };

    pin.addEventListener("pointermove", onPointerMove, { passive: true });
    pin.addEventListener("pointerleave", reset);
    pin.addEventListener("pointercancel", reset);

    return () => {
      pin.removeEventListener("pointermove", onPointerMove);
      pin.removeEventListener("pointerleave", reset);
      pin.removeEventListener("pointercancel", reset);
    };
  }, [showScene, pinRef]);

  return (
    <section
      id={EXPERIENCE_SECTION_ID}
      aria-labelledby="experience-title"
      className="relative border-t border-ink/10 bg-stage-deep text-ivory"
    >
      <div className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 right-0 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(214,184,124,0.14),transparent_68%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 left-0 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(114,47,69,0.16),transparent_70%)]"
        />

        <div className="relative mx-auto w-full max-w-[1120px] px-6 pt-20 pb-12 lg:pt-28 lg:pb-16">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
            <div>
              <div data-reveal className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  data-draw
                  className="h-px w-8 bg-terracotta"
                />
                <p className="eyebrow text-stage-gold">
                  The experience · six stages
                </p>
              </div>
              <h2
                id="experience-title"
                data-word-reveal
                data-words-ready="true"
                className="mt-5 max-w-2xl text-balance font-heading text-[clamp(2.15rem,4.6vw,3.35rem)] leading-[1.04] text-ivory"
              >
                <WordRevealText>
                  Six stages. One{" "}
                  <em className="drift-word text-stage-gold italic">thread</em>{" "}
                  of context.
                </WordRevealText>
              </h2>
            </div>

            <div
              data-reveal
              data-reveal-delay="0.1"
              className="border-l-2 border-stage-gold/60 pl-4 lg:justify-self-end lg:pb-1"
            >
              <p className="max-w-sm text-pretty text-[13px] leading-6 text-ivory/70">
                On a motion-enabled desktop, scroll through a working desk.
                Objects gather, clarify and connect as the work moves from
                scattered information to an organized record. Every object
                represents supplied material or a reviewable output.
              </p>
              <p className="mt-3 text-[9.5px] font-semibold tracking-[0.14em] text-ivory/55 uppercase">
                Interactive on large screens · scroll controlled · no autoplay
              </p>
            </div>
          </div>
        </div>

        <div
          ref={wrapperRef}
          className={cn(
            "relative",
            sceneFailed ? "hidden" : "hidden lg:motion-safe:block"
          )}
          style={{ height: "600vh" }}
        >
          <div
            ref={pinRef}
            className="experience-surface relative h-svh overflow-hidden"
          >
            <div className="relative z-10 mx-auto grid h-full w-full max-w-[1320px] grid-cols-1 gap-6 px-6 pt-[calc(var(--header-height)+1.75rem)] pb-7 lg:grid-cols-[minmax(320px,0.82fr)_1.18fr] lg:gap-0 lg:px-8">
              <div className="relative flex min-h-0 flex-col lg:pr-10">
                <div className="flex items-center justify-between gap-4">
                  <p className="eyebrow text-stage-gold">
                    The connected workspace
                  </p>
                  <p className="tnum text-[10px] tracking-[0.16em] text-ivory/55 uppercase">
                    {String(stageIndex + 1).padStart(2, "0")} / 06
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="mt-4 block h-px w-full bg-ivory/12"
                />

                <div className="my-auto grid min-h-[21rem] py-6">
                  {storyStages.map((stage, index) => {
                    const active = index === stageIndex;

                    return (
                      <div
                        key={stage.id}
                        aria-hidden={!active}
                        inert={!active}
                        className={cn(
                          "col-start-1 row-start-1 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
                          active
                            ? "translate-y-0 opacity-100"
                            : "pointer-events-none translate-y-3 opacity-0"
                        )}
                      >
                        <div
                          className="story-float"
                          style={{ animationDelay: `${index * -0.8}s` }}
                        >
                          <div className="flex items-baseline gap-4">
                            <span
                              className={cn(
                                "tnum font-heading text-[44px] leading-none",
                                accentText[stage.accent]
                              )}
                            >
                              {stage.number}
                            </span>
                            <span
                              aria-hidden="true"
                              className="mb-1 h-px flex-1 bg-ivory/15"
                            />
                          </div>

                          <h3 className="mt-5 max-w-[24rem] font-heading text-[clamp(1.85rem,2.7vw,2.55rem)] leading-[1.06] text-ivory">
                            {stage.title}
                          </h3>

                          <p className="mt-4 max-w-[24rem] text-[13px] leading-6 text-ivory/70">
                            {stage.description}
                          </p>

                          <p
                            className={cn(
                              "mt-5 flex items-center gap-2 text-[10px] font-semibold tracking-[0.1em] uppercase",
                              accentText[stage.accent]
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className="size-1 rounded-full bg-current"
                            />
                            {stage.note}
                          </p>

                          <ul className="mt-6 flex max-w-[25rem] flex-wrap gap-1.5">
                            {stage.chips.map((chip) => (
                              <li
                                key={chip}
                                className="border border-ivory/15 px-2.5 py-1 text-[9px] font-medium tracking-[0.09em] text-ivory/65 uppercase"
                              >
                                {chip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-end gap-5">
                  <div className="flex flex-1 gap-1.5">
                    {storyStages.map((stage, index) => (
                      <span
                        key={stage.id}
                        className={cn(
                          "h-px flex-1 transition-colors duration-500",
                          index <= stageIndex
                            ? "bg-stage-gold"
                            : "bg-ivory/15"
                        )}
                      />
                    ))}
                  </div>
                  <p className="hidden text-[9px] font-semibold tracking-[0.14em] text-ivory/55 uppercase sm:block">
                    Scroll to advance
                  </p>
                </div>

                <p className="sr-only" aria-live="polite">
                  Stage {stageIndex + 1} of {STAGE_COUNT}: {activeStage.title}
                </p>
              </div>

              <div className="relative min-h-0 lg:border-l lg:border-ivory/10">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-4 z-10 hidden lg:block"
                >
                  <span className="absolute top-0 left-0 size-4 border-t border-l border-stage-gold/30" />
                  <span className="absolute top-0 right-0 size-4 border-t border-r border-stage-gold/30" />
                  <span className="absolute bottom-0 left-0 size-4 border-b border-l border-stage-gold/30" />
                  <span className="absolute right-0 bottom-0 size-4 border-r border-b border-stage-gold/30" />
                </div>

                {showScene ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                  >
                    <SceneCanvas
                      progressRef={progressRef}
                      pointerRef={pointerRef}
                      active={inView}
                      onUnavailable={handleUnavailable}
                    />
                  </div>
                ) : null}

                <div className="pointer-events-none absolute top-5 right-5 z-20 hidden lg:block">
                  <div className="story-float-slow flex items-center gap-2 border border-ivory/15 bg-stage-deep/55 px-2.5 py-1.5 text-[8.5px] font-semibold tracking-[0.13em] text-ivory/65 uppercase">
                    <span
                      aria-hidden="true"
                      className="size-1 rounded-full bg-stage-gold"
                    />
                    Scroll-driven scene · sample material
                  </div>
                </div>

                <div className="pointer-events-none absolute bottom-5 left-5 z-20 hidden lg:block">
                  <p className="text-[8.5px] font-semibold tracking-[0.13em] text-ivory/40 uppercase">
                    Move the pointer to shift the view
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            sceneFailed ? "block" : "lg:motion-safe:hidden"
          )}
        >
          <StaticStory />
        </div>
      </div>
    </section>
  );
}
