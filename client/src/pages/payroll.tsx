import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Loader2,
  Lock,
  Save,
  Search,
  Send,
  UserRound,
} from "lucide-react";

import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PayrollRun = {
  id: number;
  month: number;
  year: number;
  status: string;
  createdBy?: string | null;
  reviewedBy?: string | null;
  finalizedBy?: string | null;
  reviewedAt?: string | null;
  finalizedAt?: string | null;
};

type PayrollProfile = {
  id: number;
  userId: string;

  basicSalary: string;
  defaultAllowance: string;

  lastPcb: string;

  firstName: string | null;
  lastName: string | null;
  email: string | null;
  department: string | null;
  branch: string | null;
};

type PayrollRecord = {
  id: number;
  userId: string;
  runId: number | null;

  month: number;
  year: number;

  basicSalary: string;
  allowance: string;
  incentive: string;
  overtime: string;
  wages: string;
  commissionOr: string;
  bonus: string;

  epf: string;
  socso: string;
  eis: string;
  pcb: string;

  otherDeduction: string;
  unpaidLeaveDeduction: string;

  grossPay: string;
  netPay: string;

  employerEpf: string;
  employerSocso: string;
  employerEis: string;

  statutoryVersion?: string | null;
  remarks?: string | null;
};

type PayrollRunDetails = {
  run: PayrollRun;
  payrolls: PayrollRecord[];
};

