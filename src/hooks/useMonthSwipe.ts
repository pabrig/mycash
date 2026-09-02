"use client";

import { useCallback, useRef } from "react";

const MIN_SWIPE_PX = 56;
const HORIZONTAL_RATIO = 1.4;

type SwipeHandlers = {
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerUp: (event: React.PointerEvent) => void;
  onPointerCancel: () => void;
};

export function useMonthSwipe(onShift: (delta: number) => void): SwipeHandlers {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const reset = useCallback(() => {
    startX.current = null;
    startY.current = null;
  }, []);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startX.current = event.clientX;
    startY.current = event.clientY;
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (startX.current === null || startY.current === null) return;

      const dx = event.clientX - startX.current;
      const dy = event.clientY - startY.current;
      reset();

      if (Math.abs(dx) < MIN_SWIPE_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_RATIO) return;

      onShift(dx > 0 ? -1 : 1);
    },
    [onShift, reset],
  );

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel: reset,
  };
}
