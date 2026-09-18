import { Link } from "wouter";
import {
  Calculator,
  FileText,
  Users,
  WalletCards,
  ArrowRight,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

export default function PayrollDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">
          Payroll Dashboard
        </h1>

        <p className="mt-1 text-muted-foreground">
          Manage employee payroll, monthly processing and payslips.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" />
              Employees
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">—</div>

            <p className="mt-1 text-sm text-muted-foreground">
              Payroll employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-5 w-5" />
              Current Payroll
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              August 2026
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Current payroll period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <WalletCards className="h-5 w-5" />
              Payroll Status
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              Not Started
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Current month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Payroll Run
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Prepare and review monthly employee payroll before
              finalizing the pay period.
            </p>

            <Button asChild>
              <Link href="/payroll/run">
                Open Payroll Run
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payslips
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              View finalized payroll records and employee payslips.
            </p>

            <Button variant="outline" disabled>
              Coming Next
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
