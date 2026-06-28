export const CHART_FILL = "#525252";
export const CHART_FILL_ACTIVE = "#262626";
export const CHART_PROFIT_FILL = "#86efac";
export const CHART_PROFIT_FILL_ACTIVE = "#4ade80";
export const CHART_PROFIT_STROKE = "#6ee7b7";
export const CHART_MUTED = "#737373";
export const CHART_BORDER = "#e5e5e5";

export const CHART_ICON_BADGE_CLASS =
  "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-surface-muted";

export const CHART_CURSOR = {
  fill: "rgba(0, 0, 0, 0.04)",
  isUpdateAnimationActive: true,
  animationDuration: 500,
  animationEasing: "ease-in-out" as const,
};

export const CHART_TOOLTIP_PROPS = {
  animationDuration: 280,
  animationEasing: "ease-out" as const,
  isAnimationActive: true,
  useTranslate3d: true,
  allowEscapeViewBox: { x: true, y: true },
};

export const CHART_ACTIVE_BAR = {
  fill: CHART_FILL_ACTIVE,
};

export const CHART_BAR_PROPS = {
  isAnimationActive: true,
  animationDuration: 500,
  animationEasing: "ease-in-out" as const,
};

/** Prevents Recharts from making the SVG focusable (avoids the blue click outline). */
export const CHART_ACCESSIBILITY = {
  accessibilityLayer: false as const,
};
