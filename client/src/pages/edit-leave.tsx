import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LeaveRequest } from "@shared/schema";

export default function EditLeavePage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: request, isLoading } = useQuery<LeaveRequest>({
    queryKey: [`/api/leave-requests/${id}`],
    enabled: !!id,
  });

  const [reason, setReason] = useState("");
  const [coveringPerson, setCoveringPerson] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (request) {
      setReason(request.reason || "");
      setCoveringPerson(request.coveringPerson || "");
      setStartDate(String(request.startDate).slice(0, 10));
      setEndDate(String(request.endDate).slice(0, 10));
    }
  }, [request]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/leave-requests/${id}`, {
        reason,
        coveringPerson,
        startDate,
        endDate,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });

      toast({
        title: "Updated",
        description: "Leave request updated successfully.",
      });

      navigate("/history");
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Unable to update leave request.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) return <p>Loading...</p>;
  if (!request) return <p>Leave request not found.</p>;

  if ((request.status || "").toLowerCase() !== "pending") {
    return <p>Only pending leave requests can be edited.</p>;
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Edit Leave Request</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        <div>
          <Label>Start Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <Label>End Date</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div>
          <Label>Covering Person</Label>
          <Input
            value={coveringPerson}
            onChange={(e) => setCoveringPerson(e.target.value)}
          />
        </div>

        <div>
          <Label>Reason</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            Save Changes
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/history")}
          >
            Cancel
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}
