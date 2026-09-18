import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, UserCheck, Crown, Calendar } from "lucide-react";

type RoleOption = "employee" | "hr" | "director";

const roleOptions = [
  {
    id: "employee" as RoleOption,
    title: "Employee",
    description: "Apply for leave and view your leave balance",
    icon: Users,
  },
  {
    id: "hr" as RoleOption,
    title: "HR",
    description: "Review and approve employee leave requests",
    icon: UserCheck,
  },
  {
    id: "director" as RoleOption,
    title: "Director",
    description: "Final approval authority and user management",
    icon: Crown,
  },
];

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const { toast } = useToast();

  const selectRoleMutation = useMutation({
    mutationFn: async (role: RoleOption) => {
      const response = await apiRequest("POST", "/api/auth/select-role", { role });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Role Selected",
        description: "Your role has been set successfully. Welcome to HR System!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set role",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (selectedRole) {
      selectRoleMutation.mutate(selectedRole);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Calendar className="h-7 w-7" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Welcome to HR System</h1>
          <p className="text-muted-foreground mt-2">
            Your role is assigned by management. Select Employee to continue.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Your Role</CardTitle>
            <CardDescription>
              Choose the role that matches your position in the company. 
              If you need to change it later, contact a Director.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
            {roleOptions.map((option) => {
  const Icon = option.icon;
  const isSelected = selectedRole === option.id;
  const isLocked = option.id !== "employee";

  return (
    <button
      key={option.id}
      type="button"
      disabled={isLocked}
      onClick={() => !isLocked && setSelectedRole(option.id)}
      className={[
       "flex items-start gap-4 p-4 rounded-lg border text-left transition-colors",
       isSelected ? "border-primary bg-primary/5" : "border-border",
       isLocked ? "opacity-50 cursor-not-allowed" : "hover-elevate",
       ].join(" ")}
       data-testid={`button-role-${option.id}`}
    >
      <div
      className={[
       "flex h-10 w-10 items-center justify-center rounded-lg",
       isSelected ? "bg-primary text-primary-foreground" : "bg-muted",
      ].join(" ")}

      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1">
        <h3 className="font-medium">
          {option.title}
          {isLocked && (
            <span className="text-xs ml-2 text-muted-foreground">(Contact Director)</span>
          )}
        </h3>
        <p className="text-sm text-muted-foreground">{option.description}</p>
      </div>

      <div
      className={[
       "h-5 w-5 rounded-full border-2 flex items-center justify-center",
       isSelected ? "border-primary" : "border-muted-foreground",
      ].join(" ")}

      >
        {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </div>
    </button>
  );
})}
</div>

<Button
  onClick={handleSubmit}
  disabled={!selectedRole || selectRoleMutation.isPending}
  className="w-full mt-6"
  data-testid="button-confirm-role"
>
  {selectRoleMutation.isPending ? "Setting up..." : "Continue"}
</Button>
</CardContent>
</Card>
</div>
</div>
);
}
