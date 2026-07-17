"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type ChartPoint = { date: string; score: number };

export function HistoryChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="w-full h-64 bg-surface border border-border rounded-2xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            stroke="#a3a3a3"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#a3a3a3"
            fontSize={12}
            domain={[0, 100]}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#141414",
              border: "1px solid #262626",
              borderRadius: 8,
              color: "#ffffff",
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: "#6366f1", r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
