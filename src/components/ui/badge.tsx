import { cn, priorityColor, statusColor } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "priority" | "status" | "default";
  value?: string;
  className?: string;
}

export function Badge({ children, variant = "default", value, className }: BadgeProps) {
  const colorClass =
    variant === "priority" && value
      ? priorityColor(value)
      : variant === "status" && value
        ? statusColor(value)
        : "text-gray-600 bg-gray-50 border-gray-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        colorClass,
        className
      )}
    >
      {children}
    </span>
  );
}
