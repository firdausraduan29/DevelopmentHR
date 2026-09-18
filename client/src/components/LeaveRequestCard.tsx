import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, type LeaveStatus } from "./StatusBadge";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";

interface LeaveRequestCardProps {
  id: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  hrComment?: string;
  managerComment?: string;
  onClick?: () => void;
}

export function LeaveRequestCard({
  id,
  leaveType,
  startDate,
  endDate,
  totalDays,
  reason,
  status,
  hrComment,
  managerComment,
  onClick,
}: LeaveRequestCardProps) {
  return (
    <Card
      className={onClick ? "cursor-pointer hover-elevate" : ""}
      onClick={onClick}
      data-testid={`card-leave-request-${id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium">{leaveType} Leave</h3>
              <StatusBadge status={status} />
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <span>
                {format(startDate, "dd/MM/yyyy")} - {format(endDate, "dd/MM/yyyy")}
              </span>
              <span className="font-medium">({totalDays} {totalDays === 1 ? "day" : "days"})</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{reason}</p>
          </div>
        </div>
        {(hrComment || managerComment) && (
          <div className="mt-3 space-y-2 border-t pt-3">
            {hrComment && (
              <div className="text-sm">
                <span className="font-medium text-muted-foreground">HR: </span>
                <span>{hrComment}</span>
              </div>
            )}
            {managerComment && (
              <div className="text-sm">
                <span className="font-medium text-muted-foreground">Manager: </span>
                <span>{managerComment}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
