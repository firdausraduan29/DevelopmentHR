import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./Auth"; // Pointing to your new auth.ts
import {
  insertLeaveRequestSchema,
  insertShiftScheduleSchema,
  insertEmployeePayrollProfileSchema,
  calculateLeaveBalances,
  employeeInformationFormPayloadSchema,
  MATERNITY_LEAVE_DAYS,
  PATERNITY_LEAVE_DAYS,
  type InsertPayroll,
} from "@shared/schema";
import { sendLeaveNotification } from "./email";
import { sendNewLeaveRequestAlertToDirector } from "./email";
import { format } from "date-fns";
import { countChargeableLeaveDays } from "@shared/public-holidays";
import { buildLeaveApplicationPdf } from "./pdf";
import { buildEmployeePdf } from "./employeePdf";
import { buildPayslipPdf } from "./payslipPdf";

function formatDateMY(d: any) {
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
 });
}

// Role check middleware - Updated to use req.user.id
function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Get user from database to check role
    const dbUser = await storage.getUser(user.id);
    if (!dbUser) {
      return res.status(403).json({ message: "User not found" });
    }
    
    const userRole = dbUser.role?.toLowerCase() || "employee";
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    (req as any).dbUser = dbUser;
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Auth logic
  await setupAuth(app);

    // Health check (no auth)
  app.get("/health", (req: Request, res: Response) => {
    res.json({ ok: true, time: new Date().toISOString() });
  });

  app.get(
  "/api/audit-logs",
  isAuthenticated,
  requireRole("hr", "director"),
  async (req: any, res) => {
    try {
      const logs = await storage.getAuditLogs(100);
      res.json(logs);
    } catch (error) {
      console.error("Fetch audit logs failed:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  }
);

   // PDF route (must be OUTSIDE other routes)
  app.get("/api/leave-requests/:id/pdf", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const reqWithUser = await storage.getLeaveRequestWithUser(req.params.id);
      if (!reqWithUser) return res.status(404).json({ message: "Not found" });

      const dbUser = await storage.getUser(userId);
      const role = (dbUser?.role || "employee").toLowerCase();

      const isOwner = reqWithUser.userId === userId;
      const canView = isOwner || role === "hr" || role === "director";
      if (!canView) return res.status(403).json({ message: "Forbidden" });

      let leaveEntitlement: number | null = null;
      let leaveTakenExcludingThisApplication: number | null = null;
      let leaveCurrentBalance: number | null = null;
      let leaveBalanceAfterApplication: number | null = null;

      const leaveType = String(reqWithUser.leaveType || "").toLowerCase();
      const totalDays = Number(reqWithUser.totalDays || 0);

      let yearsOfService = 0;
      if (reqWithUser.startDate) {
        const start = new Date(reqWithUser.startDate);
        const now = new Date();
        yearsOfService = Math.floor(
          (now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
      }

      // Use snapshots saved at submission time — always accurate regardless of
      // subsequent leave taken or balance changes after approval.
      const snapshotEntitlement = Number(reqWithUser.leaveEntitlementAtApplication || 0);
      const snapshotBefore     = Number(reqWithUser.leaveBalanceBeforeApplication || 0);
      const snapshotAfter      = Number(reqWithUser.leaveBalanceAfterApplication || 0);
      const snapshotTaken      = Number(reqWithUser.leaveTakenBeforeApplication || 0);

      if (snapshotBefore > 0 || snapshotEntitlement > 0) {
        // Annual, halfday, medical, hospitalization — snapshots available
        leaveEntitlement                    = snapshotEntitlement;
        leaveCurrentBalance                 = snapshotBefore;
        leaveTakenExcludingThisApplication  = snapshotTaken;
        leaveBalanceAfterApplication        = snapshotAfter;
      } else if (leaveType === "emergency") {
        // Emergency deducts from annual first — show annual balance in PDF
        const annualEntitlement = Number(reqWithUser.annualLeaveEntitlement || 0);
        const annualBalance = Number(reqWithUser.annualLeaveBalance || 0);
        const annualTaken = Math.max(0, annualEntitlement - annualBalance);

        leaveEntitlement                    = annualEntitlement;
        leaveCurrentBalance                 = annualBalance;
        leaveTakenExcludingThisApplication  = annualTaken;
        leaveBalanceAfterApplication        = Math.max(0, annualBalance - totalDays);
      } else {
        // Unpaid, time_slip, maternity, paternity — no balance tracking needed
        leaveEntitlement                    = totalDays;
        leaveCurrentBalance                 = totalDays;
        leaveTakenExcludingThisApplication  = 0;
        leaveBalanceAfterApplication        = 0;
      }

      const pdfData = {
        ...reqWithUser,
        leaveEntitlement,
        leaveTakenExcludingThisApplication,
        leaveCurrentBalance,
        leaveBalanceAfterApplication,
      };

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="leave-${reqWithUser.id}.pdf"`);

      const pdfDoc = buildLeaveApplicationPdf(pdfData);
      pdfDoc.pipe(res);

    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

      app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const user = await storage.getUser(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    let yearsOfService = 0;
    if (user.startDate) {
      const startDate = new Date(user.startDate);
      const now = new Date();
      yearsOfService = Math.floor((now.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      // Recalculate entitlement on every login fetch so it stays in sync
      // with tenure, even if start date was changed by HR/Director.
      const balances = calculateLeaveBalances(yearsOfService);
      const newAnnualEntitlement = String(balances.annualLeave);
      const newSickEntitlement = String(balances.sickLeave);

      const entitlementChanged =
        String(user.annualLeaveEntitlement) !== newAnnualEntitlement ||
        String(user.sickLeaveEntitlement) !== newSickEntitlement;

      if (entitlementChanged) {
        await storage.updateUser(userId, {
          annualLeaveEntitlement: newAnnualEntitlement,
          sickLeaveEntitlement: newSickEntitlement,
        });
        user.annualLeaveEntitlement = newAnnualEntitlement;
        user.sickLeaveEntitlement = newSickEntitlement;
      }
    }

       res.json({
       ...user,
       annualLeaveEntitlement: Number(user.annualLeaveEntitlement || 0),
       sickLeaveEntitlement: Number(user.sickLeaveEntitlement || 0),
       annualLeaveBalance: Number(user.annualLeaveBalance || 0),
       sickLeaveBalance: Number(user.sickLeaveBalance || 0),
       medicalFeeBalance: Number(user.medicalFeeBalance || 0),
       hospitalizationLeaveEntitlement: Number((user as any).hospitalizationLeaveEntitlement || 60),
       hospitalizationLeaveBalance: Number((user as any).hospitalizationLeaveBalance || 60),
       workSchedule: (user as any).workSchedule || "standard",
       branch: (user as any).branch || null,
    });
      } catch (error: any) {
        console.error("Failed to fetch user:", error?.message);
        res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get(
  "/api/leave-requests/upcoming-approved",
  isAuthenticated,
  requireRole("hr", "director"),
  async (req: any, res) => {
    try {
      const rows = await storage.getUpcomingApprovedLeaveRequests();
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch upcoming approved leaves" });
    }
  }
);

    app.get(
    "/api/leave-requests/recent-calendar",
    isAuthenticated,
    requireRole("hr", "director"),
    async (req: any, res) => {
      try {
        const rows = await storage.getRecentCalendarLeaveRequests();
        res.json(rows);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch recent calendar leaves" });
      }
    }
  );

  app.get(
  "/api/leave-requests/calendar",
  isAuthenticated,
  async (req: any, res) => {
    try {
      const rows = await storage.getCalendarLeaveRequests();

      const role = String(req.user?.role || "employee")
        .toLowerCase()
        .trim();

      const isEmployee = role === "employee";

      // Employees should only see fully approved leave.
      // HR and Director retain approved + hr_approved visibility.
      const visibleRows = isEmployee
        ? rows.filter(
            (row) =>
              String(row.status || "").toLowerCase().trim() === "approved"
          )
        : rows;

      const calendarRows = visibleRows.map((row) => ({
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        branch: row.branch,
        leaveType: isEmployee ? "leave" : row.leaveType,
        startDate: row.startDate,
        endDate: row.endDate,
        totalDays: isEmployee ? null : row.totalDays,
        status: row.status,
      }));

      res.json(calendarRows);
    } catch (error) {
      console.error("Failed to fetch leave calendar:", error);

      res.status(500).json({
        message: "Failed to fetch leave calendar",
      });
    }
  }
);

  // Update user profile
  app.patch("/api/auth/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const allowedFields = ["startDate", "department", "firstName", "lastName", "workSchedule"];
      const sanitizedData: { startDate?: string; department?: string; firstName?: string; lastName?: string; workSchedule?: string; } = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          const value = req.body[field];

      if (field === "firstName" || field === "lastName") {
          sanitizedData[field] = String(value).trim();
        } else if (field === "workSchedule") {
          sanitizedData.workSchedule = ["standard", "includes_weekends"].includes(value)
            ? value
            : "standard";
        } else {
          sanitizedData[field as "startDate" | "department"] = value;
        }
      }
    }
        
      const existingUser = await storage.getUser(userId);

      const user = await storage.updateUserProfile(userId, sanitizedData);
      
      if (sanitizedData.startDate && user) {
  const start = new Date(sanitizedData.startDate);
  const now = new Date();

  const yearsOfService = Math.floor(
    (now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  const balances = calculateLeaveBalances(yearsOfService);

  const annualEntitlement = balances.annualLeave;
  const sickEntitlement = balances.sickLeave;

  const hadStartDateBefore = !!existingUser?.startDate;

  const hadAnnualEntitlementBefore =
    Number(existingUser?.annualLeaveEntitlement || 0) > 0;

  const hadSickEntitlementBefore =
    Number(existingUser?.sickLeaveEntitlement || 0) > 0;

  const updateData: any = {
    annualLeaveEntitlement: String(annualEntitlement),
    sickLeaveEntitlement: String(sickEntitlement),
  };

  // 🔥 ONLY initialize balance if FIRST TIME
  if (!hadStartDateBefore && !hadAnnualEntitlementBefore) {
    updateData.annualLeaveBalance = String(annualEntitlement);
  }

  if (!hadStartDateBefore && !hadSickEntitlementBefore) {
    updateData.sickLeaveBalance = String(sickEntitlement);
  }

  await storage.updateUser(userId, updateData);
}
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch("/api/leave-requests/:id/cancel", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const leaveRequest = await storage.getLeaveRequest(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveRequest.userId !== userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if ((leaveRequest.status || "").toLowerCase() !== "pending") {
      return res.status(400).json({ message: "Only pending leave can be cancelled" });
    }

    const updated = await storage.updateLeaveRequestStatus(
      req.params.id,
      "cancelled"
    );

    res.json(updated);
  } catch (error) {
    console.error("Cancel leave failed:", error);
    res.status(500).json({ message: "Failed to cancel leave request" });
  }
});

  app.patch("/api/leave-requests/:id", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const leaveRequest = await storage.getLeaveRequest(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveRequest.userId !== userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if ((leaveRequest.status || "").toLowerCase() !== "pending") {
      return res.status(400).json({ message: "Only pending leave can be edited" });
    }

    const updated = await storage.updatePendingLeaveRequest(req.params.id, userId, {
      ...req.body,
      startDate: req.body.startDate ? new Date(req.body.startDate) : leaveRequest.startDate,
      endDate: req.body.endDate ? new Date(req.body.endDate) : leaveRequest.endDate,
      medicalFeeAmount: req.body.medicalFeeAmount
        ? String(req.body.medicalFeeAmount)
        : leaveRequest.medicalFeeAmount,
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update leave request" });
  }
});

  // First-time role selection
  app.post("/api/auth/select-role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { role } = req.body;
      
      if (!["employee", "hr", "director"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      if (user.hasSelectedRole === 1) {
        return res.status(403).json({ message: "Role already selected." });
      }
      
      const updatedUser = await storage.setInitialRole(userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error selecting role:", error);
      res.status(500).json({ message: "Failed to select role" });
    }
  });

  // User management (Director only)
  app.get("/api/users", isAuthenticated, requireRole("hr", "director"), async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

   app.get("/api/leave-requests/all", isAuthenticated, requireRole("hr", "director"), async (req: any, res) => {
    try {
      const requests = await storage.getAllLeaveRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all requests" });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, requireRole("director"), async (req: any, res) => {
    try {
      const { role } = req.body;
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.patch("/api/users/:id/branch", isAuthenticated, requireRole("hr", "director"), async (req: any, res) => {
    try {
      const { branch } = req.body;
      if (branch !== null && !["hq", "branch1", "branch2"].includes(branch)) {
        return res.status(400).json({ message: "Invalid branch. Must be 'hq', 'branch1', or 'branch2'." });
      }
      const user = await storage.updateUserBranch(req.params.id, branch);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update branch" });
    }
  });

     app.get(
    "/api/shift-schedules",
    isAuthenticated,
    requireRole("hr"),
    async (req: any, res) => {
      try {
        const weekStartDate = String(req.query.weekStartDate || "");

        if (!weekStartDate) {
          return res.status(400).json({
            message: "weekStartDate is required",
          });
        }

        const schedules = await storage.getShiftSchedules(weekStartDate);
        res.json(schedules);
      } catch (error) {
        console.error("Get KA schedules error:", error);
        res.status(500).json({
          message: "Failed to fetch KA schedules",
        });
      }
    }
  );

  app.put(
    "/api/shift-schedules",
    isAuthenticated,
    requireRole("hr"),
    async (req: any, res) => {
      try {
        const schedules = insertShiftScheduleSchema
          .array()
          .parse(req.body.schedules || []);

        const savedSchedules = await storage.upsertShiftSchedules(schedules);

        await storage.createAuditLog({
          userId: req.user.id,
          action: "update_ka_schedule",
          details: `Updated shift schedule (${savedSchedules.length} day(s))`,
        });

        res.json(savedSchedules);
      } catch (error) {
        console.error("Save KA schedules error:", error);
        res.status(500).json({
          message: "Failed to save KA schedules",
        });
      }
    }
  );

  // Leave request submission
  app.post("/api/leave-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { leaveType, medicalFeeAmount } = req.body;

const parsedStartDate = new Date(req.body.startDate);
const parsedEndDate = new Date(
  req.body.endDate ?? req.body.startDate
);

if (
  Number.isNaN(parsedStartDate.getTime()) ||
  Number.isNaN(parsedEndDate.getTime())
) {
  return res.status(400).json({
    message: "Invalid leave dates.",
  });
}

if (parsedEndDate < parsedStartDate) {
  return res.status(400).json({
    message: "End date must not be earlier than start date.",
  });
}

const includesWeekends =
  String((user as any).workSchedule || "") === "includes_weekends";

const isHalfDayRequest =
  leaveType === "halfday_morning" ||
  leaveType === "halfday_afternoon";

const isTimeSlipRequest = leaveType === "time_slip";

const usesExistingDurationRules =
  leaveType === "maternity" ||
  leaveType === "paternity";

let requestDays = 0;

if (isTimeSlipRequest) {
  requestDays = 0;
} else if (usesExistingDurationRules) {
  requestDays = Number(req.body.totalDays || 0);
} else {
  const chargeableFullDays = countChargeableLeaveDays(
    parsedStartDate,
    parsedEndDate,
    includesWeekends
  );

  requestDays = isHalfDayRequest
    ? chargeableFullDays > 0
      ? 0.5
      : 0
    : chargeableFullDays;
}

if (!isTimeSlipRequest && requestDays <= 0) {
  return res.status(400).json({
    message:
      "The selected date is a public holiday or non-working day. No leave request is required.",
  });
}

let leaveEntitlementAtApplication: string | null = null;
let leaveBalanceBeforeApplication: string | null = null;
let leaveBalanceAfterApplication: string | null = null;
let leaveTakenBeforeApplication: string | null = null;

if (
  leaveType === "annual" ||
  leaveType === "halfday_morning" ||
  leaveType === "halfday_afternoon"
) {
  const entitlement = Number(user.annualLeaveEntitlement || 0);
  const currentBalance = Number(user.annualLeaveBalance || 0);

  leaveEntitlementAtApplication = entitlement.toFixed(2);
  leaveBalanceBeforeApplication = currentBalance.toFixed(2);
  leaveBalanceAfterApplication = Math.max(0, currentBalance - requestDays).toFixed(2);
  leaveTakenBeforeApplication = Math.max(0, entitlement - currentBalance).toFixed(2);
}

if (leaveType === "medical") {
  const entitlement = Number(user.sickLeaveEntitlement || 0);
  const currentBalance = Number(user.sickLeaveBalance || 0);

  leaveEntitlementAtApplication = entitlement.toFixed(2);
  leaveBalanceBeforeApplication = currentBalance.toFixed(2);
  leaveBalanceAfterApplication = Math.max(0, currentBalance - requestDays).toFixed(2);
  leaveTakenBeforeApplication = Math.max(0, entitlement - currentBalance).toFixed(2);
}

if (leaveType === "hospitalization") {
  const entitlement = Number((user as any).hospitalizationLeaveEntitlement || 60);
  const currentBalance = Number((user as any).hospitalizationLeaveBalance || 60);

  leaveEntitlementAtApplication = entitlement.toFixed(2);
  leaveBalanceBeforeApplication = currentBalance.toFixed(2);
  leaveBalanceAfterApplication = Math.max(0, currentBalance - requestDays).toFixed(2);
  leaveTakenBeforeApplication = Math.max(0, entitlement - currentBalance).toFixed(2);
}
      
      // Balance checks
      if (
         (leaveType === "annual" ||
           leaveType === "halfday_morning" ||
           leaveType === "halfday_afternoon") &&
         requestDays > Number(user.annualLeaveBalance)
      ) {
         return res.status(400).json({ message: "Insufficient annual leave balance." });
      }

      if (
        leaveType === "medical" &&
        requestDays >
         Number(user.sickLeaveBalance ?? user.sickLeaveEntitlement ?? 0)
      ) {
        return res.status(400).json({ message: "Insufficient medical leave balance." });
      }

      if (
        leaveType === "hospitalization" &&
        requestDays >
         Number((user as any).hospitalizationLeaveBalance ?? 60)
      ) {
        return res.status(400).json({ message: "Insufficient hospitalization leave balance." });
      }

      // Probation check
      const isProbation = String((user as any)?.employmentStatus || "").toLowerCase() === "probation";
      if (isProbation && !["unpaid", "halfday_morning", "halfday_afternoon",].includes(leaveType)) {
        return res.status(400).json({ message: "Probation employees are only allowed Unpaid Leave, Half." });
      }

      // Generate Leave Reference Number
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-4);

      const referenceNo = `LR-${year}-${timestamp}`;

      const validatedData = insertLeaveRequestSchema.parse({
        ...req.body,
        referenceNo,
        userId,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        totalDays: String(requestDays),
        timeOut: req.body.timeOut ?? null,
        timeBack: req.body.timeBack ?? null,
        medicalFeeAmount: medicalFeeAmount ? String(medicalFeeAmount) : null,

        leaveEntitlementAtApplication,
        leaveBalanceBeforeApplication,
        leaveBalanceAfterApplication,
        leaveTakenBeforeApplication,
      });

      const request = await storage.createLeaveRequest(validatedData);
      await storage.createAuditLog({
        userId,
        action: "SUBMIT_LEAVE",
        targetUserId: userId,
        leaveRequestId: request.id,
        details: `Ref: ${request.referenceNo} - Submitted ${request.leaveType} (${request.totalDays} day(s))`,
      });

      const allUsers = await storage.getAllUsers();

      const recipients = allUsers.filter((u) =>
         ["hr", "director"].includes(String(u.role || "").toLowerCase())
       );

      const employeeName =
         `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.email ||
          "Employee";

      for (const recipient of recipients) {
          await storage.createNotification({
             userId: recipient.id,
             title: "New Leave Request",
             message: `${employeeName} submitted ${request.leaveType} leave (${request.totalDays} day(s)).`,
             type: "leave_request",
             link: "/approvals",
             isRead: false,
           });
          }

      // Notify Director when employee submits leave
  try {
  const users = await storage.getAllUsers();
    const directors = users.filter(
    (u) => (u.role || "").trim().toLowerCase() === "director"
  );

  for (const director of directors) {

    if (director.email) {
      await sendNewLeaveRequestAlertToDirector({
        toEmail: director.email,
        employeeName:
          `${req.user.firstName ?? ""} ${req.user.lastName ?? ""}`.trim() || req.user.email,
        leaveType: request.leaveType,
        startDate: String(request.startDate),
        endDate: String(request.endDate),
        totalDays: Number(request.totalDays ?? 0),
   });
  }
 }
} catch (err) {
  console.error("Director alert email failed:", err);
}

      res.status(201).json(request);
    } catch (error: any) {
      console.error("Fetch leave request failed:", error?.message);
      res.status(500).json({ message: "Failed to create leave request" });
    }
  });

  app.get("/api/leave-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requests = await storage.getLeaveRequests(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leave requests" });
    }
  });

  app.get(
  "/api/leave-requests/pending",
  isAuthenticated,
  requireRole("hr", "director"),
  async (req: any, res) => {
    try {
      const pendingRequests = await storage.getPendingLeaveRequestsWithUser();
      res.json(pendingRequests);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch pending requests" });
    }
  }
);

   app.get(
  "/api/leave-requests/recent-forms",
  isAuthenticated,
  requireRole("hr"),
  async (req: any, res) => {
    try {
      const forms = await storage.getRecentLeaveFormsForHr();
      res.json(forms);
    } catch (error) {
      console.error("Error fetching recent leave forms:", error);
      res.status(500).json({ message: "Failed to fetch recent leave forms" });
    }
  }
);

  app.get(
  "/api/leave-requests/employee-tracker",
  isAuthenticated,
  requireRole("hr"),
  async (_req: any, res) => {
    try {
      const records = await storage.getEmployeeLeaveTrackerForHr();
      res.json(records);
    } catch (error) {
      console.error("Error fetching employee leave tracker:", error);

      res.status(500).json({
        message: "Failed to fetch employee leave tracker",
      });
    }
  }
);

   app.get("/api/leave-requests/:id", isAuthenticated, async (req: any, res) => {
  try {
    const leaveRequest = await storage.getLeaveRequest(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (req.user.role === "employee" && leaveRequest.userId !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.json(leaveRequest);
    } catch (error: any) {
      console.error("Failed to fetch leave request:", error?.message);
      res.status(500).json({ message: "Failed to fetch leave request" });
    }
  });

  // HR Approval Route
  app.patch("/api/leave-requests/:id/hr-approve", isAuthenticated, requireRole("hr", "director"), async (req: any, res) => {
    try {
      const approverId = req.user.id;
      const { comment, action } = req.body;
      const status = action === "approve" ? "approved" : "rejected";
      
      const leaveRequest = await storage.getLeaveRequest(req.params.id);
      if (!leaveRequest) return res.status(404).json({ message: "Not found" });
      
      if ((leaveRequest.status || "").toLowerCase() !== "pending") {
        return res.status(400).json({ message: "This request is already decided." });
      }

      const request = await storage.updateLeaveRequestStatus(
        req.params.id,
        status,
        comment,
        "hr",
        approverId
      );
      
      await storage.createAuditLog({
        userId: approverId,
        action: status === "approved" ? "APPROVE_LEAVE" : "REJECT_LEAVE",
        targetUserId: leaveRequest.userId,
        leaveRequestId: leaveRequest.id,
        details: `Ref: ${leaveRequest.referenceNo} - HR ${status} ${leaveRequest.leaveType} (${leaveRequest.totalDays} day(s))`,
      });

      await storage.createNotification({
  userId: leaveRequest.userId,
  title: status === "approved" ? "Leave Approved" : "Leave Rejected",
  message: `Your ${leaveRequest.leaveType} leave request (${leaveRequest.totalDays} day(s)) was ${status}.`,
  type: "leave_status",
  link: "/history",
  isRead: false,
});

       // HR approval is display-only. No balance deduction here.
       // All deductions are handled exclusively in the Director approval route.

      // Email logic
      try {
  const employee = await storage.getUser(leaveRequest.userId);
  if (employee?.email) {
    await sendLeaveNotification({
      toEmail: employee.email,
      employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      leaveType: leaveRequest.leaveType,
      startDate: formatDateMY(leaveRequest.startDate),
      endDate: formatDateMY(leaveRequest.endDate),
      totalDays: Number(leaveRequest.totalDays),
      status: status as any,
      comment: comment,
      approverRole: "HR",
    });
  }
} catch (err) {
  console.error("HR approve failed:", err);
  console.error("Email failed (HR approve):", err);
}
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Update failed" });
    }
  });

  // Director Approval Route
app.patch(
  "/api/leave-requests/:id/director-approve",
  isAuthenticated,
  requireRole("director"),
  async (req: any, res) => {
    try {
      const approverId = req.user.id;
      const { comment, action } = req.body;
      const status = action === "approve" ? "approved" : "rejected";

      const leaveRequest = await storage.getLeaveRequest(req.params.id);
      if (!leaveRequest) return res.status(404).json({ message: "Not found" });

      if ((leaveRequest.status || "").toLowerCase() !== "pending") {
        return res.status(400).json({ message: "This request is already decided." });
      }

      const request = await storage.updateLeaveRequestStatus(
        req.params.id,
        status,
        comment,
        "director",
        approverId
      );

      await storage.createAuditLog({
        userId: approverId,
        action: status === "approved" ? "APPROVE_LEAVE" : "REJECT_LEAVE",
        targetUserId: leaveRequest.userId,
        leaveRequestId: leaveRequest.id,
        details: `Ref: ${leaveRequest.referenceNo} - Director ${status} ${leaveRequest.leaveType} (${leaveRequest.totalDays} day(s))`,
      });

      await storage.createNotification({
  userId: leaveRequest.userId,
  title: status === "approved" ? "Leave Approved" : "Leave Rejected",
  message: `Your ${leaveRequest.leaveType} leave request (${leaveRequest.totalDays} day(s)) was ${status}.`,
  type: "leave_status",
  link: "/history",
  isRead: false,
});

       if (status === "approved" && request) {
        const medicalFee = leaveRequest.medicalFeeAmount
          ? parseFloat(String(leaveRequest.medicalFeeAmount))
          : 0;

      const employee = await storage.getUser(request.userId);

      const isProbation =
        String((employee as any)?.employmentStatus || "").toLowerCase() === "probation";

      const isHalfDay =
        request.leaveType === "halfday_morning" ||
        request.leaveType === "halfday_afternoon";

      if (isProbation && isHalfDay) {
  await storage.upsertSpecialLeaveMonthlySummary(
    request.userId,
    "unpaid",
    new Date(request.startDate),
    Number(request.totalDays)
  );
} else {
      if (request.leaveType !== "time_slip") {
        await storage.deductLeaveBalance(
          request.userId,
          request.leaveType,
          Number(request.totalDays),
          medicalFee
        );
      }
 
      if (["unpaid", "emergency", "time_slip"].includes(String(request.leaveType || "").toLowerCase())) {
          await storage.upsertSpecialLeaveMonthlySummary(
            request.userId,
            request.leaveType,
            new Date(request.startDate),
            Number(request.totalDays)
          );
        }
      }
    }
   
      // Email logic (do NOT fail approval if email fails)
      try {
        const employee = await storage.getUser(leaveRequest.userId);
        if (employee?.email) {
          await sendLeaveNotification({
            toEmail: employee.email,
            employeeName:
              `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || employee.email,
            leaveType: leaveRequest.leaveType,
            startDate: formatDateMY(leaveRequest.startDate),
            endDate: formatDateMY(leaveRequest.endDate),
            totalDays: Number(leaveRequest.totalDays),
            status: status as any,
            comment,
            approverRole: "Director",
          });
        }
      } catch (err) {
        console.error("Email failed (Director approve):", err);
      }

      return res.json(request);
    } catch (error) {
      console.error("Director approve failed:", error);
      return res.status(500).json({ message: "Update failed" });
    }
  }
);

    app.post(
     "/api/employee-forms",
     isAuthenticated,
     requireRole("hr", "director"),
     async (req, res) => {
    try {
      const parsed = employeeInformationFormPayloadSchema.parse(req.body);

      const result = await storage.createEmployeeInformationForm(parsed);

      res.json(result);
    } catch (err: any) {
      console.error("Create employee form error:", err);
      res.status(400).json({ message: err.message });
    }
  });

      app.get(
       "/api/employee-forms/:id",
       isAuthenticated,
       requireRole("hr", "director"),
       async (req, res) => {
    try {
      const id = Number(req.params.id);

      const result = await storage.getEmployeeInformationFormById(id);

      if (!result) {
        return res.status(404).json({ message: "Not found" });
      }

      res.json(result);
    } catch (err: any) {
      console.error("Get employee form error:", err);
      res.status(500).json({ message: err.message });
    }
  });

    app.put(
     "/api/employee-forms/:id",
     isAuthenticated,
     requireRole("hr", "director"),
     async (req, res) => {
    try {
      const id = Number(req.params.id);

      const parsed = employeeInformationFormPayloadSchema.parse(req.body);

      const result = await storage.updateEmployeeInformationForm(id, parsed);

      if (!result) {
        return res.status(404).json({ message: "Not found" });
      }

      res.json(result);
    } catch (err: any) {
      console.error("Update employee form error:", err);
      res.status(400).json({ message: err.message });
    }
  });

    app.get(
     "/api/employee-forms/:id/pdf",
     isAuthenticated,
     requireRole("hr", "director"),
     async (req, res) => {
    try {
      const id = Number(req.params.id);

      const result = await storage.getEmployeeInformationFormById(id);

      if (!result) {
        return res.status(404).json({ message: "Employee form not found" });
      }

      const pdfData = {
        ...result.form,
        familyMembers: result.familyMembers,
        children: result.children,
        educationSchool: result.educationSchool,
        educationHigher: result.educationHigher,
        languages: result.languages,
        softwareSkills: result.softwareSkills,
        workExperiences: result.workExperiences,
      };

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="employee-form-${id}.pdf"`
      );

      const pdfDoc = buildEmployeePdf(pdfData);
      pdfDoc.pipe(res);
    } catch (error) {
      console.error("Employee PDF generation failed:", error);
      res.status(500).json({ message: "Failed to generate employee PDF" });
    }
  });

    // ===============================
// PAYROLL EMPLOYEE PROFILES
// ===============================

app.get(
  "/api/payroll-profiles",
  isAuthenticated,
  requireRole("hr", "director"),
  async (_req, res) => {
    try {
      const profiles = await storage.getPayrollProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Get payroll profiles error:", error);
      res.status(500).json({
        message: "Failed to fetch payroll profiles",
      });
    }
  }
);

app.get(
  "/api/payroll-profiles/:userId",
  isAuthenticated,
  requireRole("hr", "director"),
  async (req, res) => {
    try {
      const profile = await storage.getPayrollProfileByUser(
        req.params.userId
      );

      if (!profile) {
        return res.status(404).json({
          message: "Payroll profile not found",
        });
      }

      res.json(profile);
    } catch (error) {
      console.error("Get payroll profile error:", error);
      res.status(500).json({
        message: "Failed to fetch payroll profile",
      });
    }
  }
);

app.patch(
  "/api/payroll-profiles/:userId",
  isAuthenticated,
  requireRole("hr", "director"),
  async (req: any, res) => {
    try {
      const userId = req.params.userId;

      const employee = await storage.getUser(userId);

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      const updateSchema =
        insertEmployeePayrollProfileSchema
          .omit({
            userId: true,
          })
          .partial();

      const parsed = updateSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid payroll profile data",
          errors: parsed.error.flatten(),
        });
      }

      const profile = await storage.upsertPayrollProfile(
        userId,
        parsed.data
      );

      await storage.createAuditLog({
        userId: req.user.id,
        action: "UPDATE_PAYROLL_PROFILE",
        targetUserId: userId,
        details: `Updated payroll profile for ${userId}`,
      });

      res.json(profile);
    } catch (error) {
      console.error("Update payroll profile error:", error);
      res.status(500).json({
        message: "Failed to update payroll profile",
      });
    }
  }
);

    // ==============================
// PAYROLL RUNS
// ==============================

app.get(
  "/api/payroll-runs",
  isAuthenticated,
  requireRole("hr", "director"),
  async (_req, res) => {
    try {
      const runs = await storage.getPayrollRuns();
      res.json(runs);
    } catch (error) {
      console.error("Get payroll runs error:", error);
      res.status(500).json({
        message: "Failed to fetch payroll runs",
      });
    }
  }
);

app.get(
  "/api/payroll-runs/:id",
  isAuthenticated,
  requireRole("hr", "director"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid payroll run ID",
        });
      }

      const run = await storage.getPayrollRun(id);

      if (!run) {
        return res.status(404).json({
          message: "Payroll run not found",
        });
      }

      res.json(run);
    } catch (error) {
      console.error("Get payroll run error:", error);
      res.status(500).json({
        message: "Failed to fetch payroll run",
      });
    }
  }
);

