import {
  calculateEis,
  calculateEpf,
  calculateEpfPartA,
  calculateEpfPartC,
  calculateEpfPartE,
  calculateEpfPartF,
  calculateLindung24,
  calculateSocso,
  calculateStatutory,
  calculateStatutoryWages,
  getAgeAtPayrollPeriodEnd,
} from "./payrollStatutory";

console.log("=== AGE TEST ===");

console.log(
  "Age at Aug 2026:",
  getAgeAtPayrollPeriodEnd(
    "1995-01-01",
    8,
    2026
  )
);

console.log("\n=== EPF PART A ===");

console.log("RM 3250:", calculateEpfPartA(3250));
console.log("RM 3500:", calculateEpfPartA(3500));
console.log("RM 5000:", calculateEpfPartA(5000));
console.log("RM 5100:", calculateEpfPartA(5100));

console.log("\n=== EPF PART C ===");

console.log("RM 3250:", calculateEpfPartC(3250));

console.log("\n=== EPF PART E ===");

console.log("RM 3250:", calculateEpfPartE(3250));

console.log("\n=== EPF PART F ===");

console.log(
  "RM 1751:",
  calculateEpfPartF(1751)
);

console.log(
  "RM 2000:",
  calculateEpfPartF(2000)
);

console.log("\n=== CATEGORY SELECTOR ===");

const commonProfile = {
  citizenshipStatus: "malaysian" as const,
  socsoContributionCategory: "auto" as const,
  eisContributionStatus: "auto" as const,
  lindung24Status: "auto" as const,
};

console.log(
  "Malaysian under 60:",
  calculateEpf(
    3250,
    {
      ...commonProfile,
      dateOfBirth: "1995-01-01",
      epfMemberCategory: "malaysian",
    },
    8,
    2026
  )
);

console.log(
  "Malaysian age 60+:",
  calculateEpf(
    3250,
    {
      ...commonProfile,
      dateOfBirth: "1960-01-01",
      epfMemberCategory: "malaysian",
    },
    8,
    2026
  )
);

console.log(
  "PR age 60+:",
  calculateEpf(
    3250,
    {
      ...commonProfile,
      citizenshipStatus: "permanent_resident",
      dateOfBirth: "1960-01-01",
      epfMemberCategory: "permanent_resident",
    },
    8,
    2026
  )
);

console.log("\n=== STATUTORY WAGE BASES ===");

console.log(
  calculateStatutoryWages({
    basicSalary: 3000,
    allowance: 300,
    incentive: 100,
    overtime: 200,
    wages: 0,
    commissionOr: 100,
    bonus: 500,
    unpaidLeaveDeduction: 0,
  })
);

console.log(
  "Non-Malaysian post-1998:",
  calculateEpf(
    1751,
    {
      citizenshipStatus:
        "non_malaysian",

      dateOfBirth: "1995-01-01",

      epfMemberCategory:
        "non_malaysian_post_1998",

      socsoContributionCategory:
        "auto",

      eisContributionStatus:
        "auto",

      lindung24Status:
        "auto",
    },
    8,
    2026
  )
);

 console.log(
  "\n=== SOCSO FIRST CATEGORY ==="
);

console.log(
  "RM 3250:",
  calculateSocso(
    3250,
    {
      citizenshipStatus: "malaysian",
      dateOfBirth: "1995-01-01",
      epfMemberCategory: "malaysian",
      socsoContributionCategory: "auto",
      eisContributionStatus: "auto",
      lindung24Status: "auto",
    },
    8,
    2026
  )
);

console.log(
  "\n=== SOCSO SECOND CATEGORY ==="
);

console.log(
  "RM 3250 age 60+:",
  calculateSocso(
    3250,
    {
      citizenshipStatus: "malaysian",
      dateOfBirth: "1960-01-01",
      epfMemberCategory: "malaysian",
      socsoContributionCategory: "auto",
      eisContributionStatus: "auto",
      lindung24Status: "auto",
    },
    8,
    2026
  )
);

console.log(
  "\n=== SOCSO WAGE CEILING ==="
);

