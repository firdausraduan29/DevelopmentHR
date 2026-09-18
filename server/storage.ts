import { 
  users, 
  leaveRequests,
  auditLogs,
  notifications,
  specialLeaveMonthlySummaries,
  employeeInformationForms,
  employeeFamilyMembers,
  employeeChildren,
  employeeEducationSchool,
  employeeEducationHigher,
  employeeLanguages,
  employeeSoftwareSkills,
  employeeWorkExperiences,
  type User, 
  type UpsertUser,
  type LeaveRequest,
  type InsertLeaveRequest,
  type AuditLog,
  type InsertAuditLog,
  type Notification,
  type InsertNotification,
  type EmployeeInformationForm,
  type EmployeeFamilyMember,
  type EmployeeChild,
  type EmployeeEducationSchool,
  type EmployeeEducationHigher,
  type EmployeeLanguage,
  type EmployeeSoftwareSkill,
  type EmployeeWorkExperience,
  payrolls,
  employeePayrollProfiles,
  payrollRuns,
  shiftSchedules,
  type InsertEmployeeInformationFormPayload,
  type Payroll,
  type InsertPayroll,
  type PayrollRun,
  type InsertPayrollRun,
  type EmployeePayrollProfile,
  type InsertEmployeePayrollProfile,
  type ShiftSchedule,
  type InsertShiftSchedule,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, or, and, asc, desc, gte } from "drizzle-orm";

export type LeaveRequestWithUser = LeaveRequest & {
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImageUrl: string | null;
  branch: string | null;
};

export type CalendarLeaveRequest = Pick<
  LeaveRequest,
  "id" | "leaveType" | "startDate" | "endDate" | "totalDays" | "status"
> & {
  firstName: string | null;
  lastName: string | null;
  branch: string | null;
};

export type LeaveRequestPdfData = LeaveRequest & {
  firstName: string | null;
  lastName: string | null;
  email: string;
  department: string | null;
  coveringPerson: string | null;

  leaveEntitlementAtApplication: any;
  leaveBalanceBeforeApplication: any;
  leaveBalanceAfterApplication: any;
  leaveTakenBeforeApplication: any;

  annualLeaveEntitlement: any;
  sickLeaveEntitlement: any;
  annualLeaveBalance: any;
  sickLeaveBalance: any;
  medicalFeeBalance: any;
  hospitalizationLeaveEntitlement: any;
  hospitalizationLeaveBalance: any;
};

export type RecentLeaveFormWithUser = LeaveRequest & {
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImageUrl: string | null;
  branch: string | null;
};

export type EmployeeLeaveTrackerRecord = Pick<
  LeaveRequest,
  | "id"
  | "userId"
  | "referenceNo"
  | "leaveType"
  | "startDate"
  | "endDate"
  | "totalDays"
  | "status"
  | "createdAt"
> & {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  branch: string | null;
};

export type PayrollWithUser = Payroll & {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  department: string | null;
};

