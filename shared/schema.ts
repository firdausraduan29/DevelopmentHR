import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, index, uniqueIndex, jsonb, integer, numeric, date, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (Used by connect-pg-simple)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const userRoles = ["employee", "hr", "director"] as const;
export type UserRole = typeof userRoles[number];

export const leaveTypes = [
  "annual", "unpaid", "emergency", "medical", 
  "maternity", "paternity", "hospitalization", "time_slip", "halfday_morning", "halfday_afternoon",
] as const;
export type LeaveType = typeof leaveTypes[number];

export function calculateLeaveBalances(yearsOfService: number) {
  if (yearsOfService >= 5) return { annualLeave: 16, sickLeave: 22 };
  if (yearsOfService >= 2) return { annualLeave: 12, sickLeave: 18 };
  return { annualLeave: 8, sickLeave: 14 };
}

export const MATERNITY_LEAVE_DAYS = 98;
export const PATERNITY_LEAVE_DAYS = 7;
export const MEDICAL_FEE_LIMIT = 700;

// User table - Optimized for Google IDs
export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Removed random UUID default to allow Google ID
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  department: varchar("department"),
  role: varchar("role").default("employee").notNull(),
  hasSelectedRole: integer("has_selected_role").default(0).notNull(),
  employmentStatus: varchar("employment_status").default("permanent").notNull(),
  startDate: date("start_date"),
  annualLeaveEntitlement: numeric("annual_leave_entitlement", { precision: 10, scale: 2 }).default("0").notNull(),
  sickLeaveEntitlement: numeric("sick_leave_entitlement", { precision: 10, scale: 2 }).default("0").notNull(),
  annualLeaveBalance: numeric("annual_leave_balance", { precision: 10, scale: 2 }).default("8").notNull(),
  sickLeaveBalance: numeric("sick_leave_balance", { precision: 10, scale: 2 }).default("14").notNull(),
  medicalFeeBalance: numeric("medical_fee_balance", { precision: 10, scale: 2 }).default("700").notNull(),
  hospitalizationLeaveEntitlement: numeric("hospitalization_leave_entitlement", { precision: 10, scale: 2 }).default("60").notNull(),
  hospitalizationLeaveBalance: numeric("hospitalization_leave_balance", { precision: 10, scale: 2 }).default("60").notNull(),
  workSchedule: varchar("work_schedule").default("standard").notNull(),
  branch: varchar("branch"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leave requests
export const leaveRequests = pgTable("leave_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  referenceNo: varchar("reference_no"),
  leaveType: varchar("leave_type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  timeOut: varchar("time_out"),
  timeBack: varchar("time_back"),
  totalDays: numeric("total_days", { precision: 5, scale: 2 }).notNull(),
  leaveEntitlementAtApplication: numeric("leave_entitlement_at_application", { precision: 10, scale: 2 }),
  leaveBalanceBeforeApplication: numeric("leave_balance_before_application", { precision: 10, scale: 2 }),
  leaveBalanceAfterApplication: numeric("leave_balance_after_application", { precision: 10, scale: 2 }),
  leaveTakenBeforeApplication: numeric("leave_taken_before_application", { precision: 10, scale: 2 }),
  reason: text("reason").notNull(),
  medicalFeeAmount: numeric("medical_fee_amount", { precision: 10, scale: 2 }),
  attachmentUrl: text("attachment_url"),
  coveringPerson: text("covering_person"),
  status: varchar("status").notNull().default("pending"),
  hrComment: text("hr_comment"),
  directorComment: text("director_comment"),
  approvedByHr: varchar("approved_by_hr"),
  approvedByDirector: varchar("approved_by_director"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit log
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id), // Added foreign key
  action: varchar("action").notNull(),
  targetUserId: varchar("target_user_id"),
  leaveRequestId: varchar("leave_request_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),

  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),

  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),

  type: varchar("type", { length: 50 }).default("info").notNull(),

  link: text("link"),

  isRead: boolean("is_read").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const specialLeaveMonthlySummaries = pgTable(
  "special_leave_monthly_summaries",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id),

    year: integer("year").notNull(),
    month: integer("month").notNull(),

    unpaidDays: numeric("unpaid_days", { precision: 8, scale: 2 }).default("0").notNull(),
    emergencyDays: numeric("emergency_days", { precision: 8, scale: 2 }).default("0").notNull(),
    timeSlipDays: numeric("time_slip_days", { precision: 8, scale: 2 }).default("0").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("special_leave_monthly_user_year_month_uidx").on(
      table.userId,
      table.year,
      table.month
    ),
  ]
);

