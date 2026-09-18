import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  UserRound,
  CheckCircle2,
  AlertCircle,
  Save,
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

type PayrollProfile = {
  id: number;
  userId: string;
  basicSalary: string;
  defaultAllowance: string;
  dateOfBirth: string | null;
  citizenshipStatus: string;
  epfMemberCategory: string;
  socsoContributionCategory: string;
  eisContributionStatus: string;
  lastPcb: string;

  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  department?: string | null;
  branch?: string | null;
};

export default function PayrollEmployeesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    null
  );

  const [form, setForm] = useState({
    basicSalary: "0",
    defaultAllowance: "0",
    dateOfBirth: "",
    citizenshipStatus: "malaysian",
    epfMemberCategory: "malaysian",
    socsoContributionCategory: "auto",
    eisContributionStatus: "auto",
    lastPcb: "0",
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: profiles = [] } = useQuery<PayrollProfile[]>({
    queryKey: ["/api/payroll-profiles"],
  });

  const selectedUser = users.find(
    (user: any) => user.id === selectedUserId
  );

  const selectedProfile = profiles.find(
    (profile) => profile.userId === selectedUserId
  );

  useEffect(() => {
    if (!selectedUserId) return;

    if (selectedProfile) {
      setForm({
        basicSalary: selectedProfile.basicSalary || "0",
        defaultAllowance: selectedProfile.defaultAllowance || "0",
        dateOfBirth: selectedProfile.dateOfBirth || "",
        citizenshipStatus:
          selectedProfile.citizenshipStatus || "malaysian",
        epfMemberCategory:
          selectedProfile.epfMemberCategory || "malaysian",
        socsoContributionCategory:
          selectedProfile.socsoContributionCategory || "auto",
        eisContributionStatus:
          selectedProfile.eisContributionStatus || "auto",
        lastPcb: selectedProfile.lastPcb || "0",
      });
    } else {
      setForm({
        basicSalary: "0",
        defaultAllowance: "0",
        dateOfBirth: "",
        citizenshipStatus: "malaysian",
        epfMemberCategory: "malaysian",
        socsoContributionCategory: "auto",
        eisContributionStatus: "auto",
        lastPcb: "0",
      });
    }
  }, [selectedUserId, selectedProfile]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return users;

    return users.filter((user: any) => {
      const fullName =
        `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();

      return (
        fullName.includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.department?.toLowerCase().includes(term) ||
        user.branch?.toLowerCase().includes(term)
      );
    });
  }, [users, search]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) {
        throw new Error("Please select an employee.");
      }

      return apiRequest(
        "PATCH",
        `/api/payroll-profiles/${selectedUserId}`,
        {
          ...form,
          dateOfBirth: form.dateOfBirth || null,
        }
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/payroll-profiles"],
      });

      toast({
        title: "Payroll Profile Saved",
        description:
          "Employee payroll information has been updated successfully.",
      });
    },

    onError: (error: any) => {
      toast({
        title: "Unable to Save",
        description:
          error?.message || "Failed to save payroll profile.",
        variant: "destructive",
      });
    },
  });

  const money = (value: any) =>
    Number(value || 0).toLocaleString("en-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">
          Employees
        </h1>

        <p className="mt-1 text-muted-foreground">
          Manage employee salary and statutory payroll information.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        {/* Employee List */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Employees</CardTitle>

            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee..."
                className="pl-9"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {filteredUsers.map((user: any) => {
              const profile = profiles.find(
                (item) => item.userId === user.id
              );

              const fullName =
                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                user.email ||
                "Unnamed Employee";

              const selected = selectedUserId === user.id;

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                        <UserRound className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {fullName}
                        </div>

                        <div className="truncate text-sm text-muted-foreground">
                          {user.department || "No department"}
                          {user.branch
                            ? ` • ${user.branch}`
                            : ""}
                        </div>

                        {profile && (
                          <div className="mt-1 text-sm font-medium">
                            RM {money(profile.basicSalary)}
                          </div>
                        )}
                      </div>
                    </div>

                    {profile ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                </button>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No employees found.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Editor */}
        {!selectedUser ? (
          <Card className="flex min-h-[500px] items-center justify-center">
            <CardContent className="text-center">
              <UserRound className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

              <h2 className="text-lg font-semibold">
                Select an Employee
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Choose an employee to configure their payroll profile.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>
                    {`${selectedUser.firstName || ""} ${
                      selectedUser.lastName || ""
                    }`.trim() ||
                      selectedUser.email}
                  </CardTitle>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedUser.department || "No department"}
                    {selectedUser.branch
                      ? ` • ${selectedUser.branch}`
                      : ""}
                  </p>
                </div>

                <div className="rounded-full border px-3 py-1 text-xs font-medium">
                  {selectedProfile
                    ? "Configured"
                    : "Not Configured"}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Salary */}
              <section>
                <h3 className="mb-4 font-semibold">
                  Salary Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Basic Salary (RM)</Label>

                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.basicSalary}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          basicSalary: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Default Allowance (RM)</Label>

                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.defaultAllowance}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          defaultAllowance: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </section>

              {/* Personal / statutory */}
              <section>
                <h3 className="mb-4 font-semibold">
                  Statutory Profile
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>

                    <Input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Citizenship Status</Label>

                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.citizenshipStatus}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          citizenshipStatus: e.target.value,
                        })
                      }
                    >
                      <option value="malaysian">
                        Malaysian
                      </option>

                      <option value="permanent_resident">
                        Permanent Resident
                      </option>

                      <option value="non_malaysian">
                        Non-Malaysian
                      </option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>EPF Member Category</Label>

                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.epfMemberCategory}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          epfMemberCategory: e.target.value,
                        })
                      }
                    >
                      <option value="malaysian">
                        Malaysian
                      </option>

                      <option value="permanent_resident">
                        Permanent Resident
                      </option>

                      <option value="non_malaysian_pre_1998">
                        Non-Malaysian — Pre 1998
                      </option>

                      <option value="non_malaysian_post_1998">
                        Non-Malaysian — Post 1998
                      </option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>SOCSO Category</Label>

                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.socsoContributionCategory}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          socsoContributionCategory:
                            e.target.value,
                        })
                      }
                    >
                      <option value="auto">
                        Auto
                      </option>

                      <option value="first">
                        First Category
                      </option>

                      <option value="second">
                        Second Category
                      </option>

                      <option value="exempt">
                        Exempt
                      </option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>EIS Status</Label>

                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.eisContributionStatus}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          eisContributionStatus: e.target.value,
                        })
                      }
                    >
                      <option value="auto">
                        Auto
                      </option>

                      <option value="eligible">
                        Eligible
                      </option>

                      <option value="exempt">
                        Exempt
                      </option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Last PCB Reference (RM)</Label>

                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.lastPcb}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          lastPcb: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-end border-t pt-6">
                <Button
                  onClick={() => saveProfile.mutate()}
                  disabled={saveProfile.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />

                  {saveProfile.isPending
                    ? "Saving..."
                    : selectedProfile
                    ? "Update Payroll Profile"
                    : "Create Payroll Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
