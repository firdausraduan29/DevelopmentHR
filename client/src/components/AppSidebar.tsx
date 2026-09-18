import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  CalendarPlus,
  History,
  ClipboardCheck,
  Users,
  Calendar,
  User,
  CalendarDays,
  BarChart3,
  FileText,
  DollarSign,
} from "lucide-react";

type UserRole = "employee" | "hr" | "director";

interface AppSidebarProps {
  role: UserRole;
}

const employeeMenu = [
  { title: "Dashboard", url: "/leave", icon: LayoutDashboard },
  { title: "Apply Leave", url: "/apply", icon: CalendarPlus },
  { title: "My Requests", url: "/history", icon: History },
  { title: "Leave Calendar", url: "/calendar", icon: CalendarDays },
  { title: "My Profile", url: "/profile", icon: User },
];

const hrMenu = [
  { title: "HR Module Menu", url: "/hr-modules", icon: LayoutDashboard },
  { title: "Pending Approvals", url: "/approvals", icon: ClipboardCheck },
  { title: "Leave Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Off Day Request Form", url: "/off-day-request", icon: FileText },
  { title: "Apply Leave", url: "/apply", icon: CalendarPlus },
  { title: "My Requests", url: "/history", icon: History },
  { title: "My Profile", url: "/profile", icon: User },
];

const payrollMenu = [
  {
    title: "HR Module Menu",
    url: "/hr-modules",
    icon: LayoutDashboard,
  },
  {
    title: "Dashboard",
    url: "/payroll",
    icon: LayoutDashboard,
  },
  {
    title: "Employees",
    url: "/payroll/employees",
    icon: Users,
  },
  {
    title: "Payroll Run",
    url: "/payroll/run",
    icon: DollarSign,
  },
];

const directorMenu = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Approvals", url: "/director-approvals", icon: ClipboardCheck },
  { title: "Leave Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Audit Log", url: "/audit-log", icon: FileText },
  { title: "My Profile", url: "/profile", icon: User },
];

const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case "director":
      return "Director";
    case "hr":
      return "HR";
    default:
      return "Employee";
  }
};

export function AppSidebar({ role }: AppSidebarProps) {
  const [location] = useLocation();

  const getMenuItems = () => {
  switch (role) {
    case "hr":
      if (
        location === "/payroll" ||
        location.startsWith("/payroll/")
      ) {
        return payrollMenu;
      }

      return hrMenu;

    case "director":
      return directorMenu;

    default:
      return employeeMenu;
  }
};

  const menuItems = getMenuItems();

  return (
    <Sidebar>
     <SidebarHeader className="border-b px-6 py-4">
      <Link href="/" className="flex items-center">
       <span className="text-xl font-semibold">HR System</span>
      </Link>
     </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <div className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground">
            Logged in as <span className="font-medium text-foreground">{getRoleLabel(role)}</span>
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
