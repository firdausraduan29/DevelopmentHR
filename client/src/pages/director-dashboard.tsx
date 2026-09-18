import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, FileText, CheckCircle, Clock, XCircle, CalendarDays, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import type { User, LeaveRequest } from "@shared/schema";
import { format } from "date-fns";

type PendingRequest = LeaveRequest & {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export default function DirectorDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [comment, setComment] = useState("");
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  const { data: hrApprovedRequests = [], isLoading: loadingRequests } = useQuery<PendingRequest[]>({
    queryKey: ["/api/leave-requests/pending"],
  });

  const { data: upcomingApproved = [] } = useQuery<PendingRequest[]>({
    queryKey: ["/api/leave-requests/upcoming-approved"],
  });

const { data: allUsers = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, action, comment }: { id: string; action: string; comment: string }) => {
      return apiRequest("PATCH", `/api/leave-requests/${id}/director-approve`, { action, comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/upcoming-approved"] });
      toast({
        title: actionType === "approve" ? "Request Approved" : "Request Rejected",
        description: `The leave request has been ${actionType === "approve" ? "approved" : "rejected"}.`,
      });
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
      setComment("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process the request.",
        variant: "destructive",
      });
    },
  });

     const updateBranchMutation = useMutation({
    mutationFn: async ({ userId, branch }: { userId: string; branch: string | null }) => {
      return apiRequest("PATCH", `/api/users/${userId}/branch`, { branch });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Branch Updated",
        description: "User branch has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user branch.",
        variant: "destructive",
      });
    },
  });

    const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest("PATCH", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  const handleAction = (request: LeaveRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setIsApproveDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedRequest) return;
    approveMutation.mutate({
      id: selectedRequest.id,
      action: actionType,
      comment,
    });
  };

    const filteredUsers = allUsers.filter(
    (u) =>
      u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
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

   const getRoleBadge = (role: string) => {
    switch (role) {
      case "director":
        return <Badge className="bg-purple-500">Director</Badge>;
      case "hr":
        return <Badge className="bg-blue-500">HR</Badge>;
      default:
        return <Badge variant="secondary">Employee</Badge>;
    }
  };

  const pendingPreview = hrApprovedRequests.slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Director Dashboard</h1>
        <p className="text-muted-foreground mt-1">View approval summaries, quick actions, and upcoming leaves.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold" data-testid="text-pending-count">
                  {hrApprovedRequests.length}
                </p>
                <p className="text-sm text-muted-foreground">Pending Leave Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold" data-testid="text-users-count">
                  {allUsers.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-900/30">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {allUsers.filter(u => u.role === "hr").length}
                </p>
                <p className="text-sm text-muted-foreground">HR Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-amber-100 p-3 dark:bg-amber-900/30">
                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {allUsers.filter(u => u.role === "employee").length}
                </p>
                <p className="text-sm text-muted-foreground">Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/director-approvals">
          <Button variant="outline" className="w-full justify-start">
            <CheckCircle className="mr-2 h-4 w-4" />
            View All Approvals
          </Button>
        </Link>

        <Link href="/calendar">
          <Button variant="outline" className="w-full justify-start">
            <CalendarDays className="mr-2 h-4 w-4" />
            View Leave Calendar
          </Button>
        </Link>

        <Link href="/reports">
          <Button variant="outline" className="w-full justify-start">
            <FileText className="mr-2 h-4 w-4" />
            View Reports
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending Approval Preview</CardTitle>
          <Link href="/director-approvals">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : pendingPreview.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No pending leave requests.
            </p>
          ) : (
            <div className="space-y-3">
              {pendingPreview.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {`${request.firstName ?? ""} ${request.lastName ?? ""}`.trim() || request.email || "-"}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {request.leaveType} • {request.totalDays} day(s)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.startDate), "dd/MM/yyyy")} - {format(new Date(request.endDate), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div>{getStatusBadge(request.status)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Approved Leaves</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingApproved.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No upcoming approved leaves.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingApproved.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="capitalize">{request.leaveType}</TableCell>
                    <TableCell>
                      {`${request.firstName ?? ""} ${request.lastName ?? ""}`.trim() ||
                        request.email ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.startDate), "dd/MM/yyyy")} -{" "}
                      {format(new Date(request.endDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{request.totalDays}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/api/leave-requests/${request.id}/pdf`, "_blank")}
                      >
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

            <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-users"
            />
          </div>

          <Card>
            <CardContent className="pt-6">
              {loadingUsers ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No users found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Annual Leave</TableHead>
                      <TableHead>Medical Leave</TableHead>
                      <TableHead>Change Role</TableHead>
                      <TableHead>Branch</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell>
                          {u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : u.email?.split("@")[0] || "N/A"}
                        </TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.department || "N/A"}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell>{u.annualLeaveBalance} days</TableCell>
                        <TableCell>{u.sickLeaveBalance} days</TableCell>
                        <TableCell>
                          {u.id !== user?.id ? (
                            <Select
                              value={u.role}
                              onValueChange={(value) => updateRoleMutation.mutate({ userId: u.id, role: value })}
                            >
                              <SelectTrigger className="w-32" data-testid={`select-role-${u.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="employee">Employee</SelectItem>
                                <SelectItem value="hr">HR</SelectItem>
                                <SelectItem value="director">Director</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground text-sm">Current user</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={(u as any).branch || "unassigned"}
                            onValueChange={(value) =>
                              updateBranchMutation.mutate({
                                userId: u.id,
                                branch: value === "unassigned" ? null : value,
                              })
                            }
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder="Assign branch" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              <SelectItem value="hq">HQ</SelectItem>
                              <SelectItem value="branch1">Branch 1</SelectItem>
                              <SelectItem value="branch2">Branch 2</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This will give final approval to the leave request."
                : "This will reject the leave request."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Comment (optional)</label>
              <Textarea
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                data-testid="textarea-comment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={handleConfirmAction}
              disabled={approveMutation.isPending}
              data-testid="button-confirm-action"
            >
              {approveMutation.isPending ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
