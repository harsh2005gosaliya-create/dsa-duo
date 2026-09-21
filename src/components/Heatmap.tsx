import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function level(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

const LEVEL_CLASS = [
  "bg-muted",
  "bg-primary/25",
  "bg-primary/45",
  "bg-primary/70",
  "bg-primary",
];

export function Heatmap({
  counts,
  weeks = 26,
  onSelect,
}: {
  counts: Record<string, number>;
  weeks?: number;
  onSelect?: (date: string, count: number) => void;
}) {
  const [hover, setHover] = useState<{ date: string; count: number } | null>(null);

  const columns = useMemo(() => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + (6 - end.getDay()));
    const cols: { date: string; count: number }[][] = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const col: { date: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(end);
        day.setDate(end.getDate() - (w * 7 + (6 - d)));
        const iso = day.toISOString().slice(0, 10);
        col.push({ date: iso, count: counts[iso] ?? 0 });
      }
      cols.push(col);
    }
    return cols;
  }, [counts, weeks]);

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {columns.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {col.map((cell) => (
              <button
                key={cell.date}
                type="button"
                onMouseEnter={() => setHover(cell)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect?.(cell.date, cell.count)}
                aria-label={`${cell.date}: ${cell.count} solved`}
                className={cn(
                  "size-[11px] rounded-[2px] transition-transform hover:scale-125",
                  LEVEL_CLASS[level(cell.count)],
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono">
          {hover ? `${hover.date} — ${hover.count} solved` : "Last 6 months"}
        </span>
        <span className="flex items-center gap-1">
          Less
          {LEVEL_CLASS.map((c, i) => (
            <span key={i} className={cn("size-[10px] rounded-[2px]", c)} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
