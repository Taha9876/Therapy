import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  Active: "bg-success/15 text-success",
  Inactive: "bg-muted text-muted-foreground",
  Pending: "bg-warning/15 text-warning",
  Confirmed: "bg-success/15 text-success",
  Completed: "bg-primary/15 text-primary",
  Cancelled: "bg-destructive/15 text-destructive",
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        statusStyles[status] || "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
