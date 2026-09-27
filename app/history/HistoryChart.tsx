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
    <div className="w-full h-64 bg-surface border-2 border-border rounded-2xl shadow-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="rgba(244,238,227,0.08)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            stroke="rgba(244,238,227,0.5)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="rgba(244,238,227,0.5)"
            fontSize={12}
            domain={[0, 100]}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#211C16",
              border: "2px solid #E8553A",
              borderRadius: 16,
              color: "#F4EEE3",
              fontWeight: 700,
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#E8553A"
            strokeWidth={3}
            dot={{ fill: "#E8553A", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
