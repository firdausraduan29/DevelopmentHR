import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import type { LeaveRequest } from "@shared/schema";
import { format } from "date-fns";

export default function LeaveHistoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
  });

  const filteredRecords = requests.filter((record) => {
    const matchesSearch =
      record.leaveType.toLowerCase().includes(search.toLowerCase()) ||
      record.reason.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Leave History</h1>
        <p className="text-muted-foreground mt-1">View all your past and current leave requests.</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by type or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="hr_approved">HR Approved</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No leave requests found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id} data-testid={`row-request-${record.id}`}>
                  <TableCell className="capitalize">{record.leaveType}</TableCell>
                  <TableCell>{format(new Date(record.startDate), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{format(new Date(record.endDate), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{record.totalDays}</TableCell>
                  <TableCell className="max-w-48 truncate">{record.reason}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>{format(new Date(record.createdAt!), "dd/MM/yyyy")}</TableCell>

                  <TableCell>
                   {(record.status || "").toLowerCase() === "pending" && (
                     <div className="flex gap-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => window.location.href = `/edit-leave/${record.id}`}
                       >
                         Edit
                       </Button>

                       <Button
                         variant="destructive"
                         size="sm"
                         onClick={async () => {
                         try {
                          await apiRequest("PATCH", `/api/leave-requests/${record.id}/cancel`);
                          await queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });

                          toast({
                            title: "Leave cancelled",
                            description: "Your pending leave request has been cancelled.",
                          });
                        } catch (error: any) {
                          toast({
                           title: "Cancel failed",
                           description: error?.message || "Unable to cancel leave request.",
                           variant: "destructive",
                         });
                        }
                      }}
                     > 
                        Cancel
                     </Button>
                   </div>
                 )}
               </TableCell>

               <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/leave-requests/${record.id}/pdf`, "_blank")}
                >
                  PDF
                </Button>
               </TableCell>
               </TableRow>
               ))}
               </TableBody>
               </Table>
               </Card>
               )}
               </div>
               );
               }