export type PayrollProfileWithUser = EmployeePayrollProfile & {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  department: string | null;
  branch: string | null;
};

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getLeaveRequestWithUser(id: string): Promise<LeaveRequestPdfData | undefined>;
  upsertSpecialLeaveMonthlySummary(userId: string, leaveType: string, date: Date, days: number): Promise<void>;
  updateUserBranch(id: string, branch: string | null): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getShiftSchedules(weekStartDate: string): Promise<ShiftSchedule[]>;
  upsertShiftSchedules(
    schedules: InsertShiftSchedule[]
  ): Promise<ShiftSchedule[]>;
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  updatePayroll(
    id: number,
    payroll: Partial<InsertPayroll>
  ): Promise<Payroll | undefined>;

  getPayrolls(): Promise<PayrollWithUser[]>;
  getPayroll(id: number): Promise<PayrollWithUser | undefined>;
  getPayrollsByUser(userId: string): Promise<Payroll[]>;
  getPayrollsByRun(runId: number): Promise<PayrollWithUser[]>;
  deletePayroll(id: number): Promise<void>;
  
  getPayrollProfiles(): Promise<PayrollProfileWithUser[]>;

  getPayrollRuns(): Promise<PayrollRun[]>;

  getPayrollRun(
    id: number
  ): Promise<PayrollRun | undefined>;

  getPayrollRunByMonthYear(
    month: number,
    year: number
  ): Promise<PayrollRun | undefined>;

  createPayrollRun(
    data: InsertPayrollRun
  ): Promise<PayrollRun>;

  updatePayrollRunStatus(
    id: number,
    status: string,
    userId?: string
  ): Promise<PayrollRun | undefined>;

  getPayrollProfileByUser(
    userId: string
  ): Promise<EmployeePayrollProfile | undefined>;

  upsertPayrollProfile(
    userId: string,
    data: Partial<Omit<InsertEmployeePayrollProfile, "userId">>
  ): Promise<EmployeePayrollProfile>;
  getRecentCalendarLeaveRequests(): Promise<LeaveRequestWithUser[]>;
  getUpcomingApprovedLeaveRequests(): Promise<LeaveRequestWithUser[]>;
  getCalendarLeaveRequests(): Promise<CalendarLeaveRequest[]>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  setInitialRole(id: string, role: string): Promise<User | undefined>;

  updatePendingLeaveRequest(
    id: string,
    userId: string,
    data: Partial<InsertLeaveRequest>
  ): Promise<LeaveRequest | undefined>;

  updateUserProfile(
  id: string,
  data: {
    startDate?: string;
    department?: string;
    firstName?: string;
    lastName?: string;
  }
): Promise<User | undefined>;

   updateUser(
  id: string,
  data: {
    annualLeaveEntitlement?: string;
    sickLeaveEntitlement?: string;
    annualLeaveBalance?: string;
    sickLeaveBalance?: string;
    medicalFeeBalance?: string;
  }
): Promise<User | undefined>;

  updateUserLeaveBalances(id: string, data: { 
    annualLeaveBalance?: number; 
    sickLeaveBalance?: number;
    medicalFeeBalance?: number;
  }): Promise<User | undefined>;
  
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  getLeaveRequest(id: string): Promise<LeaveRequest | undefined>;
  getLeaveRequests(userId: string): Promise<LeaveRequest[]>;
  getAllLeaveRequests(): Promise<LeaveRequest[]>;
  getPendingLeaveRequests(): Promise<LeaveRequest[]>;
  getPendingLeaveRequestsWithUser(): Promise<LeaveRequestWithUser[]>;
  getRecentLeaveFormsForHr(): Promise<RecentLeaveFormWithUser[]>;
  getEmployeeLeaveTrackerForHr(): Promise<EmployeeLeaveTrackerRecord[]>;
  getHRApprovedLeaveRequests(): Promise<LeaveRequest[]>;
  updateLeaveRequestStatus(id: string, status: string, comment?: string, role?: string, approverId?: string): Promise<LeaveRequest | undefined>;
  
  deductLeaveBalance(userId: string, leaveType: string, days: number, medicalFeeAmount?: number): Promise<User | undefined>;
  
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: string): Promise<AuditLog[]>;

  createNotification(
     notification: InsertNotification
  ): Promise<Notification>;

  getNotifications(userId: string): Promise<Notification[]>;

  getUnreadNotificationCount(userId: string): Promise<number>;

  markNotificationAsRead(id: number): Promise<void>;

  markAllNotificationsAsRead(userId: string): Promise<void>; 

  createEmployeeInformationForm(payload: InsertEmployeeInformationFormPayload): Promise<EmployeeInformationForm>;
  getEmployeeInformationFormById(id: number): Promise<{
    form: EmployeeInformationForm;
    familyMembers: EmployeeFamilyMember[];
    children: EmployeeChild[];
    educationSchool: EmployeeEducationSchool[];
    educationHigher: EmployeeEducationHigher[];
    languages: EmployeeLanguage[];
    softwareSkills: EmployeeSoftwareSkill[];
    workExperiences: EmployeeWorkExperience[];
  } | null>;
  getLatestEmployeeInformationFormByEmail(email: string): Promise<EmployeeInformationForm | null>;
  updateEmployeeInformationForm(id: number, payload: InsertEmployeeInformationFormPayload): Promise<EmployeeInformationForm | null>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getLeaveRequestWithUser(id: string): Promise<LeaveRequestPdfData | undefined> {
  const [row] = await db
    .select({
      id: leaveRequests.id,
      userId: leaveRequests.userId,
      referenceNo: leaveRequests.referenceNo,
      leaveType: leaveRequests.leaveType,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      timeOut: leaveRequests.timeOut,
      timeBack: leaveRequests.timeBack,
      totalDays: leaveRequests.totalDays,
      reason: leaveRequests.reason,
      medicalFeeAmount: leaveRequests.medicalFeeAmount,
      attachmentUrl: leaveRequests.attachmentUrl,
      coveringPerson: leaveRequests.coveringPerson,
      status: leaveRequests.status,
      hrComment: leaveRequests.hrComment,
      directorComment: leaveRequests.directorComment,
      approvedByHr: leaveRequests.approvedByHr,
      approvedByDirector: leaveRequests.approvedByDirector,
      createdAt: leaveRequests.createdAt,
      updatedAt: leaveRequests.updatedAt,

      leaveEntitlementAtApplication: leaveRequests.leaveEntitlementAtApplication,
      leaveBalanceBeforeApplication: leaveRequests.leaveBalanceBeforeApplication,
      leaveBalanceAfterApplication: leaveRequests.leaveBalanceAfterApplication,
      leaveTakenBeforeApplication: leaveRequests.leaveTakenBeforeApplication,

      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      department: users.department,
      branch: (users as any).branch,

      annualLeaveEntitlement: users.annualLeaveEntitlement,  
      sickLeaveEntitlement: users.sickLeaveEntitlement,
      annualLeaveBalance: users.annualLeaveBalance,
      sickLeaveBalance: users.sickLeaveBalance,
      medicalFeeBalance: users.medicalFeeBalance,
      hospitalizationLeaveEntitlement: users.hospitalizationLeaveEntitlement,
      hospitalizationLeaveBalance: users.hospitalizationLeaveBalance,
    })
    .from(leaveRequests)
    .innerJoin(users, eq(users.id, leaveRequests.userId))
    .where(eq(leaveRequests.id, id));

  return row as LeaveRequestPdfData | undefined;
}

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const insertData: UpsertUser = {
      ...userData,
      role: "employee",          
      hasSelectedRole: 0,        
  };

    const [user] = await db
      .insert(users)
      .values(insertData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,

          // ✅ do NOT overwrite names if user already edited them
          firstName: sql`COALESCE(${users.firstName}, ${userData.firstName})`,
          lastName: sql`COALESCE(${users.lastName}, ${userData.lastName})`,

          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async setInitialRole(id: string, role: string): Promise<User | undefined> {

    const safeRole = role === "employee" ? "employee" : "employee";

    const [user] = await db
      .update(users)
      .set({ role, hasSelectedRole: 1, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserProfile(
    id: string,
    data: { startDate?: string; department?: string; firstName?: string; lastName?: string; workSchedule?: string }
    ): Promise<User | undefined> {
    const updateData: any = { updatedAt: new Date() };

    // allow clearing too (so empty string becomes null)
    if (data.startDate !== undefined) updateData.startDate = data.startDate 
    if (data.department !== undefined) updateData.department = data.department
    if (data.firstName !== undefined) updateData.firstName = data.firstName 
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.workSchedule !== undefined) updateData.workSchedule = data.workSchedule   
  
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUser(
  id: string,
  data: {
    annualLeaveEntitlement?: string;
    sickLeaveEntitlement?: string;
    annualLeaveBalance?: string;
    sickLeaveBalance?: string;
    medicalFeeBalance?: string;
  }
): Promise<User | undefined> {
  const updateData: any = { updatedAt: new Date() };

  if (data.annualLeaveEntitlement !== undefined) {
    updateData.annualLeaveEntitlement = data.annualLeaveEntitlement;
  }

  if (data.sickLeaveEntitlement !== undefined) {
    updateData.sickLeaveEntitlement = data.sickLeaveEntitlement;
  }

  if (data.annualLeaveBalance !== undefined) {
    updateData.annualLeaveBalance = data.annualLeaveBalance;
  }

  if (data.sickLeaveBalance !== undefined) {
    updateData.sickLeaveBalance = data.sickLeaveBalance;
  }

  if (data.medicalFeeBalance !== undefined) {
    updateData.medicalFeeBalance = data.medicalFeeBalance;
  }

  const [user] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();

  return user;
}

  async updateUserLeaveBalances(id: string, data: { 
    annualLeaveBalance?: number; 
    sickLeaveBalance?: number;
    medicalFeeBalance?: number;
  }): Promise<User | undefined> {
    const updateData: any = { updatedAt: new Date() };
    if (data.annualLeaveBalance !== undefined) updateData.annualLeaveBalance = data.annualLeaveBalance;
    if (data.sickLeaveBalance !== undefined) updateData.sickLeaveBalance = data.sickLeaveBalance;
    if (data.medicalFeeBalance !== undefined) updateData.medicalFeeBalance = String(data.medicalFeeBalance);
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const [result] = await db.insert(leaveRequests).values(request).returning();
    return result;
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | undefined> {
    const [result] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return result;
  }

  async getLeaveRequests(userId: string): Promise<LeaveRequest[]> {
    return await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.userId, userId))
      .orderBy(leaveRequests.createdAt);
  }

  async updatePendingLeaveRequest(
  id: string,
  userId: string,
  data: any
): Promise<LeaveRequest | undefined> {

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.reason !== undefined) updateData.reason = data.reason;
  if (data.coveringPerson !== undefined) updateData.coveringPerson = data.coveringPerson;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;
  if (data.totalDays !== undefined) updateData.totalDays = data.totalDays;

  const [updated] = await db
    .update(leaveRequests)
    .set(updateData)
    .where(and(eq(leaveRequests.id, id), eq(leaveRequests.userId, userId)))
    .returning();

  return updated;
}

  async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests).orderBy(leaveRequests.createdAt);
  }

  async getCalendarLeaveRequests(): Promise<CalendarLeaveRequest[]> {
  const rows = await db
    .select({
      id: leaveRequests.id,
      firstName: users.firstName,
      lastName: users.lastName,
      branch: users.branch,
      leaveType: leaveRequests.leaveType,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      totalDays: leaveRequests.totalDays,
      status: leaveRequests.status,
    })
    .from(leaveRequests)
    .innerJoin(users, eq(users.id, leaveRequests.userId))
    .where(
      and(
        or(
          eq(leaveRequests.status, "approved"),
          eq(leaveRequests.status, "hr_approved")
        ),
        sql`${leaveRequests.endDate}::date >= CURRENT_DATE - INTERVAL '3 months'`
      )
    )
    .orderBy(asc(leaveRequests.startDate));

  return rows;
}

  async getUpcomingApprovedLeaveRequests(): Promise<LeaveRequestWithUser[]> {
  const rows = await db
    .select({
      // leave request fields
      id: leaveRequests.id,
      userId: leaveRequests.userId,
      referenceNo: leaveRequests.referenceNo,
      leaveType: leaveRequests.leaveType,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      totalDays: leaveRequests.totalDays,
      reason: leaveRequests.reason,
      medicalFeeAmount: leaveRequests.medicalFeeAmount,
      attachmentUrl: leaveRequests.attachmentUrl,
      coveringPerson: leaveRequests.coveringPerson,
      status: leaveRequests.status,
      hrComment: leaveRequests.hrComment,
      directorComment: leaveRequests.directorComment,
      approvedByHr: leaveRequests.approvedByHr,
      approvedByDirector: leaveRequests.approvedByDirector,
      createdAt: leaveRequests.createdAt,
      updatedAt: leaveRequests.updatedAt,

      // user fields
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      profileImageUrl: users.profileImageUrl,
      branch: users.branch,
    })
    .from(leaveRequests)
    .innerJoin(users, eq(users.id, leaveRequests.userId))
    .where(
      and(
        eq(leaveRequests.status, "approved"),
        sql`${leaveRequests.endDate}::date >= CURRENT_DATE`
      )
    )
    .orderBy(asc(leaveRequests.startDate));

  return rows as LeaveRequestWithUser[];
}

    async getRecentCalendarLeaveRequests(): Promise<LeaveRequestWithUser[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const rows = await db
      .select({
        // leave request fields
        id: leaveRequests.id,
        userId: leaveRequests.userId,
        referenceNo: leaveRequests.referenceNo,
        leaveType: leaveRequests.leaveType,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        totalDays: leaveRequests.totalDays,
        reason: leaveRequests.reason,
        medicalFeeAmount: leaveRequests.medicalFeeAmount,
        attachmentUrl: leaveRequests.attachmentUrl,
        coveringPerson: leaveRequests.coveringPerson,
        status: leaveRequests.status,
        hrComment: leaveRequests.hrComment,
        directorComment: leaveRequests.directorComment,
        approvedByHr: leaveRequests.approvedByHr,
        approvedByDirector: leaveRequests.approvedByDirector,
        createdAt: leaveRequests.createdAt,
        updatedAt: leaveRequests.updatedAt,

        // user fields
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
      })
      .from(leaveRequests)
      .innerJoin(users, eq(users.id, leaveRequests.userId))
      .where(
        and(
          eq(leaveRequests.status, "approved"),
          gte(leaveRequests.endDate, thirtyDaysAgo)
        )
      )
      .orderBy(desc(leaveRequests.startDate));

    return rows as LeaveRequestWithUser[];
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return await db
      .select()
      .from(leaveRequests)
      .where(or(
        eq(leaveRequests.status, "pending"),
        eq(leaveRequests.status, "Pending")
      ))
      .orderBy(leaveRequests.createdAt);
  }

  async getPendingLeaveRequestsWithUser(): Promise<LeaveRequestWithUser[]> {
  const rows = await db
    .select({
      // leave request fields
      id: leaveRequests.id,
      userId: leaveRequests.userId,
      referenceNo: leaveRequests.referenceNo,
      leaveType: leaveRequests.leaveType,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      totalDays: leaveRequests.totalDays,
      reason: leaveRequests.reason,
      medicalFeeAmount: leaveRequests.medicalFeeAmount,
      attachmentUrl: leaveRequests.attachmentUrl,
      coveringPerson: leaveRequests.coveringPerson,
      status: leaveRequests.status,
      hrComment: leaveRequests.hrComment,
      directorComment: leaveRequests.directorComment,
      approvedByHr: leaveRequests.approvedByHr,
      approvedByDirector: leaveRequests.approvedByDirector,
      createdAt: leaveRequests.createdAt,
      updatedAt: leaveRequests.updatedAt,

      // user fields
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      profileImageUrl: users.profileImageUrl,
      branch: users.branch,
    })
    .from(leaveRequests)
    .innerJoin(users, eq(users.id, leaveRequests.userId))
    .where(or(eq(leaveRequests.status, "pending"), eq(leaveRequests.status, "Pending")))
    .orderBy(leaveRequests.createdAt);

  return rows as LeaveRequestWithUser[];
}

    async getRecentLeaveFormsForHr(): Promise<RecentLeaveFormWithUser[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const rows = await db
      .select({
        // leave request fields
        id: leaveRequests.id,
        userId: leaveRequests.userId,
        referenceNo: leaveRequests.referenceNo,
        leaveType: leaveRequests.leaveType,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        totalDays: leaveRequests.totalDays,
        reason: leaveRequests.reason,
        medicalFeeAmount: leaveRequests.medicalFeeAmount,
        attachmentUrl: leaveRequests.attachmentUrl,
        coveringPerson: leaveRequests.coveringPerson,
        status: leaveRequests.status,
        hrComment: leaveRequests.hrComment,
        directorComment: leaveRequests.directorComment,
        approvedByHr: leaveRequests.approvedByHr,
        approvedByDirector: leaveRequests.approvedByDirector,
        createdAt: leaveRequests.createdAt,
        updatedAt: leaveRequests.updatedAt,

        // user fields
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        branch: users.branch,
      })
      .from(leaveRequests)
      .innerJoin(users, eq(users.id, leaveRequests.userId))
      .where(gte(leaveRequests.createdAt, thirtyDaysAgo))
      .orderBy(desc(leaveRequests.createdAt));

    return rows as RecentLeaveFormWithUser[];
  }

  async getEmployeeLeaveTrackerForHr(): Promise<
  EmployeeLeaveTrackerRecord[]
