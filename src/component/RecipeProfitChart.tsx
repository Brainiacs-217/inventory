"use client";

import { BookOpen } from "lucide-react";
import { useState } from "react";
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

import { formatCurrency, formatOptionalCurrency } from "@/lib/formatCurrency";
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

const RECIPE_PROFIT_GRADIENT_ID = "fill-recipe-profit";

const PERIODS: { id: SalesPeriod; label: string; range: string }[] = [
  { id: "day", label: "Daily", range: "Today" },
  { id: "week", label: "Weekly", range: "This week" },
  { id: "month", label: "Monthly", range: "This month" },
  { id: "year", label: "Yearly", range: "This year" },
];

function formatProfitAxisTick(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }

  return `$${value}`;
}

type RecipeTooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: RecipeSales }>;
};

function RecipeTooltip({ active, payload }: RecipeTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-text-primary">{point.name}</p>
      <p className="text-text-secondary">{formatCurrency(point.sales)} sales</p>
      <p className="text-text-secondary">
        {point.profit == null
          ? "Profit needs a linked recipe"
          : `${formatOptionalCurrency(point.profit)} profit`}
      </p>
      <p className="text-text-muted">{point.quantitySold.toLocaleString()} sold</p>
    </div>
  );
}

type RecipeProfitChartProps = {
  data: RecipeSalesByPeriod;
};

export function RecipeProfitChart({ data }: RecipeProfitChartProps) {
  const [period, setPeriod] = useState<SalesPeriod>("day");
  const { position, onMouseMove, onMouseLeave } = useFollowCursorTooltip();
  const points = data[period];
  const hasProfit = points.some((point) => point.profit != null);
  const rangeLabel = PERIODS.find((option) => option.id === period)?.range ?? "Today";

  return (
    <div className={CHART_CARD_CLASS}>
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border/80 bg-surface px-5 py-3.5">
        <div className={CHART_ICON_BADGE_CLASS}>
          <BookOpen className="size-4 text-text-muted" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-text-primary">
            Recipe profit &amp; sales
          </p>
          <p className="text-xs text-text-muted">Top 5 by sales · {rangeLabel}</p>
        </div>
        <div
          role="group"
          aria-label="Sales period"
          className="ml-auto flex shrink-0 rounded-md border border-border/80 bg-background p-0.5"
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
      <div className="h-[calc(14rem+1in)] px-2 pb-5 pt-4 sm:px-4">
        {points.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-text-muted">
            No sales in this period.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              {...CHART_ACCESSIBILITY}
              data={points}
              margin={{ top: hasProfit ? 28 : 8, right: 12, left: 4, bottom: 36 }}
              onMouseMove={onMouseMove}
              onMouseLeave={onMouseLeave}
            >
              <defs>
                <linearGradient id={RECIPE_PROFIT_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_PROFIT_FILL_ACTIVE} stopOpacity={0.85} />
                  <stop offset="95%" stopColor={CHART_PROFIT_FILL_ACTIVE} stopOpacity={0.25} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART_BORDER} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                height={48}
                tick={{ fill: CHART_MUTED, fontSize: 11 }}
                axisLine={{ stroke: CHART_BORDER }}
                tickLine={false}
                tickMargin={12}
                interval={0}
                tickFormatter={(value: string) =>
                  value.length > 14 ? `${value.slice(0, 12)}…` : value
                }
              />
              <YAxis
                tickFormatter={formatProfitAxisTick}
                tick={{ fill: CHART_MUTED, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                content={<RecipeTooltip />}
                cursor={CHART_CURSOR}
                position={position ?? undefined}
                {...CHART_TOOLTIP_PROPS}
              />
              {hasProfit ? (
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, color: CHART_MUTED }}
                />
              ) : null}
              <Bar
                dataKey="sales"
                name="Sales"
                fill={CHART_FILL}
                stroke={CHART_FILL_ACTIVE}
                strokeWidth={1}
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
                activeBar={{ fill: CHART_FILL_ACTIVE, stroke: CHART_FILL_ACTIVE }}
                {...CHART_BAR_PROPS}
              />
              {hasProfit ? (
                <Bar
                  dataKey="profit"
                  name="Profit"
                  fill={`url(#${RECIPE_PROFIT_GRADIENT_ID})`}
                  stroke={CHART_PROFIT_STROKE}
                  strokeWidth={1}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                  activeBar={{ fill: CHART_PROFIT_FILL_ACTIVE, stroke: CHART_PROFIT_STROKE }}
                  {...CHART_BAR_PROPS}
                />
              ) : null}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
