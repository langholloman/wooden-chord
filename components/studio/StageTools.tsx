"use client";

import type { RefObject } from "react";
import type { StageView } from "@/components/scene/FretboardScene";

type StageToolsProps = {
  viewRef: RefObject<StageView | null>;
  /** The full neck stays flat, so it hides the tilt pair. */
  tilt?: boolean;
};

function hold(run: () => void) {
  run();
  const timer = window.setInterval(run, 70);
  const stop = () => {
    window.clearInterval(timer);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
  };
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
}

export function StageTools({ viewRef, tilt = true }: StageToolsProps) {
  const press = (apply: (view: StageView) => void) => () => {
    const view = viewRef.current;
    if (!view) return;
    hold(() => apply(view));
  };

  return (
    <div className="view-tools" role="toolbar" aria-label="Stage view">
      <div className="view-group">
        <span>Pan</span>
        <button type="button" aria-label="Pan left" onPointerDown={press((view) => view.pan(-0.45, 0))}>
          ←
        </button>
        <button type="button" aria-label="Pan up" onPointerDown={press((view) => view.pan(0, 0.45))}>
          ↑
        </button>
        <button type="button" aria-label="Pan down" onPointerDown={press((view) => view.pan(0, -0.45))}>
          ↓
        </button>
        <button type="button" aria-label="Pan right" onPointerDown={press((view) => view.pan(0.45, 0))}>
          →
        </button>
      </div>
      {tilt ? (
        <div className="view-group">
          <span>Tilt</span>
          <button type="button" aria-label="Tilt up" onPointerDown={press((view) => view.tilt(-0.06))}>
            ⌃
          </button>
          <button type="button" aria-label="Tilt down" onPointerDown={press((view) => view.tilt(0.06))}>
            ⌄
          </button>
        </div>
      ) : null}
      <div className="view-group">
        <span>Zoom</span>
        <button type="button" aria-label="Zoom out" onPointerDown={press((view) => view.zoom(1.12))}>
          −
        </button>
        <button type="button" aria-label="Zoom in" onPointerDown={press((view) => view.zoom(0.84))}>
          +
        </button>
      </div>
      <button type="button" className="view-reset" onClick={() => viewRef.current?.reset()}>
        Reset
      </button>
    </div>
  );
}