> {
  const rows = await db
    .select({
      id: leaveRequests.id,
      userId: leaveRequests.userId,
      referenceNo: leaveRequests.referenceNo,

      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      branch: users.branch,

      leaveType: leaveRequests.leaveType,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      totalDays: leaveRequests.totalDays,
      status: leaveRequests.status,
      createdAt: leaveRequests.createdAt,
    })
    .from(leaveRequests)
    .innerJoin(users, eq(users.id, leaveRequests.userId))
    .orderBy(desc(leaveRequests.createdAt));

  return rows;
}

  async getHRApprovedLeaveRequests(): Promise<LeaveRequest[]> {
    return await db
      .select()
      .from(leaveRequests)
      .where(or(
        eq(leaveRequests.status, "hr_approved"),
        eq(leaveRequests.status, "HR Approved")
      ))
      .orderBy(leaveRequests.createdAt);
  }

  async updateLeaveRequestStatus(
    id: string, 
    status: string, 
    comment?: string, 
    role?: string,
    approverId?: string
  ): Promise<LeaveRequest | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (role === "hr") {
      if (comment) updateData.hrComment = comment;
      updateData.approvedByHr = approverId;
    } else if (role === "director") {
      if (comment) updateData.directorComment = comment;
      updateData.approvedByDirector = approverId;
    }
    const [result] = await db
      .update(leaveRequests)
      .set(updateData)
      .where(eq(leaveRequests.id, id))
      .returning();
    return result;
  }

  async deductLeaveBalance(userId: string, leaveType: string, days: number, medicalFeeAmount?: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const updateData: any = { updatedAt: new Date() };

    if (
      leaveType === "annual" ||
      leaveType === "halfday_morning" ||
      leaveType === "halfday_afternoon"
     ) {
      const currentAnnual = parseFloat(String(user.annualLeaveBalance || "0"));
      updateData.annualLeaveBalance = Math.max(0, currentAnnual - days).toFixed(2);
      } else if (leaveType === "medical") {
      const currentSick = parseFloat(String(user.sickLeaveBalance ?? user.sickLeaveEntitlement ?? "0"));
      updateData.sickLeaveBalance = Math.max(0, currentSick - days).toFixed(2);
      if (medicalFeeAmount && medicalFeeAmount > 0) {
        const currentBalance = parseFloat(String(user.medicalFeeBalance ?? "0"));
        updateData.medicalFeeBalance = Math.max(0, currentBalance - medicalFeeAmount).toFixed(2);
      }
    } else if (leaveType === "hospitalization") {
      const currentHosp = parseFloat(String((user as any).hospitalizationLeaveBalance ?? "60"));
      updateData.hospitalizationLeaveBalance = Math.max(0, currentHosp - days).toFixed(2);
      if (medicalFeeAmount && medicalFeeAmount > 0) {
        const currentBalance = parseFloat(String(user.medicalFeeBalance ?? "0"));
        updateData.medicalFeeBalance = Math.max(0, currentBalance - medicalFeeAmount).toFixed(2);
      }
    } else if (leaveType === "emergency") {
      const currentAnnual = parseFloat(String(user.annualLeaveBalance || "0"));
      if (currentAnnual >= days) {
        // Enough annual leave — deduct from annual
        updateData.annualLeaveBalance = Math.max(0, currentAnnual - days).toFixed(2);
      } else if (currentAnnual > 0) {
        // Partial annual leave left — use it all, rest is unpaid (no balance to deduct)
        updateData.annualLeaveBalance = "0.00";
      }
      // If annual balance is 0, counts as unpaid — no deduction needed
    }

    if (Object.keys(updateData).length > 1) {
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    }
    return user;
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [result] = await db.insert(auditLogs).values(log).returning();
    return result;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(sql`${auditLogs.createdAt} DESC`)
      .limit(limit);
  }

  async getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(sql`${auditLogs.createdAt} DESC`);
  }

     async createNotification(
    notification: InsertNotification
  ): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values(notification)
      .returning();

    return created;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    return Number(result[0]?.count || 0);
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({
        isRead: true,
      })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({
        isRead: true,
      })
      .where(eq(notifications.userId, userId));
  }

    async createPayroll(payroll: InsertPayroll): Promise<Payroll> {
    const [created] = await db
      .insert(payrolls)
      .values(payroll)
      .returning();

    return created;
  }

  async updatePayroll(
  id: number,
  payroll: Partial<InsertPayroll>
): Promise<Payroll | undefined> {
  const [updated] = await db
    .update(payrolls)
    .set({
      ...payroll,
      updatedAt: new Date(),
    })
    .where(eq(payrolls.id, id))
    .returning();

  return updated;
}

  async getPayrolls(): Promise<PayrollWithUser[]> {
    const rows = await db
      .select({
        id: payrolls.id,
        userId: payrolls.userId,
        runId: payrolls.runId,
        month: payrolls.month,
        year: payrolls.year,

        basicSalary: payrolls.basicSalary,
        allowance: payrolls.allowance,
        incentive: payrolls.incentive,
        overtime: payrolls.overtime,
        wages: payrolls.wages,
        commissionOr: payrolls.commissionOr,
        bonus: payrolls.bonus,

        epf: payrolls.epf,
        socso: payrolls.socso,
        eis: payrolls.eis,
        pcb: payrolls.pcb,
        otherDeduction: payrolls.otherDeduction,
        unpaidLeaveDeduction: payrolls.unpaidLeaveDeduction,

        grossPay: payrolls.grossPay,
        netPay: payrolls.netPay,
        employerEpf: payrolls.employerEpf,
        employerSocso: payrolls.employerSocso,
        employerEis: payrolls.employerEis,
        statutoryVersion: payrolls.statutoryVersion,
        updatedAt: payrolls.updatedAt,
        remarks: payrolls.remarks,
        createdAt: payrolls.createdAt,

        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        department: users.department,
      })
      .from(payrolls)
      .innerJoin(users, eq(users.id, payrolls.userId))
      .orderBy(desc(payrolls.createdAt));

    return rows as PayrollWithUser[];
  }

  async getPayrollsByRun(
  runId: number
): Promise<PayrollWithUser[]> {
  const rows = await db
    .select({
      id: payrolls.id,
      userId: payrolls.userId,
      runId: payrolls.runId,

      month: payrolls.month,
      year: payrolls.year,

      basicSalary: payrolls.basicSalary,
      allowance: payrolls.allowance,
      incentive: payrolls.incentive,
      overtime: payrolls.overtime,
      wages: payrolls.wages,
      commissionOr: payrolls.commissionOr,
      bonus: payrolls.bonus,

      epf: payrolls.epf,
      socso: payrolls.socso,
      eis: payrolls.eis,
      pcb: payrolls.pcb,
      otherDeduction: payrolls.otherDeduction,
      unpaidLeaveDeduction: payrolls.unpaidLeaveDeduction,

      grossPay: payrolls.grossPay,
      netPay: payrolls.netPay,

      employerEpf: payrolls.employerEpf,
      employerSocso: payrolls.employerSocso,
      employerEis: payrolls.employerEis,

      statutoryVersion: payrolls.statutoryVersion,

      remarks: payrolls.remarks,
      createdAt: payrolls.createdAt,
      updatedAt: payrolls.updatedAt,

      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      department: users.department,
    })
    .from(payrolls)
    .innerJoin(users, eq(users.id, payrolls.userId))
    .where(eq(payrolls.runId, runId))
    .orderBy(users.firstName, users.lastName);

  return rows as PayrollWithUser[];
}

  async getPayroll(id: number): Promise<PayrollWithUser | undefined> {
    const [row] = await db
      .select({
        id: payrolls.id,
        userId: payrolls.userId,
        runId: payrolls.runId,
        month: payrolls.month,
        year: payrolls.year,

        basicSalary: payrolls.basicSalary,
        allowance: payrolls.allowance,
        incentive: payrolls.incentive,
        overtime: payrolls.overtime,
        wages: payrolls.wages,
        commissionOr: payrolls.commissionOr,
        bonus: payrolls.bonus,

        epf: payrolls.epf,
        socso: payrolls.socso,
        eis: payrolls.eis,
        pcb: payrolls.pcb,
        otherDeduction: payrolls.otherDeduction,
        unpaidLeaveDeduction: payrolls.unpaidLeaveDeduction,

        grossPay: payrolls.grossPay,
        netPay: payrolls.netPay,
        remarks: payrolls.remarks,
        createdAt: payrolls.createdAt,

        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        department: users.department,
      })
      .from(payrolls)
      .innerJoin(users, eq(users.id, payrolls.userId))
      .where(eq(payrolls.id, id));

    return row as PayrollWithUser | undefined;
  }

  async getPayrollsByUser(userId: string): Promise<Payroll[]> {
    return await db
      .select()
      .from(payrolls)
      .where(eq(payrolls.userId, userId))
      .orderBy(desc(payrolls.createdAt));
  }
 
  async deletePayroll(id: number): Promise<void> {
    await db.delete(payrolls).where(eq(payrolls.id, id));
  }

  async getPayrollProfiles(): Promise<PayrollProfileWithUser[]> {
  const rows = await db
    .select({
      id: employeePayrollProfiles.id,
      userId: employeePayrollProfiles.userId,

      basicSalary: employeePayrollProfiles.basicSalary,
      defaultAllowance: employeePayrollProfiles.defaultAllowance,

      dateOfBirth: employeePayrollProfiles.dateOfBirth,
      citizenshipStatus: employeePayrollProfiles.citizenshipStatus,
      epfMemberCategory: employeePayrollProfiles.epfMemberCategory,

      socsoContributionCategory:
        employeePayrollProfiles.socsoContributionCategory,

      eisContributionStatus:
        employeePayrollProfiles.eisContributionStatus,

      lastPcb: employeePayrollProfiles.lastPcb,

      createdAt: employeePayrollProfiles.createdAt,
      updatedAt: employeePayrollProfiles.updatedAt,

      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      department: users.department,
      branch: users.branch,
    })
    .from(employeePayrollProfiles)
    .innerJoin(
      users,
      eq(users.id, employeePayrollProfiles.userId)
    )
    .orderBy(asc(users.firstName));

  return rows as PayrollProfileWithUser[];
}

