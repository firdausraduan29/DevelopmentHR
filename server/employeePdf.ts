import PDFDocument from "pdfkit";

function safeText(v: any) {
  return (v ?? "").toString().trim();
}

function displayText(v: any) {
  const s = safeText(v);
  return s || "-";
}

function formatDate(d: any) {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return displayText(d);

  return date.toLocaleDateString("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatNumber(v: any) {
  if (v === undefined || v === null || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return displayText(v);
  return String(n);
}

function formatMoney(v: any) {
  if (v === undefined || v === null || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return displayText(v);
  return n.toFixed(2);
}

function yesNo(v: any) {
  return v ? "Yes" : "No";
}

type Doc = PDFKit.PDFDocument;

const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 30,
};

const LAYOUT = {
  left: PAGE.margin + 12,
  width: PAGE.width - PAGE.margin * 2 - 24,
  footerTop: PAGE.height - 62,
  contentBottom: PAGE.height - 90, // safe area above footer
};

function drawCheckbox(
  doc: Doc,
  x: number,
  y: number,
  label: string,
  checked: boolean
) {
  // box
  doc.rect(x, y, 10, 10).stroke();

  // tick
  if (checked) {
    doc
      .moveTo(x + 2, y + 5)
      .lineTo(x + 4, y + 8)
      .lineTo(x + 8, y + 2)
      .stroke();
  }

  // label
  doc.font("Helvetica").fontSize(8.5).text(label, x + 14, y - 1);
}

function drawOuterBorder(doc: Doc) {
  doc
    .lineWidth(1)
    .rect(
      PAGE.margin,
      PAGE.margin,
      PAGE.width - PAGE.margin * 2,
      PAGE.height - PAGE.margin * 2
    )
    .stroke();
}

function drawUnderline(doc: Doc, x: number, y: number, w: number) {
  doc.moveTo(x, y).lineTo(x + w, y).stroke();
}

function drawLineValue(
  doc: Doc,
  x: number,
  y: number,
  label: string,
  value: string,
  lineWidth: number
) {
  doc.font("Helvetica").fontSize(9).text(label, x, y - 8);
  drawUnderline(doc, x + 120, y, lineWidth);
  if (displayText(value) !== "-") {
    doc.font("Helvetica").fontSize(9).text(displayText(value), x + 124, y - 8, {
      width: lineWidth - 8,
    });
  }
}

function drawFooter(doc: Doc) {
  const footer =
    "This document and all information contained within are the confidential and proprietary intellectual property of the Company. No part may be reproduced, distributed, or transmitted in any form or by any means, including electronic, photographic, or mechanical methods, without the prior written consent of the Company. Unauthorized use, disclosure or circulation strictly prohibited.";

  doc
    .font("Helvetica-Bold")
    .fontSize(6.2)
    .text(footer, PAGE.margin + 10, PAGE.height - 60, {
      width: PAGE.width - PAGE.margin * 2 - 20,
      align: "left",
      lineGap: 0.2,
    });
}

function drawHeader(doc: Doc) {
  drawOuterBorder(doc);

  const left = LAYOUT.left;
  const top = PAGE.margin + 10;
  const width = LAYOUT.width;

  doc
  .font("Helvetica-Bold")
  .fontSize(18)
  .text("EMPLOYEE DETAILS", left, top + 25, {
    width,
    align: "center",
  });

  const barY = top + 78;
  const barH = 18;

doc.rect(left, barY, width, barH).fill("#000000");

doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(6.8);

doc.text("HIGHLY CONFIDENTIAL", left + 12, barY + 6.8, {
  width: 115,
  align: "left",
  lineBreak: false,
});

doc.text("EMPLOYEE PARTICULARS FORM", left, barY + 6.2, {
  width,
  align: "center",
  lineBreak: false,
});

  doc.fillColor("#000000");
}

function drawSectionBar(doc: Doc, y: number, title: string) {
  const left = LAYOUT.left;
  const width = LAYOUT.width;
  const h = 15;

  doc.rect(left, y, width, h).fill("#000000");
  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(title.toUpperCase(), left, y + 4, {
      width,
      align: "center",
    });

  doc.fillColor("#000000");
}

function drawFieldBox(
  doc: Doc,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string
) {
  doc.rect(x, y, w, h).stroke();

  doc.font("Helvetica").fontSize(7.8).text(label, x + 4, y + 4, {
    width: w - 8,
    align: "left",
    lineBreak: false,
  });

  doc.font("Helvetica-Bold").fontSize(9).text(displayText(value), x + 4, y + 15, {
    width: w - 8,
    align: "left",
     lineBreak: false,
  });
}

function drawInlineField(
  doc: Doc,
  x: number,
  y: number,
  label: string,
  value: string,
  labelWidth: number = 140
) {
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .text(label, x, y, {
      width: labelWidth,
      align: "left",
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text(displayText(value), x + labelWidth, y, {
      width: 100,
      align: "left",
    });
}

function drawPlaceholder(
  doc: Doc,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string
) {
  doc.rect(x, y, w, h).stroke();
  doc.font("Helvetica").fontSize(8).text(text, x, y + h / 2 - 4, {
    width: w,
    align: "center",
  });
}

type TableCell = string | {
  text: string;
  bold?: boolean;
};

function drawTable(
  doc: Doc,
  x: number,
  y: number,
  headers: string[],
  widths: number[],
  rows: TableCell[][],
  opts?: {
    headerHeight?: number;
    rowHeight?: number;
    fontSize?: number;
    maxRows?: number;
    headerFontSize?: number;
    cellPaddingX?: number;
    cellPaddingY?: number;
  }
) {
  const headerHeight = opts?.headerHeight ?? 24;
  const rowHeight = opts?.rowHeight ?? 20;
  const fontSize = opts?.fontSize ?? 7.5;
  const maxRows = opts?.maxRows ?? rows.length;
  const headerFontSize = opts?.headerFontSize ?? 8;
  const cellPaddingX = opts?.cellPaddingX ?? 4;
  const cellPaddingY = opts?.cellPaddingY ?? 5;

  let currentX = x;
  headers.forEach((header, i) => {
    doc.rect(currentX, y, widths[i], headerHeight).stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(headerFontSize)
      .text(header, currentX + cellPaddingX, y + 6, {
        width: widths[i] - cellPaddingX * 2,
        align: "center",
      });
    currentX += widths[i];
  });

  for (let r = 0; r < maxRows; r++) {
    const row = rows[r] || Array(headers.length).fill("-");
    let rowX = x;
    const rowY = y + headerHeight + r * rowHeight;

  headers.forEach((_, i) => {
  doc.rect(rowX, rowY, widths[i], rowHeight).stroke();

  const cell = row[i];
  const text = typeof cell === "object" ? cell.text : cell;
  const isBold = typeof cell === "object" && cell.bold;

  doc
    .font(isBold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(fontSize)
    .text(displayText(text), rowX + cellPaddingX, rowY + cellPaddingY, {
      width: widths[i] - cellPaddingX * 2,
      align: "left",
    });

  rowX += widths[i];
});
}
}

function drawPage1(doc: Doc, data: any) {
  doc.addPage({ size: "A4", margin: 0, autoFirstPage: false });
  drawHeader(doc);

  const left = LAYOUT.left;

  drawPlaceholder(doc, left, 160, 130, 140, "Insert your image here");

  const infoX = left + 150;
  const infoLabelW = 96;
  const infoValueW = 263;
  const rowH = 26;

  const infoRows: Array<[string, string]> = [
    ["Name:", data.name],
    ["NRIC No", data.nricNo],
    ["HP No", data.hpNo],
    ["Email", data.email],
    ["Address", data.address],
  ];

  infoRows.forEach(([label, value], i) => {
    const y = 166 + i * rowH;
    doc.rect(infoX, y, infoLabelW, rowH).stroke();
    doc.rect(infoX + infoLabelW, y, infoValueW, rowH).stroke();

    doc.font("Helvetica-Bold").fontSize(8).text(label, infoX + 4, y + 8, {
      width: infoLabelW - 8,
      align: "center",
    });

    doc.font("Helvetica").fontSize(8.8).text(displayText(value), infoX + infoLabelW + 6, y + 8, {
      width: infoValueW - 12,
      align: "left",
    });
  });

  drawSectionBar(doc, 328, "1. Employment Details");

  const col1X = left;
  const col2X = left + 130;
  const boxY = 356;
  const boxW = 110;
  const boxH = 32;

  const leftCol = [
    ["1. Title/Position", data.titlePosition],
    ["3. Commencement Date", formatDate(data.commencementDate)],
    ["5. Account No", data.accountNo],
    ["7. HQ Branch", data.hqBranch],
    ["9. Socso No", data.socsoNo],
    ["11. Tin No", data.tinNo],
    ["13. Allowance", formatMoney(data.allowance)],
    ["Leave - Medical", formatNumber(data.medicalLeave)],
  ];

  const rightCol = [
    ["2. Department", data.department],
    ["4. Bank", data.bankName],
    ["6. Staff No", data.staffNo],
    ["8. EPF No", data.epfNo],
    ["10. Income Tax", data.incomeTaxNo],
    ["12. Salary", formatMoney(data.salary)],
    ["14. Leave - Annual", formatNumber(data.annualLeave)],
    ["Leave - Medical Fee", formatMoney(data.medicalFee)],
  ];

  for (let i = 0; i < leftCol.length; i++) {
    drawFieldBox(doc, col1X, boxY + i * boxH, boxW, boxH, leftCol[i][0], leftCol[i][1] as string);
    drawFieldBox(doc, col2X, boxY + i * boxH, boxW, boxH, rightCol[i][0], rightCol[i][1] as string);
  }

  const insuranceY = boxY + leftCol.length * boxH + 8;
  const insuranceLabelY = insuranceY + 18;
  const insuranceListY = insuranceLabelY + 18;

doc
  .font("Helvetica-Bold")
  .fontSize(9)
  .text("15. Insurance", col1X, insuranceLabelY);

  drawCheckbox(doc, col1X, insuranceListY, "Group Personal Accident (GPA)", !!data.insuranceGpa);
  drawCheckbox(doc, col1X, insuranceListY + 18, "Group Hospital Surgical (GHS)", !!data.insuranceGhs);
  drawCheckbox(doc, col1X, insuranceListY + 36, "Group Term Family (GTL)", !!data.insuranceGtl);

  const icX = 320;
const icTop = boxY;

  drawPlaceholder(doc, icX, icTop, 210, 110, "IC Front");
  drawPlaceholder(doc, icX, icTop + 150, 210, 110, "IC Back");

  drawFooter(doc);
}

function drawPage2(doc: Doc, data: any) {
  doc.addPage({ size: "A4", margin: 0 });
  drawOuterBorder(doc);

  const left = LAYOUT.left;

  drawSectionBar(doc, 42, "B. Personal Particular");

const leftFields = [
  ["1. Date of Birth", formatDate(data.dateOfBirth)],
  ["2. Age", formatNumber(data.age)],
  ["3. Citizenship", data.citizenship],
  ["4. Race", data.ethnicity],
  ["5. Gender", data.gender],
  ["6. Religion", data.religion],
  ["7. Marital Status", data.maritalStatus],
  ["8. Number of Children", formatNumber(data.numberOfChildren)],
  ["9. Mode of Transportation", data.modeOfTransportation],
];

const rightFields = [
  ["10. Place of Birth", data.placeOfBirth],
  ["11. Country of Birth", data.countryOfBirth],
  ["12. Weight (kg)", formatNumber(data.weightKg)],
  ["13. Height (cm)", formatNumber(data.heightCm)],
  ["14. Blood Type", data.bloodType],
];

const rowGap = 20;
const startY = 70;

leftFields.forEach(([label, value], i) => {
  drawInlineField(doc, left + 6, startY + i * rowGap, label, value as string, 120);
});

rightFields.forEach(([label, value], i) => {
  drawInlineField(doc, left + 270, startY + i * rowGap, label, value as string, 120);
});

doc.moveTo(left, 260).lineTo(PAGE.width - PAGE.margin - 12, 260).stroke();

drawSectionBar(doc, 280, "C. Family Particular");

const familyRows = (data.familyMembers || []).map((m: any) => [
  m.name,
  formatNumber(m.age),
  m.occupation,
  m.relationship,
  m.phoneNumber,
]);

drawTable(
  doc,
  72,
  300,
  ["Name", "Age", "Occupation", "Relationship", "Phone\nNumber"],
  [95, 58, 95, 95, 90],
  familyRows,
  { headerHeight: 28, rowHeight: 18, maxRows: 5, fontSize: 7.3 }
);

doc.moveTo(left, 440).lineTo(PAGE.width - PAGE.margin - 12, 440).stroke();

drawSectionBar(doc, 460, "D. Children Particular");

doc.font("Helvetica").fontSize(8);
doc.text(`I) Number of Children / Has Children: ${yesNo(data.hasChildren)}`, left + 6, 485);
doc.text(`II) No Children: ${data.hasChildren ? "No" : "Yes"}`, left + 190, 485);

const childRows = (data.children || []).map((c: any) => [
  c.name,
  c.gender,
  formatDate(c.dateOfBirth),
  c.institutionName,
  c.eligibleForTax || "-",
]);

drawTable(
  doc,
  70,
  510,
  ["Name", "Gender", "Date of Birth", "Institution Name", "Eligible for Tax"],
  [92, 68, 92, 125, 95],
  childRows,
  { headerHeight: 24, rowHeight: 17, maxRows: 5, fontSize: 7.1 }
);

  drawFooter(doc);
}

function drawPage3(doc: Doc, data: any) {
  doc.addPage({ size: "A4", margin: 0 });
  drawOuterBorder(doc);

  const left = LAYOUT.left;

  drawSectionBar(doc, 42, "E. Driving License");

  drawFieldBox(doc, left, 70, 160, 40, "1. Driving License Class", data.drivingLicenseClass);
  drawFieldBox(doc, left + 170, 70, 160, 40, "2. License No", data.licenseNo);
  drawFieldBox(
    doc,
    left + 340,
    70,
    160,
    40,
    "3. Years of Driving Experience",
    formatNumber(data.yearsOfDrivingExperience)
  );

  doc.moveTo(left, 128).lineTo(PAGE.width - PAGE.margin - 12, 128).stroke();

  drawSectionBar(doc, 148, "F. Educational Background");

  doc.font("Helvetica-Bold").fontSize(10).text("a) School", left + 4, 174);

  const schoolRows = (data.educationSchool || []).map((r: any) => [
    r.schoolName,
    r.periodOfStudy,
    r.qualification,
    r.fieldOfStudy,
    r.grade,
  ]);

  drawTable(
    doc,
    70,
    196,
    ["Name of School", "From/to", "Qualification", "Field of Study", "Grade"],
    [115, 95, 90, 95, 70],
    schoolRows,
    { headerHeight: 24, rowHeight: 18, fontSize: 7.0, maxRows: 5 }
  );

  doc.font("Helvetica-Bold").fontSize(10).text("b) Higher Education", left + 4, 320);

  const higherRows = (data.educationHigher || []).map((r: any) => [
    r.institutionName,
    r.periodOfStudy,
    r.qualification,
    r.fieldOfStudy,
    r.cgpa,
  ]);

  drawTable(
    doc,
    70,
    342,
    ["Higher Education", "Period of Study", "Qualification", "Field of Study", "CGPA"],
    [115, 95, 90, 95, 70],
    higherRows,
    { headerHeight: 24, rowHeight: 18, fontSize: 7.0, maxRows: 5 }
  );

  doc.moveTo(left, 476).lineTo(PAGE.width - PAGE.margin - 12, 476).stroke();

  drawSectionBar(doc, 496, "G. Language & Computer Skills");

  doc.font("Helvetica-Bold").fontSize(7.3).text(
    "*NOTE: Good, Average, Weak, Not Applicable",
    left,
    522
  );

  doc.font("Helvetica-Bold").fontSize(10).text("a)", left + 4, 542);

  const languageRows = (data.languages || []).map((r: any) => [
    { text: r.languageName, bold: true }, // ✅ make first column bold
    r.speakingLevel,
    r.readingLevel,
    r.writingLevel,
  ]);

  drawTable(
    doc,
    106,
    560,
    ["Language", "Speaking", "Reading", "Writing"],
    [135, 85, 85, 85],
    languageRows,
    { headerHeight: 22, rowHeight: 16, maxRows: 4, fontSize: 7.0 }
  );

  doc.font("Helvetica-Bold").fontSize(10).text("b)", left + 4, 656);

  const softwareRows = (data.softwareSkills || []).map((r: any) => [
    { text: r.softwareName, bold: true }, // ✅ bold
    r.proficiencyLevel,
  ]);

  drawTable(
    doc,
    106,
    672,
    ["Software", "Proficiency Level"],
    [215, 180],
    softwareRows,
    { headerHeight: 22, rowHeight: 16, maxRows: 4, fontSize: 7.0 }
  );

  drawFooter(doc);
}

  function drawPage4(doc: Doc, data: any) {
  doc.addPage({ size: "A4", margin: 0 });
  drawOuterBorder(doc);

  const left = LAYOUT.left;
  const right = PAGE.width - PAGE.margin - 12;
  let y = 280;

  drawSectionBar(doc, 42, "H. Working Experience");

  const workRows = (data.workExperiences || []).map((r: any) => [
    formatDate(r.fromDate),
    formatDate(r.toDate),
    r.previousCompany,
    r.previousPosition,
    formatMoney(r.basicSalary),
    r.reasonForLeaving,
  ]);

  drawTable(
    doc,
    42,
    76,
    ["From", "To", "Previous\nCompany", "Previous\nPosition", "Basic Salary", "Reason for\nLeaving"],
    [72, 72, 95, 95, 82, 95],
    workRows,
    { headerHeight: 34, rowHeight: 28, fontSize: 7.1, maxRows: 5 }
  );

// ===== FURTHER NOTES =====
doc.font("Helvetica-Bold").fontSize(11).text("FURTHER NOTES", left, y);

y += 25; // ⬅️ MORE SPACE

doc.font("Helvetica").fontSize(10);

// a)
doc.text("a) Sporting or social activities or hobbies after leaving school:", left, y);
y += 26; // more breathing space
doc.moveTo(left + 20, y).lineTo(right - 40, y).stroke();
y += 28; // consistent spacing

// b)
doc.text("b) Experience in Motor Trade:", left, y);
y += 26;
doc.moveTo(left + 20, y).lineTo(right - 40, y).stroke();
y += 28;

// c)
doc.text("c) Any other information:", left, y);
y += 26;
doc.moveTo(left + 20, y).lineTo(right - 40, y).stroke();
y += 28;

  // ===== PERSONAL REFERENCES =====
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("PERSONAL REFERENCES", left, y);

  y += 20;

  function drawReferenceBlock(label: string) {
  doc.font("Helvetica").fontSize(10);

  const lineGap = 22;     // distance between each row
  const addressGap = 22;  // distance between address lines
  const lineStart = left + 70; //
  
  doc.text(`${label})`, left, y);

  // Name
  doc.text("Name", left + 22, y);
  doc.moveTo(left + 70, y + 10).lineTo(left + 520, y + 10).stroke();
  y += lineGap;

  // Address (2 lines, perfectly spaced)
  doc.text("Address", left + 22, y);

  doc.moveTo(left + 70, y + 10).lineTo(left + 520, y + 10).stroke();
  doc.moveTo(left + 70, y + 10 + addressGap).lineTo(left + 520, y + 10 + addressGap).stroke();

  y += lineGap * 2; // move down EXACTLY 2 rows

  // Relation
doc.text("Relation", left + 22, y);
doc.moveTo(lineStart, y + 10).lineTo(lineStart + 180, y + 10).stroke();
y += lineGap;

// Period Known
doc.text("Period Known", left + 22, y);
doc.moveTo(left + 90, y + 10).lineTo(left + 275, y + 10).stroke();
y += lineGap;

// Contact No.
doc.text("Contact No.", left + 22, y);
doc.moveTo(left + 80, y + 10).lineTo(left + 265, y + 10).stroke();
y += lineGap + 10;
}

  drawReferenceBlock("a");
  drawReferenceBlock("b");

  drawFooter(doc);
}

  function drawPage5(doc: Doc, data: any) {
  doc.addPage({ size: "A4", margin: 0 });
  drawOuterBorder(doc);

  const left = LAYOUT.left;
  const right = PAGE.width - PAGE.margin;

  // ===== HEADER =====
  drawSectionBar(doc, 42, "5. DECLARATION");

  let y = 80;

  doc.font("Helvetica").fontSize(9);

  // ===== PARAGRAPH 1 =====
  const p1 =
    "1. I hereby declare that all information provided in this application is true, complete, and accurate. I authorize the Company to verify this information and to obtain further relevant information from any third-party sources deemed appropriate.";

  doc.text(p1, left, y, {
    width: right - left - 40,
    align: "left",
  });

  y += 60;

  // ===== PARAGRAPH 2 =====
  const p2 =
    "2. I understand that any misrepresentation, falsification, or omission of material facts will be grounds for disciplinary action, including immediate termination of employment.";

  doc.text(p2, left, y, {
    width: right - left - 40,
    align: "left",
  });

  y += 70;

  // ===== SIGNATURE LINE =====

  // Employee Signature
  doc.text("Employee’s Signature:", left, y);
  doc.moveTo(left + 120, y + 10).lineTo(left + 300, y + 10).stroke();

  // Date (right side)
  doc.text("Date:", right - 150, y);
  doc.moveTo(right - 100, y + 10).lineTo(right - 20, y + 10).stroke();

  drawFooter(doc);
}

  export function buildEmployeePdf(data: any) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    autoFirstPage: false,
    bufferPages: true,
  });

  drawPage1(doc, data);
  drawPage2(doc, data);
  drawPage3(doc, data);
  drawPage4(doc, data);
  drawPage5(doc, data);

  doc.end();
  return doc;
}
