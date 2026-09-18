import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import type { User, LeaveRequest } from "@shared/schema";
import { format } from "date-fns";

type PendingRequest = LeaveRequest & {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  branch?: string | null;
};

export default function DirectorApprovals() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [comment, setComment] = useState("");
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [branchFilter, setBranchFilter] = useState<"all" | "hq" | "branch1" | "branch2">("all");

const getBranchLabel = (branch: string) => {
  if (branch === "hq") return "HQ";
  if (branch === "branch1") return "Branch 1";
  if (branch === "branch2") return "Branch 2";
  return "All Branches";
};

  const { data: hrApprovedRequests = [], isLoading: loadingRequests } = useQuery<PendingRequest[]>({
    queryKey: ["/api/leave-requests/pending"],
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

  const filteredRequests = hrApprovedRequests.filter((r: any) => {
    if (branchFilter === "all") return true;
    return (r.branch || "").toLowerCase() === branchFilter;
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Approvals</h1>
        <p className="text-muted-foreground mt-1">Review and approve pending leave requests.</p>
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
    {loadingRequests ? (
      <p className="text-muted-foreground">Loading...</p>
    ) : filteredRequests.length === 0 ? (
      <p className="text-muted-foreground text-center py-8">
      No pending leave requests{branchFilter !== "all" ? ` for ${getBranchLabel(branchFilter)}` : ""}.
      </p>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
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
            <TableRow key={request.id}>
              <TableCell className="capitalize">{request.leaveType}</TableCell>
              <TableCell>
                {`${request.firstName ?? ""} ${request.lastName ?? ""}`.trim() || request.email || "-"}
              </TableCell>
              <TableCell>
                {format(new Date(request.startDate), "dd/MM/yyyy")} -{" "}
                {format(new Date(request.endDate), "dd/MM/yyyy")}
              </TableCell>
              <TableCell>{request.totalDays}</TableCell>
              <TableCell className="max-w-48 truncate">{request.reason}</TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAction(request, "approve")}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(request, "reject")}
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