type PayrollForm = {
  basicSalary: string;
  allowance: string;
  incentive: string;
  overtime: string;
  wages: string;
  commissionOr: string;
  bonus: string;

  epf: string;
  socso: string;
  eis: string;
  pcb: string;

  otherDeduction: string;
  unpaidLeaveDeduction: string;

  employerEpf: string;
  employerSocso: string;
  employerEis: string;

  remarks: string;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const emptyForm: PayrollForm = {
  basicSalary: "0",
  allowance: "0",
  incentive: "0",
  overtime: "0",
  wages: "0",
  commissionOr: "0",
  bonus: "0",

  epf: "0",
  socso: "0",
  eis: "0",
  pcb: "0",

  otherDeduction: "0",
  unpaidLeaveDeduction: "0",

  employerEpf: "0",
  employerSocso: "0",
  employerEis: "0",

  remarks: "",
};

function money(value: number) {
  return value.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function employeeName(profile: PayrollProfile) {
  const name =
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

  return name || profile.email || "Unnamed Employee";
}

function MoneyField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <Input
        type="number"
        min="0"
        step="0.01"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value;

          if (next === "" || Number(next) >= 0) {
            onChange(next);
          }
        }}
      />
    </div>
  );
}

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(
    today.getMonth() + 1
  );

  const [selectedYear, setSelectedYear] = useState(
    today.getFullYear()
  );

  const [selectedUserId, setSelectedUserId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [form, setForm] =
    useState<PayrollForm>(emptyForm);

  const { data: runs = [] } = useQuery<PayrollRun[]>({
    queryKey: ["/api/payroll-runs"],
  });

  const { data: profiles = [] } = useQuery<
    PayrollProfile[]
  >({
    queryKey: ["/api/payroll-profiles"],
  });

  const selectedRun = useMemo(() => {
    return runs.find(
      (run) =>
        Number(run.month) === Number(selectedMonth) &&
        Number(run.year) === Number(selectedYear)
    );
  }, [runs, selectedMonth, selectedYear]);

  const runDetailsUrl = selectedRun
    ? `/api/payroll-runs/${selectedRun.id}/payrolls`
    : "";

  const {
    data: runDetails,
    isLoading: runDetailsLoading,
  } = useQuery<PayrollRunDetails>({
    queryKey: [runDetailsUrl],
    enabled: Boolean(selectedRun),
  });

  const currentRun =
    runDetails?.run || selectedRun;

  const runPayrolls =
    runDetails?.payrolls || [];

  useEffect(() => {
    if (profiles.length === 0) {
      setSelectedUserId(null);
      return;
    }

    const stillExists = profiles.some(
      (profile) =>
        profile.userId === selectedUserId
    );

    if (!selectedUserId || !stillExists) {
      setSelectedUserId(profiles[0].userId);
    }
  }, [profiles, selectedUserId]);

  const selectedProfile = useMemo(() => {
    return profiles.find(
      (profile) =>
        profile.userId === selectedUserId
    );
  }, [profiles, selectedUserId]);

  const existingPayroll = useMemo(() => {
    return runPayrolls.find(
      (payroll) =>
        payroll.userId === selectedUserId
    );
  }, [runPayrolls, selectedUserId]);

  useEffect(() => {
    if (!selectedProfile) {
      setForm(emptyForm);
      return;
    }

    if (existingPayroll) {
      setForm({
        basicSalary:
          existingPayroll.basicSalary || "0",

        allowance:
          existingPayroll.allowance || "0",

        incentive:
          existingPayroll.incentive || "0",

        overtime:
          existingPayroll.overtime || "0",

        wages:
          existingPayroll.wages || "0",

        commissionOr:
          existingPayroll.commissionOr || "0",

        bonus:
          existingPayroll.bonus || "0",

        epf:
          existingPayroll.epf || "0",

        socso:
          existingPayroll.socso || "0",

        eis:
          existingPayroll.eis || "0",

        pcb:
          existingPayroll.pcb || "0",

        otherDeduction:
          existingPayroll.otherDeduction || "0",

        unpaidLeaveDeduction:
          existingPayroll.unpaidLeaveDeduction ||
          "0",

        employerEpf:
          existingPayroll.employerEpf || "0",

        employerSocso:
          existingPayroll.employerSocso || "0",

        employerEis:
          existingPayroll.employerEis || "0",

        remarks:
          existingPayroll.remarks || "",
      });

      return;
    }

    setForm({
      ...emptyForm,

      basicSalary:
        selectedProfile.basicSalary || "0",

      allowance:
        selectedProfile.defaultAllowance || "0",

      pcb:
        selectedProfile.lastPcb || "0",
    });
  }, [selectedProfile, existingPayroll]);

  const payrollByUser = useMemo(() => {
    return new Map(
      runPayrolls.map((payroll) => [
        payroll.userId,
        payroll,
      ])
    );
  }, [runPayrolls]);

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return profiles;
    }

    return profiles.filter((profile) => {
      const haystack = [
        employeeName(profile),
        profile.email,
        profile.department,
        profile.branch,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [profiles, search]);

  const preparedCount = runPayrolls.length;

  const allPrepared =
    profiles.length > 0 &&
    preparedCount === profiles.length;

  const isLocked =
    currentRun?.status === "finalized";

  const grossPay =
    Number(form.basicSalary || 0) +
    Number(form.allowance || 0) +
    Number(form.incentive || 0) +
    Number(form.overtime || 0) +
    Number(form.wages || 0) +
    Number(form.commissionOr || 0) +
    Number(form.bonus || 0);

  const totalDeductions =
    Number(form.epf || 0) +
    Number(form.socso || 0) +
    Number(form.eis || 0) +
    Number(form.pcb || 0) +
    Number(form.otherDeduction || 0) +
    Number(form.unpaidLeaveDeduction || 0);

  const netPay =
    grossPay - totalDeductions;

  const employerContributions =
    Number(form.employerEpf || 0) +
    Number(form.employerSocso || 0) +
    Number(form.employerEis || 0);

  const updateField = (
    key: keyof PayrollForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const createRun = useMutation({
    mutationFn: async () => {
      return apiRequest(
        "POST",
        "/api/payroll-runs",
        {
          month: selectedMonth,
          year: selectedYear,
        }
      );
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["/api/payroll-runs"],
      });

      toast({
        title: "Payroll Run Created",
        description:
          `${MONTHS[selectedMonth - 1]} ${selectedYear} is ready for payroll preparation.`,
      });
    },

    onError: (error: any) => {
      toast({
        title: "Unable to Create Payroll Run",
        description:
          error?.message ||
          "Failed to create payroll run.",
        variant: "destructive",
      });
    },
  });

  const savePayroll = useMutation({
    mutationFn: async () => {
      if (!selectedRun) {
        throw new Error(
          "Create the payroll run first."
        );
      }

      if (!selectedUserId) {
        throw new Error(
          "Select an employee first."
        );
      }

      const payload = {
        runId: selectedRun.id,
        userId: selectedUserId,

        month: selectedRun.month,
        year: selectedRun.year,

        ...form,

        statutoryVersion: "manual-v1",
      };

      if (existingPayroll) {
        return apiRequest(
          "PATCH",
          `/api/payroll/${existingPayroll.id}`,
          payload
        );
      }

      return apiRequest(
        "POST",
        "/api/payroll",
        payload
      );
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [runDetailsUrl],
      });

      await queryClient.invalidateQueries({
        queryKey: ["/api/payroll"],
      });

      toast({
        title: existingPayroll
          ? "Payroll Updated"
          : "Payroll Saved",

        description:
          "Employee payroll has been saved successfully.",
      });
    },

    onError: (error: any) => {
      toast({
        title: "Unable to Save Payroll",
        description:
          error?.message ||
          "Failed to save employee payroll.",
        variant: "destructive",
      });
    },
  });

  const reviewRun = useMutation({
    mutationFn: async () => {
      if (!selectedRun) {
        throw new Error(
          "Payroll run not found."
        );
      }

      return apiRequest(
        "PATCH",
        `/api/payroll-runs/${selectedRun.id}/review`
      );
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["/api/payroll-runs"],
      });

      await queryClient.invalidateQueries({
        queryKey: [runDetailsUrl],
      });

      toast({
        title: "Payroll Submitted for Review",
        description:
          "The payroll run is now in review.",
      });
    },

    onError: (error: any) => {
      toast({
        title: "Unable to Submit Payroll",
        description:
          error?.message ||
          "Failed to submit payroll for review.",
        variant: "destructive",
      });
    },
  });

  const finalizeRun = useMutation({
    mutationFn: async () => {
      if (!selectedRun) {
        throw new Error(
          "Payroll run not found."
        );
      }

      return apiRequest(
        "PATCH",
        `/api/payroll-runs/${selectedRun.id}/finalize`
      );
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["/api/payroll-runs"],
      });

      await queryClient.invalidateQueries({
        queryKey: [runDetailsUrl],
      });

      toast({
        title: "Payroll Finalized",
        description:
          "The payroll run is now locked and payslips are available.",
      });
    },

    onError: (error: any) => {
      toast({
        title: "Unable to Finalize Payroll",
        description:
          error?.message ||
          "Failed to finalize payroll.",
        variant: "destructive",
      });
    },
  });

  const statusLabel = !currentRun
    ? "Not Started"
    : currentRun.status === "draft"
      ? "Draft"
      : currentRun.status === "review"
        ? "In Review"
        : currentRun.status === "finalized"
          ? "Finalized"
          : currentRun.status;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">
          Payroll Run
        </h1>

        <p className="mt-1 text-muted-foreground">
          Prepare, review and finalize monthly
          employee payroll.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:max-w-xl">
              <div className="space-y-2">
                <Label>Payroll Month</Label>

                <select
                  value={selectedMonth}
                  onChange={(e) =>
                    setSelectedMonth(
                      Number(e.target.value)
                    )
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {MONTHS.map((month, index) => (
                    <option
                      key={month}
                      value={index + 1}
                    >
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Year</Label>

                <Input
                  type="number"
                  min="2000"
                  max="2100"
                  value={selectedYear}
                  onChange={(e) =>
                    setSelectedYear(
                      Number(e.target.value)
                    )
                  }
                />
              </div>
            </div>

            {!selectedRun ? (
              <Button
                onClick={() => createRun.mutate()}
                disabled={createRun.isPending}
              >
                {createRun.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CalendarDays className="mr-2 h-4 w-4" />
                )}

                Create Payroll Run
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Status
                </span>

                <span
                  className={[
                    "rounded-full px-3 py-1 text-sm font-medium",
                    currentRun?.status === "finalized"
                      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : currentRun?.status === "review"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
                  ].join(" ")}
                >
                  {statusLabel}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedRun && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Payroll Period
              </p>

              <p className="mt-1 text-xl font-semibold">
                {MONTHS[selectedRun.month - 1]}{" "}
                {selectedRun.year}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Prepared Employees
              </p>

              <p className="mt-1 text-xl font-semibold">
                {preparedCount} / {profiles.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Remaining
              </p>

              <p className="mt-1 text-xl font-semibold">
                {Math.max(
                  profiles.length - preparedCount,
                  0
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedRun ? (
        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
            <CalendarDays className="mb-4 h-10 w-10 text-muted-foreground" />

            <h2 className="text-lg font-semibold">
              No Payroll Run
            </h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Create a payroll run for{" "}
              {MONTHS[selectedMonth - 1]}{" "}
              {selectedYear} before preparing
              employee payroll.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserRound className="h-5 w-5" />
                Employees
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search employee..."
                  className="pl-9"
                />
              </div>

              <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
                {filteredProfiles.map(
                  (profile) => {
                    const prepared =
                      payrollByUser.has(
                        profile.userId
                      );

                    const active =
                      selectedUserId ===
                      profile.userId;

                    return (
                      <button
                        key={profile.userId}
                        type="button"
                        onClick={() =>
                          setSelectedUserId(
                            profile.userId
                          )
                        }
                        className={[
                          "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors",
                          active
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/60",
                        ].join(" ")}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {employeeName(profile)}
                          </p>

                          <p className="truncate text-xs text-muted-foreground">
                            {profile.department ||
                              profile.email ||
                              "Employee"}
                          </p>
                        </div>

                        {prepared ? (
                          <CheckCircle2 className="ml-3 h-5 w-5 shrink-0 text-green-600" />
                        ) : (
                          <Circle className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    );
                  }
                )}

                {filteredProfiles.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No employees found.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            {runDetailsLoading ? (
              <CardContent className="flex min-h-96 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            ) : !selectedProfile ? (
              <CardContent className="flex min-h-96 items-center justify-center text-muted-foreground">
                Select an employee.
              </CardContent>
            ) : (
              <>
                <CardHeader className="border-b">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>
                        {employeeName(
                          selectedProfile
                        )}
                      </CardTitle>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedProfile.department ||
                          selectedProfile.email}
                      </p>
                    </div>

                    <span className="text-sm font-medium">
                      {existingPayroll
                        ? "Payroll Prepared"
                        : "Not Prepared"}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-8 pt-6">
                  {isLocked && (
                    <div className="flex items-center gap-3 rounded-lg border bg-muted p-4">
                      <Lock className="h-5 w-5" />

                      <div>
                        <p className="font-medium">
                          Payroll Locked
                        </p>

                        <p className="text-sm text-muted-foreground">
                          This payroll run has been
                          finalized and can no longer
                          be edited.
                        </p>
                      </div>
                    </div>
                  )}

                  <section className="space-y-4">
                    <div>
                      <h3 className="font-semibold">
                        Earnings
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        Employee earnings for the
                        selected payroll period.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <MoneyField
                        label="Basic Salary"
                        value={form.basicSalary}
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField(
                            "basicSalary",
                            value
                          )
                        }
                      />

                      <MoneyField
                        label="Allowance"
                        value={form.allowance}
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField(
                            "allowance",
                            value
                          )
                        }
                      />

                      <MoneyField
                        label="Incentive"
                        value={form.incentive}
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField(
                            "incentive",
                            value
                          )
                        }
                      />

                      <MoneyField
                        label="Overtime"
                        value={form.overtime}
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField(
                            "overtime",
                            value
                          )
                        }
                      />

                      <MoneyField
                        label="Wages"
                        value={form.wages}
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField(
                            "wages",
                            value
                          )
                        }
                      />

                      <MoneyField
                        label="Commission / OR"
                        value={form.commissionOr}
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField(
                            "commissionOr",
                            value
                          )
                        }
                      />

                      <MoneyField
                        label="Bonus"
                        value={form.bonus}
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField(
                            "bonus",
                            value
                          )
                        }
                      />
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div>
                      <h3 className="font-semibold">
                        Employee Deductions
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        EPF, SOCSO and EIS remain
                        manually entered until the
                        statutory calculation engine
                        is enabled.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <MoneyField
                        label="EPF"
                        value={form.epf}
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField("epf", value)
                        }
                      />

                      <MoneyField
                        label="SOCSO"
                        value={form.socso}
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField(
                            "socso",
                            value
                          )
                        }
                      />

                      <MoneyField
                        label="EIS"
                        value={form.eis}
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField("eis", value)
                        }
                      />

                      <MoneyField
                        label="PCB"
                        value={form.pcb}
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField("pcb", value)
                        }
                      />

                      <MoneyField
                        label="Unpaid Leave Deduction"
                        value={
                          form.unpaidLeaveDeduction
                        }
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField(
                            "unpaidLeaveDeduction",
                            value
                          )
                        }
                      />

                      <MoneyField
                        label="Other Deduction"
                        value={
                          form.otherDeduction
                        }
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField(
                            "otherDeduction",
                            value
                          )
                        }
                      />
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div>
                      <h3 className="font-semibold">
                        Employer Contributions
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        Employer contributions are
                        recorded separately and are
                        not deducted from employee
                        net pay.
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <MoneyField
                        label="Employer EPF"
                        value={form.employerEpf}
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField(
                            "employerEpf",
                            value
                          )
                        }
                      />

                      <MoneyField
                        label="Employer SOCSO"
                        value={
                          form.employerSocso
                        }
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField(
                            "employerSocso",
                            value
                          )
                        }
                      />

                      <MoneyField
                        label="Employer EIS"
                        value={form.employerEis}
                        disabled={isLocked}
                        onChange={(value) =>
                          updateField(
                            "employerEis",
                            value
                          )
                        }
                      />
                    </div>
                  </section>

                  <section className="space-y-2">
                    <Label>Remarks</Label>

                    <Input
                      value={form.remarks}
                      disabled={isLocked}
                      onChange={(e) =>
                        updateField(
                          "remarks",
                          e.target.value
                        )
                      }
                      placeholder="Optional remarks"
                    />
                  </section>

                  <div className="grid gap-4 rounded-xl bg-muted p-5 sm:grid-cols-2 xl:grid-cols-5">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Gross Pay
                      </p>

                      <p className="mt-1 text-xl font-semibold">
                        RM {money(grossPay)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Employee Deductions
                      </p>

                      <p className="mt-1 text-xl font-semibold">
                        RM {money(totalDeductions)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Net Pay
                      </p>

                      <p className="mt-1 text-xl font-semibold">
                        RM {money(netPay)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Employer Contribution
                      </p>

                      <p className="mt-1 text-xl font-semibold">
                        RM{" "}
                        {money(
                          employerContributions
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Employer Cost
                      </p>

                      <p className="mt-1 text-xl font-semibold">
                        RM{" "}
                        {money(
                          grossPay +
                            employerContributions
                        )}
                      </p>
                    </div>
                  </div>

                  {!isLocked && (
                    <div className="flex justify-end">
                      <Button
                        onClick={() =>
                          savePayroll.mutate()
                        }
                        disabled={
                          savePayroll.isPending
                        }
                      >
                        {savePayroll.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}

                        {existingPayroll
                          ? "Update Payroll"
                          : "Save Payroll"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        </div>
      )}

      {selectedRun && (
        <Card>
          <CardContent className="flex flex-col gap-5 pt-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-semibold">
                Payroll Run Actions
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {currentRun?.status ===
                "finalized"
                  ? "This payroll run is finalized and locked."
                  : currentRun?.status ===
                      "review"
                    ? "Review is active. Corrections remain possible until finalization."
                    : allPrepared
                      ? "All configured employees are prepared and the run can be submitted for review."
                      : `${Math.max(
                          profiles.length -
                            preparedCount,
                          0
                        )} employee(s) still require payroll preparation.`}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {currentRun?.status ===
                "draft" && (
                <Button
                  variant="outline"
                  disabled={
                    !allPrepared ||
                    reviewRun.isPending
                  }
                  onClick={() =>
                    reviewRun.mutate()
                  }
                >
                  {reviewRun.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}

                  Submit for Review
                </Button>
              )}

              {currentRun?.status ===
                "review" && (
                <Button
                  disabled={
                    finalizeRun.isPending
                  }
                  onClick={() =>
                    finalizeRun.mutate()
                  }
                >
                  {finalizeRun.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="mr-2 h-4 w-4" />
                  )}

                  Finalize Payroll
                </Button>
              )}

              {currentRun?.status ===
                "finalized" && (
                <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-5 w-5" />
                  Payroll Finalized
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
