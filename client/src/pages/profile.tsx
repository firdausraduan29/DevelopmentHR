import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, User, Briefcase, Clock, Wallet } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { calculateLeaveBalances, MEDICAL_FEE_LIMIT } from "@shared/schema";

const departmentOptions = [
  { value: "maintenance", label: "Maintenance" },
  { value: "sales", label: "Sales" },
  { value: "hr", label: "HR" },
  { value: "finance", label: "Finance" },
  { value: "marketing", label: "Marketing" },
  { value: "admin", label: "Admin" },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setDepartment(user?.department || "");
    setWorkSchedule((user as any)?.workSchedule || "standard");
  }, [user?.firstName, user?.lastName, user?.department, (user as any)?.workSchedule]);
  
  const currentStartDate = user?.startDate ? new Date(user.startDate) : undefined;
  const [startDate, setStartDate] = useState<Date | undefined>(currentStartDate);
  const [department, setDepartment] = useState(user?.department || "");
  const [workSchedule, setWorkSchedule] = useState((user as any)?.workSchedule || "standard");

  const yearsOfService = startDate 
    ? differenceInYears(new Date(), startDate)
    : 0;
  
  const expectedBalances = calculateLeaveBalances(yearsOfService);
  const medicalFeeBalance = parseFloat(String(user?.medicalFeeBalance || MEDICAL_FEE_LIMIT));

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { startDate?: string; department?: string; firstName?: string; lastName?: string; workSchedule?: string }) => {
      return apiRequest("PATCH", "/api/auth/user/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully. Leave entitlements have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateProfileMutation.mutate({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      department: department || undefined,
      workSchedule: workSchedule || "standard",
    });
  };

  return (
    <div className="space-y-8 max-w-2xl">
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and view your leave entitlements.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Your basic information. Some fields are synced from your login account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)}
                data-testid="input-first-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                data-testid="input-last-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
              value={user?.email || ""} 
              disabled 
              className="bg-muted"
              data-testid="input-email"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Employment Details
          </CardTitle>
          <CardDescription>
            Set your employment start date to calculate your leave entitlements.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Employment Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date > new Date()}
                      captionLayout="dropdown-buttons"
                      fromYear={1990}
                      toYear={new Date().getFullYear()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground mb-4">
                  This determines your leave entitlements based on years of service.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger data-testid="select-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

             <div className="space-y-2">
                <Label>Work Schedule</Label>
                <Select value={workSchedule} onValueChange={setWorkSchedule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select work schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (Mon - Fri)</SelectItem>
                    <SelectItem value="includes_weekends">Includes Weekends (Mon - Sun)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This affects how your leave days are counted when applying.
                </p>
              </div>
             </div>
 
            {startDate && (
              <div className="rounded-lg bg-muted p-4 space-y-2 mt-4 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Years of Service: {yearsOfService} year(s)</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on your start date, you are entitled to:
                </p>
                <ul className="text-sm space-y-1 ml-6 list-disc">
                  <li><strong>{expectedBalances.annualLeave}</strong> days of annual leave per year</li>
                  <li><strong>{expectedBalances.sickLeave}</strong> days of sick leave per year</li>
                  <li><strong>RM {MEDICAL_FEE_LIMIT}</strong> medical fee allowance per year</li>
                </ul>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={updateProfileMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
        </CardContent>
      </Card>

      <Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Wallet className="h-5 w-5" />
      Leave Entitlements
    </CardTitle>
    <CardDescription>
      Your leave entitlement based on company policy and years of service.
    </CardDescription>
  </CardHeader>

  <CardContent>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border p-4 text-center">
        <p className="text-sm text-muted-foreground">Annual Entitlement</p>
        <p className="text-2xl font-semibold mt-1">
          {Number(user?.annualLeaveEntitlement || 0).toFixed(2)} days
        </p>
      </div>

      <div className="rounded-lg border p-4 text-center">
        <p className="text-sm text-muted-foreground">MC Entitlement</p>
        <p className="text-2xl font-semibold mt-1">
          {Number(user?.sickLeaveEntitlement || 0).toFixed(2)} days
        </p>
      </div>
    </div>
  </CardContent>
</Card>

      </form>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Current Leave Balances
          </CardTitle>
          <CardDescription>
            Your remaining leave balances for this year.
          </CardDescription>
        </CardHeader>
        <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <div className="rounded-lg border p-4 text-center">
    <p className="text-sm text-muted-foreground">Annual Leave Balance</p>
    <p className="text-2xl font-semibold mt-1" data-testid="text-annual-balance">
      {Number(user?.annualLeaveBalance || 0).toFixed(2)} days
    </p>
  </div>

  <div className="rounded-lg border p-4 text-center">
    <p className="text-sm text-muted-foreground">Sick Leave Balance</p>
    <p className="text-2xl font-semibold mt-1" data-testid="text-sick-balance">
      {Number(user?.sickLeaveBalance || 0).toFixed(2)} days
    </p>
  </div>

  <div className="rounded-lg border p-4 text-center">
    <p className="text-sm text-muted-foreground">Medical Fee Balance</p>
    <p className="text-2xl font-semibold mt-1" data-testid="text-medical-fee">
                RM {medicalFeeBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
