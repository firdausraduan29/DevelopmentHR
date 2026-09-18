import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, AlertCircle } from "lucide-react";
import { format, eachDayOfInterval, isWeekend } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import {
  countChargeableLeaveDays,
  getPublicHolidaysInRange,
} from "@shared/public-holidays";

interface ApplyLeaveFormProps {
  onSubmit?: () => void;
  onCancel?: () => void;
}

const allLeaveTypeOptions = [
  { value: "annual", label: "Annual Leave", description: "Vacation/personal time off" },
  { value: "halfday_morning", label: "Halfday (9AM - 1PM)", description: "Half day leave - morning session" },
  { value: "halfday_afternoon", label: "Halfday (2PM - 6PM)", description: "Half day leave - afternoon session" },
  { value: "unpaid", label: "Unpaid Leave", description: "Leave without pay" },
  { value: "emergency", label: "Emergency Leave", description: "Urgent personal matters" },
  { value: "medical", label: "Medical Leave", description: "Sick leave (uses sick leave balance)" },
  { value: "maternity", label: "Maternity Leave", description: "98 days for new mothers" },
  { value: "paternity", label: "Paternity Leave", description: "7 days for new fathers" },
  { value: "hospitalization", label: "Hospitalization", description: "Hospital admission" },
  { value: "time_slip", label: "Time Slip", description: "Late arrival/early departure" },
];

const PROBATION_ALLOWED = ["unpaid", "halfday_morning", "halfday_afternoon"];

