import { storyStages } from "@/components/3d/story-data";

export function StaticStory() {
  return (
    <div className="border-t border-ivory/15">
      <div className="mx-auto w-full max-w-[1120px] px-6 py-14 lg:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow text-stage-gold">The six stages · static view</p>
          <p className="mt-4 text-[13px] leading-6 text-ivory/70">
            The interactive desk is available on larger screens with motion
            enabled. Here is the same sequence, with every object and every
            gap stated in plain text.
          </p>
        </div>

        <ol className="relative mt-10 border-t border-ivory/15">
          <span
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-[5px] w-px bg-ivory/12"
          />

          {storyStages.map((stage, index) => (
            <li
              key={stage.id}
              className="relative grid gap-6 border-b border-ivory/15 py-8 pl-9 sm:grid-cols-[1fr_0.85fr] sm:items-start sm:gap-12 sm:pl-12"
            >
              <span
                aria-hidden="true"
                className="absolute top-[41px] left-0 size-[11px] rounded-full border border-stage-gold/70 bg-stage-deep sm:top-[45px]"
              />

              <div>
                <div className="flex items-baseline gap-3">
                  <span className="tnum font-heading text-[32px] leading-none text-stage-gold">
                    {stage.number}
                  </span>
                  <span className="text-[9px] font-semibold tracking-[0.16em] text-ivory/45 uppercase">
                    Stage {index + 1} of {storyStages.length}
                  </span>
                </div>

                <h3 className="mt-4 font-heading text-[26px] leading-[1.12] text-ivory">
                  {stage.title}
                </h3>
                <p className="mt-3 max-w-lg text-[13px] leading-6 text-ivory/70">
                  {stage.description}
                </p>
                <p className="mt-4 flex items-center gap-2 text-[10px] font-semibold tracking-[0.1em] text-stage-gold uppercase">
                  <span
                    aria-hidden="true"
                    className="size-1 rounded-full bg-current"
                  />
                  {stage.note}
                </p>
              </div>

              <div className="border border-ivory/15 bg-ivory/[0.035] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[8.5px] font-semibold tracking-[0.16em] text-ivory/55 uppercase">
                    Object board
                  </p>
                  <p className="tnum text-[8.5px] tracking-[0.1em] text-ivory/45 uppercase">
                    {stage.chips.length} items
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {stage.chips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center gap-2 border border-ivory/15 px-2 py-1.5 text-[9.5px] leading-4 text-ivory/70"
                    >
                      <span
                        aria-hidden="true"
                        className="size-1.5 bg-terracotta/80"
                      />
                      {chip}
                    </span>
                  ))}
                </div>

                <span
                  aria-hidden="true"
                  className="mt-4 block h-px bg-gradient-to-r from-stage-gold/70 to-transparent"
                />
                <p className="mt-3 text-[10px] leading-5 text-ivory/55">
                  Reading order follows the work: source, refinement,
                  preparation, record, knowledge, connection.
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
