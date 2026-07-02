"use client";

import { useCallback, useState } from "react";
import { getRelativeCoordinate } from "recharts";

const CURSOR_OFFSET = { x: 12, y: 12 };

type ChartPointer = {
  x: number;
  y: number;
};

export function useFollowCursorTooltip() {
  const [position, setPosition] = useState<ChartPointer | null>(null);

  const onMouseMove = useCallback(
    (_state: unknown, event: React.MouseEvent<SVGGraphicsElement>) => {
      const { relativeX, relativeY } = getRelativeCoordinate(event);
      setPosition({
        x: relativeX + CURSOR_OFFSET.x,
        y: relativeY + CURSOR_OFFSET.y,
      });
    },
    [],
  );

  const onMouseLeave = useCallback(() => {
    setPosition(null);
  }, []);

  return { position, onMouseMove, onMouseLeave };
}
