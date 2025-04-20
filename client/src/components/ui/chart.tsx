import { useEffect, useRef } from "react";
import { User } from "@shared/schema";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// The type for mood data expected by the chart
export type MoodData = {
  date: string;
  mood: number;
  label: string;
  // Optional properties for different mood sources
  selfReportedMood?: number;
  sentimentMood?: number;
};

type MoodChartProps = {
  data: MoodData[];
  user?: User;
  height?: number;
};

export function MoodChart({ data, height = 180 }: MoodChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={chartRef} className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9ECF0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={{ stroke: "#E9ECF0" }}
            tickLine={false}
          />
          <YAxis
            domain={[1, 5]}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={{ stroke: "#E9ECF0" }}
            tickLine={false}
            tickCount={5}
            tickFormatter={(value) => {
              if (value === 5) return "Great";
              if (value === 3) return "Okay";
              if (value === 1) return "Low";
              return "";
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #E9ECF0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              padding: "8px",
            }}
            formatter={(value, name, props) => {
              const dataPoint = props.payload as unknown as MoodData;
              const moodTexts = {
                1: "Sad",
                2: "Worried",
                3: "Neutral",
                4: "Good",
                5: "Great"
              };
              
              // If this is the main mood value
              if (name === "mood") {
                const moodValue = Number(value);
                if (moodValue === 0) return ["No mood recorded", "Overall"];
                
                // Check if we have both types of mood data
                if (dataPoint.selfReportedMood && dataPoint.sentimentMood) {
                  return [
                    <div className="space-y-1">
                      <div className="font-semibold">{moodTexts[moodValue as 1 | 2 | 3 | 4 | 5]}</div>
                      <div className="text-xs flex items-center">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#F5B8DB] mr-1"></span>
                        Self-rated: {moodTexts[dataPoint.selfReportedMood as 1 | 2 | 3 | 4 | 5]}
                      </div>
                      <div className="text-xs flex items-center">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#B6CAEB] mr-1"></span>
                        From journal: {moodTexts[Math.round(dataPoint.sentimentMood) as 1 | 2 | 3 | 4 | 5]}
                      </div>
                    </div>, 
                    "Mood"
                  ];
                } else if (dataPoint.selfReportedMood) {
                  return [`${moodTexts[moodValue as 1 | 2 | 3 | 4 | 5]} (self-rated)`, "Mood"];
                } else if (dataPoint.sentimentMood) {
                  return [`${moodTexts[moodValue as 1 | 2 | 3 | 4 | 5]} (from journal)`, "Mood"];
                }
                
                return [moodTexts[moodValue as 1 | 2 | 3 | 4 | 5], "Mood"];
              }
              
              return [value, name];
            }}
            labelFormatter={(label) => label}
          />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="#8B85C1"
            strokeWidth={3}
            dot={{ r: 5, fill: "#8B85C1", strokeWidth: 0 }}
            activeDot={{ r: 7, fill: "#6D67A0", stroke: "#8B85C1", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
