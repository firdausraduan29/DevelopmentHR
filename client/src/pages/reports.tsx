import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, Users, Calendar, TrendingUp } from "lucide-react";
import type { LeaveRequest, User } from "@shared/schema";

const leaveTypeColors: Record<string, string> = {
  annual: "#3b82f6",
  medical: "#ef4444",
  unpaid: "#6b7280",
  emergency: "#f97316",
  maternity: "#ec4899",
  paternity: "#8b5cf6",
  hospitalization: "#dc2626",
  time_slip: "#eab308",
  replacement: "#14b8a6",
};

const toNumber = (value: unknown) => Number(value) || 0;

 export default function ReportsPage() {
  const [branchFilter, setBranchFilter] = useState<"all" | "hq" | "branch1" | "branch2">("all");

  const { data: requests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests/all"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const filteredUsers = users.filter((u: any) => {
    if (branchFilter === "all") return true;
    return (u.branch || "").toLowerCase() === branchFilter;
  });

  const filteredUserIds = new Set(filteredUsers.map((u: any) => u.id));

  const filteredRequests = requests.filter((r: any) =>
    branchFilter === "all" ? true : filteredUserIds.has(r.userId)
  );

  const approvedRequests = filteredRequests.filter(r => r.status === "approved");
  const pendingRequests = filteredRequests.filter(r => r.status === "pending" || r.status === "hr_approved");
  const rejectedRequests = filteredRequests.filter(r => r.status === "rejected");

  const leaveByType = Object.entries(
    approvedRequests.reduce((acc, req) => {
      acc[req.leaveType] = (acc[req.leaveType] || 0) + toNumber(req.totalDays);
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, days]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1).replace("_", " "),
    days,
    fill: leaveTypeColors[type] || "#6b7280",
  }));

  const statusData = [
    { name: "Approved", value: approvedRequests.length, fill: "#22c55e" },
    { name: "Pending", value: pendingRequests.length, fill: "#eab308" },
    { name: "Rejected", value: rejectedRequests.length, fill: "#ef4444" },
  ].filter(d => d.value > 0);

  const totalLeaveDays = approvedRequests.reduce((sum, r) => sum + toNumber(r.totalDays), 0);
  const avgLeaveDays = filteredUsers.length > 0 ? (totalLeaveDays / filteredUsers.length).toFixed(1) : "0.0";

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyLeave = approvedRequests.filter(r => {
    const date = new Date(r.startDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const departmentLeave = Object.entries(
    approvedRequests.reduce((acc, req) => {
      const user = filteredUsers.find((u: any) => u.id === req.userId);
      const dept = user?.department || "Unassigned";
      acc[dept] = (acc[dept] || 0) + toNumber(req.totalDays);
      return acc;
    }, {} as Record<string, number>)
  ).map(([dept, days]) => ({ department: dept, days }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Leave usage statistics and insights.</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={branchFilter === "all" ? "default" : "outline"}
          onClick={() => setBranchFilter("all")}
        >
          All Branches
        </Button>
        <Button
          variant={branchFilter === "hq" ? "default" : "outline"}
          onClick={() => setBranchFilter("hq")}
        >
          HQ
        </Button>
        <Button
          variant={branchFilter === "branch1" ? "default" : "outline"}
          onClick={() => setBranchFilter("branch1")}
        >
          Branch 1
        </Button>
        <Button
          variant={branchFilter === "branch2" ? "default" : "outline"}
          onClick={() => setBranchFilter("branch2")}
        >
          Branch 2
        </Button>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
           <div className="text-2xl font-bold" data-testid="stat-total-employees">{filteredUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leave Days Used</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-leave">{totalLeaveDays}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Days/Employee</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-avg-leave">{avgLeaveDays}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-monthly-leave">
            {monthlyLeave.reduce((sum, r) => sum + toNumber(r.totalDays), 0)} days
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leave by Type</CardTitle>
            <CardDescription>Total approved leave days by category</CardDescription>
          </CardHeader>
          <CardContent>
            {leaveByType.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No leave data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leaveByType}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="days" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Status</CardTitle>
            <CardDescription>Distribution of leave requests by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No requests yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {departmentLeave.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Leave by Department</CardTitle>
            <CardDescription>Total approved leave days by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentLeave} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="department" tick={{ fontSize: 12 }} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="days" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
