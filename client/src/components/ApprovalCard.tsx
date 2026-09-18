import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge, type LeaveStatus } from "./StatusBadge";
import { CalendarDays, Check, X, User } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ApprovalCardProps {
  id: string;
  employeeName: string;
  employeeEmail: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  role: "HR" | "Manager";
  onApprove?: (id: string, comment: string) => void;
  onReject?: (id: string, comment: string) => void;
}

export function ApprovalCard({
  id,
  employeeName,
  employeeEmail,
  leaveType,
  startDate,
  endDate,
  totalDays,
  reason,
  status,
  role,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    // todo: remove mock functionality
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast({
      title: "Request Approved",
      description: `You have approved ${employeeName}'s leave request.`,
    });
    onApprove?.(id, comment);
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }
    setIsProcessing(true);
    // todo: remove mock functionality
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast({
      title: "Request Rejected",
      description: `You have rejected ${employeeName}'s leave request.`,
    });
    onReject?.(id, comment);
    setIsProcessing(false);
  };

  const initials = employeeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card data-testid={`card-approval-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{employeeName}</CardTitle>
              <p className="text-sm text-muted-foreground">{employeeEmail}</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Leave Type</p>
            <p className="font-medium">{leaveType}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Duration</p>
            <p className="font-medium">{totalDays} {totalDays === 1 ? "day" : "days"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span>
            {format(startDate, "dd/MM/yyyy")} - {format(endDate, "dd/MM/yyyy")}
          </span>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Reason</p>
          <p className="text-sm bg-muted rounded-lg p-3">{reason}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {role} Comment (optional for approval, required for rejection)
          </p>
          <Textarea
            placeholder="Add your comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-20"
            data-testid="input-approval-comment"
          />
        </div>

        <div className="flex gap-3 pt-2 flex-wrap">
          <Button
            onClick={handleApprove}
            disabled={isProcessing}
            className="gap-2"
            data-testid="button-approve"
          >
            <Check className="h-4 w-4" />
            Approve
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isProcessing}
            className="gap-2"
            data-testid="button-reject"
          >
            <X className="h-4 w-4" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
