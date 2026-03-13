import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use dark variant matching bg-slate-900 theme */
  dark?: boolean;
}

export function Skeleton({ className, dark = false, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md",
        dark ? "bg-slate-800" : "bg-slate-200",
        className
      )}
      {...props}
    />
  );
}
