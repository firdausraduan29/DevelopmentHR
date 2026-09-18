import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarX, FileQuestion, Users, ClipboardList } from "lucide-react";

type EmptyStateType = "no-requests" | "no-approvals" | "no-users" | "no-results";

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const typeConfig: Record<EmptyStateType, { icon: typeof CalendarX; title: string; description: string }> = {
  "no-requests": {
    icon: CalendarX,
    title: "No Leave Requests",
    description: "You haven't submitted any leave requests yet. Start by applying for your first leave.",
  },
  "no-approvals": {
    icon: ClipboardList,
    title: "No Pending Approvals",
    description: "Great job! There are no leave requests waiting for your approval.",
  },
  "no-users": {
    icon: Users,
    title: "No Users Found",
    description: "There are no users matching your criteria.",
  },
  "no-results": {
    icon: FileQuestion,
    title: "No Results",
    description: "We couldn't find any matching results. Try adjusting your filters.",
  },
};

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{title || config.title}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description || config.description}
        </p>
        {actionLabel && onAction && (
          <Button className="mt-6" onClick={onAction} data-testid="button-empty-state-action">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
