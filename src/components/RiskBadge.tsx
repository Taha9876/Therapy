import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level: "Low" | "Medium" | "High";
}

const RiskBadge = ({ level }: RiskBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        level === "Low" && "risk-badge-low",
        level === "Medium" && "risk-badge-medium",
        level === "High" && "risk-badge-high"
      )}
    >
      {level}
    </span>
  );
};

export default RiskBadge;
