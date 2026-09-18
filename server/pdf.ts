import PDFDocument from "pdfkit";

function safeText(v: any) {
  return (v ?? "").toString();
}

function toTitleCase(v: any) {
  const s = safeText(v).trim();
  if (!s) return "-";
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
}

function formatDate(d: any) {
  if (!d) return "-";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return safeText(d);

  return date.toLocaleDateString("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDays(v: any) {
  const n = parseFloat(String(v ?? "0"));
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function formatRM(v: any) {
  const n = parseFloat(String(v ?? "0"));
  if (!Number.isFinite(n)) return "RM 0.00";
  return `RM ${n.toFixed(2)}`;
}

function formNoFromId(id: string) {
  const year = new Date().getFullYear();
  const short = (id || "").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return `LF-${year}-${short || "000000"}`;
}

function getResumeDutyDate(endDateValue: any) {
  if (!endDateValue) return "-";

  const endDate = new Date(endDateValue);
  if (Number.isNaN(endDate.getTime())) return "-";

  endDate.setDate(endDate.getDate() + 1);

  return endDate.toLocaleDateString("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getLeaveTypeLabel(v: any) {
  const t = String(v || "").toLowerCase();
  const map: Record<string, string> = {
    annual: "Annual Leave",
    medical: "Medical Leave",
    unpaid: "Unpaid Leave",
    emergency: "Emergency Leave",
    maternity: "Maternity Leave",
    paternity: "Paternity Leave",
    hospitalization: "Hospitalization Leave",
    time_slip: "Time Slip",
    halfday_morning: "Halfday (9AM - 1PM)",
    halfday_afternoon: "Halfday (2PM - 6PM)",
  };
  return map[t] || (t ? t.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "-");
}

function getSummaryTitle(leaveType: any) {
  const t = String(leaveType || "").toLowerCase();

  if (t === "annual") return "ANNUAL LEAVE SUMMARY";
  if (t === "medical") return "MC (SICK LEAVE) SUMMARY";
  if (t === "hospitalization") return "HOSPITALIZATION LEAVE SUMMARY";
  if (t === "emergency") return "ANNUAL LEAVE SUMMARY (EMERGENCY)";
  if (t === "unpaid") return "UNPAID LEAVE SUMMARY";
  if (t === "maternity") return "MATERNITY LEAVE SUMMARY";
  if (t === "paternity") return "PATERNITY LEAVE SUMMARY";
  if (t === "time_slip") return "TIME SLIP SUMMARY";

  return "LEAVE SUMMARY";
}

function getCurrentBalanceForType(data: any) {
  if (
    data.leaveCurrentBalance !== undefined &&
    data.leaveCurrentBalance !== null &&
    data.leaveCurrentBalance !== ""
  ) {
    return parseFloat(String(data.leaveCurrentBalance)) || 0;
  }

  const t = String(data.leaveType || "").toLowerCase();

  if (t === "annual" || t === "halfday_morning" || t === "halfday_afternoon") {
    return parseFloat(String(data.annualLeaveBalance ?? "0")) || 0;
  }

  if (t === "medical") {
    return parseFloat(String(data.sickLeaveBalance ?? "0")) || 0;
  }

  if (t === "hospitalization") {
    return parseFloat(String(data.hospitalizationLeaveBalance ?? "60")) || 0;
  }

  return parseFloat(String(data.annualLeaveBalance ?? "0")) || 0;
}

function getProjectedBalanceAfterApplication(data: any) {
  if (
    data.leaveBalanceAfterApplication !== undefined &&
    data.leaveBalanceAfterApplication !== null &&
    data.leaveBalanceAfterApplication !== ""
  ) {
    return parseFloat(String(data.leaveBalanceAfterApplication)) || 0;
  }

  const currentBalance = getCurrentBalanceForType(data);
  const totalDays = parseFloat(String(data.totalDays ?? "0")) || 0;
  const projected = currentBalance - totalDays;
  return projected < 0 ? 0 : projected;
}

function drawLabeledField(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  label: string,
  value: string,
  labelWidth = 105,
  valueWidth = 180
) {
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(label, x, y, { width: labelWidth });

  doc
    .font("Helvetica")
    .fontSize(10)
    .text(`: ${value}`, x + labelWidth, y, { width: valueWidth });
}

function drawSummaryBox(doc: PDFKit.PDFDocument, data: any, x: number, y: number, w: number) {
  const headerH = 18;
  const rowH = 24;
  const boxH = headerH + rowH * 3;

  const currentBalance = getCurrentBalanceForType(data);
  const projectedBalance = getProjectedBalanceAfterApplication(data);

  const leaveType = String(data.leaveType || "").toLowerCase();

  const entitlementRaw = data.leaveEntitlement;
  const takenRaw = data.leaveTakenExcludingThisApplication;

  const entitlement =
    entitlementRaw === undefined || entitlementRaw === null || entitlementRaw === ""
      ? "-"
      : `${formatDays(entitlementRaw)} days`;

  const taken =
    takenRaw === undefined || takenRaw === null || takenRaw === ""
      ? "-"
      : `${formatDays(takenRaw)} days`;

  const balanceForYear = `${formatDays(currentBalance)} days`;
  const balanceAfter = `${formatDays(projectedBalance)} days`;

  doc
    .roundedRect(x, y, w, boxH, 6)
    .lineWidth(1)
    .stroke("#1f3f8f");

  doc
    .rect(x, y, w, headerH)
    .fillAndStroke("#eef3ff", "#1f3f8f");

  doc
    .fillColor("#1f3f8f")
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(getSummaryTitle(data.leaveType), x, y + 7, {
      width: w,
      align: "center",
    });

  doc.fillColor("black");
 
  const label1 =
    leaveType === "annual" || leaveType === "emergency"
      ? "1. Annual Entitlement"
      : leaveType === "medical"
      ? "1. MC Entitlement"
      : leaveType === "hospitalization"
      ? "1. Hospitalization Entitlement"
      : "1. Leave Entitlement";

  const label2 =
    leaveType === "annual" || leaveType === "emergency"
      ? "2. Annual Taken"
      : leaveType === "medical"
      ? "2. MC Taken"
      : leaveType === "hospitalization"
      ? "2. Hospitalization Taken"
      : "2. Leave Taken";

  const label3 =
    leaveType === "annual"
      ? "3. Current Balance"
      : leaveType === "medical" || leaveType === "hospitalization"
      ? "3. Current Balance"
      : "3. Current Balance";

  const rows = [
    [label1, entitlement],
    [label2, taken],
    [label3, balanceForYear],
  ];

  rows.forEach(([label, value], index) => {
    const rowY = y + headerH + index * rowH;

    if (index > 0) {
      doc
        .moveTo(x, rowY)
        .lineTo(x + w, rowY)
        .dash(2, { space: 2 })
        .stroke("#9aa9d6")
        .undash();
    }

    doc
      .font(index === 3 ? "Helvetica-Bold" : "Helvetica")
      .fontSize(10)
      .fillColor("black")
      .text(label, x + 8, rowY + 6, {
        width: w - 110,
        align: "left",
      });

    doc
      .font(index === 3 ? "Helvetica-Bold" : "Helvetica")
      .fontSize(10)
      .text(value, x + w - 100, rowY + 6, {
        width: 75,
        align: "right",
      });
  });

  return boxH;
}

export function buildLeaveApplicationPdf(data: any) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  const pageWidth = doc.page.width;
  const pageMargin = 50;
  const contentWidth = pageWidth - pageMargin * 2;

  const fullName =
    `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() || data.email || "N/A";

  const formNo = data.referenceNo || formNoFromId(data.id);
  const appliedOn = formatDate(data.createdAt);
  const start = formatDate(data.startDate);
  const end = formatDate(data.endDate);
  const resumeDutyDate = getResumeDutyDate(data.endDate);
  const leaveTypeLabel = getLeaveTypeLabel(data.leaveType);

  // Header (CENTERED)
  doc.font("Helvetica-Bold").fontSize(18).text("HR SYSTEM", 50, 35, {
  width: 495,
  align: "center",
});

doc.font("Helvetica").fontSize(16).text("LEAVE APPLICATION FORM", 50, 56, {
  width: 495,
  align: "center",
});

doc.font("Helvetica")
  .fontSize(10)
  .text(`Form No: ${formNo}`, 380, 38, { width: 165, align: "right" });

doc.text(`Generated: ${formatDate(new Date())}`, 380, 54, {
  width: 165,
  align: "right",
});

let y = 92;

  const drawSectionTitle = (title: string, yPos: number) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#1f3f8f")
      .text(title.toUpperCase(), 50, yPos);

    doc
      .moveTo(50, yPos + 20)
      .lineTo(545, yPos + 20)
      .lineWidth(1)
      .stroke("#1f3f8f");

    doc.fillColor("black");

    return yPos + 28;
  };

  // Employee Information
  y = drawSectionTitle("Employee Information", y);
  drawLabeledField(doc, 50, y, "Employee Name", safeText(fullName));
  y += 18;
  drawLabeledField(doc, 50, y, "Email", safeText(data.email || "-"));
  y += 18;
  drawLabeledField(doc, 50, y, "Department", safeText(data.department || "-"));
  y += 18;
  drawLabeledField(doc, 50, y, "Date Applied", safeText(appliedOn));
  y += 28;

    // Leave Details
  y = drawSectionTitle("Leave Details", y);

  const leftX = 50;
  const rightX = 330;
  const rightWidth = 215;

  drawLabeledField(doc, leftX, y, "Leave Type", leaveTypeLabel, 92, 150);
  y += 18;
  drawLabeledField(doc, leftX, y, "Start Date", safeText(start), 92, 150);
  y += 18;
  drawLabeledField(doc, leftX, y, "End Date", safeText(end), 92, 150);
  y += 18;
  drawLabeledField(doc, leftX, y, "Resume Duty Date", safeText(resumeDutyDate), 92, 150);
  y += 18;
  drawLabeledField(doc, leftX, y, "Total Days", safeText(formatDays(data.totalDays ?? "-")), 92, 150);
  y += 18;
  drawLabeledField(doc, leftX, y, "Covering Person", toTitleCase(data.coveringPerson), 92, 150);
  y += 28;

    // Balances
  y = drawSectionTitle("Balances", y);

  const balancesStartY = y;

  const balanceLeftX = 50;
  const balanceWidth = 240;

  const summaryBoxHeight = drawSummaryBox(
    doc,
    data,
    balanceLeftX,
    balancesStartY,
    balanceWidth
  );

  const projectedBalance = getProjectedBalanceAfterApplication(data);
  const currentLeaveType = String(data.leaveType || "").toLowerCase();

  const afterTitle =
    currentLeaveType === "annual" || currentLeaveType === "emergency"
      ? "Annual Balance After Application"
      : currentLeaveType === "medical"
      ? "MC Balance After Application"
      : currentLeaveType === "hospitalization"
      ? "Hospitalization Balance After Application"
      : "Balance After Application";

  const afterBoxY = balancesStartY + summaryBoxHeight + 10;

  doc
    .roundedRect(balanceLeftX, afterBoxY, balanceWidth, 38, 6)
    .lineWidth(1)
    .stroke("#1f3f8f");

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("black")
    .text(afterTitle, balanceLeftX + 10, afterBoxY + 5, {
      width: balanceWidth - 20,
      align: "center",
    });

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("black")
    .text(`${formatDays(projectedBalance)} days`, balanceLeftX + 10, afterBoxY + 18, {
      width: balanceWidth - 20,
      align: "center",
    });

  let balancesBottomY = afterBoxY + 38;

  if (currentLeaveType === "medical" || currentLeaveType === "hospitalization") {
    const medicalFeeY = balancesBottomY + 12;

    drawLabeledField(
      doc,
      balanceLeftX,
      medicalFeeY,
      "Medical Fee Balance",
      formatRM(data.medicalFeeBalance),
      110,
      90
    );

    balancesBottomY = medicalFeeY + 20;
  }

  y = balancesBottomY + 10;

  // Reason
  y = drawSectionTitle("Reason", y);

  const reason = safeText(data.reason || "");
  const shortReason =
  reason.length > 200 ? reason.slice(0, 200) + "..." : reason;

doc
  .font("Helvetica")
  .fontSize(10)
  .text(shortReason, 50, y, {
    width: contentWidth,
  });

y = doc.y + 10;

  // Attachment
  y = drawSectionTitle("Attachment", y);
const hasAttachment = !!data.attachmentUrl;

doc
  .font("Helvetica-Bold")
  .fontSize(10)
  .fillColor("black")
  .text("Attachment", 50, y);

doc
  .font("Helvetica")
  .fontSize(10)
  .fillColor("black")
  .text(`: ${hasAttachment ? "YES" : "NO"}`, 135, y);

if (hasAttachment) {
  doc
    .fillColor("blue")
    .font("Helvetica")
    .fontSize(10)
    .text(" (View Attachment)", 175, y, {
      link: data.attachmentUrl,
      underline: true,
    });

  doc.fillColor("black");
}

y += 20;


  // Approval
  y = drawSectionTitle("Approval", y);
  drawLabeledField(
    doc,
    50,
    y,
    "Status",
    safeText((data.status || "").toString().toUpperCase() || "-"),
    85,
    120
  );
  y += 18;

  drawLabeledField(doc, 50, y, "HR Comment", safeText(data.hrComment || "-"), 85, 180);
y += 18;

drawLabeledField(doc, 50, y, "Director Comment", safeText(data.directorComment || "-"), 100, 180);
y += 28;

  // System Approval Record
  doc
  .font("Helvetica-Bold")
  .fontSize(13)
  .fillColor("#1f3f8f")
  .text("SYSTEM APPROVAL RECORD", 50, y);

doc
  .moveTo(50, y + 16)
  .lineTo(545, y + 16)
  .lineWidth(1)
  .stroke("#1f3f8f");

doc
  .fillColor("black")
  .font("Helvetica")
  .fontSize(9)
  .text(
    "This document is system-generated and does not require a physical signature.",
    50,
    y + 22,
    {
      width: contentWidth,
      align: "left",
    }
  );

y = doc.y + 8;

  doc.end();
  return doc;
}
