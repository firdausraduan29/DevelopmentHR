import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, type LeaveStatus } from "./StatusBadge";
import { format } from "date-fns";

export interface LeaveRecord {
  id: string;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  createdAt: Date;
}

interface LeaveHistoryTableProps {
  records: LeaveRecord[];
  onRowClick?: (record: LeaveRecord) => void;
}

export function LeaveHistoryTable({ records, onRowClick }: LeaveHistoryTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead className="text-center">Days</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow
              key={record.id}
              className={onRowClick ? "cursor-pointer" : ""}
              onClick={() => onRowClick?.(record)}
              data-testid={`row-leave-${record.id}`}
            >
              <TableCell className="font-medium">{record.leaveType}</TableCell>
              <TableCell>
                {format(record.startDate, "dd/MM/yyyy")} - {format(record.endDate, "dd/MM/yyyy")}
              </TableCell>
              <TableCell className="text-center">{record.totalDays}</TableCell>
              <TableCell className="max-w-xs truncate">{record.reason}</TableCell>
              <TableCell>
                <StatusBadge status={record.status} />
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {format(record.createdAt, "dd/MM/yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
