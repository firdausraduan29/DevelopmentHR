import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type BranchFilter = "all" | "hq" | "branch1" | "branch2";

type StatusFilter =
  | "all"
  | "approved"
  | "pending"
  | "rejected"
  | "cancelled";

type LeaveRecord = {
  id: string;
  userId?: string;
  referenceNo: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  branch?: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: string | number | null;
  status: string;
  createdAt: string | null;
};

const branchOptions: Array<{
  value: BranchFilter;
  label: string;
}> = [
  { value: "all", label: "All Branches" },
  { value: "hq", label: "HQ" },
  { value: "branch1", label: "Branch 1" },
  { value: "branch2", label: "Branch 2" },
];

const statusOptions: Array<{
  value: StatusFilter;
  label: string;
}> = [
  { value: "all", label: "All Statuses" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const controlClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

const malaysiaDisplayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kuala_Lumpur",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const malaysiaDateKeyFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kuala_Lumpur",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function normalizeBranch(branch?: string | null): string {
  const value = String(branch || "").trim().toLowerCase();

  if (
    value === "branch2" ||
    value.includes("branch 2")
  ) {
    return "branch2";
  }

  if (value.includes("branch1")) {
    return "branch1";
  }

  if (
  value === "hq" ||
  value === "headquarters"
) {
  return "hq";
}

  return value || "unassigned";
}

function getBranchLabel(branch?: string | null): string {
  const normalizedBranch = normalizeBranch(branch);

  if (normalizedBranch === "hq") return "HQ";
  if (normalizedBranch === "branch1") return "Branch 1";
  if (normalizedBranch === "branch2") return "Branch 2";

  return "Unassigned";
}

function normalizeStatus(status?: string | null): string {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getStatusGroup(status?: string | null): StatusFilter {
  const normalized = normalizeStatus(status);

  if (normalized === "approved" || normalized === "hr_approved") {
    return "approved";
  }

  if (normalized === "pending") return "pending";
  if (normalized === "rejected") return "rejected";
  if (normalized === "cancelled" || normalized === "canceled") {
    return "cancelled";
  }

  return "pending";
}

function getStatusLabel(status?: string | null): string {
  const normalized = normalizeStatus(status);

  if (normalized === "hr_approved") return "HR Approved";
  if (normalized === "approved") return "Approved";
  if (normalized === "pending") return "Pending";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "cancelled" || normalized === "canceled") {
    return "Cancelled";
  }

  return status || "Unknown";
}

function getStatusBadgeVariant(
  status?: string | null
): "default" | "secondary" | "destructive" | "outline" {
  const group = getStatusGroup(status);

  if (group === "approved") return "default";
  if (group === "rejected") return "destructive";
  if (group === "cancelled") return "outline";

  return "secondary";
}

function getEmployeeName(record: LeaveRecord): string {
  const fullName = `${record.firstName ?? ""} ${
    record.lastName ?? ""
  }`.trim();

  return fullName || record.email || "Unknown Employee";
}

function getEmployeeKey(record: LeaveRecord): string {
  return (
    record.userId ||
    record.email ||
    `${record.firstName ?? ""}-${record.lastName ?? ""}`
  );
}

function formatMalaysiaDate(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return malaysiaDisplayFormatter.format(date);
}

function toMalaysiaDateKey(value?: string | null): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = malaysiaDateKeyFormatter.formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;

  if (!day || !month || !year) return "";

  return `${year}-${month}-${day}`;
}

function formatLeaveType(leaveType?: string | null): string {
  return String(leaveType || "leave")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function LeaveRecordsTable({
  records,
  emptyMessage,
}: {
  records: LeaveRecord[];
  emptyMessage: string;
}) {
  if (records.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-3 pr-4 text-left">Reference</th>
            <th className="py-3 pr-4 text-left">Employee</th>
            <th className="py-3 pr-4 text-left">Branch</th>
            <th className="py-3 pr-4 text-left">Leave Details</th>
            <th className="py-3 pr-4 text-left">Status</th>
            <th className="py-3 text-left">PDF</th>
          </tr>
        </thead>

        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b align-top">
              <td className="py-3 pr-4">
                <div className="font-medium">
                  {record.referenceNo || "-"}
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  Applied {formatMalaysiaDate(record.createdAt)}
                </div>
              </td>

              <td className="py-3 pr-4">
                <div className="font-medium">
                  {getEmployeeName(record)}
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  {record.email || ""}
                </div>
              </td>

              <td className="py-3 pr-4">
                {getBranchLabel(record.branch)}
              </td>

              <td className="py-3 pr-4">
                <div className="font-medium">
                  {formatLeaveType(record.leaveType)}
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  {formatMalaysiaDate(record.startDate)} -{" "}
                  {formatMalaysiaDate(record.endDate)}
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  {Number(record.totalDays || 0)} day(s)
                </div>
              </td>

              <td className="py-3 pr-4">
                <Badge variant={getStatusBadgeVariant(record.status)}>
                  {getStatusLabel(record.status)}
                </Badge>
              </td>

              <td className="py-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `/api/leave-requests/${record.id}/pdf`,
                      "_blank"
                    )
                  }
                >
                  View PDF
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HrRecentLeaveFormsPage() {
  const [recentSearch, setRecentSearch] = useState("");
  const [recentBranchFilter, setRecentBranchFilter] =
    useState<BranchFilter>("all");
  const [recentStatusFilter, setRecentStatusFilter] =
    useState<StatusFilter>("all");

  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [trackerBranchFilter, setTrackerBranchFilter] =
    useState<BranchFilter>("all");
  const [trackerStatusFilter, setTrackerStatusFilter] =
    useState<StatusFilter>("all");
  const [trackerLeaveTypeFilter, setTrackerLeaveTypeFilter] =
    useState("all");
  const [trackerFromDate, setTrackerFromDate] = useState("");
  const [trackerToDate, setTrackerToDate] = useState("");

  const recentQuery = useQuery<LeaveRecord[]>({
    queryKey: ["/api/leave-requests/recent-forms"],
  });

  const trackerQuery = useQuery<LeaveRecord[]>({
    queryKey: ["/api/leave-requests/employee-tracker"],
  });

  const recentData = recentQuery.data ?? [];
  const trackerData = trackerQuery.data ?? [];

  const employeeOptions = useMemo(() => {
    const employees = new Map<
      string,
      {
        key: string;
        name: string;
        email: string;
        branch: string;
      }
    >();

    trackerData.forEach((record) => {
      const key = getEmployeeKey(record);

      if (!employees.has(key)) {
        employees.set(key, {
          key,
          name: getEmployeeName(record),
          email: record.email || "",
          branch: getBranchLabel(record.branch),
        });
      }
    });

    return Array.from(employees.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [trackerData]);

  const leaveTypeOptions = useMemo(() => {
    return Array.from(
      new Set(
        trackerData
          .map((record) => record.leaveType)
          .filter(Boolean)
      )
    ).sort();
  }, [trackerData]);

  const filteredRecentData = useMemo(() => {
    const search = recentSearch.trim().toLowerCase();

    return recentData.filter((record) => {
      const matchesSearch =
        !search ||
        [
          getEmployeeName(record),
          record.email,
          record.referenceNo,
          record.leaveType,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search);

      const matchesBranch =
        recentBranchFilter === "all" ||
        normalizeBranch(record.branch) === recentBranchFilter;

      const matchesStatus =
        recentStatusFilter === "all" ||
        getStatusGroup(record.status) === recentStatusFilter;

      return matchesSearch && matchesBranch && matchesStatus;
    });
  }, [
    recentData,
    recentSearch,
    recentBranchFilter,
    recentStatusFilter,
  ]);

  const filteredTrackerData = useMemo(() => {
    return trackerData.filter((record) => {
      const matchesEmployee =
        employeeFilter === "all" ||
        getEmployeeKey(record) === employeeFilter;

      const matchesBranch =
        trackerBranchFilter === "all" ||
        normalizeBranch(record.branch) === trackerBranchFilter;

      const matchesStatus =
        trackerStatusFilter === "all" ||
        getStatusGroup(record.status) === trackerStatusFilter;

      const matchesLeaveType =
        trackerLeaveTypeFilter === "all" ||
        record.leaveType === trackerLeaveTypeFilter;

      const leaveStartDate = toMalaysiaDateKey(record.startDate);
      const leaveEndDate = toMalaysiaDateKey(record.endDate);

      const matchesFromDate =
        !trackerFromDate ||
        !leaveEndDate ||
        leaveEndDate >= trackerFromDate;

      const matchesToDate =
        !trackerToDate ||
        !leaveStartDate ||
        leaveStartDate <= trackerToDate;

      return (
        matchesEmployee &&
        matchesBranch &&
        matchesStatus &&
        matchesLeaveType &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    trackerData,
    employeeFilter,
    trackerBranchFilter,
    trackerStatusFilter,
    trackerLeaveTypeFilter,
    trackerFromDate,
    trackerToDate,
  ]);

  const trackerSummary = useMemo(() => {
    const approvedRecords = filteredTrackerData.filter(
      (record) => getStatusGroup(record.status) === "approved"
    );

    const pendingRecords = filteredTrackerData.filter(
      (record) => getStatusGroup(record.status) === "pending"
    );

    const unsuccessfulRecords = filteredTrackerData.filter((record) =>
      ["rejected", "cancelled"].includes(
        getStatusGroup(record.status)
      )
    );

    const approvedDays = approvedRecords.reduce(
      (total, record) => total + Number(record.totalDays || 0),
      0
    );

    return {
      total: filteredTrackerData.length,
      approved: approvedRecords.length,
      pending: pendingRecords.length,
      unsuccessful: unsuccessfulRecords.length,
      approvedDays,
    };
  }, [filteredTrackerData]);

  const clearTrackerFilters = () => {
    setEmployeeFilter("all");
    setTrackerBranchFilter("all");
    setTrackerStatusFilter("all");
    setTrackerLeaveTypeFilter("all");
    setTrackerFromDate("");
    setTrackerToDate("");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Leave Records</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Access recent leave PDFs and track employee leave history.
          </p>
        </div>

        <Link href="/approvals">
          <Button variant="outline">Back to Approvals</Button>
        </Link>
      </div>

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="recent">
            Recent Leave Forms
          </TabsTrigger>

          <TabsTrigger value="tracker">
            Employee Leave Tracker
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader className="space-y-4">
              <div>
                <CardTitle>Recent Leave Forms</CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Applications submitted within the last 30 days.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Search
                  </label>

                  <input
                    type="text"
                    value={recentSearch}
                    onChange={(event) =>
                      setRecentSearch(event.target.value)
                    }
                    placeholder="Name, email or reference"
                    className={controlClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Branch
                  </label>

                  <select
                    value={recentBranchFilter}
                    onChange={(event) =>
                      setRecentBranchFilter(
                        event.target.value as BranchFilter
                      )
                    }
                    className={controlClass}
                  >
                    {branchOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Status
                  </label>

                  <select
                    value={recentStatusFilter}
                    onChange={(event) =>
                      setRecentStatusFilter(
                        event.target.value as StatusFilter
                      )
                    }
                    className={controlClass}
                  >
                    {statusOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {recentQuery.isLoading ? (
                <p className="text-muted-foreground">
                  Loading recent leave forms...
                </p>
              ) : recentQuery.error ? (
                <p className="text-red-500">
                  Failed to load recent leave forms.
                </p>
              ) : (
                <LeaveRecordsTable
                  records={filteredRecentData}
                  emptyMessage="No recent leave forms match the selected filters."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracker" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Leave Tracker</CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Review the complete leave application history for each
                employee.
              </p>
            </CardHeader>

            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="xl:col-span-2">
                  <label className="mb-1 block text-sm font-medium">
                    Employee
                  </label>

                  <select
                    value={employeeFilter}
                    onChange={(event) =>
                      setEmployeeFilter(event.target.value)
                    }
                    className={controlClass}
                  >
                    <option value="all">All Employees</option>

                    {employeeOptions.map((employee) => (
                      <option
                        key={employee.key}
                        value={employee.key}
                      >
                        {employee.name}
                        {employee.email
                          ? ` — ${employee.email}`
                          : ""}
                        {employee.branch
                          ? ` (${employee.branch})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Branch
                  </label>

                  <select
                    value={trackerBranchFilter}
                    onChange={(event) =>
                      setTrackerBranchFilter(
                        event.target.value as BranchFilter
                      )
                    }
                    className={controlClass}
                  >
                    {branchOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Status
                  </label>

                  <select
                    value={trackerStatusFilter}
                    onChange={(event) =>
                      setTrackerStatusFilter(
                        event.target.value as StatusFilter
                      )
                    }
                    className={controlClass}
                  >
                    {statusOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Leave Type
                  </label>

                  <select
                    value={trackerLeaveTypeFilter}
                    onChange={(event) =>
                      setTrackerLeaveTypeFilter(event.target.value)
                    }
                    className={controlClass}
                  >
                    <option value="all">All Leave Types</option>

                    {leaveTypeOptions.map((leaveType) => (
                      <option key={leaveType} value={leaveType}>
                        {formatLeaveType(leaveType)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Leave From
                  </label>

                  <input
                    type="date"
                    value={trackerFromDate}
                    onChange={(event) =>
                      setTrackerFromDate(event.target.value)
                    }
                    className={controlClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Leave To
                  </label>

                  <input
                    type="date"
                    value={trackerToDate}
                    onChange={(event) =>
                      setTrackerToDate(event.target.value)
                    }
                    className={controlClass}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={clearTrackerFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Total Applications
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {trackerSummary.total}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Approved
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {trackerSummary.approved}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Pending
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {trackerSummary.pending}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Rejected / Cancelled
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {trackerSummary.unsuccessful}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Approved Days
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {trackerSummary.approvedDays}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Leave History ({filteredTrackerData.length})
              </CardTitle>
            </CardHeader>

            <CardContent>
              {trackerQuery.isLoading ? (
                <p className="text-muted-foreground">
                  Loading employee leave history...
                </p>
              ) : trackerQuery.error ? (
                <p className="text-red-500">
                  Failed to load employee leave history.
                </p>
              ) : (
                <LeaveRecordsTable
                  records={filteredTrackerData}
                  emptyMessage="No leave applications match the selected filters."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
