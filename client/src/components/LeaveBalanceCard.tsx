import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Stethoscope, AlertTriangle, Briefcase, Baby } from "lucide-react";

export type LeaveType = "Annual" | "Medical" | "Emergency" | "Unpaid" | "Maternity";

interface LeaveBalanceCardProps {
  type: LeaveType;
  balance: number;
  total: number;
}

const typeConfig: Record<LeaveType, { icon: typeof CalendarDays; color: string }> = {
  Annual: {
    icon: CalendarDays,
    color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
  },
  Medical: {
    icon: Stethoscope,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
  },
  Emergency: {
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
  },
  Unpaid: {
    icon: Briefcase,
    color: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30",
  },
  Maternity: {
    icon: Baby,
    color: "text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30",
  },
};

export function LeaveBalanceCard({ type, balance, total }: LeaveBalanceCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;
  const percentage = total > 0 ? (balance / total) * 100 : 0;

  return (
    <Card data-testid={`card-balance-${type.toLowerCase()}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{type} Leave</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">{balance}</span>
              <span className="text-sm text-muted-foreground">/ {total} days</span>
            </div>
          </div>
          <div className={`rounded-lg p-3 ${config.color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${config.color.split(" ")[0].replace("text-", "bg-")}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {total - balance} days used this year
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
