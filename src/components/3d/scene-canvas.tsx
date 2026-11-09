"use client";

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useProgress } from "@react-three/drei";

import { HinterlandScene } from "@/components/3d/hinterland-scene";
import { SceneFontsReadyContext } from "@/components/3d/scene-context";
import type { PointerRef, ProgressRef } from "@/components/3d/types";

function supportsWebGl() {
  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ?? canvas.getContext("webgl");

    if (!context) return false;

    const lose = context.getExtension("WEBGL_lose_context");
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

class SceneErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("The Hinterland 3D scene could not start.", error);
    this.props.onError();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function SceneLoader() {
  const { active, progress } = useProgress();
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (complete || active) return;

    // If the section is already in view when loading finishes, useProgress can
    // settle at 0/100 without ever flipping active. A grace timer guarantees
    // the overlay cannot remain pinned over a rendered scene.
    const timer = window.setTimeout(
      () => setComplete(true),
      progress >= 100 ? 400 : 1400
    );
    return () => window.clearTimeout(timer);
  }, [active, progress, complete]);

  const visible = !complete || active;
  const value = Math.round(progress);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 grid place-items-center"
    >
      <div className="flex w-56 flex-col items-center text-center">
        <span
          aria-hidden="true"
          className="mb-5 block h-px w-10 bg-stage-gold/70"
        />
        <p
          role="status"
          aria-live="polite"
          className="text-[10px] font-semibold tracking-[0.22em] text-ivory/80 uppercase"
        >
          {active ? `Preparing the workspace · ${value}%` : "Preparing the workspace"}
        </p>
        <span
          aria-hidden="true"
          className="mt-4 block h-px w-full overflow-hidden bg-ivory/15"
        >
          <span
            className="block h-px origin-left bg-stage-gold transition-transform duration-500"
            style={{ transform: `scaleX(${Math.max(0.04, progress / 100)})` }}
          />
        </span>
      </div>
    </div>
  );
}

export function SceneCanvas({
  progressRef,
  pointerRef,
  active,
  onUnavailable,
}: {
  progressRef: ProgressRef;
  pointerRef: PointerRef;
  active: boolean;
  onUnavailable: () => void;
}) {
  // This module is only loaded client-side (dynamic import with ssr: false),
  // so WebGL support can be resolved during the first render.
  const [supported] = useState(() => supportsWebGl());
  const [fontsReady, setFontsReady] = useState(false);
  const notified = useRef(false);

  const notifyUnavailable = useCallback(() => {
    if (notified.current) return;
    notified.current = true;
    onUnavailable();
  }, [onUnavailable]);

  useEffect(() => {
    if (supported === false) notifyUnavailable();
  }, [supported, notifyUnavailable]);

  useEffect(() => {
    if (supported === false) return;

    let cancelled = false;
    let frame = 0;

    if (!document.fonts) {
      frame = requestAnimationFrame(() => {
        if (!cancelled) setFontsReady(true);
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
      };
    }

    document.fonts.ready.then(() => {
      if (!cancelled) setFontsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [supported]);

  if (supported === false) {
    return null;
  }

  return (
    <SceneErrorBoundary onError={notifyUnavailable}>
      <SceneFontsReadyContext.Provider value={fontsReady}>
        <div className="absolute inset-0">
          <Suspense fallback={<SceneLoader />}>
            <HinterlandScene
              progressRef={progressRef}
              pointerRef={pointerRef}
              active={active}
            />
          </Suspense>
          <SceneLoader />
        </div>
      </SceneFontsReadyContext.Provider>
    </SceneErrorBoundary>
  );
}
