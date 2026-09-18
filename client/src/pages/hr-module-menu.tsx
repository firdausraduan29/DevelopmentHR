import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  DollarSign,
  Users,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { UserDropdown } from "@/components/UserDropdown";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

export default function HRModuleMenuPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email?.split("@")[0] || "User";

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b px-6">
       <div className="flex items-center">
        <span className="text-xl font-semibold">
          HR System
        </span>
       </div>

        <div className="flex items-center gap-2">
          <NotificationBell />

          <ThemeToggle />

          <UserDropdown
            name={displayName}
            email={user?.email || ""}
            role="hr"
            profileImageUrl={user?.profileImageUrl || undefined}
            onLogout={handleLogout}
            onProfile={() => setLocation("/profile")}
          />
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 py-16">
        <div className="w-full max-w-4xl">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border bg-muted/40">
              <Users className="h-6 w-6 text-primary" />
            </div>

            <h1 className="text-4xl font-semibold tracking-tight">
              HR Module Menu
            </h1>

            <p className="mt-3 text-lg text-muted-foreground">
              Select a module to manage HR operations.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="flex min-h-[330px] flex-col">
              <CardHeader className="space-y-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <CalendarDays className="h-7 w-7 text-primary" />
                </div>

                <div>
                  <CardTitle className="text-2xl">
                    Leave Management
                  </CardTitle>

                  <CardDescription className="mt-3 text-base leading-6">
                    Manage leave applications, approvals, calendars
                    and employee leave records.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="mt-auto">
                <Button asChild size="lg">
                  <Link href="/leave">
                    Open Leave Management
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="flex min-h-[330px] flex-col">
              <CardHeader className="space-y-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10">
                  <DollarSign className="h-7 w-7 text-emerald-600" />
                </div>

                <div>
                  <CardTitle className="text-2xl">
                    Payroll
                  </CardTitle>

                  <CardDescription className="mt-3 text-base leading-6">
                    Manage employee payroll, monthly salary processing
                    and payslips.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="mt-auto">
                <Button asChild size="lg">
                  <Link href="/payroll">
                    Open Payroll
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t px-6 py-5 text-center text-sm text-muted-foreground">
        Internal HR System
      </footer>
    </div>
  );
}
