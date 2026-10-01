"use client";

import { LabTrendPoint } from "@/lib/mockData";

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

export default function TrendChart({
  points,
  metric,
  unit,
}: {
  points: LabTrendPoint[];
  metric: string;
  unit: string;
}) {
  const width = 560;
  const height = 180;
  const padX = 36;
  const padY = 24;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * (width - padX * 2);
    const y = height - padY - ((p.value - min) / range) * (height - padY * 2);
    return { x, y, ...p };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-medium text-ink">{metric}</span>
        <span className="text-xs text-muted">{unit}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={padX}
            x2={width - padX}
            y1={padY + t * (height - padY * 2)}
            y2={padY + t * (height - padY * 2)}
            stroke="#E1E4E1"
            strokeWidth={1}
          />
        ))}
        <path d={path} fill="none" stroke="#2F63E5" strokeWidth={2} />
        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r={3.5} fill="#2F63E5" />
            <text x={c.x} y={c.y - 10} textAnchor="middle" fontSize={11} fill="#10161C" fontFamily="var(--font-plex-mono)">
              {c.value}
            </text>
            <text x={c.x} y={height - 4} textAnchor="middle" fontSize={10} fill="#5B6A66">
              {formatShort(c.date)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
