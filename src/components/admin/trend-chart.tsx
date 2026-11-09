import type { SeriesPoint } from "@/lib/admin/types";

const TONES: Record<string, { fill: string; soft: string }> = {
  forest: { fill: "#304e3e", soft: "#aab5a1" },
  gold: { fill: "#b3924f", soft: "#d9c79a" },
  terracotta: { fill: "#b06a4a", soft: "#ddb39c" },
};

export function TrendChart({
  points,
  label,
  tone = "forest",
  height = 120,
}: {
  points: SeriesPoint[];
  label: string;
  tone?: keyof typeof TONES;
  height?: number;
}) {
  const palette = TONES[tone] ?? TONES.forest;
  const max = Math.max(1, ...points.map((point) => point.count));
  const total = points.reduce((sum, point) => sum + point.count, 0);
  const width = 600;
  const gap = points.length > 20 ? 1 : 3;
  const barWidth = points.length ? (width - gap * (points.length - 1)) / points.length : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11.5px] font-medium text-[var(--adm-ink-soft)]">{label}</p>
        <p className="text-[11px] text-[var(--adm-muted)]">
          {total.toLocaleString("en-GB")} total
        </p>
      </div>
      <svg
        role="img"
        aria-label={`${label}: ${total} across ${points.length} days`}
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2 w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <line
          x1={0}
          y1={height - 1}
          x2={width}
          y2={height - 1}
          stroke="var(--adm-line)"
          strokeWidth={1}
        />
        {points.map((point, index) => {
          const barHeight = point.count === 0 ? 1 : (point.count / max) * (height - 10);
          return (
            <rect
              key={point.day}
              x={index * (barWidth + gap)}
              y={Math.max(1, height - 1 - barHeight)}
              width={barWidth}
              height={barHeight}
              rx={1.5}
              fill={point.count === 0 ? "var(--adm-line)" : palette.fill}
              opacity={point.count === 0 ? 0.5 : 0.35 + 0.65 * (point.count / max)}
            >
              <title>{`${point.day}: ${point.count}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-[var(--adm-muted)]">
        <span>{points[0]?.day ?? "—"}</span>
        <span>{points[points.length - 1]?.day ?? "—"}</span>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {points.map((point) => (
            <tr key={point.day}>
              <th scope="row">{point.day}</th>
              <td>{point.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
