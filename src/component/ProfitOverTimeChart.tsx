"use client";

import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/formatCurrency";
import {
  CHART_BORDER,
  CHART_ICON_BADGE_CLASS,
  CHART_MUTED,
  CHART_PROFIT_FILL_ACTIVE,
  CHART_PROFIT_STROKE,
  CHART_TOOLTIP_PROPS,
} from "@/lib/chartInteraction";
import type { MonthlyProfit } from "@/lib/mock/dashboard";
import { useFollowCursorTooltip } from "@/lib/useFollowCursorTooltip";

const CHART_CARD_CLASS =
  "w-full overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-4px_rgba(0,0,0,0.08)]";

const PROFIT_FILL_GRADIENT_ID = "fill-profit";

function formatMonth(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("en-US", { month: "short" });
}

function formatMonthYear(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatProfitAxisTick(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }

  return `$${value}`;
}

function getProfitYAxisScale(data: MonthlyProfit[]) {
  const profits = data
    .map((point) => point.profit)
    .filter((profit): profit is number => profit != null);
  const min = Math.min(...profits);
  const max = Math.max(...profits);
  const range = max - min;
  const padding = Math.max(range * 0.2, 800);
  const domainMin = Math.floor((min - padding) / 500) * 500;
  const domainMax = Math.ceil((max + padding) / 500) * 500;
  const tickStep = range <= 4_000 ? 500 : 1_000;
  const ticks: number[] = [];

  for (let value = domainMin; value <= domainMax; value += tickStep) {
    ticks.push(value);
  }

  return {
    domain: [domainMin, domainMax] as [number, number],
    ticks,
    baseLine: domainMin,
  };
}

type ProfitTooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: MonthlyProfit }>;
};

function ProfitTooltip({ active, payload }: ProfitTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-text-primary">{formatMonthYear(point.date)}</p>
      {point.profit == null ? (
        <p className="text-text-muted">In progress — awaiting this month&apos;s results</p>
      ) : (
        <p className="text-text-secondary">{formatCurrency(point.profit)} profit</p>
      )}
    </div>
  );
}

function ProfitAxisTick({
  x,
  y,
  payload,
  pendingDate,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  pendingDate?: string;
}) {
  if (x == null || y == null || !payload?.value) return null;

  const isPending = payload.value === pendingDate;

  return (
    <text
      x={x}
      y={y + 12}
      fill={CHART_MUTED}
      fontSize={12}
      textAnchor="middle"
      opacity={isPending ? 0.55 : 1}
    >
      {formatMonth(payload.value)}
      {isPending ? " ···" : ""}
    </text>
  );
}

function ProfitDot({
  cx,
  cy,
  payload,
}: {
  cx?: number;
  cy?: number;
  payload?: MonthlyProfit;
}) {
  if (cx == null || cy == null || !payload || payload.profit == null) return null;

  return (
    <circle cx={cx} cy={cy} r={4} fill={CHART_PROFIT_FILL_ACTIVE} stroke="#fff" strokeWidth={2} />
  );
}

function PendingMonthMarker({ cx, cy }: { cx?: number; cy?: number }) {
  if (cx == null || cy == null) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="none"
      stroke={CHART_MUTED}
      strokeWidth={1.5}
      strokeDasharray="3 3"
    />
  );
}

type ProfitOverTimeChartProps = {
  data: MonthlyProfit[];
};

export function ProfitOverTimeChart({ data }: ProfitOverTimeChartProps) {
  const { position, onMouseMove, onMouseLeave } = useFollowCursorTooltip();
  const yAxisScale = getProfitYAxisScale(data);
  const pendingMonth = data.find((point) => point.profit == null);
  const pendingMonthMarker = pendingMonth
    ? [{ ...pendingMonth, markerY: yAxisScale.baseLine }]
    : [];

  return (
    <div className={`${CHART_CARD_CLASS} shrink-0`}>
      <div className="flex shrink-0 items-center gap-3 border-b border-border/80 bg-surface px-5 py-3.5">
        <div className={CHART_ICON_BADGE_CLASS}>
          <TrendingUp className="size-4 text-text-muted" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-text-primary">
            Profit over time
          </p>
          <p className="text-xs text-text-muted">6 months recorded · current month in progress</p>
        </div>
      </div>
      <div className="h-[calc(14rem+1in)] pl-4 pr-2 py-4 sm:pl-5 sm:pr-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, left: 12, bottom: 0 }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
          >
            <defs>
              <linearGradient id={PROFIT_FILL_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_PROFIT_FILL_ACTIVE} stopOpacity={0.45} />
                <stop offset="95%" stopColor={CHART_PROFIT_FILL_ACTIVE} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_BORDER} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={(props) => <ProfitAxisTick {...props} pendingDate={pendingMonth?.date} />}
              axisLine={{ stroke: CHART_BORDER }}
              tickLine={false}
              interval={0}
            />
            <YAxis
              domain={yAxisScale.domain}
              ticks={yAxisScale.ticks}
              tickFormatter={formatProfitAxisTick}
              tick={{ fill: CHART_MUTED, fontSize: 12, dx: 2 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              content={<ProfitTooltip />}
              cursor={{ stroke: CHART_PROFIT_STROKE, strokeWidth: 1, strokeDasharray: "4 4" }}
              position={position ?? undefined}
              {...CHART_TOOLTIP_PROPS}
            />
            <Area
              type="monotone"
              dataKey="profit"
              connectNulls={false}
              stroke={CHART_PROFIT_FILL_ACTIVE}
              strokeWidth={2.5}
              fill={`url(#${PROFIT_FILL_GRADIENT_ID})`}
              dot={<ProfitDot />}
              activeDot={{ r: 6, fill: CHART_PROFIT_FILL_ACTIVE, stroke: "#fff", strokeWidth: 2 }}
              baseLine={yAxisScale.baseLine}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-in-out"
            />
            {pendingMonthMarker.length > 0 ? (
              <Scatter
                data={pendingMonthMarker}
                dataKey="markerY"
                shape={PendingMonthMarker}
                isAnimationActive={false}
              />
            ) : null}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
