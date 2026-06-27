"use client";

import { BookOpen } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/formatCurrency";
import {
  CHART_BAR_PROPS,
  CHART_BORDER,
  CHART_CURSOR,
  CHART_ICON_BADGE_CLASS,
  CHART_MUTED,
  CHART_PROFIT_FILL_ACTIVE,
  CHART_PROFIT_STROKE,
  CHART_TOOLTIP_PROPS,
} from "@/lib/chartInteraction";
import type { RecipeSales } from "@/lib/mock/dashboard";
import { useFollowCursorTooltip } from "@/lib/useFollowCursorTooltip";

const CHART_CARD_CLASS =
  "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]";

const RECIPE_PROFIT_GRADIENT_ID = "fill-recipe-profit";

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
      <p className="text-text-secondary">{formatCurrency(point.profit)} profit</p>
      <p className="text-text-muted">{point.quantitySold.toLocaleString()} sold</p>
    </div>
  );
}

function createSoldBarLabel(data: RecipeSales[]) {
  return function SoldBarLabel(props: {
    x?: string | number;
    y?: string | number;
    width?: string | number;
    index?: number;
  }) {
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    const width = Number(props.width ?? 0);
    const index = props.index ?? 0;
    const point = data[index];
    if (!point) return null;

    return (
      <text
        x={x + width / 2}
        y={y - 8}
        fill={CHART_MUTED}
        fontSize={11}
        textAnchor="middle"
      >
        {point.quantitySold.toLocaleString()} sold
      </text>
    );
  };
}

type RecipeProfitChartProps = {
  data: RecipeSales[];
};

export function RecipeProfitChart({ data }: RecipeProfitChartProps) {
  const renderSoldBarLabel = createSoldBarLabel(data);
  const { position, onMouseMove, onMouseLeave } = useFollowCursorTooltip();

  return (
    <div className={`${CHART_CARD_CLASS} flex h-full min-h-0 flex-col`}>
      <div className="flex shrink-0 items-center gap-3 border-b border-border/80 bg-surface px-5 py-3.5">
        <div className={CHART_ICON_BADGE_CLASS}>
          <BookOpen className="size-4 text-text-muted" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-text-primary">
            Recipe profit &amp; sales
          </p>
          <p className="text-xs text-text-muted">Ranked by total profit (demo data)</p>
        </div>
      </div>
      <div className="min-h-[calc(14rem+1in)] flex-1 px-2 pb-5 pt-4 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 28, right: 12, left: 4, bottom: 36 }}
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
              label={{
                value: "Profit",
                angle: -90,
                position: "left",
                offset: 0,
                style: { fill: CHART_MUTED, fontSize: 11, textAnchor: "middle" },
              }}
            />
            <Tooltip
              content={<RecipeTooltip />}
              cursor={CHART_CURSOR}
              position={position ?? undefined}
              {...CHART_TOOLTIP_PROPS}
            />
            <Bar
              dataKey="profit"
              fill={`url(#${RECIPE_PROFIT_GRADIENT_ID})`}
              stroke={CHART_PROFIT_STROKE}
              strokeWidth={1}
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
              activeBar={{ fill: CHART_PROFIT_FILL_ACTIVE, stroke: CHART_PROFIT_STROKE }}
              {...CHART_BAR_PROPS}
            >
              <LabelList content={renderSoldBarLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
