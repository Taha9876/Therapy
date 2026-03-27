import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantStyles = {
  default: "border-l-primary",
  success: "border-l-success",
  warning: "border-l-warning",
  danger: "border-l-destructive",
};

const StatCard = ({ title, value, icon, trend, variant = "default" }: StatCardProps) => {
  return (
    <div className={cn("stat-card border-l-4 animate-fade-in", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-card-foreground">{value}</p>
          {trend && (
            <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
