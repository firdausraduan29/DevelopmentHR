export type PayrollEarnings = {
  basicSalary: number;
  allowance: number;
  incentive: number;
  overtime: number;
  wages: number;
  commissionOr: number;
  bonus: number;
  unpaidLeaveDeduction: number;
};

export type PayrollStatutoryProfile = {
  dateOfBirth?: string | null;

  citizenshipStatus:
    | "malaysian"
    | "permanent_resident"
    | "non_malaysian";

  epfMemberCategory:
    | "malaysian"
    | "permanent_resident"
    | "non_malaysian_pre_1998"
    | "non_malaysian_post_1998";

  socsoContributionCategory:
    | "auto"
    | "first"
    | "second"
    | "exempt";

  eisContributionStatus:
    | "auto"
    | "eligible"
    | "exempt";

  lindung24Status?:
    | "auto"
    | "opted_in"
    | "opted_out"
    | "exempt";
};

export type StatutoryCalculation = {
  epfWages: number;
  socsoWages: number;
  eisWages: number;

  employeeEpf: number;
  employerEpf: number;

  employeeSocso: number;
  employerSocso: number;

  employeeEis: number;
  employerEis: number;

  lindung24: number;

  statutoryVersion: string;
};

function n(value: unknown) {
  const result = Number(value || 0);

  if (!Number.isFinite(result)) {
    return 0;
  }

  return Math.max(0, result);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getAgeAtPayrollPeriodEnd(
  dateOfBirth: string,
  month: number,
  year: number
) {
  const [birthYear, birthMonth, birthDay] =
    dateOfBirth.split("-").map(Number);

  if (
    !birthYear ||
    !birthMonth ||
    !birthDay
  ) {
    throw new Error(
      "A valid date of birth is required for statutory calculation."
    );
  }

  const payrollEnd = new Date(
    Date.UTC(year, month, 0)
  );

  let age =
    payrollEnd.getUTCFullYear() -
    birthYear;

  const payrollMonth =
    payrollEnd.getUTCMonth() + 1;

  const payrollDay =
    payrollEnd.getUTCDate();

  if (
    payrollMonth < birthMonth ||
    (payrollMonth === birthMonth &&
      payrollDay < birthDay)
  ) {
    age--;
  }

  return age;
}

export function calculateStatutoryWages(
  earnings: PayrollEarnings
) {
  const basicSalary = n(earnings.basicSalary);
  const allowance = n(earnings.allowance);
  const incentive = n(earnings.incentive);
  const overtime = n(earnings.overtime);
  const wages = n(earnings.wages);
  const commission = n(earnings.commissionOr);
  const bonus = n(earnings.bonus);
  const unpaidLeave = n(
    earnings.unpaidLeaveDeduction
  );

  /*
   * EPF:
   * Overtime is excluded.
   * Bonus, allowance, commission and incentive
   * can form part of EPF wages.
   */
  const epfWages = Math.max(
    0,
    basicSalary +
      allowance +
      incentive +
      wages +
      commission +
      bonus -
      unpaidLeave
  );

  /*
   * SOCSO:
   * Overtime and commission are generally wages.
   * Annual bonus is excluded.
   */
  const socsoWages = Math.max(
    0,
    basicSalary +
      allowance +
      incentive +
      overtime +
      wages +
      commission -
      unpaidLeave
  );

  /*
   * EIS uses its own statutory wage definition.
   * For our existing earning fields this currently
   * follows the same base as SOCSO.
   */
  const eisWages = Math.max(
    0,
    basicSalary +
      allowance +
      incentive +
      overtime +
      wages +
      commission -
      unpaidLeave
  );

  return {
    epfWages: roundMoney(epfWages),
    socsoWages: roundMoney(socsoWages),
    eisWages: roundMoney(eisWages),
  };
}

  function ceilRinggit(value: number) {
  return Math.ceil(value);
}

function epfPartABracketWages(wages: number) {
  if (wages <= 0) {
    return 0;
  }

  if (wages <= 10) {
    return 0;
  }

  if (wages <= 5000) {
    if (wages <= 20) {
      return 20;
    }

    return Math.ceil(wages / 20) * 20;
  }

  if (wages <= 20000) {
    return Math.ceil(wages / 100) * 100;
  }

  return wages;
}

function calculateEpfScheduledRate(
  wagesInput: number,
  employeeRate: number,
  employerRate: number
) {
  const wages = n(wagesInput);

  if (wages <= 10) {
    return {
      employee: 0,
      employer: 0,
    };
  }

  if (wages > 20000) {
    throw new Error(
      "EPF wages above RM20,000 require the high-wage calculation path."
    );
  }

  const bracketWages =
    epfPartABracketWages(wages);

  return {
    employee: ceilRinggit(
      bracketWages * employeeRate
    ),

    employer: ceilRinggit(
      bracketWages * employerRate
    ),
  };
}

export function calculateEpfPartA(
  wagesInput: number
) {
  const wages = n(wagesInput);

  if (wages <= 10) {
    return {
      employee: 0,
      employer: 0,
    };
  }

  /*
   * Above RM20,000 KWSP permits direct
   * percentage calculation.
   */
  if (wages > 20000) {
    return {
      employee: ceilRinggit(
        wages * 0.11
      ),

      employer: ceilRinggit(
        wages * 0.12
      ),
    };
  }

  const bracketWages =
    epfPartABracketWages(wages);

  /*
   * Part A:
   * <= RM5,000
   * Employee 11%
   * Employer 13%
   *
   * > RM5,000
   * Employee 11%
   * Employer 12%
   */
  const employee =
    ceilRinggit(bracketWages * 0.11);

  const employerRate =
    wages <= 5000 ? 0.13 : 0.12;

  const employer =
    ceilRinggit(
      bracketWages * employerRate
    );

  return {
    employee,
    employer,
  };
}

export function calculateEpfPartC(
  wagesInput: number
) {
  const wages = n(wagesInput);

  const employerRate =
    wages <= 5000
      ? 0.065
      : 0.06;

  return calculateEpfScheduledRate(
    wages,
    0.055,
    employerRate
  );
}

export function calculateEpfPartE(
  wagesInput: number
) {
  return calculateEpfScheduledRate(
    wagesInput,
    0,
    0.04
  );
}

export function calculateEpfPartF(
  wagesInput: number
) {
  const wages = n(wagesInput);

  if (wages <= 0) {
    return {
      employee: 0,
      employer: 0,
    };
  }

  return {
    employee: ceilRinggit(
      wages * 0.02
    ),

    employer: ceilRinggit(
      wages * 0.02
    ),
  };
}

export function calculateEpf(
  wagesInput: number,
  profile: PayrollStatutoryProfile,
  month: number,
  year: number
) {
  const wages = n(wagesInput);

  if (!profile.dateOfBirth) {
    throw new Error(
      "Date of birth is required to calculate EPF."
    );
  }

  const age =
    getAgeAtPayrollPeriodEnd(
      profile.dateOfBirth,
      month,
      year
    );

  if (age >= 75) {
    return {
      employee: 0,
      employer: 0,
      part: "EXEMPT_AGE_75",
    };
  }

  if (
  profile.epfMemberCategory ===
  "non_malaysian_post_1998"
) {
  return {
    ...calculateEpfPartF(wages),
    part: "F",
  };
}

  if (age < 60) {
    return {
      ...calculateEpfPartA(wages),
      part: "A",
    };
  }

  if (
    profile.epfMemberCategory ===
    "malaysian"
  ) {
    return {
      ...calculateEpfPartE(wages),
      part: "E",
    };
  }

  return {
    ...calculateEpfPartC(wages),
    part: "C",
  };
}

  type SocsoCategory =
  | "first"
  | "second"
  | "exempt";

function getPerkesoAssumedWage(
  wagesInput: number
) {
  const wages = Math.min(
    n(wagesInput),
    6000
  );

  if (wages <= 0) {
    return 0;
  }

  if (wages <= 30) {
    return 20;
  }

  if (wages <= 50) {
    return 40;
  }

  if (wages <= 70) {
    return 60;
  }

  if (wages <= 100) {
    return 85;
  }

  if (wages <= 140) {
    return 120;
  }

  if (wages <= 200) {
    return 170;
  }

  if (wages <= 300) {
    return 250;
  }

  return Math.min(
    5950,
    250 +
      Math.ceil(
        (wages - 300) / 100
      ) *
        100
  );
}

function calculateSocsoSchedule(
  wagesInput: number,
  category: SocsoCategory
) {
  const wages = n(wagesInput);

  if (
    wages <= 0 ||
    category === "exempt"
  ) {
    return {
      employee: 0,
      employer: 0,
    };
  }

  if (wages <= 30) {
    return category === "first"
      ? {
          employee: 0.1,
          employer: 0.4,
        }
      : {
          employee: 0,
          employer: 0.3,
        };
  }

  if (wages <= 50) {
    return category === "first"
      ? {
          employee: 0.2,
          employer: 0.7,
        }
      : {
          employee: 0,
          employer: 0.5,
        };
  }

  if (wages <= 70) {
    return category === "first"
      ? {
          employee: 0.3,
          employer: 1.1,
        }
      : {
          employee: 0,
          employer: 0.8,
        };
  }

  if (wages <= 100) {
    return category === "first"
      ? {
          employee: 0.4,
          employer: 1.5,
        }
      : {
          employee: 0,
          employer: 1.1,
        };
  }

  if (wages <= 140) {
    return category === "first"
      ? {
          employee: 0.6,
          employer: 2.1,
        }
      : {
          employee: 0,
          employer: 1.5,
        };
  }

  if (wages <= 200) {
    return category === "first"
      ? {
          employee: 0.85,
          employer: 2.95,
        }
      : {
          employee: 0,
          employer: 2.1,
        };
  }

  const assumedWage =
    getPerkesoAssumedWage(wages);

  const employmentInjury =
    Math.round(
      assumedWage * 0.0125 * 10
    ) / 10;

  const invalidity =
    roundMoney(
      assumedWage * 0.005
    );

  if (category === "second") {
    return {
      employee: 0,
      employer: roundMoney(
        employmentInjury
      ),
    };
  }

  return {
    employee: invalidity,

    employer: roundMoney(
      employmentInjury +
        invalidity
    ),
  };
}

function resolveSocsoCategory(
  profile: PayrollStatutoryProfile,
  month: number,
  year: number
): SocsoCategory {
  if (
    profile.socsoContributionCategory ===
    "exempt"
  ) {
    return "exempt";
  }

  if (
    profile.socsoContributionCategory ===
    "first"
  ) {
    return "first";
  }

  if (
    profile.socsoContributionCategory ===
    "second"
  ) {
    return "second";
  }

  if (!profile.dateOfBirth) {
    throw new Error(
      "Date of birth is required to determine SOCSO contribution category."
    );
  }

  const age =
    getAgeAtPayrollPeriodEnd(
      profile.dateOfBirth,
      month,
      year
    );

  return age >= 60
    ? "second"
    : "first";
}

export function calculateSocso(
  wagesInput: number,
  profile: PayrollStatutoryProfile,
  month: number,
  year: number
) {
  const wages = n(wagesInput);

  const category =
    resolveSocsoCategory(
      profile,
      month,
      year
    );

  const contribution =
    calculateSocsoSchedule(
      wages,
      category
    );

  return {
    ...contribution,
    category,
  };
}

  type ResolvedEisStatus =
  | "eligible"
  | "exempt";

function resolveEisStatus(
  profile: PayrollStatutoryProfile,
  month: number,
  year: number
): ResolvedEisStatus {
  if (
    profile.eisContributionStatus ===
    "exempt"
  ) {
    return "exempt";
  }

  if (
    profile.eisContributionStatus ===
    "eligible"
  ) {
    return "eligible";
  }

  if (
    profile.citizenshipStatus ===
    "non_malaysian"
  ) {
    return "exempt";
  }

  if (!profile.dateOfBirth) {
    throw new Error(
      "Date of birth is required to determine EIS eligibility."
    );
  }

  const age =
    getAgeAtPayrollPeriodEnd(
      profile.dateOfBirth,
      month,
      year
    );

  if (age < 18 || age >= 60) {
    return "exempt";
  }

  /*
   * Employees aged 57-59 may be exempt
   * if they had never contributed before age 57.
   * The system cannot infer contribution history,
   * therefore HR must choose eligible/exempt.
   */
  if (age >= 57) {
    throw new Error(
      "EIS status must be manually set to eligible or exempt for employees aged 57 to 59."
    );
  }

  return "eligible";
}

  function roundUpToFiveSen(
  value: number
) {
  return (
    Math.ceil(
      (value - Number.EPSILON) * 20
    ) / 20
  );
}

function calculateEisSchedule(
  wagesInput: number
) {
  const wages = n(wagesInput);

  if (wages <= 0) {
    return {
      employee: 0,
      employer: 0,
    };
  }

  const assumedWage =
    getPerkesoAssumedWage(wages);

  const contribution =
    roundUpToFiveSen(
      assumedWage * 0.002
    );

  return {
    employee:
      roundMoney(contribution),

    employer:
      roundMoney(contribution),
  };
}

  export function calculateEis(
  wagesInput: number,
  profile: PayrollStatutoryProfile,
  month: number,
  year: number
) {
  const status =
    resolveEisStatus(
      profile,
      month,
      year
    );

  if (status === "exempt") {
    return {
      employee: 0,
      employer: 0,
      status,
    };
  }

  const contribution =
    calculateEisSchedule(
      wagesInput
    );

  return {
    ...contribution,
    status,
  };
}

  const lindung24Contributions = [
  0.20,
  0.30,
  0.50,
  0.65,
  0.90,
  1.25,
  1.85,
  2.65,
  3.35,
  4.15,
  4.85,
  5.65,
  6.35,
  7.15,
  7.85,
  8.65,
  9.35,
  10.15,
  10.85,
  11.65,
  12.35,
  13.15,
  13.85,
  14.65,
  15.35,
  16.15,
  16.85,
  17.65,
  18.35,
  19.15,
  19.85,
  20.65,
  21.35,
  22.15,
  22.85,
  23.65,
  24.35,
  25.15,
  25.85,
  26.65,
  27.35,
  28.15,
  28.85,
  29.65,
  30.35,
  31.15,
  31.85,
  32.65,
  33.35,
  34.15,
  34.85,
  35.65,
  36.35,
  37.15,
  37.85,
  38.65,
  39.35,
  40.15,
  40.85,
  41.65,
  42.35,
  43.15,
  43.85,
  44.65,
  44.65,
] as const;

  function getPerkesoContributionBand(
  wagesInput: number
) {
  const wages = Math.min(
    n(wagesInput),
    6000
  );

  if (wages <= 0) {
    return -1;
  }

  if (wages <= 30) return 0;
  if (wages <= 50) return 1;
  if (wages <= 70) return 2;
  if (wages <= 100) return 3;
  if (wages <= 140) return 4;
  if (wages <= 200) return 5;
  if (wages <= 300) return 6;

  return Math.min(
    63,
    7 +
      Math.ceil(
        (wages - 300) / 100
      ) -
      1
  );
}

  export function calculateLindung24(
  wagesInput: number,
  profile: PayrollStatutoryProfile
) {
  const wages = n(wagesInput);

  if (wages <= 0) {
    return 0;
  }

  if (
    profile.lindung24Status ===
    "exempt"
  ) {
    return 0;
  }

  /*
   * Foreign workers:
   * LINDUNG 24 Jam is mandatory.
   */
  if (
    profile.citizenshipStatus ===
    "non_malaysian"
  ) {
    const band =
      getPerkesoContributionBand(
        wages
      );

    if (band < 0) {
      return 0;
    }

    return lindung24Contributions[
      band
    ];
  }

  /*
   * Local employees:
   * participation is voluntary.
   */
  if (
    profile.lindung24Status !==
    "opted_in"
  ) {
    return 0;
  }

  const band =
    getPerkesoContributionBand(
      wages
    );

  if (band < 0) {
    return 0;
  }

  return lindung24Contributions[
    band
  ];
}

  export function calculateStatutory(
  earnings: PayrollEarnings,
  profile: PayrollStatutoryProfile,
  month: number,
  year: number
): StatutoryCalculation {
  const wageBases =
    calculateStatutoryWages(earnings);

  const epf =
    calculateEpf(
      wageBases.epfWages,
      profile,
      month,
      year
    );

  const socso =
    calculateSocso(
      wageBases.socsoWages,
      profile,
      month,
      year
    );

  const eis =
    calculateEis(
      wageBases.eisWages,
      profile,
      month,
      year
    );

  const lindung24 =
  calculateLindung24(
    wageBases.socsoWages,
    profile
  );

  return {
    epfWages: wageBases.epfWages,
    socsoWages: wageBases.socsoWages,
    eisWages: wageBases.eisWages,

    employeeEpf: epf.employee,
    employerEpf: epf.employer,

    employeeSocso: socso.employee,
    employerSocso: socso.employer,

    employeeEis: eis.employee,
    employerEis: eis.employer,

    // LINDUNG 24 Jam will be implemented
    // separately after the core payroll
    // statutory engine is stable.
    lindung24,

    statutoryVersion:
      "MY-PAYROLL-STATUTORY-2026-08-V1",
  };
}