export function ApplyLeaveForm({ onSubmit, onCancel }: ApplyLeaveFormProps) {
  const { toast } = useToast();
  const [leaveType, setLeaveType] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [coveringPerson, setCoveringPerson] = useState("");
  const [medicalFee, setMedicalFee] = useState<string>("");
  const [document, setDocument] = useState<File>();
  const [timeOut, setTimeOut] = useState("");
  const [timeBack, setTimeBack] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

const isProbationEmployee =
  String((user as any)?.employmentStatus || "").toLowerCase() === "probation";

const leaveTypeOptions = isProbationEmployee
  ? allLeaveTypeOptions.filter((o) => PROBATION_ALLOWED.includes(o.value))
  : allLeaveTypeOptions;

{isProbationEmployee && (
  <p className="text-sm text-yellow-600 font-medium">
    ⚠️ As a probation employee, you are only entitled to Unpaid Leave and Half Day (Unpaid).
  </p>
)}

  const isHalfDay =
    leaveType === "halfday_morning" || leaveType === "halfday_afternoon";

  const isTimeSlip = leaveType === "time_slip";

  const includesWeekends =
    (user as any)?.workSchedule === "includes_weekends";

  const usesExistingDurationRules =
    leaveType === "maternity" || leaveType === "paternity";

  const calculationEndDate =
    isHalfDay || isTimeSlip ? startDate : endDate;

  const countExistingScheduleDays = (
    start: Date,
    end: Date
  ): number => {
    const days = eachDayOfInterval({ start, end });

    return includesWeekends
      ? days.length
      : days.filter((day) => !isWeekend(day)).length;
  };

  const holidaysInRange =
    !usesExistingDurationRules &&
    !isTimeSlip &&
    startDate &&
    calculationEndDate
      ? getPublicHolidaysInRange(startDate, calculationEndDate)
      : [];

  const chargeableFullDays =
    startDate && calculationEndDate
      ? countChargeableLeaveDays(
          startDate,
          calculationEndDate,
          includesWeekends
        )
      : 0;

  const totalDays =
    !startDate || !calculationEndDate
      ? 0
      : isTimeSlip
      ? 0
      : isHalfDay
      ? chargeableFullDays > 0
        ? 0.5
        : 0
      : usesExistingDurationRules
      ? countExistingScheduleDays(startDate, calculationEndDate)
      : chargeableFullDays;

  const needsSupportingDoc = ["medical", "hospitalization", "paternity", "maternity", "time_slip"].includes(leaveType);

  const createRequestMutation = useMutation({
    mutationFn: async (data: {
      leaveType: string;
      startDate: Date;
      endDate: Date;
      totalDays: number;
      reason: string;
      medicalFeeAmount?: number;
      attachmentUrl?: string;
      coveringPerson?: string | null;
      timeOut?: string | null;
      timeBack?: string | null;
    }) => {
      return apiRequest("POST", "/api/leave-requests", data);
    },
    onSuccess: () => {
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Leave Request Submitted",
        description: `Your ${
          leaveTypeOptions.find((o) => o.value === leaveType)?.label || leaveType
          } leave request for ${totalDays} ${totalDays === 1 ? "day" : "days"} has been submitted for approval.`,
      });
      onSubmit?.();
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request. Please try again.",
        variant: "destructive",
      });
    },
  });

     const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (createRequestMutation.isPending) return;
      if (isSubmitting) return;

      if (
     !leaveType ||
     !startDate ||
     (!isHalfDay && !isTimeSlip && !endDate) ||
     !reason
   ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (endDate && endDate < startDate) {
      toast({
        title: "Invalid Dates",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    if (isTimeSlip && (!timeOut || !timeBack)) {
  toast({
    title: "Missing Information",
    description: "Please fill in Time Out and Time Back.",
    variant: "destructive",
  });
  return;
}

if (isTimeSlip && timeBack <= timeOut) {
  toast({
    title: "Invalid Time",
    description: "Time Back must be later than Time Out.",
    variant: "destructive",
  });
  return;
}

if (!isTimeSlip && totalDays <= 0) {
  toast({
    title: "No Leave Deduction Required",
    description:
      "The selected date is a public holiday or non-working day. No leave request is required.",
  });

  return;
}

setIsSubmitting(true);

const finalEndDate =
  isHalfDay || isTimeSlip ? startDate : endDate;

    const medicalFeeAmount = medicalFee ? parseFloat(medicalFee) : undefined;

    // 1) upload file first (if any)
    let uploadedUrl: string | undefined;

    if (document) {
      // optional: size check (5MB)
      const maxBytes = 5 * 1024 * 1024;
      if (document.size > maxBytes) {
        setIsSubmitting(false);

       toast({
         title: "File too large",
         description: "Max 5MB allowed (PDF/JPG/PNG).",
         variant: "destructive",
       });
       return;
     }

     const fd = new FormData();
     fd.append("file", document);

     const resp = await fetch("/api/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      if (!resp.ok) {
         setIsSubmitting(false);  

        toast({
          title: "Upload failed",
          description: "Could not upload document",
          variant: "destructive",
        });
        return;
       }

       const out = await resp.json();
       uploadedUrl = out.url;
     }

     // 2) then submit leave request (with uploaded url)
     createRequestMutation.mutate({
       leaveType,
       startDate,
       endDate: finalEndDate!,
       totalDays: isTimeSlip ? 0 : totalDays,
       reason,
       medicalFeeAmount,
       attachmentUrl: uploadedUrl,
       coveringPerson: coveringPerson.trim() || null,
       timeOut: isTimeSlip ? timeOut : null,
       timeBack: isTimeSlip ? timeBack : null,
     });
     };

  const getBalanceWarning = () => {
    if (!user || !leaveType || !totalDays) return null;

    if (leaveType === "annual" && totalDays > Number(user.annualLeaveBalance)) {
      return `You only have ${user.annualLeaveBalance} annual leave days remaining.`;
    }
    if (leaveType === "medical" && totalDays > Number(user.sickLeaveBalance || 14)) {
      return `You only have ${user.sickLeaveBalance || 14} sick leave days remaining.`;
    }
    if (leaveType === "medical" && medicalFee) {
      const feeAmount = parseFloat(medicalFee);
      const remainingBalance = parseFloat(String(user.medicalFeeBalance || "700"));
      if (feeAmount > remainingBalance) {
        return `Medical fee exceeds your remaining balance of RM ${remainingBalance.toFixed(2)}.`;
      }
    }
    return null;
  };

  const balanceWarning = getBalanceWarning();

  return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-semibold tracking-tight">
        Apply for leave
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground dark:text-zinc-400">
          Submit a new leave request. Your request will be reviewed for approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="leave-type">Leave Type *</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger
                id="leave-type"
                data-testid="select-leave-type"
                className="bg-white text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
               >
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {leaveType && (
              <p className="text-xs text-muted-foreground">
                {leaveTypeOptions.find(o => o.value === leaveType)?.description}
              </p>
            )}
          </div>

          <div className={`grid gap-4 ${(isHalfDay || isTimeSlip) ? "sm:grid-cols-1" : "sm:grid-cols-2"}`}>
            <div className="space-y-2">
             <Label>{(isHalfDay || isTimeSlip) ? "Date *" : "Start Date *"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-white text-left font-normal text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
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
                    captionLayout="dropdown-buttons"
                    fromYear={new Date().getFullYear()}
                    toYear={new Date().getFullYear() + 2}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

           {!isHalfDay && !isTimeSlip && (
            <div className="space-y-2">
             <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    data-testid="button-end-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                    captionLayout="dropdown-buttons"
                    fromYear={new Date().getFullYear()}
                    toYear={new Date().getFullYear() + 2}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
           )}
         </div>

         {isTimeSlip && (
  <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="time-out">Time Out *</Label>
        <Input
          id="time-out"
          type="time"
          min="09:00"
          max="18:00"
          value={timeOut}
          onChange={(e) => setTimeOut(e.target.value)}
          className="bg-white text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="time-back">Time Back *</Label>
        <Input
          id="time-back"
          type="time"
          min="09:00"
          max="18:00"
          value={timeBack}
          onChange={(e) => setTimeBack(e.target.value)}
          className="bg-white text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </div>
    </div>

    <p className="text-xs text-muted-foreground">
      Note: Time Slip is for short absences such as clinic visits and does not deduct leave balance.
    </p>
  </div>
)}

     {holidaysInRange.length > 0 && (
  <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
    <div className="flex items-start gap-2">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

      <div>
        <p className="font-semibold">Public Holiday Detected</p>

        <div className="mt-1 space-y-1">
          {holidaysInRange.map((holiday) => (
            <p key={holiday.date}>
              {holiday.name} (
              {holiday.date.split("-").reverse().join("/")})
            </p>
          ))}
        </div>

        <p className="mt-1">
          Public holidays are automatically excluded from your leave
          deduction.
        </p>
      </div>
    </div>
  </div>
)}

          {totalDays > 0 && !isTimeSlip && (
              <div className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-zinc-900 dark:text-white">
              <span className="font-medium">Total Duration:</span> {totalDays} {totalDays === 1 ? "day" : "days"}
              {leaveType === "maternity" && totalDays !== 98 && (
                <p className="text-xs text-muted-foreground mt-1">Note: Maternity leave is typically 98 days.</p>
              )}
              {leaveType === "paternity" && totalDays !== 7 && (
                <p className="text-xs text-muted-foreground mt-1">Note: Paternity leave is typically 7 days.</p>
              )}
            </div>
          )}

          {balanceWarning && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {balanceWarning}
            </div>
          )}

          {/* Covering Person */}
          <div className="space-y-2">
            <Label htmlFor="covering-person">Covering Person (Optional)</Label>
            <Input
              id="covering-person"
              placeholder="Who will cover your duties during leave?"
              value={coveringPerson}
              onChange={(e) => setCoveringPerson(e.target.value)}
              className="bg-white text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a brief reason for your leave request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-24 bg-white text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              data-testid="input-reason"
            />
          </div>

          {(leaveType === "medical" || leaveType === "hospitalization") && (
  <div className="space-y-2">
    <Label htmlFor="medical-fee">Medical Fee Claim (RM)</Label>
    <Input
      id="medical-fee"
      type="number"
      step="0.01"
      min="0"
      max="700"
      placeholder="Enter medical fee amount"
      value={medicalFee}
      onChange={(e) => setMedicalFee(e.target.value)}
      className="bg-white text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
    />
    <p className="text-xs text-muted-foreground">
      Your remaining medical fee balance: RM {parseFloat(String(user?.medicalFeeBalance || "700")).toFixed(2)}
    </p>
  </div>
)}

 {needsSupportingDoc && (
  <div className="space-y-2">
    <Label htmlFor="document">Supporting Document (Optional)</Label>
    <div className="flex items-center gap-4 flex-wrap">
      <Input
        id="document"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => setDocument(e.target.files?.[0])}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => window.document.getElementById("document")?.click()}
        className="gap-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
      >
        <Upload className="h-4 w-4" />
        {document ? document.name : "Upload Document"}
      </Button>
      {document && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setDocument(undefined)}
        >
          Remove
        </Button>
      )}
    </div>
    <p className="text-xs text-muted-foreground">
      Accepted formats: PDF, JPG, PNG (Max 5MB)
    </p>
  </div>
)}

          <div className="flex gap-3 pt-4 flex-wrap">
            <Button 
              type="submit" 
              disabled={createRequestMutation.isPending || isSubmitting}
              data-testid="button-submit-leave"
            >
              {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

