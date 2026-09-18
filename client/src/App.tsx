import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";
import { UserDropdown } from "@/components/UserDropdown";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import EmployeeFormPage from "@/pages/employee-form";
import PayrollPage from "@/pages/payroll";
import { NotificationBell } from "@/components/NotificationBell";


import PayrollEmployeesPage from "@/pages/payroll-employees";
import PayrollDashboardPage from "@/pages/payroll-dashboard";
import HRModuleMenuPage from "@/pages/hr-module-menu";
import HrRecentLeaveFormsPage from "@/pages/hr-recent-leave-forms";
import LandingPage from "@/pages/landing";
import RoleSelectionPage from "@/pages/role-selection";
import EmployeeDashboard from "@/pages/employee-dashboard";
import ApplyLeavePage from "@/pages/apply-leave";
import LeaveHistoryPage from "@/pages/leave-history";
import ProfilePage from "@/pages/profile";
import EditLeavePage from "@/pages/edit-leave";
import HRDashboard from "@/pages/hr-dashboard";
import DirectorDashboard from "@/pages/director-dashboard";
import DirectorApprovals from "@/pages/director-approvals";
import LeaveCalendarPage from "@/pages/leave-calendar";
import ReportsPage from "@/pages/reports";
import AuditLogPage from "@/pages/audit-log";
import ShiftSchedulePage from "@/pages/shift-schedule";
import OffDayRequestPage from "@/pages/off-day-request";
import NotFound from "@/pages/not-found";

type UserRole = "employee" | "hr" | "director";

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: UserRole[] }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    window.location.href = "/api/login";
    return <LoadingScreen />;
  }
  
  const userRole = (user.role?.toLowerCase() as UserRole) || "employee";
  if (!allowedRoles.includes(userRole)) {
    return <Redirect to="/" />;
  }
  
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation(); // This allows us to redirect the user

  const role = (user?.role?.toLowerCase() || "employee") as UserRole;
  const displayName = user?.firstName 
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.email?.split("@")[0] || "User";

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role={role} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center justify-between gap-4 border-b px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
              <UserDropdown
               name={displayName}
               email={user?.email || ""}
               role={role}
               profileImageUrl={user?.profileImageUrl || undefined}
               onLogout={handleLogout}
               onProfile={() => setLocation("/profile")}   // Changed this
              />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function getDashboardByRole(role: UserRole) {
  switch (role) {
    case "hr":
      return <HRDashboard />;
    case "director":
      return <DirectorDashboard />;
    default:
      return <EmployeeDashboard />;
  }
}

function AuthenticatedRoutes() {
  const { user } = useAuth();
  const role = (user?.role?.toLowerCase() || "employee") as UserRole;

  return (
    <AppLayout>
      <Switch>
         <Route path="/hr-recent-leave-forms">
        <ProtectedRoute allowedRoles={["hr"]}>
          <HrRecentLeaveFormsPage />
        </ProtectedRoute>
      </Route>

        <Route path="/" component={() => getDashboardByRole(role)} />
         <Route path="/leave">
           <ProtectedRoute allowedRoles={["hr"]}>
             <HRDashboard />
           </ProtectedRoute>
         </Route>
        <Route path="/apply">
          <ProtectedRoute allowedRoles={["employee", "hr", "director"]}>
            <ApplyLeavePage />
          </ProtectedRoute>
        </Route>
        <Route path="/history">
          <ProtectedRoute allowedRoles={["employee", "hr", "director"]}>
            <LeaveHistoryPage />
          </ProtectedRoute>
        </Route>

       <Route path="/edit-leave/:id">
         <ProtectedRoute allowedRoles={["employee"]}>
           <EditLeavePage />
         </ProtectedRoute>
       </Route>  

        <Route path="/profile">
          <ProtectedRoute allowedRoles={["employee", "hr", "director"]}>
            <ProfilePage />
          </ProtectedRoute>
        </Route>
        <Route path="/approvals">
          <ProtectedRoute allowedRoles={["hr", "director"]}>
            <HRDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/director-approvals">
          <ProtectedRoute allowedRoles={["director"]}>
          <DirectorApprovals />
        </ProtectedRoute>
       </Route>
        <Route path="/users">
          <ProtectedRoute allowedRoles={["director"]}>
            <DirectorDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/calendar">
          <ProtectedRoute allowedRoles={["employee", "hr", "director"]}>
            <LeaveCalendarPage />
          </ProtectedRoute>
        </Route>
        <Route path="/reports">
          <ProtectedRoute allowedRoles={["director"]}>
            <ReportsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/audit-log">
          <ProtectedRoute allowedRoles={["director"]}>
            <AuditLogPage />
          </ProtectedRoute>
        </Route>
         <Route path="/payroll/employees">
          <ProtectedRoute allowedRoles={["hr", "director"]}>
           <PayrollEmployeesPage />
          </ProtectedRoute>
         </Route>
         <Route path="/payroll/run">
          <ProtectedRoute allowedRoles={["hr", "director"]}>
           <PayrollPage />
          </ProtectedRoute>
         </Route>
         <Route path="/payroll">
          <ProtectedRoute allowedRoles={["hr", "director"]}>
           <PayrollDashboardPage />
          </ProtectedRoute>
         </Route>
        <Route path="/shift-schedule">
        <ProtectedRoute allowedRoles={["hr"]}>
            <ShiftSchedulePage />
         </ProtectedRoute>
        </Route>
       <Route path="/off-day-request">
         <ProtectedRoute allowedRoles={["hr"]}>
           <OffDayRequestPage />
         </ProtectedRoute>
       </Route>
        <Route path="/employee-form">
          <ProtectedRoute allowedRoles={["hr", "director"]}>
            <EmployeeFormPage />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Check if user needs to select their role (first-time login)
  if (user && user.hasSelectedRole === 0) {
    return <RoleSelectionPage />;
  }

  const role = (user?.role?.toLowerCase() || "employee") as UserRole;

  // HR enters the module selector before choosing Leave or Payroll
  if (role === "hr" && location === "/") {
    return <Redirect to="/hr-modules" />;
  }

  // Module selector is outside the normal Leave sidebar/layout
  if (role === "hr" && location === "/hr-modules") {
    return <HRModuleMenuPage />;
  }

  return <AuthenticatedRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;