app.post(
  "/api/payroll-runs",
  isAuthenticated,
  requireRole("hr", "director"),
  async (req: any, res) => {
    try {
      const month = Number(req.body.month);
      const year = Number(req.body.year);

      if (
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
      ) {
        return res.status(400).json({
          message: "Month must be between 1 and 12",
        });
      }

      if (
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 2100
      ) {
        return res.status(400).json({
          message: "Invalid payroll year",
        });
      }

      const existingRun =
        await storage.getPayrollRunByMonthYear(
          month,
          year
        );

      if (existingRun) {
        return res.status(400).json({
          message:
            "A payroll run already exists for this month and year.",
        });
      }

      const run = await storage.createPayrollRun({
        month,
        year,
        status: "draft",
        createdBy: req.user.id,
      });

      await storage.createAuditLog({
        userId: req.user.id,
        action: "CREATE_PAYROLL_RUN",
        targetUserId: req.user.id,
        details:
          `Created payroll run ${run.id} for ${month}/${year}`,
      });

      res.status(201).json(run);
    } catch (error: any) {
      console.error("Create payroll run error:", error);

      if (error?.code === "23505") {
        return res.status(400).json({
          message:
            "A payroll run already exists for this month and year.",
        });
      }

      res.status(500).json({
        message: "Failed to create payroll run",
      });
    }
  }
);

