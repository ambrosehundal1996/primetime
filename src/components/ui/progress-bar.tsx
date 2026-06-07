import { cn, formatPercent } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  label?: string;
  showPercent?: boolean;
  className?: string;
  color?: "green" | "amber" | "red" | "blue";
}

const colorMap = {
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
};

export function ProgressBar({
  value,
  label,
  showPercent = true,
  className,
  color = "blue",
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value * 100));

  return (
    <div className={cn("space-y-1", className)}>
      {(label || showPercent) && (
        <div className="flex justify-between text-xs text-gray-500">
          {label && <span>{label}</span>}
          {showPercent && <span>{formatPercent(value)}</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn("h-full rounded-full transition-all", colorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
