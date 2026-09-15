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
    <div className="w-full h-64 bg-white/5 border-2 border-white/10 rounded-2xl shadow-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.5)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="rgba(255,255,255,0.5)"
            fontSize={12}
            domain={[0, 100]}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#001220",
              border: "2px solid #6600FF",
              borderRadius: 16,
              color: "#ffffff",
              fontWeight: 700,
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#715DF2"
            strokeWidth={3}
            dot={{ fill: "#6600FF", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
