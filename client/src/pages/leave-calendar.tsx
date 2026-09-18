import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, isWithinInterval, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { User } from "@shared/schema";

interface CalendarLeave {
  id: string;
  firstName: string | null;
  lastName: string | null;
  branch: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: string | null;
  status: string;
}

const leaveTypeColors: Record<string, string> = {
  leave: "bg-emerald-500",
  annual: "bg-blue-500",
  halfday_morning: "bg-cyan-500",
  halfday_afternoon: "bg-indigo-500",
  medical: "bg-red-500",
  unpaid: "bg-gray-500",
  emergency: "bg-orange-500",
  maternity: "bg-pink-500",
  paternity: "bg-purple-500",
  hospitalization: "bg-red-700",
  time_slip: "bg-yellow-500",
};

export default function LeaveCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showRecent, setShowRecent] = useState(false);

 const { data: currentUser } = useQuery<User>({
  queryKey: ["/api/auth/user"],
 });

 const { data: requests = [] } = useQuery<CalendarLeave[]>({
  queryKey: ["/api/leave-requests/calendar"],
 });

  const approvedRequests = requests.filter((r) => {
  const s = (r.status || "").toLowerCase().trim();
  if (!(s === "approved" || s === "hr_approved")) return false;

  const start = new Date(r.startDate as any);
  const end = new Date(r.endDate as any);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (showRecent) {
  const threeMonthsAgo = subMonths(today, 3);

  return end >= threeMonthsAgo && end < today;
}

return end >= today;
});

  const getUserName = (leave: CalendarLeave) => {
  if (leave.firstName) {
    return `${leave.firstName} ${leave.lastName || ""}`.trim();
  }

  return "Employee";
};

  const getBranchLabel = (branch: string | null) => {
  const normalized = String(branch || "").toLowerCase().trim();

  if (["hq", "headquarters"].includes(normalized)) {
    return "HQ";
  }

  if (["branch1", "branch 1"].includes(normalized)) {
    return "Branch 1";
  }

  if (["branch2", "branch 2"].includes(normalized)) {
    return "Branch 2";
  }

  return branch || "Unassigned";
};

  const getLeaveForDate = (date: Date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return approvedRequests.filter((request) => {
    const start = new Date(request.startDate as any);
    const end = new Date(request.endDate as any);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

   if (showRecent) {
  const threeMonthsAgo = subMonths(today, 3);

  return (
    day >= start &&
    day <= end &&
    end >= threeMonthsAgo &&
    end < today
  );
}

return day >= start && day <= end && end >= today;
  });
};

  const selectedDateLeaves = selectedDate ? getLeaveForDate(selectedDate) : [];

  const modifiers = {
    hasLeave: (date: Date) => getLeaveForDate(date).length > 0,
  };

  const modifiersStyles = {
    hasLeave: {
      fontWeight: "bold",
      border: "2px solid hsl(var(--primary))",
      backgroundColor: "hsl(var(--primary) / 0.05)",
    },
  };

  const role = (currentUser?.role || "").toLowerCase().trim();
  const isHr = role === "hr";
  const isDirector = role === "director";
  const isEmployee = role === "employee";
  const canSeeLeaveShortcuts = isHr || isDirector;

  const visibleLegend: Array<[string, string]> = isEmployee
    ? [["leave", leaveTypeColors.leave]]
    : Object.entries(leaveTypeColors).filter(([type]) => type !== "leave");

  return (
  <div className="space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold">Leave Calendar</h1>
        <p className="text-muted-foreground mt-1">View team absences at a glance.</p>
      </div>

     {canSeeLeaveShortcuts && (
        <div className="flex items-center gap-2">
          <Button
            variant={!showRecent ? "default" : "outline"}
            size="sm"
            onClick={() => setShowRecent(false)}
          >
            Upcoming
          </Button>

          <Button
            variant={showRecent ? "default" : "outline"}
            size="sm"
            onClick={() => setShowRecent(true)}
          >
            Past 3 Months
          </Button>

     {isHr && (
      <Link href="/hr-recent-leave-forms">
       <Button variant="outline" size="sm">
         Leave Recirds
         </Button>
        </Link>
       )}
        </div>
      )}
    </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="w-full"
              classNames={{
                months: "w-full",
                month: "w-full",
                table: "w-full",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-sm",
                row: "flex w-full mt-2",
                cell: "flex-1 text-center text-sm relative p-0 min-h-[50px]",
                day: "h-12 w-full rounded-md hover-elevate flex flex-col items-center justify-start pt-1",
                day_selected: "bg-primary text-primary-foreground",
                day_today: "border border-primary font-bold",
              }}
              components={{
                DayContent: ({ date }) => {
                  const dayLeaves = getLeaveForDate(date);
                  return (
                    <div className="flex flex-col items-center w-full h-full relative group">
                      <span className="relative z-10">{date.getDate()}</span>
                      <div className="flex gap-1 mt-1 flex-wrap justify-center px-1">
                        {dayLeaves.slice(0, 3).map((leave, i) => (
                          <div
                            key={i}
                            className={`h-2 w-2 rounded-full ${leaveTypeColors[leave.leaveType] || "bg-gray-400"}`}
                            title={getUserName(leave)}
                          />
                        ))}
                        {dayLeaves.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{dayLeaves.length - 3}</span>
                        )}
                      </div>
                    </div>
                  );
                }
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Select a date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-muted-foreground text-sm">Click on a date to see who is on leave.</p>
            ) : selectedDateLeaves.length === 0 ? (
              <p className="text-muted-foreground text-sm">No one is on leave on this date.</p>
            ) : (
              <div className="space-y-3">
                {selectedDateLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted"
                    data-testid={`leave-item-${leave.id}`}
                  >
                    <div className={`h-3 w-3 rounded-full ${leaveTypeColors[leave.leaveType] || "bg-gray-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{getUserName(leave)}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                         {leave.leaveType === "leave"
                           ? "On Leave"
                           : `${leave.leaveType.replace(/_/g, " ")} leave - ${leave.totalDays} day(s)`}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {getBranchLabel(leave.branch)}
                      </p>
                    </div>
                    <Badge variant={leave.status === "approved" ? "default" : "secondary"} className="text-xs">
                      {leave.status === "approved" ? "Approved" : "HR Approved"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Type Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {visibleLegend.map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${color}`} />
                <span className="text-sm capitalize">
                  {type === "leave" ? "On Leave" : type.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