app.patch(
  "/api/payroll-runs/:id/review",
  isAuthenticated,
  requireRole("hr", "director"),
  async (req: any, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid payroll run ID",
        });
      }

      const run = await storage.getPayrollRun(id);

      if (!run) {
        return res.status(404).json({
          message: "Payroll run not found",
        });
      }

      if (run.status === "finalized") {
        return res.status(400).json({
          message:
            "Finalized payroll runs cannot be changed.",
         });
       }

       if (run.status !== "draft") {

        return res.status(400).json({
          message:
            "Only draft payroll runs can be submitted for review.",
        });
      }

     const payrollProfiles =
  await storage.getPayrollProfiles();

if (payrollProfiles.length === 0) {
  return res.status(400).json({
    message:
      "No employee payroll profiles have been configured.",
  });
}

const runPayrolls =
  await storage.getPayrollsByRun(id);

const completedUserIds = new Set(
  runPayrolls.map((payroll) => payroll.userId)
);

const missingProfiles = payrollProfiles.filter(
  (profile) =>
    !completedUserIds.has(profile.userId)
);

if (missingProfiles.length > 0) {
  return res.status(400).json({
    message:
      `Payroll is incomplete. ${missingProfiles.length} ` +
      `employee(s) still require payroll preparation.`,
  });
}

      const updatedRun =
        await storage.updatePayrollRunStatus(
          id,
          "review",
          req.user.id
        );

      await storage.createAuditLog({
        userId: req.user.id,
        action: "REVIEW_PAYROLL_RUN",
        targetUserId: req.user.id,
        details:
          `Submitted payroll run ${id} for review (${run.month}/${run.year})`,
      });

      res.json(updatedRun);
    } catch (error) {
      console.error("Review payroll run error:", error);
      res.status(500).json({
        message:
          "Failed to submit payroll run for review",
      });
    }
  }
);