console.log(
  "RM 6500:",
  calculateSocso(
    6500,
    {
      citizenshipStatus: "malaysian",
      dateOfBirth: "1995-01-01",
      epfMemberCategory: "malaysian",
      socsoContributionCategory: "auto",
      eisContributionStatus: "auto",
      lindung24Status: "auto",
    },
    8,
    2026
  )
);

  console.log(
  "\n=== EIS STANDARD ==="
);

console.log(
  "RM 3250:",
  calculateEis(
    3250,
    {
      citizenshipStatus: "malaysian",
      dateOfBirth: "1995-01-01",
      epfMemberCategory: "malaysian",
      socsoContributionCategory: "auto",
      eisContributionStatus: "auto",
      lindung24Status: "auto",
    },
    8,
    2026
  )
);

console.log(
  "\n=== EIS WAGE CEILING ==="
);

console.log(
  "RM 6500:",
  calculateEis(
    6500,
    {
      citizenshipStatus: "malaysian",
      dateOfBirth: "1995-01-01",
      epfMemberCategory: "malaysian",
      socsoContributionCategory: "auto",
      eisContributionStatus: "auto",
      lindung24Status: "auto",
    },
    8,
    2026
  )
);

console.log(
  "\n=== EIS LOW WAGE ==="
);

console.log(
  "RM 30:",
  calculateEis(
    30,
    {
      citizenshipStatus: "malaysian",
      dateOfBirth: "1995-01-01",
      epfMemberCategory: "malaysian",
      socsoContributionCategory: "auto",
      eisContributionStatus: "auto",
      lindung24Status: "auto",
    },
    8,
    2026
  )
);

console.log(
  "\n=== EIS FOREIGN WORKER ==="
);

console.log(
  "Non-Malaysian RM 3250:",
  calculateEis(
    3250,
    {
      citizenshipStatus: "non_malaysian",
      dateOfBirth: "1995-01-01",
      epfMemberCategory:
        "non_malaysian_post_1998",
      socsoContributionCategory: "auto",
      eisContributionStatus: "auto",
      lindung24Status: "auto",
    },
    8,
    2026
  )
);

console.log(
  "\n=== EIS AGE 60+ ==="
);

console.log(
  "Age 60+:",
  calculateEis(
    3250,
    {
      citizenshipStatus: "malaysian",
      dateOfBirth: "1960-01-01",
      epfMemberCategory: "malaysian",
      socsoContributionCategory: "auto",
      eisContributionStatus: "auto",
      lindung24Status: "auto",
    },
    8,
    2026
  )
);

  console.log(
  "\n=== FULL STATUTORY CALCULATION ==="
);

console.log(
  calculateStatutory(
    {
      basicSalary: 3000,
      allowance: 300,
      incentive: 100,
      overtime: 200,
      wages: 0,
      commissionOr: 100,
      bonus: 500,
      unpaidLeaveDeduction: 0,
    },
    {
      citizenshipStatus: "malaysian",
      dateOfBirth: "1995-01-01",
      epfMemberCategory: "malaysian",
      socsoContributionCategory: "auto",
      eisContributionStatus: "auto",
      lindung24Status: "auto",
    },
    8,
    2026
  )
);

   console.log(
  "\n=== LINDUNG 24 JAM ==="
);

const localAutoProfile = {
  citizenshipStatus: "malaysian" as const,
  dateOfBirth: "1995-01-01",
  epfMemberCategory: "malaysian" as const,
  socsoContributionCategory: "auto" as const,
  eisContributionStatus: "auto" as const,
  lindung24Status: "auto" as const,
};

console.log(
  "Local auto RM3250:",
  calculateLindung24(
    3250,
    localAutoProfile
  )
);

console.log(
  "Local opted-in RM3250:",
  calculateLindung24(
    3250,
    {
      ...localAutoProfile,
      lindung24Status:
        "opted_in",
    }
  )
);

console.log(
  "Foreign auto RM3250:",
  calculateLindung24(
    3250,
    {
      ...localAutoProfile,
      citizenshipStatus:
        "non_malaysian",
      epfMemberCategory:
        "non_malaysian_post_1998",
    }
  )
);

console.log(
  "Foreign RM6500:",
  calculateLindung24(
    6500,
    {
      ...localAutoProfile,
      citizenshipStatus:
        "non_malaysian",
      epfMemberCategory:
        "non_malaysian_post_1998",
    }
  )
);
