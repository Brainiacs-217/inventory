"use client";

import { BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/formatCurrency";
import {
  CHART_ACCESSIBILITY,
  CHART_BAR_PROPS,
  CHART_BORDER,
  CHART_CURSOR,
  CHART_FILL,
  CHART_FILL_ACTIVE,
  CHART_ICON_BADGE_CLASS,
  CHART_MUTED,
  CHART_PROFIT_FILL_ACTIVE,
  CHART_PROFIT_STROKE,
  CHART_TOOLTIP_PROPS,
} from "@/lib/chartInteraction";
import type { RecipeSales, RecipeSalesByPeriod, SalesPeriod } from "@/types/dashboard";
import { useFollowCursorTooltip } from "@/hooks/useFollowCursorTooltip";

const CHART_CARD_CLASS =
  "flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]";

export function RecipeProfitChartSkeleton() {
  return (
    <div className={CHART_CARD_CLASS} aria-hidden="true">
      <div className="flex shrink-0 items-center gap-3 border-b border-border/80 px-5 py-3.5">
        <div className="size-9 rounded-lg bg-surface-muted" />
        <div className="space-y-2">
          <div className="h-4 w-36 rounded bg-surface-muted" />
          <div className="h-3 w-24 rounded bg-surface-muted" />
        </div>
      </div>
      <div className="h-[calc(14rem+1in)] animate-pulse bg-surface-muted/50" />
    </div>
  );
}

const RECIPE_PROFIT_GRADIENT_ID = "fill-recipe-profit";

const PERIODS: { id: SalesPeriod; label: string; range: string }[] = [
  { id: "day", label: "Daily", range: "Today" },
  { id: "week", label: "Weekly", range: "This week" },
  { id: "month", label: "Monthly", range: "This month" },
  { id: "year", label: "Yearly", range: "This year" },
];

function useNarrowScreen(): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return narrow;
}

const NARROW_NAME_WIDTH = 124;

type RecipeNameTickProps = {
  y?: number;
  payload?: { value?: string };
};

function RecipeNameTick({ y = 0, payload }: RecipeNameTickProps) {
  return (
    <text
      x={0}
      y={y}
      dy={4}
      textAnchor="start"
      fill={CHART_MUTED}
      fontSize={12}
    >
      {payload?.value}
    </text>
  );
}

function formatProfitAxisTick(value: number): string {
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absolute >= 1000) {
    return `${sign}$${(absolute / 1000).toFixed(absolute % 1000 === 0 ? 0 : 1)}k`;
  }

  return `${sign}$${absolute}`;
}

type RecipeTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: RecipeSales }>;
};

function RecipeTooltip({ active, payload }: RecipeTooltipProps) {
  const point = payload?.[0]?.payload;
  if (!active || !point?.name) return null;

  const sold = point.quantitySold ?? 0;

  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-text-primary">{point.name}</p>
      <p className="text-text-secondary">{formatCurrency(point.revenue ?? 0)} revenue</p>
      <p className="text-text-secondary">{formatCurrency(point.profit ?? 0)} profit</p>
      <p className="text-text-muted">{sold.toLocaleString()} sold</p>
    </div>
  );
}

type RecipeProfitChartProps = {
  data: RecipeSalesByPeriod;
};