async getPayrollProfileByUser(
  userId: string
): Promise<EmployeePayrollProfile | undefined> {
  const [profile] = await db
    .select()
    .from(employeePayrollProfiles)
    .where(eq(employeePayrollProfiles.userId, userId));

  return profile;
}

async upsertPayrollProfile(
  userId: string,
  data: Partial<Omit<InsertEmployeePayrollProfile, "userId">>
): Promise<EmployeePayrollProfile> {
  const [profile] = await db
    .insert(employeePayrollProfiles)
    .values({
      userId,
      ...data,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: employeePayrollProfiles.userId,
      set: {
        ...data,
        updatedAt: new Date(),
      },
    })
    .returning();

  return profile;
}

  async getPayrollRuns(): Promise<PayrollRun[]> {
  return await db
    .select()
    .from(payrollRuns)
    .orderBy(
      desc(payrollRuns.year),
      desc(payrollRuns.month)
    );
}

async getPayrollRun(
  id: number
): Promise<PayrollRun | undefined> {
  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(eq(payrollRuns.id, id))
    .limit(1);

  return run;
}

async getPayrollRunByMonthYear(
  month: number,
  year: number
): Promise<PayrollRun | undefined> {
  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(
      and(
        eq(payrollRuns.month, month),
        eq(payrollRuns.year, year)
      )
    )
    .limit(1);

  return run;
}

