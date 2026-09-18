import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, ArrowRight, Calendar, Stethoscope, Wallet, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { LeaveRequest } from "@shared/schema";
import { format } from "date-fns";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  
  const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
  });

  const recentRequests = requests.slice(-3).reverse();
  
  const medicalFeeBalance = parseFloat(String(user?.medicalFeeBalance || "700"));
  const needsProfileSetup = !user?.startDate;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "hr_approved":
        return <Badge className="bg-blue-500">HR Approved</Badge>;
      case "approved":
        return <Badge className="bg-emerald-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.firstName || user?.email?.split("@")[0] || "User"}! Here's your leave overview.
          </p>
        </div>
        <Link href="/apply">
          <Button className="gap-2" data-testid="button-apply-leave">
            <CalendarPlus className="h-4 w-4" />
            Apply for Leave
          </Button>
        </Link>
      </div>

      {needsProfileSetup && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">Complete Your Profile</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Please set your employment start date to calculate your correct leave balances.
                </p>
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="mt-3" data-testid="button-setup-profile">
                    Set Up Profile
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">Leave Balances</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Annual Leave</p>
                  <p className="text-2xl font-semibold" data-testid="text-annual-balance">
                    {user?.annualLeaveBalance ?? 8} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900/30">
                  <Stethoscope className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Sick Leave</p>
                  <p className="text-2xl font-semibold" data-testid="text-sick-balance">
                    {user?.sickLeaveBalance ?? 14} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                  <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Medical Fee Balance</p>
                  <p className="text-2xl font-semibold" data-testid="text-medical-fee-balance">
                    RM {medicalFeeBalance.toFixed(2)}
                  </p>
                </div>
              </div>

            <div className="flex items-center gap-4 mt-4">
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                  <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Hospitalization Balance</p>
                  <p className="text-2xl font-semibold">
                    {Number((user as any)?.hospitalizationLeaveBalance || 60).toFixed(2)} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <h2 className="text-xl font-semibold">Recent Requests</h2>
          <Link href="/history">
            <Button variant="ghost" className="gap-1" data-testid="link-view-all">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : recentRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No leave requests yet.</p>
              <Link href="/apply">
                <Button data-testid="button-apply-first">Apply for Leave</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentRequests.map((request) => (
              <Card key={request.id} data-testid={`card-request-${request.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg capitalize">{request.leaveType.replace("_", " ")} Leave</CardTitle>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {format(new Date(request.startDate), "dd/MM/yyyy")} - {format(new Date(request.endDate), "dd/MM/yyyy")}
                  </p>
                  <p className="text-sm font-medium">{request.totalDays} day(s)</p>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{request.reason}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
