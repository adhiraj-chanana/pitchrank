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
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            domain={[0, 100]}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "2px solid #4f46e5",
              borderRadius: 16,
              color: "#111827",
              fontWeight: 700,
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#4f46e5"
            strokeWidth={3}
            dot={{ fill: "#4f46e5", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