async createPayrollRun(
  data: InsertPayrollRun
): Promise<PayrollRun> {
  const [run] = await db
    .insert(payrollRuns)
    .values(data)
    .returning();

  return run;
}

async updatePayrollRunStatus(
  id: number,
  status: string,
  userId?: string
): Promise<PayrollRun | undefined> {
  const now = new Date();

  const updateData: Partial<PayrollRun> = {
    status,
    updatedAt: now,
  };

  if (status === "review") {
    updateData.reviewedAt = now;

    if (userId) {
      updateData.reviewedBy = userId;
    }
  }

  if (status === "finalized") {
    updateData.finalizedAt = now;

    if (userId) {
      updateData.finalizedBy = userId;
    }
  }

  const [run] = await db
    .update(payrollRuns)
    .set(updateData)
    .where(eq(payrollRuns.id, id))
    .returning();

  return run;
}

  async createEmployeeInformationForm(payload: InsertEmployeeInformationFormPayload) {
    const {
      form,
      familyMembers = [],
      children = [],
      educationSchool = [],
      educationHigher = [],
      languages = [],
      softwareSkills = [],
      workExperiences = [],
    } = payload;

    const numberOfChildren = children.length;
    const hasChildren = numberOfChildren > 0;

    const [createdForm] = await db
      .insert(employeeInformationForms)
      .values({
        ...form,
        numberOfChildren,
        hasChildren,
        updatedAt: new Date(),
      })
      .returning();

    const employeeFormId = createdForm.id;

    if (familyMembers.length > 0) {
      await db.insert(employeeFamilyMembers).values(
        familyMembers.map((item) => ({
          ...item,
          employeeFormId,
        }))
      );
    }

    if (children.length > 0) {
      await db.insert(employeeChildren).values(
        children.map((item) => ({
          ...item,
          employeeFormId,
        }))
      );
    }

    if (educationSchool.length > 0) {
      await db.insert(employeeEducationSchool).values(
        educationSchool.map((item) => ({
          ...item,
          employeeFormId,
        }))
      );
    }

    if (educationHigher.length > 0) {
      await db.insert(employeeEducationHigher).values(
        educationHigher.map((item) => ({
          ...item,
          employeeFormId,
        }))
      );
    }

    if (languages.length > 0) {
      await db.insert(employeeLanguages).values(
        languages.map((item) => ({
          ...item,
          employeeFormId,
        }))
      );
    }

    if (softwareSkills.length > 0) {
      await db.insert(employeeSoftwareSkills).values(
        softwareSkills.map((item) => ({
          ...item,
          employeeFormId,
        }))
      );
    }

    if (workExperiences.length > 0) {
      await db.insert(employeeWorkExperiences).values(
        workExperiences.map((item) => ({
          ...item,
          employeeFormId,
        }))
      );
    }

    return createdForm;
  }

  async getEmployeeInformationFormById(id: number) {
    const [form] = await db
      .select()
      .from(employeeInformationForms)
      .where(eq(employeeInformationForms.id, id));

    if (!form) return null;

    const familyMembers = await db
      .select()
      .from(employeeFamilyMembers)
      .where(eq(employeeFamilyMembers.employeeFormId, id));

    const children = await db
      .select()
      .from(employeeChildren)
      .where(eq(employeeChildren.employeeFormId, id));

    const educationSchool = await db
      .select()
      .from(employeeEducationSchool)
      .where(eq(employeeEducationSchool.employeeFormId, id));

    const educationHigher = await db
      .select()
      .from(employeeEducationHigher)
      .where(eq(employeeEducationHigher.employeeFormId, id));

    const languages = await db
      .select()
      .from(employeeLanguages)
      .where(eq(employeeLanguages.employeeFormId, id));

    const softwareSkills = await db
      .select()
      .from(employeeSoftwareSkills)
      .where(eq(employeeSoftwareSkills.employeeFormId, id));

    const workExperiences = await db
      .select()
      .from(employeeWorkExperiences)
      .where(eq(employeeWorkExperiences.employeeFormId, id));

    return {
      form,
      familyMembers,
      children,
      educationSchool,
      educationHigher,
      languages,
      softwareSkills,
      workExperiences,
    };
  }

  async getLatestEmployeeInformationFormByEmail(email: string): Promise<EmployeeInformationForm | null> {
    const normalizedEmail = email.trim().toLowerCase();

    const [form] = await db
      .select()
      .from(employeeInformationForms)
      .where(sql`lower(${employeeInformationForms.email}) = ${normalizedEmail}`)
      .orderBy(sql`${employeeInformationForms.createdAt} desc`)
      .limit(1);

    return form ?? null;
  }

  async updateEmployeeInformationForm(id: number, payload: InsertEmployeeInformationFormPayload) {
    const {
      form,
      familyMembers = [],
      children = [],
      educationSchool = [],
      educationHigher = [],
      languages = [],
      softwareSkills = [],
      workExperiences = [],
    } = payload;

    const numberOfChildren = children.length;
    const hasChildren = numberOfChildren > 0;

    const [updatedForm] = await db
      .update(employeeInformationForms)
      .set({
        ...form,
        numberOfChildren,
        hasChildren,
        updatedAt: new Date(),
      })
      .where(eq(employeeInformationForms.id, id))
      .returning();

    if (!updatedForm) return null;

    await db.delete(employeeFamilyMembers).where(eq(employeeFamilyMembers.employeeFormId, id));
    await db.delete(employeeChildren).where(eq(employeeChildren.employeeFormId, id));
    await db.delete(employeeEducationSchool).where(eq(employeeEducationSchool.employeeFormId, id));
    await db.delete(employeeEducationHigher).where(eq(employeeEducationHigher.employeeFormId, id));
    await db.delete(employeeLanguages).where(eq(employeeLanguages.employeeFormId, id));
    await db.delete(employeeSoftwareSkills).where(eq(employeeSoftwareSkills.employeeFormId, id));
    await db.delete(employeeWorkExperiences).where(eq(employeeWorkExperiences.employeeFormId, id));

    if (familyMembers.length > 0) {
      await db.insert(employeeFamilyMembers).values(
        familyMembers.map((item) => ({
          ...item,
          employeeFormId: id,
        }))
      );
    }

    if (children.length > 0) {
      await db.insert(employeeChildren).values(
        children.map((item) => ({
          ...item,
          employeeFormId: id,
        }))
      );
    }

    if (educationSchool.length > 0) {
      await db.insert(employeeEducationSchool).values(
        educationSchool.map((item) => ({
          ...item,
          employeeFormId: id,
        }))
      );
    }

    if (educationHigher.length > 0) {
      await db.insert(employeeEducationHigher).values(
        educationHigher.map((item) => ({
          ...item,
          employeeFormId: id,
        }))
      );
    }

    if (languages.length > 0) {
      await db.insert(employeeLanguages).values(
        languages.map((item) => ({
          ...item,
          employeeFormId: id,
        }))
      );
    }

    if (softwareSkills.length > 0) {
      await db.insert(employeeSoftwareSkills).values(
        softwareSkills.map((item) => ({
          ...item,
          employeeFormId: id,
        }))
      );
    }

    if (workExperiences.length > 0) {
      await db.insert(employeeWorkExperiences).values(
        workExperiences.map((item) => ({
          ...item,
          employeeFormId: id,
        }))
      );
    }

    return updatedForm;
  }

  async getShiftSchedules(
    weekStartDate: string
  ): Promise<ShiftSchedule[]> {
    return await db
      .select()
      .from(shiftSchedules)
      .where(eq(shiftSchedules.weekStartDate, weekStartDate))
      .orderBy(asc(shiftSchedules.scheduleDate));
  }

  async upsertShiftSchedules(
    schedules: InsertShiftSchedule[]
  ): Promise<ShiftSchedule[]> {
    if (schedules.length === 0) return [];

    const savedSchedules: ShiftSchedule[] = [];

    for (const schedule of schedules) {
      const [savedSchedule] = await db
        .insert(shiftSchedules)
        .values({
          ...schedule,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: shiftSchedules.scheduleDate,
          set: {
            weekStartDate: schedule.weekStartDate,
            dayName: schedule.dayName,
            morningStaff: schedule.morningStaff ?? "",
            afternoonStaff: schedule.afternoonStaff ?? "",
            nightStaff: schedule.nightStaff ?? "",
            extraDuty: schedule.extraDuty ?? "-",
            secondaryDuty: schedule.secondaryDuty ?? "-",
            offLeave: schedule.offLeave ?? "-",
            notes: schedule.notes ?? "-",
            updatedAt: new Date(),
          },
        })
        .returning();

      savedSchedules.push(savedSchedule);
    }

    return savedSchedules.sort((a, b) =>
      String(a.scheduleDate).localeCompare(String(b.scheduleDate))
    );
  }

  async updateUserBranch(id: string, branch: string | null): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ branch, updatedAt: new Date() } as any)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertSpecialLeaveMonthlySummary(
    userId: string,
    leaveType: string,
    date: Date,
    days: number
  ): Promise<void> {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    await db
      .insert(specialLeaveMonthlySummaries)
      .values({
        userId,
        year,
        month,
        unpaidDays: leaveType === "unpaid" ? String(days) : "0",
        emergencyDays: leaveType === "emergency" ? String(days) : "0",
        timeSlipDays: leaveType === "time_slip" ? String(days) : "0",
      })
      .onConflictDoUpdate({
        target: [
          specialLeaveMonthlySummaries.userId,
          specialLeaveMonthlySummaries.year,
          specialLeaveMonthlySummaries.month,
        ],
        set: {
          unpaidDays: leaveType === "unpaid"
            ? sql`${specialLeaveMonthlySummaries.unpaidDays} + ${String(days)}`
            : specialLeaveMonthlySummaries.unpaidDays,
          emergencyDays: leaveType === "emergency"
            ? sql`${specialLeaveMonthlySummaries.emergencyDays} + ${String(days)}`
            : specialLeaveMonthlySummaries.emergencyDays,
          timeSlipDays: leaveType === "time_slip"
            ? sql`${specialLeaveMonthlySummaries.timeSlipDays} + ${String(days)}`
            : specialLeaveMonthlySummaries.timeSlipDays,
          updatedAt: new Date(),
        },
      });
  }
}

export const storage = new DatabaseStorage();