export function RecipeProfitChart({ data }: RecipeProfitChartProps) {
  const [period, setPeriod] = useState<SalesPeriod>("day");
  const { position, onMouseMove, onMouseLeave } = useFollowCursorTooltip();
  const recipes = data[period] ?? [];
  const narrow = useNarrowScreen();
  const rangeLabel = PERIODS.find((option) => option.id === period)?.range ?? "Today";
  const chartHeight = narrow ? Math.max(320, recipes.length * 52 + 72) : undefined;

  return (
    <div className={CHART_CARD_CLASS}>
      <div className="flex shrink-0 flex-col items-start gap-3 border-b border-border/80 bg-surface px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className={CHART_ICON_BADGE_CLASS}>
            <BookOpen className="size-4 text-text-muted" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-text-primary">
              Recipe profit &amp; sales
            </p>
            <p className="text-xs text-text-muted">All recipes · {rangeLabel}</p>
          </div>
        </div>
        <div
          role="group"
          aria-label="Sales period"
          className="flex shrink-0 rounded-md border border-border/80 bg-background p-0.5"
        >
          {PERIODS.map((option) => {
            const selected = option.id === period;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setPeriod(option.id)}
                className={`rounded-[5px] px-2 py-1 text-xs font-medium transition-colors ${
                  selected
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <div
        className={`pb-5 pt-4 sm:px-4 ${narrow ? "pl-5 pr-3" : "h-[calc(14rem+1in)] px-2"}`}
        style={chartHeight ? { height: chartHeight } : undefined}
      >
        {recipes.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-text-muted">
            No recipes yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              {...CHART_ACCESSIBILITY}
              data={recipes}
              layout={narrow ? "vertical" : "horizontal"}
              barGap={4}
              margin={
                narrow
                  ? { top: 28, right: 8, left: 0, bottom: 4 }
                  : { top: 28, right: 12, left: 4, bottom: 64 }
              }
              onMouseMove={onMouseMove}
              onMouseLeave={onMouseLeave}
            >
              <defs>
                <linearGradient id={RECIPE_PROFIT_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_PROFIT_FILL_ACTIVE} stopOpacity={0.85} />
                  <stop offset="95%" stopColor={CHART_PROFIT_FILL_ACTIVE} stopOpacity={0.25} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke={CHART_BORDER}
                strokeDasharray="3 3"
                vertical={narrow}
                horizontal={!narrow}
              />
              {narrow ? (
                <XAxis
                  type="number"
                  tickFormatter={formatProfitAxisTick}
                  tick={{ fill: CHART_MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
              ) : (
                <XAxis
                  dataKey="name"
                  type="category"
                  height={72}
                  tick={{ fill: CHART_MUTED, fontSize: 11 }}
                  axisLine={{ stroke: CHART_BORDER }}
                  tickLine={false}
                  interval={0}
                  angle={-32}
                  textAnchor="end"
                  tickFormatter={(value: string) =>
                    value.length > 16 ? `${value.slice(0, 14)}…` : value
                  }
                />
              )}
              {narrow ? (
                <YAxis
                  dataKey="name"
                  type="category"
                  width={NARROW_NAME_WIDTH}
                  tick={RecipeNameTick}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
              ) : (
                <YAxis
                  type="number"
                  tickFormatter={formatProfitAxisTick}
                  tick={{ fill: CHART_MUTED, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
              )}
              <Tooltip
                content={<RecipeTooltip />}
                cursor={CHART_CURSOR}
                position={position ?? undefined}
                {...CHART_TOOLTIP_PROPS}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, color: CHART_MUTED }}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill={CHART_FILL}
                stroke={CHART_FILL_ACTIVE}
                strokeWidth={1}
                radius={narrow ? [0, 6, 6, 0] : [6, 6, 0, 0]}
                maxBarSize={narrow ? 12 : 56}
                activeBar={{ fill: CHART_FILL_ACTIVE, stroke: CHART_FILL_ACTIVE }}
                {...CHART_BAR_PROPS}
              />
              <Bar
                dataKey="profit"
                name="Profit"
                fill={`url(#${RECIPE_PROFIT_GRADIENT_ID})`}
                stroke={CHART_PROFIT_STROKE}
                strokeWidth={1}
                radius={narrow ? [0, 6, 6, 0] : [6, 6, 0, 0]}
                maxBarSize={narrow ? 12 : 56}
                activeBar={{ fill: CHART_PROFIT_FILL_ACTIVE, stroke: CHART_PROFIT_STROKE }}
                {...CHART_BAR_PROPS}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
