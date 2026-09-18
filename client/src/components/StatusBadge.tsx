import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export type LeaveStatus = "Pending" | "HR Approved" | "Manager Approved" | "Rejected";

interface StatusBadgeProps {
  status: LeaveStatus;
}

const statusConfig: Record<LeaveStatus, { className: string; icon: typeof Clock }> = {
  Pending: {
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Clock,
  },
  "HR Approved": {
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: AlertCircle,
  },
  "Manager Approved": {
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: CheckCircle,
  },
  Rejected: {
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: XCircle,
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={`${config.className} gap-1 font-medium no-default-hover-elevate no-default-active-elevate`}
      data-testid={`badge-status-${status.toLowerCase().replace(" ", "-")}`}
    >
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}