app.patch(
  "/api/payroll-runs/:id/finalize",
  isAuthenticated,
  requireRole("hr", "director"),
  async (req: any, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid payroll run ID",
        });
      }

      const run = await storage.getPayrollRun(id);

      if (!run) {
        return res.status(404).json({
          message: "Payroll run not found",
        });
      }

      if (run.status === "finalized") {
        return res.status(400).json({
          message:
            "Payroll run has already been finalized.",
        });
      }

      if (run.status !== "review") {
        return res.status(400).json({
          message:
            "Payroll run must be reviewed before it can be finalized.",
        });
      }

      const updatedRun =
        await storage.updatePayrollRunStatus(
          id,
          "finalized",
          req.user.id
        );

      await storage.createAuditLog({
        userId: req.user.id,
        action: "FINALIZE_PAYROLL_RUN",
        targetUserId: req.user.id,
        details:
          `Finalized payroll run ${id} (${run.month}/${run.year})`,
      });

      res.json(updatedRun);
    } catch (error) {
      console.error(
        "Finalize payroll run error:",
        error
      );

      res.status(500).json({
        message: "Failed to finalize payroll run",
      });
    }
  }
);

    app.post(
    "/api/payroll",
    isAuthenticated,
    requireRole("hr", "director"),
    async (req: any, res) => {
      try {
          const data: InsertPayroll = req.body;

const runId = Number(data.runId);

if (!Number.isInteger(runId) || runId <= 0) {
  return res.status(400).json({
    message: "A valid payroll run is required.",
  });
}

const run = await storage.getPayrollRun(runId);

if (!run) {
  return res.status(404).json({
    message: "Payroll run not found.",
  });
}

if (
  run.status !== "draft" &&
  run.status !== "review"
) {
  return res.status(400).json({
    message:
      "This payroll run cannot be modified.",
  });
}

   const grossPay =
  Number(data.basicSalary || 0) +
  Number(data.allowance || 0) +
  Number(data.incentive || 0) +
  Number(data.overtime || 0) +
  Number(data.wages || 0) +
  Number(data.commissionOr || 0) +
  Number(data.bonus || 0);

   const totalDeductions =
  Number(data.epf || 0) +
  Number(data.socso || 0) +
  Number(data.eis || 0) +
  Number(data.pcb || 0) +
  Number(data.otherDeduction || 0) +
  Number(data.unpaidLeaveDeduction || 0);

  const netPay = grossPay - totalDeductions;

       const payroll = await storage.createPayroll({
  ...data,

  runId,

  // Month/year always come from the payroll run.
  // Do not trust values submitted by the frontend.
  month: run.month,
  year: run.year,

  grossPay: grossPay.toFixed(2),
  netPay: netPay.toFixed(2),

  updatedAt: new Date(),
});

       await storage.createAuditLog({
  userId: req.user.id,
  action: "CREATE_PAYROLL",
  targetUserId: data.userId,
  details:
    `Created payroll for ${data.userId} — ` +
    `${run.month}/${run.year} ` +
    `(Gross: RM ${grossPay.toFixed(2)}, ` +
    `Net: RM ${netPay.toFixed(2)})`,
});

        res.json(payroll);
       } catch (error: any) {
        console.error("Create payroll error:", error);
        if (error?.code === "23505") {
          return res.status(400).json({
            message: "Payroll already exists for this employee in the selected month and year.",
          });
        }
        res.status(500).json({
          message: "Failed to create payroll",
        });
      }
    }
  );

  app.patch(
  "/api/payroll/:id",
  isAuthenticated,
  requireRole("hr", "director"),
  async (req: any, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid payroll ID",
        });
      }

      const existingPayroll = await storage.getPayroll(id);

      if (!existingPayroll) {
        return res.status(404).json({
          message: "Payroll not found",
        });
      }

      if (!existingPayroll.runId) {
        return res.status(400).json({
          message:
            "Historical payroll records cannot be edited through the new payroll workflow.",
        });
      }

      const run = await storage.getPayrollRun(
        existingPayroll.runId
      );

      if (!run) {
        return res.status(404).json({
          message: "Payroll run not found",
        });
      }

      if (run.status === "finalized") {
        return res.status(400).json({
          message:
            "This payroll run has been finalized and can no longer be modified.",
        });
      }

      const data: Partial<InsertPayroll> = req.body;

      const grossPay =
        Number(data.basicSalary ?? existingPayroll.basicSalary ?? 0) +
        Number(data.allowance ?? existingPayroll.allowance ?? 0) +
        Number(data.incentive ?? existingPayroll.incentive ?? 0) +
        Number(data.overtime ?? existingPayroll.overtime ?? 0) +
        Number(data.wages ?? existingPayroll.wages ?? 0) +
        Number(data.commissionOr ?? existingPayroll.commissionOr ?? 0) +
        Number(data.bonus ?? existingPayroll.bonus ?? 0);

      const totalDeductions =
        Number(data.epf ?? existingPayroll.epf ?? 0) +
        Number(data.socso ?? existingPayroll.socso ?? 0) +
        Number(data.eis ?? existingPayroll.eis ?? 0) +
        Number(data.pcb ?? existingPayroll.pcb ?? 0) +
        Number(
          data.otherDeduction ??
            existingPayroll.otherDeduction ??
            0
        ) +
        Number(
          data.unpaidLeaveDeduction ??
            existingPayroll.unpaidLeaveDeduction ??
            0
        );

      const netPay = grossPay - totalDeductions;

      const payroll = await storage.updatePayroll(id, {
        ...data,

        // These must remain tied to the original payroll run.
        runId: existingPayroll.runId,
        userId: existingPayroll.userId,
        month: run.month,
        year: run.year,

        grossPay: grossPay.toFixed(2),
        netPay: netPay.toFixed(2),
      });

      await storage.createAuditLog({
        userId: req.user.id,
        action: "UPDATE_PAYROLL",
        targetUserId: existingPayroll.userId,
        details:
          `Updated payroll ${id} for ${existingPayroll.userId} — ` +
          `${run.month}/${run.year} ` +
          `(Gross: RM ${grossPay.toFixed(2)}, ` +
          `Net: RM ${netPay.toFixed(2)})`,
      });

      res.json(payroll);
    } catch (error) {
      console.error("Update payroll error:", error);

      res.status(500).json({
        message: "Failed to update payroll",
      });
    }
  }
);

  app.get(
    "/api/payroll",
    isAuthenticated,
    requireRole("hr", "director"),
    async (_req, res) => {
      try {
        const payrolls = await storage.getPayrolls();
        res.json(payrolls);
      } catch (error) {
        console.error("Get payrolls error:", error);
        res.status(500).json({
          message: "Failed to fetch payrolls",
        });
      }
    }
  );

  app.get(
  "/api/payroll/:id",
  isAuthenticated,
  async (req: any, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid payroll ID",
        });
      }

      const payroll = await storage.getPayroll(id);

      if (!payroll) {
        return res.status(404).json({
          message: "Payroll not found",
        });
      }

      const dbUser = await storage.getUser(req.user.id);
      const role = (dbUser?.role || "employee").toLowerCase();

      const isOwner = payroll.userId === req.user.id;
      const canView =
        isOwner ||
        role === "hr" ||
        role === "director";

      if (!canView) {
        return res.status(403).json({
          message: "Forbidden",
        });
      }

      res.json(payroll);
    } catch (error) {
      console.error("Get payroll error:", error);

      res.status(500).json({
        message: "Failed to fetch payroll",
      });
    }
  }
);

  app.get(
  "/api/payroll/:id/pdf",
  isAuthenticated,
  async (req: any, res) => {
    try {
      const payroll = await storage.getPayroll(Number(req.params.id));

      if (!payroll) {
        return res.status(404).json({ message: "Payroll not found" });
      }

      if (payroll.runId) {
        const run = await storage.getPayrollRun(payroll.runId);

        if (!run) {
          return res.status(404).json({
           message: "Payroll run not found",
          });
         }

        if (run.status !== "finalized") {
          return res.status(400).json({
            message:
              "Payslip is not available until the payroll run has been finalized.",
           });
          }
         }

      const dbUser = await storage.getUser(req.user.id);
      const role = (dbUser?.role || "employee").toLowerCase();

      const isOwner = payroll.userId === req.user.id;
      const canView = isOwner || role === "hr" || role === "director";

      if (!canView) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="payslip-${payroll.month}-${payroll.year}.pdf"`
      );

      const userPayrolls = await storage.getPayrollsByUser(payroll.userId);

      const ytdPayrolls = userPayrolls.filter((p: any) => {
       return Number(p.year) === Number(payroll.year)
        && Number(p.month) <= Number(payroll.month);
      });

      const ytd = {
        grossPay: ytdPayrolls.reduce((sum: number, p: any) => sum + Number(p.grossPay || 0), 0),
        epf: ytdPayrolls.reduce((sum: number, p: any) => sum + Number(p.epf || 0), 0),
        socso: ytdPayrolls.reduce((sum: number, p: any) => sum + Number(p.socso || 0), 0),
        pcb: ytdPayrolls.reduce((sum: number, p: any) => sum + Number(p.pcb || 0), 0),
        netPay: ytdPayrolls.reduce((sum: number, p: any) => sum + Number(p.netPay || 0), 0),
       };

      const pdfDoc = buildPayslipPdf({
        ...payroll,
        ytd,
      });

      pdfDoc.pipe(res);
     } catch (error) {
      console.error("Payslip PDF generation failed:", error);
      res.status(500).json({ message: "Failed to generate payslip PDF" });
    }
  }
);

    app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Get unread notification count error:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.get(
  "/api/payroll-runs/:id/payrolls",
  isAuthenticated,
  requireRole("hr", "director"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid payroll run ID",
        });
      }

      const run = await storage.getPayrollRun(id);

      if (!run) {
        return res.status(404).json({
          message: "Payroll run not found",
        });
      }

      const payrolls =
        await storage.getPayrollsByRun(id);

      res.json({
        run,
        payrolls,
      });
    } catch (error) {
      console.error(
        "Get payroll run payrolls error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch payroll run payrolls",
      });
    }
  }
);

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      await storage.markNotificationAsRead(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
