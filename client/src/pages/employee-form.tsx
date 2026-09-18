import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type FamilyMemberRow = {
  name: string;
  age: string;
  occupation: string;
  relationship: string;
  phoneNumber: string;
};

type ChildRow = {
  name: string;
  gender: string;
  dateOfBirth: string;
  institutionName: string;
  eligibleForTax: string;
};

type SchoolRow = {
  schoolName: string;
  periodOfStudy: string;
  qualification: string;
  fieldOfStudy: string;
  grade: string;
};

type HigherEducationRow = {
  institutionName: string;
  periodOfStudy: string;
  qualification: string;
  fieldOfStudy: string;
  cgpa: string;
};

type LanguageRow = {
  languageName: string;
  speakingLevel: string;
  readingLevel: string;
  writingLevel: string;
};

type SoftwareRow = {
  softwareName: string;
  proficiencyLevel: string;
};

type WorkExperienceRow = {
  fromDate: string;
  toDate: string;
  previousCompany: string;
  previousPosition: string;
  basicSalary: string;
  reasonForLeaving: string;
};

const emptyFamilyRow = (): FamilyMemberRow => ({
  name: "",
  age: "",
  occupation: "",
  relationship: "",
  phoneNumber: "",
});

const emptyChildRow = (): ChildRow => ({
  name: "",
  gender: "",
  dateOfBirth: "",
  institutionName: "",
  eligibleForTax: "",
});

const emptySchoolRow = (): SchoolRow => ({
  schoolName: "",
  periodOfStudy: "",
  qualification: "",
  fieldOfStudy: "",
  grade: "",
});

const emptyHigherRow = (): HigherEducationRow => ({
  institutionName: "",
  periodOfStudy: "",
  qualification: "",
  fieldOfStudy: "",
  cgpa: "",
});

const emptyLanguageRow = (): LanguageRow => ({
  languageName: "",
  speakingLevel: "",
  readingLevel: "",
  writingLevel: "",
});

const emptySoftwareRow = (): SoftwareRow => ({
  softwareName: "",
  proficiencyLevel: "",
});

const emptyWorkRow = (): WorkExperienceRow => ({
  fromDate: "",
  toDate: "",
  previousCompany: "",
  previousPosition: "",
  basicSalary: "",
  reasonForLeaving: "",
});

