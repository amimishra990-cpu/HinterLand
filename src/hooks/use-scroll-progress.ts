"use client";

import { useEffect, useRef, useState } from "react";

export function useScrollProgress({
  stageCount,
  enabled,
}: {
  stageCount: number;
  enabled: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const stageIndexRef = useRef(0);
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let revertMedia: (() => void) | undefined;
    let removeLoadListener: (() => void) | undefined;

    const setup = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);
      ScrollTrigger.config({ ignoreMobileResize: true });

      const media = gsap.matchMedia();
      media.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          const wrapper = wrapperRef.current;
          const pin = pinRef.current;
          if (!wrapper || !pin) return;

          const trigger = ScrollTrigger.create({
            trigger: wrapper,
            start: "top top",
            end: "bottom bottom",
            pin,
            pinSpacing: false,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              progressRef.current = self.progress;
              const index = Math.min(
                stageCount - 1,
                Math.round(self.progress * (stageCount - 1))
              );

              if (index !== stageIndexRef.current) {
                stageIndexRef.current = index;
                setStageIndex(index);
              }
            },
            onRefresh: (self) => {
              progressRef.current = self.progress;
            },
          });

          return () => trigger.kill();
        }
      );

      revertMedia = () => media.revert();

      const refresh = () => ScrollTrigger.refresh();
      requestAnimationFrame(refresh);

      if (document.fonts) {
        document.fonts.ready.then(refresh).catch(() => undefined);
      }

      if (document.readyState !== "complete") {
        const onLoad = () => refresh();
        window.addEventListener("load", onLoad, { once: true });
        removeLoadListener = () => window.removeEventListener("load", onLoad);
      }
    };

    setup().catch((error) => {
      console.error("Scroll choreography could not start.", error);
    });

    return () => {
      cancelled = true;
      removeLoadListener?.();
      revertMedia?.();
    };
  }, [enabled, stageCount]);

  return {
    wrapperRef,
    pinRef,
    progressRef,
    stageIndex,
  };
}