export const shiftSchedules = pgTable("shift_schedules", {
  id: serial("id").primaryKey(),

  weekStartDate: date("week_start_date").notNull(),

  scheduleDate: date("schedule_date").notNull().unique(),

  dayName: varchar("day_name", { length: 20 }).notNull(),

  morningStaff: text("morning_staff").default("").notNull(),

  afternoonStaff: text("afternoon_staff").default("").notNull(),

  nightStaff: text("night_staff").default("").notNull(),

  extraDuty: text("extra_duty").default("-").notNull(),

  secondaryDuty: text("secondary_duty").default("-").notNull(),

  offLeave: text("off_leave").default("-").notNull(),

  notes: text("notes").default("-").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payrollRuns = pgTable(
  "payroll_runs",
  {
    id: serial("id").primaryKey(),

    month: integer("month").notNull(),
    year: integer("year").notNull(),

    status: varchar("status", {
      length: 30,
    })
      .default("draft")
      .notNull(),

    createdBy: varchar("created_by")
      .references(() => users.id),

    reviewedBy: varchar("reviewed_by")
      .references(() => users.id),

    finalizedBy: varchar("finalized_by")
      .references(() => users.id),

    reviewedAt: timestamp("reviewed_at"),
    finalizedAt: timestamp("finalized_at"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("payroll_runs_year_month_unique").on(
      table.year,
      table.month
    ),
  ]
);


export const payrolls = pgTable("payrolls", {
  id: serial("id").primaryKey(),

  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),

  runId: integer("run_id")
  .references(() => payrollRuns.id),

  month: integer("month").notNull(),
  year: integer("year").notNull(),

  basicSalary: numeric("basic_salary", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  allowance: numeric("allowance", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  incentive: numeric("incentive", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  overtime: numeric("overtime", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  wages: numeric("wages", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  commissionOr: numeric("commission_or", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  bonus: numeric("bonus", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  epf: numeric("epf", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  socso: numeric("socso", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  eis: numeric("eis", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  lindung24: numeric("lindung24", {
  precision: 12,
  scale: 2,
}).default("0").notNull(),

  epfWages: numeric("epf_wages", {
  precision: 12,
  scale: 2,
}).default("0").notNull(),

socsoWages: numeric("socso_wages", {
  precision: 12,
  scale: 2,
}).default("0").notNull(),

eisWages: numeric("eis_wages", {
  precision: 12,
  scale: 2,
}).default("0").notNull(),

  pcb: numeric("pcb", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  otherDeduction: numeric("other_deduction", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  unpaidLeaveDeduction: numeric("unpaid_leave_deduction", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  grossPay: numeric("gross_pay", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  netPay: numeric("net_pay", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  employerEpf: numeric("employer_epf", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  employerSocso: numeric("employer_socso", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  employerEis: numeric("employer_eis", {
    precision: 12,
    scale: 2,
  }).default("0").notNull(),

  statutoryVersion: varchar("statutory_version", {
    length: 100,
  }),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),

  remarks: text("remarks"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

export const employeePayrollProfiles = pgTable(
  "employee_payroll_profiles",
  {
    id: serial("id").primaryKey(),

    userId: varchar("user_id")
      .notNull()
      .references(() => users.id),

    basicSalary: numeric("basic_salary", {
      precision: 12,
      scale: 2,
    })
      .default("0")
      .notNull(),

    defaultAllowance: numeric("default_allowance", {
      precision: 12,
      scale: 2,
    })
      .default("0")
      .notNull(),

    dateOfBirth: date("date_of_birth"),

    citizenshipStatus: varchar("citizenship_status", {
      length: 50,
    })
      .default("malaysian")
      .notNull(),

    epfMemberCategory: varchar("epf_member_category", {
      length: 50,
    })
      .default("malaysian")
      .notNull(),

    socsoContributionCategory: varchar(
      "socso_contribution_category",
      {
        length: 30,
      }
    )
      .default("auto")
      .notNull(),

    eisContributionStatus: varchar(
      "eis_contribution_status",
      {
        length: 30,
      }
    )
      .default("auto")
      .notNull(),

    lindung24Status: varchar(
  "lindung24_status",
  { length: 30 }
)
  .default("auto")
  .notNull(),

    lastPcb: numeric("last_pcb", {
      precision: 12,
      scale: 2,
    })
      .default("0")
      .notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdUnique: uniqueIndex(
      "employee_payroll_profiles_user_id_unique"
    ).on(table.userId),
  })
);

export const payrollCitizenshipStatuses = [
  "malaysian",
  "permanent_resident",
  "non_malaysian",
] as const;

export const epfMemberCategories = [
  "malaysian",
  "permanent_resident",
  "non_malaysian_pre_1998",
  "non_malaysian_post_1998",
] as const;

export const socsoContributionCategories = [
  "auto",
  "first",
  "second",
  "exempt",
] as const;

export const eisContributionStatuses = [
  "auto",
  "eligible",
  "exempt",
] as const;

export const lindung24Statuses = [
  "auto",
  "opted_in",
  "opted_out",
  "exempt",
] as const;

export const insertEmployeePayrollProfileSchema =
  createInsertSchema(employeePayrollProfiles)
    .omit({
      id: true,
      createdAt: true,
      updatedAt: true,
    })
    .extend({
      citizenshipStatus: z
        .enum(payrollCitizenshipStatuses)
        .optional(),

      epfMemberCategory: z
        .enum(epfMemberCategories)
        .optional(),

      socsoContributionCategory: z
        .enum(socsoContributionCategories)
        .optional(),

      eisContributionStatus: z
        .enum(eisContributionStatuses)
        .optional(),

      lindung24Status:
        z.enum(lindung24Statuses).optional(),
    });

export type EmployeePayrollProfile =
  typeof employeePayrollProfiles.$inferSelect;

export type InsertEmployeePayrollProfile =
  z.infer<typeof insertEmployeePayrollProfileSchema>;

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  status: true,
  hrComment: true,
  directorComment: true,
  approvedByHr: true,
  approvedByDirector: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;

export type User = typeof users.$inferSelect;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

export type UpsertUser = typeof users.$inferInsert;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type Notification =
 typeof notifications.$inferSelect;

export type InsertNotification =
 typeof notifications.$inferInsert;

export type SpecialLeaveMonthlySummary = 
 typeof specialLeaveMonthlySummaries.$inferSelect;

export type InsertSpecialLeaveMonthlySummary = 
 typeof specialLeaveMonthlySummaries.$inferInsert;

export const insertShiftScheduleSchema = createInsertSchema(
  shiftSchedules
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ShiftSchedule =
 typeof shiftSchedules.$inferSelect;

export type InsertShiftSchedule =
 typeof shiftSchedules.$inferInsert;

export type EmployeeInformationForm = 
 typeof employeeInformationForms.$inferSelect;

export type InsertEmployeeInformationForm = 
 typeof employeeInformationForms.$inferInsert;

export type EmployeeFamilyMember = 
 typeof employeeFamilyMembers.$inferSelect;
 
export type InsertEmployeeFamilyMember = 
 typeof employeeFamilyMembers.$inferInsert;

export type EmployeeChild = 
 typeof employeeChildren.$inferSelect;

export type InsertEmployeeChild = 
 typeof employeeChildren.$inferInsert;

export type EmployeeEducationSchool = 
 typeof employeeEducationSchool.$inferSelect;

export type InsertEmployeeEducationSchool = 
 typeof employeeEducationSchool.$inferInsert;

export type EmployeeEducationHigher = 
 typeof employeeEducationHigher.$inferSelect;

export type InsertEmployeeEducationHigher = 
 typeof employeeEducationHigher.$inferInsert;

export type EmployeeLanguage = 
 typeof employeeLanguages.$inferSelect;

export type InsertEmployeeLanguage = 
 typeof employeeLanguages.$inferInsert;

export type EmployeeSoftwareSkill = 
 typeof employeeSoftwareSkills.$inferSelect;

export type InsertEmployeeSoftwareSkill = 
 typeof employeeSoftwareSkills.$inferInsert;

export type EmployeeWorkExperience = 
 typeof employeeWorkExperiences.$inferSelect;

export type InsertEmployeeWorkExperience = 
 typeof employeeWorkExperiences.$inferInsert;

export type Payroll =
 typeof payrolls.$inferSelect;

export type InsertPayroll =
 typeof payrolls.$inferInsert;

export type PayrollRun =
  typeof payrollRuns.$inferSelect;

export type InsertPayrollRun =
  typeof payrollRuns.$inferInsert;

export const employeeInformationForms = 
 pgTable("employee_information_forms", {
  id: serial("id").primaryKey(),

  // optional: if tied to an existing user account
  userId: integer("user_id"),

  // top profile / uploads
  employeePhotoUrl: text("employee_photo_url"),
  icFrontUrl: text("ic_front_url"),
  icBackUrl: text("ic_back_url"),
  signatureUrl: text("signature_url"),

  // contact block
  mobilePhoneNumber: varchar("mobile_phone_number", { length: 50 }),
  nricNo: varchar("nric_no", { length: 100 }),
  hpNo: varchar("hp_no", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),

  // employment details
  titlePosition: varchar("title_position", { length: 255 }),
  department: varchar("department", { length: 255 }),
  commencementDate: date("commencement_date"),
  bankName: varchar("bank_name", { length: 255 }),
  accountNo: varchar("account_no", { length: 100 }),
  staffNo: varchar("staff_no", { length: 100 }),
  hqBranch: varchar("hq_branch", { length: 255 }),
  epfNo: varchar("epf_no", { length: 100 }),
  socsoNo: varchar("socso_no", { length: 100 }),
  incomeTaxNo: varchar("income_tax_no", { length: 100 }),
  tinNo: varchar("tin_no", { length: 100 }),
  salary: numeric("salary", { precision: 12, scale: 2 }),
  allowance: numeric("allowance", { precision: 12, scale: 2 }),

  annualLeave: numeric("annual_leave", { precision: 6, scale: 2 }),
  medicalLeave: numeric("medical_leave", { precision: 6, scale: 2 }),
  medicalFee: numeric("medical_fee", { precision: 12, scale: 2 }),

  insuranceGtl: boolean("insurance_gtl").default(false),
  insuranceGhs: boolean("insurance_ghs").default(false),
  insuranceGrpa: boolean("insurance_grpa").default(false),

  // personal particular
  dateOfBirth: date("date_of_birth"),
  age: integer("age"),
  citizenship: varchar("citizenship", { length: 100 }),
  ethnicity: varchar("ethnicity", { length: 100 }),
  gender: varchar("gender", { length: 50 }),
  religion: varchar("religion", { length: 100 }),
  maritalStatus: varchar("marital_status", { length: 100 }),
  numberOfChildren: integer("number_of_children").default(0),
  modeOfTransportation: varchar("mode_of_transportation", { length: 100 }),
  placeOfBirth: varchar("place_of_birth", { length: 255 }),
  countryOfBirth: varchar("country_of_birth", { length: 100 }),
  weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
  heightCm: numeric("height_cm", { precision: 5, scale: 2 }),
  bloodType: varchar("blood_type", { length: 20 }),

  // children summary
  hasChildren: boolean("has_children").default(false),
  childrenEligibleForTax: integer("children_eligible_for_tax").default(0),

  // driving license
  drivingLicenseClass: varchar("driving_license_class", { length: 100 }),
  licenseNo: varchar("license_no", { length: 100 }),
  yearsOfDrivingExperience: integer("years_of_driving_experience"),

  // legacy fields (keep for now so no data loss)
  furtherNotes: text("further_notes"),
  personalReferenceEmergency: text("personal_reference_emergency"),
  
  // further notes
  sportingActivities: text("sporting_activities"),
  motorTradeExperience: text("motor_trade_experience"),
  otherInformation: text("other_information"),

  // personal references
  reference1Name: varchar("reference1_name", { length: 255 }),
  reference1Address: text("reference1_address"),
  reference1Relation: varchar("reference1_relation", { length: 100 }),
  reference1PeriodKnown: varchar("reference1_period_known", { length: 100 }),
  reference1ContactNo: varchar("reference1_contact_no", { length: 100 }),

  reference2Name: varchar("reference2_name", { length: 255 }),
  reference2Address: text("reference2_address"),
  reference2Relation: varchar("reference2_relation", { length: 100 }),
  reference2PeriodKnown: varchar("reference2_period_known", { length: 100 }),
  reference2ContactNo: varchar("reference2_contact_no", { length: 100 }),

  // declaration
  declarationAccepted: boolean("declaration_accepted").default(false),
  signatureDate: date("signature_date"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const employeeFamilyMembers = pgTable("employee_family_members", {
  id: serial("id").primaryKey(),
  employeeFormId: integer("employee_form_id").notNull(),

  name: varchar("name", { length: 255 }),
  age: integer("age"),
  occupation: varchar("occupation", { length: 255 }),
  relationship: varchar("relationship", { length: 100 }),
  phoneNumber: varchar("phone_number", { length: 50 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employeeChildren = pgTable("employee_children", {
  id: serial("id").primaryKey(),
  employeeFormId: integer("employee_form_id").notNull(),

  name: varchar("name", { length: 255 }),
  gender: varchar("gender", { length: 50 }),
  dateOfBirth: date("date_of_birth"),
  institutionName: varchar("institution_name", { length: 255 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employeeEducationSchool = pgTable("employee_education_school", {
  id: serial("id").primaryKey(),
  employeeFormId: integer("employee_form_id").notNull(),

  schoolName: varchar("school_name", { length: 255 }),
  periodOfStudy: varchar("period_of_study", { length: 100 }),
  qualification: varchar("qualification", { length: 255 }),
  fieldOfStudy: varchar("field_of_study", { length: 255 }),
  grade: varchar("grade", { length: 50 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employeeEducationHigher = pgTable("employee_education_higher", {
  id: serial("id").primaryKey(),
  employeeFormId: integer("employee_form_id").notNull(),

  institutionName: varchar("institution_name", { length: 255 }),
  periodOfStudy: varchar("period_of_study", { length: 100 }),
  qualification: varchar("qualification", { length: 255 }),
  fieldOfStudy: varchar("field_of_study", { length: 255 }),
  cgpa: varchar("cgpa", { length: 50 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employeeLanguages = pgTable("employee_languages", {
  id: serial("id").primaryKey(),
  employeeFormId: integer("employee_form_id").notNull(),

  languageName: varchar("language_name", { length: 100 }),
  speakingLevel: varchar("speaking_level", { length: 50 }),
  readingLevel: varchar("reading_level", { length: 50 }),
  writingLevel: varchar("writing_level", { length: 50 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employeeSoftwareSkills = pgTable("employee_software_skills", {
  id: serial("id").primaryKey(),
  employeeFormId: integer("employee_form_id").notNull(),

  softwareName: varchar("software_name", { length: 100 }),
  proficiencyLevel: varchar("proficiency_level", { length: 50 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employeeWorkExperiences = pgTable("employee_work_experiences", {
  id: serial("id").primaryKey(),
  employeeFormId: integer("employee_form_id").notNull(),

  fromDate: varchar("from_date", { length: 100 }),
  toDate: varchar("to_date", { length: 100 }),
  previousCompany: varchar("previous_company", { length: 255 }),
  previousPosition: varchar("previous_position", { length: 255 }),
  basicSalary: numeric("basic_salary", { precision: 12, scale: 2 }),
  reasonForLeaving: text("reason_for_leaving"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmployeeInformationFormSchema = createInsertSchema(employeeInformationForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeFamilyMemberSchema = createInsertSchema(employeeFamilyMembers).omit({
  id: true,
  employeeFormId: true,
  createdAt: true,
});

export const insertEmployeeChildSchema = createInsertSchema(employeeChildren).omit({
  id: true,
  employeeFormId: true,
  createdAt: true,
});

export const insertEmployeeEducationSchoolSchema = createInsertSchema(employeeEducationSchool).omit({
  id: true,
  employeeFormId: true,
  createdAt: true,
});

export const insertEmployeeEducationHigherSchema = createInsertSchema(employeeEducationHigher).omit({
  id: true,
  employeeFormId: true,
  createdAt: true,
});

export const insertEmployeeLanguageSchema = createInsertSchema(employeeLanguages).omit({
  id: true,
  employeeFormId: true,
  createdAt: true,
});

export const insertEmployeeSoftwareSkillSchema = createInsertSchema(employeeSoftwareSkills).omit({
  id: true,
  employeeFormId: true,
  createdAt: true,
});

export const insertEmployeeWorkExperienceSchema = createInsertSchema(employeeWorkExperiences).omit({
  id: true,
  employeeFormId: true,
  createdAt: true,
});

export const employeeInformationFormPayloadSchema = z.object({
  form: insertEmployeeInformationFormSchema,
  familyMembers: z.array(insertEmployeeFamilyMemberSchema).default([]),
  children: z.array(insertEmployeeChildSchema).default([]),
  educationSchool: z.array(insertEmployeeEducationSchoolSchema).default([]),
  educationHigher: z.array(insertEmployeeEducationHigherSchema).default([]),
  languages: z.array(insertEmployeeLanguageSchema).default([]),
  softwareSkills: z.array(insertEmployeeSoftwareSkillSchema).default([]),
  workExperiences: z.array(insertEmployeeWorkExperienceSchema).default([]),
});

export type InsertEmployeeInformationFormPayload = z.infer<typeof employeeInformationFormPayloadSchema>;
