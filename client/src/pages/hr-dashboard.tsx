import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, CheckCircle, XCircle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LeaveRequest } from "@shared/schema";
import { format } from "date-fns";

 type PendingRequest = LeaveRequest & {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    branch?: string | null;
  };

export default function HRDashboard() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [comment, setComment] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [branchFilter, setBranchFilter] = useState<"all" | "hq" | "branch1" | "branch2">("all");

  const getBranchLabel = (branch: string) => {
    if (branch === "hq") return "HQ";
    if (branch === "branch1") return "Branch 1";
    if (branch === "branch2") return "Branch 2";
    return "All Branches";
  };

  const { data: pendingRequests = [], isLoading } = useQuery<PendingRequest[]>({
    queryKey: ["/api/leave-requests/pending"],
  });

  const { data: upcomingApproved = [] } = useQuery<PendingRequest[]>({
    queryKey: ["/api/leave-requests/upcoming-approved"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, action, comment }: { id: string; action: string; comment: string }) => {
      return apiRequest("PATCH", `/api/leave-requests/${id}/hr-approve`, { action, comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests/upcoming-approved"] });
      toast({
        title: actionType === "approve" ? "Request Approved" : "Request Rejected",
        description: actionType === "approve" 
          ? "The leave request has been approved."
          : "The leave request has been rejected.",
      });
      setIsDialogOpen(false);
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

  const filteredRequests = pendingRequests.filter((r: any) => {
    if (branchFilter === "all") return true;
    return (r.branch || "").toLowerCase() === branchFilter;
  });

  const handleAction = (request: LeaveRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setIsDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedRequest) return;
    approveMutation.mutate({
      id: selectedRequest.id,
      action: actionType,
      comment,
    });
  };

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

    <div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-semibold">HR Dashboard</h1>
    <p className="text-muted-foreground mt-1">Review and approve employee leave requests.</p>
  </div>

  <div className="flex items-center gap-2">
    <Link href="/hr-recent-leave-forms">
      <Button variant="outline" className="gap-2">
        Leave Records
      </Button>
    </Link>

    <Link href="/calendar">
      <Button variant="outline" className="gap-2">
        <Calendar className="h-4 w-4" />
        Calendar
      </Button>
    </Link>
  </div>
</div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-amber-100 p-3 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold" data-testid="text-pending-count">
                  {pendingRequests.length}
                </p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
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
                <p className="text-2xl font-semibold">-</p>
                <p className="text-sm text-muted-foreground">Approved This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">-</p>
                <p className="text-sm text-muted-foreground">Rejected This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
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

      <Card>
        <CardHeader>
          <CardTitle>
            Pending Leave Requests
            {branchFilter !== "all" && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
              — {getBranchLabel(branchFilter)}
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
            No pending requests{branchFilter !== "all" ? ` for ${getBranchLabel(branchFilter)}` : ""}.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                    <TableCell>{request.referenceNo || "-"}</TableCell>
                    <TableCell className="capitalize">{request.leaveType}</TableCell>
                    <TableCell>
                      {`${request.firstName ?? ""} ${request.lastName ?? ""}`.trim() || request.email || "-"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.startDate), "dd/MM/yyyy")} - {format(new Date(request.endDate), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{request.totalDays}</TableCell>
                    <TableCell className="max-w-48 truncate">{request.reason}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAction(request, "approve")}
                          data-testid={`button-approve-${request.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(request, "reject")}
                          data-testid={`button-reject-${request.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/api/leave-requests/${request.id}/pdf`, "_blank")}
                        >
                          PDF
                       </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                  <TableHead>Ref No.</TableHead>
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
                    <TableCell>{request.referenceNo || "-"}</TableCell>
                    <TableCell className="capitalize">{request.leaveType}</TableCell>
                    <TableCell>
                      {`${request.firstName ?? ""} ${request.lastName ?? ""}`.trim() ||
                        request.email ||
                        "-"}
                    </TableCell>
                    <TableCell>
                    {format(new Date(request.startDate), "dd/MM/yyyy")} - {format(new Date(request.endDate), "dd/MM/yyyy")}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This will approve the leave request."
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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
