import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileText, CheckCircle, XCircle, Minus, UserCog } from "lucide-react";
import type { AuditLog } from "@shared/schema";

const actionLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  leave_hr_approved: { label: "HR Approved", variant: "secondary" },
  leave_hr_rejected: { label: "HR Rejected", variant: "destructive" },
  leave_director_approved: { label: "Director Approved", variant: "default" },
  leave_director_rejected: { label: "Director Rejected", variant: "destructive" },
  balance_deducted: { label: "Balance Deducted", variant: "outline" },
  role_changed: { label: "Role Changed", variant: "secondary" },
};

function getActionBadge(action: string) {
  const config = actionLabels[action] || { label: action, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getActionIcon(action: string) {
  if (action.includes("approved")) return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (action.includes("rejected")) return <XCircle className="h-4 w-4 text-red-600" />;
  if (action.includes("balance")) return <Minus className="h-4 w-4 text-orange-600" />;
  if (action.includes("role")) return <UserCog className="h-4 w-4 text-blue-600" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

export default function AuditLogPage() {
  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Audit Log</h1>
        <p className="text-muted-foreground mt-1">Track all approval decisions and system changes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No audit logs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {logs.map((log) => (
                  <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        {getActionBadge(log.action)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground">
                        {log.details || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.createdAt ? format(new Date(log.createdAt), "dd/MM/yyyy HH:mm") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
