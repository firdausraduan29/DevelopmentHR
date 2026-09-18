import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Shield, UserCog, UserX } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export type UserRole = "Employee" | "HR" | "Manager" | "Admin";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

interface UserManagementTableProps {
  users: UserRecord[];
  onRoleChange?: (userId: string, newRole: UserRole) => void;
  onDelete?: (userId: string) => void;
}

const roleColors: Record<UserRole, string> = {
  Employee: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
  HR: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Manager: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Admin: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

export function UserManagementTable({
  users,
  onRoleChange,
  onDelete,
}: UserManagementTableProps) {
  const { toast } = useToast();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    // todo: remove mock functionality
    toast({
      title: "Role Updated",
      description: `User role has been changed to ${newRole}.`,
    });
    onRoleChange?.(userId, newRole);
    setEditingUserId(null);
  };

  const handleDelete = (userId: string, userName: string) => {
    // todo: remove mock functionality
    toast({
      title: "User Deactivated",
      description: `${userName} has been deactivated.`,
    });
    onDelete?.(userId);
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const initials = user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {editingUserId === user.id ? (
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                    >
                      <SelectTrigger className="w-32" data-testid={`select-role-${user.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant="secondary"
                      className={`${roleColors[user.role]} no-default-hover-elevate no-default-active-elevate`}
                    >
                      {user.role}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(user.createdAt, "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-user-actions-${user.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setEditingUserId(user.id)}>
                        <UserCog className="mr-2 h-4 w-4" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => console.log("View details:", user.id)}>
                        <Shield className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(user.id, user.name)}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