export default function EmployeeFormPage() {
  const [form, setForm] = useState({
    // Page 1
    mobilePhoneNumber: "",
    nricNo: "",
    hpNo: "",
    email: "",
    address: "",

    titlePosition: "",
    department: "",
    commencementDate: "",
    bankName: "",
    accountNo: "",
    staffNo: "",
    hqBranch: "",
    epfNo: "",
    socsoNo: "",
    incomeTaxNo: "",
    tinNo: "",
    salary: "",
    allowance: "",
    annualLeave: "",
    medicalLeave: "",
    medicalFee: "",
    insuranceGtl: false,
    insuranceGhs: false,
    insuranceGrpa: false,

    // Page 2
    dateOfBirth: "",
    age: "",
    citizenship: "",
    ethnicity: "",
    gender: "",
    religion: "",
    maritalStatus: "",
    modeOfTransportation: "",
    placeOfBirth: "",
    countryOfBirth: "",
    weightKg: "",
    heightCm: "",
    bloodType: "",
    childrenEligibleForTax: "",
    hasChildren: false,

    // Page 3
    drivingLicenseClass: "",
    licenseNo: "",
    yearsOfDrivingExperience: "",

    // Page 4
    furtherNotes: "",
    personalReferenceEmergency: "",
    declarationAccepted: false,
    signatureDate: "",
  });

  const [familyMembers, setFamilyMembers] = useState<FamilyMemberRow[]>([
    emptyFamilyRow(),
  ]);
  const [children, setChildren] = useState<ChildRow[]>([emptyChildRow()]);
  const [educationSchool, setEducationSchool] = useState<SchoolRow[]>([
    emptySchoolRow(),
  ]);
  const [educationHigher, setEducationHigher] = useState<HigherEducationRow[]>(
    [emptyHigherRow()]
  );
  const [languages, setLanguages] = useState<LanguageRow[]>([
    {
      languageName: "Bahasa Melayu",
      speakingLevel: "",
      readingLevel: "",
      writingLevel: "",
    },
    {
      languageName: "English",
      speakingLevel: "",
      readingLevel: "",
      writingLevel: "",
    },
    {
      languageName: "Other Languages",
      speakingLevel: "",
      readingLevel: "",
      writingLevel: "",
    },
  ]);
  const [softwareSkills, setSoftwareSkills] = useState<SoftwareRow[]>([
    { softwareName: "Microsoft Word", proficiencyLevel: "" },
    { softwareName: "Microsoft Excel", proficiencyLevel: "" },
    { softwareName: "Microsoft Powerpoint", proficiencyLevel: "" },
    { softwareName: "Perakaunan (Acc Dept)", proficiencyLevel: "" },
  ]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperienceRow[]>([
    emptyWorkRow(),
  ]);

  const [employeePhoto, setEmployeePhoto] = useState<File | null>(null);
  const [icFront, setIcFront] = useState<File | null>(null);
  const [icBack, setIcBack] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  const sectionTitleClass =
    "mb-4 bg-black px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white";
  const inputClass =
    "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black";
  const labelClass = "mb-1 block text-sm font-medium";
  const smallMutedClass = "text-xs text-muted-foreground";

  const employeePhotoPreview = useMemo(
    () => (employeePhoto ? URL.createObjectURL(employeePhoto) : ""),
    [employeePhoto]
  );
  const icFrontPreview = useMemo(
    () => (icFront ? URL.createObjectURL(icFront) : ""),
    [icFront]
  );
  const icBackPreview = useMemo(
    () => (icBack ? URL.createObjectURL(icBack) : ""),
    [icBack]
  );
  const signaturePreview = useMemo(
    () => (signatureFile ? URL.createObjectURL(signatureFile) : ""),
    [signatureFile]
  );

  const toNumberOrUndefined = (value: string) => {
    if (!value || value.trim() === "") return undefined;
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  };

  const hasAnyValue = (obj: Record<string, unknown>) =>
    Object.values(obj).some((value) => String(value ?? "").trim() !== "");

  const cleanFamilyMembers = familyMembers
    .filter((row) => hasAnyValue(row))
    .map((row) => ({
      ...row,
      age: toNumberOrUndefined(row.age),
    }));

  const cleanChildren = form.hasChildren
    ? children.filter((row) => hasAnyValue(row))
    : [];

  const cleanEducationSchool = educationSchool.filter((row) => hasAnyValue(row));
  const cleanEducationHigher = educationHigher.filter((row) => hasAnyValue(row));
  const cleanLanguages = languages.filter((row) => hasAnyValue(row));
  const cleanSoftwareSkills = softwareSkills.filter((row) => hasAnyValue(row));
  const cleanWorkExperiences = workExperiences.filter((row) => hasAnyValue(row));

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        form: {
          mobilePhoneNumber: form.mobilePhoneNumber || undefined,
          nricNo: form.nricNo || undefined,
          hpNo: form.hpNo || undefined,
          email: form.email || undefined,
          address: form.address || undefined,

          titlePosition: form.titlePosition || undefined,
          department: form.department || undefined,
          commencementDate: form.commencementDate || undefined,
          bankName: form.bankName || undefined,
          accountNo: form.accountNo || undefined,
          staffNo: form.staffNo || undefined,
          hqBranch: form.hqBranch || undefined,
          epfNo: form.epfNo || undefined,
          socsoNo: form.socsoNo || undefined,
          incomeTaxNo: form.incomeTaxNo || undefined,
          tinNo: form.tinNo || undefined,
          salary: form.salary || undefined,
          allowance: form.allowance || undefined,
          annualLeave: form.annualLeave || undefined,
          medicalLeave: form.medicalLeave || undefined,
          medicalFee: form.medicalFee || undefined,
          insuranceGtl: form.insuranceGtl,
          insuranceGhs: form.insuranceGhs,
          insuranceGrpa: form.insuranceGrpa,

          dateOfBirth: form.dateOfBirth || undefined,
          age: toNumberOrUndefined(form.age),
          citizenship: form.citizenship || undefined,
          ethnicity: form.ethnicity || undefined,
          gender: form.gender || undefined,
          religion: form.religion || undefined,
          maritalStatus: form.maritalStatus || undefined,
          numberOfChildren: cleanChildren.length,
          modeOfTransportation: form.modeOfTransportation || undefined,
          placeOfBirth: form.placeOfBirth || undefined,
          countryOfBirth: form.countryOfBirth || undefined,
          weightKg: form.weightKg || undefined,
          heightCm: form.heightCm || undefined,
          bloodType: form.bloodType || undefined,
          hasChildren: form.hasChildren,
          childrenEligibleForTax: toNumberOrUndefined(form.childrenEligibleForTax),

          drivingLicenseClass: form.drivingLicenseClass || undefined,
          licenseNo: form.licenseNo || undefined,
          yearsOfDrivingExperience: toNumberOrUndefined(
            form.yearsOfDrivingExperience
          ),

          furtherNotes: form.furtherNotes || undefined,
          personalReferenceEmergency: form.personalReferenceEmergency || undefined,
          declarationAccepted: form.declarationAccepted,
          signatureDate: form.signatureDate || undefined,

          // Uploads can be wired to /api/upload later
          employeePhotoUrl: undefined,
          icFrontUrl: undefined,
          icBackUrl: undefined,
          signatureUrl: undefined,
        },
        familyMembers: cleanFamilyMembers,
        children: cleanChildren,
        educationSchool: cleanEducationSchool,
        educationHigher: cleanEducationHigher,
        languages: cleanLanguages,
        softwareSkills: cleanSoftwareSkills,
        workExperiences: cleanWorkExperiences,
      };

      return apiRequest("POST", "/api/employee-forms", payload);
    },
    onSuccess: () => {
      alert("Employee form saved successfully.");
    },
    onError: (error: any) => {
      alert(error?.message || "Failed to save employee form.");
    },
  });

  const updateFamilyRow = (
    index: number,
    field: keyof FamilyMemberRow,
    value: string
  ) => {
    setFamilyMembers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateChildRow = (index: number, field: keyof ChildRow, value: string) => {
    setChildren((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateSchoolRow = (
    index: number,
    field: keyof SchoolRow,
    value: string
  ) => {
    setEducationSchool((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateHigherRow = (
    index: number,
    field: keyof HigherEducationRow,
    value: string
  ) => {
    setEducationHigher((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateLanguageRow = (
    index: number,
    field: keyof LanguageRow,
    value: string
  ) => {
    setLanguages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateSoftwareRow = (
    index: number,
    field: keyof SoftwareRow,
    value: string
  ) => {
    setSoftwareSkills((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateWorkRow = (
    index: number,
    field: keyof WorkExperienceRow,
    value: string
  ) => {
    setWorkExperiences((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 grid gap-4 md:grid-cols-[220px_1fr] md:items-start">
          <div className="flex flex-col items-center justify-center rounded-lg border p-4">
            <div className="mb-3 flex h-40 w-40 items-center justify-center overflow-hidden rounded border bg-muted text-xs text-muted-foreground">
              {employeePhotoPreview ? (
                <img
                  src={employeePhotoPreview}
                  alt="Employee"
                  className="h-full w-full object-cover"
                />
              ) : (
                "Insert your image here"
              )}
            </div>
            <label className={labelClass}>Employee Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEmployeePhoto(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
            <p className={`mt-2 ${smallMutedClass}`}>
              Upload wiring can be connected next.
            </p>
          </div>

          <div>
            <div className="mb-4 text-center">
              <h1 className="text-2xl font-bold">
               EMPLOYEE DETAILS
              </h1>
              <h2 className="mt-3 text-lg font-bold underline">
                EMPLOYEE DETAILS
              </h2>
            </div>

            <div className="mb-3 bg-black px-4 py-2 text-center text-sm font-semibold text-white">
              HIGHLY CONFIDENTIAL EMPLOYEE PARTICULARS FORM
            </div>

            <div className="grid gap-3 md:grid-cols-[220px_1fr]">
              <label className={labelClass}>Mobile Phone Number</label>
              <input
                className={inputClass}
                value={form.mobilePhoneNumber}
                onChange={(e) =>
                  setForm({ ...form, mobilePhoneNumber: e.target.value })
                }
              />

              <label className={labelClass}>NRIC No</label>
              <input
                className={inputClass}
                value={form.nricNo}
                onChange={(e) => setForm({ ...form, nricNo: e.target.value })}
              />

              <label className={labelClass}>HP No</label>
              <input
                className={inputClass}
                value={form.hpNo}
                onChange={(e) => setForm({ ...form, hpNo: e.target.value })}
              />

              <label className={labelClass}>Email</label>
              <input
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <label className={labelClass}>Address</label>
              <textarea
                className={inputClass}
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className={sectionTitleClass}>1. Employment Details</div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className={labelClass}>1. Title/Position</label>
              <input
                className={inputClass}
                value={form.titlePosition}
                onChange={(e) =>
                  setForm({ ...form, titlePosition: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClass}>2. Department</label>
              <input
                className={inputClass}
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClass}>3. Commencement Date</label>
              <input
                type="date"
                className={inputClass}
                value={form.commencementDate}
                onChange={(e) =>
                  setForm({ ...form, commencementDate: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClass}>4. Bank</label>
              <input
                className={inputClass}
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>5. Account No</label>
              <input
                className={inputClass}
                value={form.accountNo}
                onChange={(e) =>
                  setForm({ ...form, accountNo: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClass}>6. Staff No</label>
              <input
                className={inputClass}
                value={form.staffNo}
                onChange={(e) => setForm({ ...form, staffNo: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>7. HQ Branch</label>
              <input
                className={inputClass}
                value={form.hqBranch}
                onChange={(e) => setForm({ ...form, hqBranch: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>8. EPF No</label>
              <input
                className={inputClass}
                value={form.epfNo}
                onChange={(e) => setForm({ ...form, epfNo: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>9. SOCSO No</label>
              <input
                className={inputClass}
                value={form.socsoNo}
                onChange={(e) => setForm({ ...form, socsoNo: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>10. Income Tax</label>
              <input
                className={inputClass}
                value={form.incomeTaxNo}
                onChange={(e) =>
                  setForm({ ...form, incomeTaxNo: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClass}>11. TIN No</label>
              <input
                className={inputClass}
                value={form.tinNo}
                onChange={(e) => setForm({ ...form, tinNo: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>12. Salary</label>
              <input
                className={inputClass}
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>13. Allowance</label>
              <input
                className={inputClass}
                value={form.allowance}
                onChange={(e) => setForm({ ...form, allowance: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>14. Leave - Annual</label>
              <input
                className={inputClass}
                value={form.annualLeave}
                onChange={(e) =>
                  setForm({ ...form, annualLeave: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Leave - Medical</label>
              <input
                className={inputClass}
                value={form.medicalLeave}
                onChange={(e) =>
                  setForm({ ...form, medicalLeave: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Leave - Medical Fee</label>
              <input
                className={inputClass}
                value={form.medicalFee}
                onChange={(e) =>
                  setForm({ ...form, medicalFee: e.target.value })
                }
              />
            </div>

            <div>
              <label className={labelClass}>15. Insurance</label>
              <div className="flex flex-wrap gap-4 rounded-md border px-3 py-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.insuranceGtl}
                    onChange={(e) =>
                      setForm({ ...form, insuranceGtl: e.target.checked })
                    }
                  />
                  GTL
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.insuranceGhs}
                    onChange={(e) =>
                      setForm({ ...form, insuranceGhs: e.target.checked })
                    }
                  />
                  GHS
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.insuranceGrpa}
                    onChange={(e) =>
                      setForm({ ...form, insuranceGrpa: e.target.checked })
                    }
                  />
                  GRPA
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded border bg-muted text-xs text-muted-foreground">
                {icFrontPreview ? (
                  <img
                    src={icFrontPreview}
                    alt="IC Front"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  "IC Front"
                )}
              </div>
              <label className={labelClass}>IC Front</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setIcFront(e.target.files?.[0] || null)}
                className="w-full text-sm"
              />
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded border bg-muted text-xs text-muted-foreground">
                {icBackPreview ? (
                  <img
                    src={icBackPreview}
                    alt="IC Back"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  "IC Back"
                )}
              </div>
              <label className={labelClass}>IC Back</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setIcBack(e.target.files?.[0] || null)}
                className="w-full text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className={sectionTitleClass}>B. Personal Particular</div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className={labelClass}>1. Date of Birth</label>
            <input
              type="date"
              className={inputClass}
              value={form.dateOfBirth}
              onChange={(e) =>
                setForm({ ...form, dateOfBirth: e.target.value })
              }
            />
          </div>

          <div>
            <label className={labelClass}>2. Age</label>
            <input
              className={inputClass}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>3. Citizenship</label>
            <input
              className={inputClass}
              value={form.citizenship}
              onChange={(e) =>
                setForm({ ...form, citizenship: e.target.value })
              }
            />
          </div>

          <div>
            <label className={labelClass}>4. Ethnicity</label>
            <input
              className={inputClass}
              value={form.ethnicity}
              onChange={(e) => setForm({ ...form, ethnicity: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>5. Gender</label>
            <input
              className={inputClass}
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>6. Religion</label>
            <input
              className={inputClass}
              value={form.religion}
              onChange={(e) => setForm({ ...form, religion: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>7. Marital Status</label>
            <input
              className={inputClass}
              value={form.maritalStatus}
              onChange={(e) =>
                setForm({ ...form, maritalStatus: e.target.value })
              }
            />
          </div>

          <div>
            <label className={labelClass}>8. Number of Children</label>
            <input
              className={inputClass}
              value={form.hasChildren ? cleanChildren.length : 0}
              readOnly
            />
          </div>

          <div>
            <label className={labelClass}>9. Mode of Transportation</label>
            <input
              className={inputClass}
              value={form.modeOfTransportation}
              onChange={(e) =>
                setForm({ ...form, modeOfTransportation: e.target.value })
              }
            />
          </div>

          <div>
            <label className={labelClass}>10. Place of Birth</label>
            <input
              className={inputClass}
              value={form.placeOfBirth}
              onChange={(e) =>
                setForm({ ...form, placeOfBirth: e.target.value })
              }
            />
          </div>

          <div>
            <label className={labelClass}>11. Country of Birth</label>
            <input
              className={inputClass}
              value={form.countryOfBirth}
              onChange={(e) =>
                setForm({ ...form, countryOfBirth: e.target.value })
              }
            />
          </div>

          <div>
            <label className={labelClass}>12. Weight (kg)</label>
            <input
              className={inputClass}
              value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>13. Height (cm)</label>
            <input
              className={inputClass}
              value={form.heightCm}
              onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>14. Blood Type</label>
            <input
              className={inputClass}
              value={form.bloodType}
              onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-8">
          <div className={sectionTitleClass}>C. Family Particular</div>

          <div className="space-y-4">
            {familyMembers.map((member, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-lg border p-4 md:grid-cols-5"
              >
                <input
                  className={inputClass}
                  placeholder="Name"
                  value={member.name}
                  onChange={(e) =>
                    updateFamilyRow(index, "name", e.target.value)
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Age"
                  value={member.age}
                  onChange={(e) => updateFamilyRow(index, "age", e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="Occupation"
                  value={member.occupation}
                  onChange={(e) =>
                    updateFamilyRow(index, "occupation", e.target.value)
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Relationship"
                  value={member.relationship}
                  onChange={(e) =>
                    updateFamilyRow(index, "relationship", e.target.value)
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Phone Number"
                  value={member.phoneNumber}
                  onChange={(e) =>
                    updateFamilyRow(index, "phoneNumber", e.target.value)
                  }
                />
              </div>
            ))}

            <button
              type="button"
              className="rounded-md border px-4 py-2 text-sm font-medium"
              onClick={() => setFamilyMembers((prev) => [...prev, emptyFamilyRow()])}
            >
              + Add Family Row
            </button>
          </div>
        </div>

        <div className="mt-8">
          <div className={sectionTitleClass}>D. Children Particular</div>

          <div className="mb-4 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.hasChildren}
                onChange={(e) =>
                  setForm({ ...form, hasChildren: e.target.checked })
                }
              />
              I) Number of Children / Has Children
            </label>

            <div className="flex items-center gap-2 text-sm">
              <span>II) No Children</span>
              <input
                type="checkbox"
                checked={!form.hasChildren}
                onChange={(e) =>
                  setForm({ ...form, hasChildren: !e.target.checked })
                }
              />
            </div>
          </div>

           {form.hasChildren && (
  <div className="space-y-4">
    <div className="hidden rounded-lg border bg-muted/30 p-3 text-sm font-medium md:grid md:grid-cols-5 md:gap-3">
      <div>Name</div>
      <div>Gender</div>
      <div>Date of Birth</div>
      <div>Institution Name</div>
      <div>Eligible for Tax</div>
    </div>

    {children.map((child, index) => (
      <div
        key={index}
        className="grid gap-3 rounded-lg border p-4 md:grid-cols-5"
      >
        <input
          className={inputClass}
          placeholder="Name"
          value={child.name}
          onChange={(e) =>
            updateChildRow(index, "name", e.target.value)
          }
        />
        <input
          className={inputClass}
          placeholder="Gender"
          value={child.gender}
          onChange={(e) =>
            updateChildRow(index, "gender", e.target.value)
          }
        />
        <input
          type="date"
          className={inputClass}
          value={child.dateOfBirth}
          onChange={(e) =>
            updateChildRow(index, "dateOfBirth", e.target.value)
          }
        />
        <input
          className={inputClass}
          placeholder="Institution Name"
          value={child.institutionName}
          onChange={(e) =>
            updateChildRow(index, "institutionName", e.target.value)
          }
        />
        <input
          className={inputClass}
          placeholder="Yes / No"
          value={child.eligibleForTax}
          onChange={(e) =>
            updateChildRow(index, "eligibleForTax", e.target.value)
          }
        />
      </div>
    ))}

    <button
      type="button"
      className="rounded-md border px-4 py-2 text-sm font-medium"
      onClick={() => setChildren((prev) => [...prev, emptyChildRow()])}
    >
      + Add Child Row
    </button>
  </div>
)}
      </div>
     </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className={sectionTitleClass}>E. Driving License</div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className={labelClass}>1. Driving License Class</label>
            <input
              className={inputClass}
              value={form.drivingLicenseClass}
              onChange={(e) =>
                setForm({ ...form, drivingLicenseClass: e.target.value })
              }
            />
          </div>

          <div>
            <label className={labelClass}>2. License No</label>
            <input
              className={inputClass}
              value={form.licenseNo}
              onChange={(e) =>
                setForm({ ...form, licenseNo: e.target.value })
              }
            />
          </div>

          <div>
            <label className={labelClass}>3. Years of Driving Experience</label>
            <input
              className={inputClass}
              value={form.yearsOfDrivingExperience}
              onChange={(e) =>
                setForm({
                  ...form,
                  yearsOfDrivingExperience: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="mt-8">
          <div className={sectionTitleClass}>F. Educational Background</div>

          <div className="mb-6">
            <h3 className="mb-3 font-semibold">a) School</h3>
            <div className="space-y-4">
              {educationSchool.map((row, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-lg border p-4 md:grid-cols-5"
                >
                  <input
                    className={inputClass}
                    placeholder="Name of School"
                    value={row.schoolName}
                    onChange={(e) =>
                      updateSchoolRow(index, "schoolName", e.target.value)
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Period of Study"
                    value={row.periodOfStudy}
                    onChange={(e) =>
                      updateSchoolRow(index, "periodOfStudy", e.target.value)
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Qualification"
                    value={row.qualification}
                    onChange={(e) =>
                      updateSchoolRow(index, "qualification", e.target.value)
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Field of Study"
                    value={row.fieldOfStudy}
                    onChange={(e) =>
                      updateSchoolRow(index, "fieldOfStudy", e.target.value)
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Grade"
                    value={row.grade}
                    onChange={(e) =>
                      updateSchoolRow(index, "grade", e.target.value)
                    }
                  />
                </div>
              ))}

              <button
                type="button"
                className="rounded-md border px-4 py-2 text-sm font-medium"
                onClick={() =>
                  setEducationSchool((prev) => [...prev, emptySchoolRow()])
                }
              >
                + Add School Row
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold">b) Higher Education</h3>
            <div className="space-y-4">
              {educationHigher.map((row, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-lg border p-4 md:grid-cols-5"
                >
                  <input
                    className={inputClass}
                    placeholder="IPTA/IPTS"
                    value={row.institutionName}
                    onChange={(e) =>
                      updateHigherRow(index, "institutionName", e.target.value)
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Period of Study"
                    value={row.periodOfStudy}
                    onChange={(e) =>
                      updateHigherRow(index, "periodOfStudy", e.target.value)
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Qualification"
                    value={row.qualification}
                    onChange={(e) =>
                      updateHigherRow(index, "qualification", e.target.value)
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Field of Study"
                    value={row.fieldOfStudy}
                    onChange={(e) =>
                      updateHigherRow(index, "fieldOfStudy", e.target.value)
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="CGPA"
                    value={row.cgpa}
                    onChange={(e) =>
                      updateHigherRow(index, "cgpa", e.target.value)
                    }
                  />
                </div>
              ))}

              <button
                type="button"
                className="rounded-md border px-4 py-2 text-sm font-medium"
                onClick={() =>
                  setEducationHigher((prev) => [...prev, emptyHigherRow()])
                }
              >
                + Add IPTA/IPTS Row
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className={sectionTitleClass}>G. Language & Computer Skills</div>

          <p className="mb-4 text-sm font-medium">
            NOTE: Good, Average, Weak, Not Applicable (N/A)
          </p>

          <div className="mb-6">
            <h3 className="mb-3 font-semibold">a) Language</h3>
            <div className="space-y-4">
              {languages.map((row, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-lg border p-4 md:grid-cols-4"
                >
                  <input
                    className={inputClass}
                    placeholder="Language"
                    value={row.languageName}
                    onChange={(e) =>
                      updateLanguageRow(index, "languageName", e.target.value)
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Speaking"
                    value={row.speakingLevel}
                    onChange={(e) =>
                      updateLanguageRow(index, "speakingLevel", e.target.value)
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Reading"
                    value={row.readingLevel}
                    onChange={(e) =>
                      updateLanguageRow(index, "readingLevel", e.target.value)
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Writing"
                    value={row.writingLevel}
                    onChange={(e) =>
                      updateLanguageRow(index, "writingLevel", e.target.value)
                    }
                  />
                </div>
              ))}

              <button
                type="button"
                className="rounded-md border px-4 py-2 text-sm font-medium"
                onClick={() => setLanguages((prev) => [...prev, emptyLanguageRow()])}
              >
                + Add Language Row
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold">b) Software</h3>
            <div className="space-y-4">
              {softwareSkills.map((row, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-lg border p-4 md:grid-cols-2"
                >
                  <input
                    className={inputClass}
                    placeholder="Software"
                    value={row.softwareName}
                    onChange={(e) =>
                      updateSoftwareRow(index, "softwareName", e.target.value)
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Proficiency Level"
                    value={row.proficiencyLevel}
                    onChange={(e) =>
                      updateSoftwareRow(
                        index,
                        "proficiencyLevel",
                        e.target.value
                      )
                    }
                  />
                </div>
              ))}

              <button
                type="button"
                className="rounded-md border px-4 py-2 text-sm font-medium"
                onClick={() =>
                  setSoftwareSkills((prev) => [...prev, emptySoftwareRow()])
                }
              >
                + Add Software Row
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className={sectionTitleClass}>H. Working Experience</div>

        <div className="space-y-4">
          {workExperiences.map((row, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-lg border p-4 md:grid-cols-3"
            >
              <input
                className={inputClass}
                placeholder="From"
                value={row.fromDate}
                onChange={(e) => updateWorkRow(index, "fromDate", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="To"
                value={row.toDate}
                onChange={(e) => updateWorkRow(index, "toDate", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Previous Company"
                value={row.previousCompany}
                onChange={(e) =>
                  updateWorkRow(index, "previousCompany", e.target.value)
                }
              />
              <input
                className={inputClass}
                placeholder="Previous Position"
                value={row.previousPosition}
                onChange={(e) =>
                  updateWorkRow(index, "previousPosition", e.target.value)
                }
              />
              <input
                className={inputClass}
                placeholder="Basic Salary"
                value={row.basicSalary}
                onChange={(e) =>
                  updateWorkRow(index, "basicSalary", e.target.value)
                }
              />
              <input
                className={inputClass}
                placeholder="Reason for Leaving"
                value={row.reasonForLeaving}
                onChange={(e) =>
                  updateWorkRow(index, "reasonForLeaving", e.target.value)
                }
              />
            </div>
          ))}

          <button
            type="button"
            className="rounded-md border px-4 py-2 text-sm font-medium"
            onClick={() => setWorkExperiences((prev) => [...prev, emptyWorkRow()])}
          >
            + Add Work Row
          </button>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <label className={labelClass}>I) Further Notes</label>
            <textarea
              className={inputClass}
              rows={4}
              value={form.furtherNotes}
              onChange={(e) =>
                setForm({ ...form, furtherNotes: e.target.value })
              }
            />
          </div>

          <div>
            <label className={labelClass}>II) Personal Reference (Emergency)</label>
            <textarea
              className={inputClass}
              rows={4}
              value={form.personalReferenceEmergency}
              onChange={(e) =>
                setForm({
                  ...form,
                  personalReferenceEmergency: e.target.value,
                })
              }
            />
          </div>

          <div>
            <div className={sectionTitleClass}>III. Declaration & Sign</div>

            <label className="mb-3 flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.declarationAccepted}
                onChange={(e) =>
                  setForm({
                    ...form,
                    declarationAccepted: e.target.checked,
                  })
                }
              />
              I hereby declare that the information provided is true and complete.
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Signature Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.signatureDate}
                  onChange={(e) =>
                    setForm({ ...form, signatureDate: e.target.value })
                  }
                />
              </div>

              <div>
                <label className={labelClass}>Signature Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setSignatureFile(e.target.files?.[0] || null)
                  }
                  className="w-full text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex h-32 items-center justify-center overflow-hidden rounded-lg border bg-muted text-xs text-muted-foreground">
              {signaturePreview ? (
                <img
                  src={signaturePreview}
                  alt="Signature"
                  className="h-full w-full object-contain"
                />
              ) : (
                "Signature Preview"
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          className="rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Saving..." : "Save Employee Form"}
        </button>
      </div>
    </div>
  );
}
