import PDFDocument from "pdfkit";

function n(value: any) {
  return Number(value || 0);
}

function money(value: any) {
  return `RM ${n(value).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function monthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleString("en-MY", {
    month: "long",
  });
}

function getPayPeriod(month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return `${formatDate(start)} - ${formatDate(end)}`;
}

function box(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 6
) {
  doc
    .strokeColor("#D1D5DB")
    .lineWidth(1)
    .roundedRect(x, y, w, h, radius)
    .stroke();
}

function labelValue(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  labelW = 92
) {
  doc.font("Helvetica-Bold").fontSize(8.4).fillColor("#374151").text(label, x, y);
  doc.font("Helvetica").fontSize(8.4).fillColor("#111827").text(value || "-", x + labelW, y);
}

function tableHeader(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  title: string
) {
  doc.font("Helvetica-Bold").fontSize(8.4).fillColor("#111827");
  doc.text(title, x + 12, y);
  doc.text("Amount", x + w - 112, y, { width: 95, align: "right" });

  doc
    .moveTo(x + 10, y + 15)
    .lineTo(x + w - 10, y + 15)
    .strokeColor("#D1D5DB")
    .stroke();
}

function moneyRow(
  doc: PDFKit.PDFDocument,
  label: string,
  value: any,
  x: number,
  y: number,
  w: number,
  bold = false,
  color = "#111827"
) {
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(8.3).fillColor(color);
  doc.text(label, x + 12, y);
  doc.text(money(value), x + w - 112, y, {
    width: 95,
    align: "right",
  });
}

function ytdCard(
  doc: PDFKit.PDFDocument,
  title: string,
  amount: any,
  x: number,
  y: number,
  w: number
) {
  doc.fillColor("#FFFFFF").roundedRect(x, y, w, 44, 6).fill();
  doc.strokeColor("#CBD5E1").lineWidth(1).roundedRect(x, y, w, 44, 6).stroke();

  doc.font("Helvetica").fontSize(6.8).fillColor("#374151").text(title, x + 4, y + 8, {
    width: w - 8,
    align: "center",
  });

  doc.font("Helvetica-Bold").fontSize(7.8).fillColor("#111827").text(money(amount), x + 4, y + 26, {
    width: w - 8,
    align: "center",
  });
}

export function buildPayslipPdf(data: any) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 35,
  });

  const left = 40;
  const right = 555;
  const width = right - left;

  const employeeName =
    `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
    data.email ||
    "-";

  const month = Number(data.month || 1);
  const year = Number(data.year || new Date().getFullYear());
  const payMonth = `${monthName(month)} ${year}`;
  const payPeriod = getPayPeriod(month, year);

  /**
   * Main salary payslip only.
   * Incentive, wages, comm & OR, and bonus are intentionally excluded here
   * because company-style payslip calculates those separately.
   */
  const salaryItems = [
    ["Basic Salary", data.basicSalary],
    ["Allowance", data.allowance],
    ["Overtime", data.overtime],
  ];

  const deductionItems = [
    ["Employee EPF", data.epf],
    ["Employee SOCSO", data.socso],
    ["Employee SOCSO SIP", data.employeeSocsoSip || data.socsoSip],
    ["PCB", data.pcb],
    ["Other Deduction", data.otherDeduction],
  ];

  const employerItems = [
    ["Employer EPF", data.employerEpf],
    ["Employer SOCSO", data.employerSocso],
    ["Employer SOCSO SIP", data.employerSocsoSip],
  ];

  const grossPay = salaryItems.reduce((sum, [, value]) => sum + n(value), 0);
  const totalDeductions = deductionItems.reduce((sum, [, value]) => sum + n(value), 0);
  const netPay = grossPay - totalDeductions;

  const ytdGross = n(data.ytd?.salaryGrossPay ?? data.ytd?.grossPay);
  const ytdEpf = n(data.ytd?.epf);
  const ytdSocso = n(data.ytd?.socso);
  const ytdPcb = n(data.ytd?.pcb);
  const ytdNet = n(data.ytd?.salaryNetPay ?? data.ytd?.netPay);

  // Header
  doc
  .font("Helvetica-Bold")
  .fontSize(20)
  .fillColor("#111827")
  .text("PAYSLIP", 55, 38, {
    width: 500,
    align: "center",
  });

  doc.font("Helvetica").fontSize(8.4).fillColor("#6B7280").text(`Payroll ID: ${data.id || "-"}`, 430, 55, {
    width: 120,
    align: "right",
  });

  doc.moveTo(left, 98).lineTo(right, 98).strokeColor("#111827").lineWidth(1).stroke();

  // Employee Info
  const infoY = 112;
  box(doc, left, infoY, width, 112);

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(
    "Employee & Pay Information",
    55,
    infoY + 14
  );

  labelValue(doc, "Name:", employeeName, 55, infoY + 39);
  labelValue(doc, "Email:", data.email || "-", 55, infoY + 57);
  labelValue(doc, "Department:", data.department || "-", 55, infoY + 75);
  labelValue(doc, "Employee No:", data.employeeNo || "-", 55, infoY + 93);

  labelValue(doc, "Pay Month:", payMonth, 320, infoY + 39);
  labelValue(doc, "Pay Period:", payPeriod, 320, infoY + 57);
  labelValue(doc, "Generated:", new Date().toLocaleDateString("en-GB"), 320, infoY + 75);
  labelValue(doc, "EPF / SOCSO:", `${data.epfNo || "-"} / ${data.socsoNo || "-"}`, 320, infoY + 93);

  // Salary Earnings & Deductions
  const tableTitleY = 245;
  const tableY = 264;
  const tableH = 170;
  const tableW = 245;
  const leftTableX = 40;
  const rightTableX = 310;

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#047857").text("Salary Earnings", leftTableX, tableTitleY);
  box(doc, leftTableX, tableY, tableW, tableH);
  tableHeader(doc, leftTableX, tableY + 13, tableW, "Earning Items");

  let rowY = tableY + 42;
  salaryItems.forEach(([label, value]) => {
    moneyRow(doc, label, value, leftTableX, rowY, tableW);
    rowY += 21;
  });

  const grossLineY = tableY + tableH - 39;
  doc
    .moveTo(leftTableX + 10, grossLineY)
    .lineTo(leftTableX + tableW - 10, grossLineY)
    .strokeColor("#D1D5DB")
    .stroke();

  moneyRow(doc, "Gross Pay", grossPay, leftTableX, grossLineY + 13, tableW, true, "#047857");

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#B91C1C").text("Deductions", rightTableX, tableTitleY);
  box(doc, rightTableX, tableY, tableW, tableH);
  tableHeader(doc, rightTableX, tableY + 13, tableW, "Deduction Items");

  rowY = tableY + 42;
  deductionItems.forEach(([label, value]) => {
    moneyRow(doc, label, value, rightTableX, rowY, tableW);
    rowY += 17;
  });

  const deductionLineY = tableY + tableH - 39;
  doc
    .moveTo(rightTableX + 10, deductionLineY)
    .lineTo(rightTableX + tableW - 10, deductionLineY)
    .strokeColor("#D1D5DB")
    .stroke();

  moneyRow(doc, "Total Deductions", totalDeductions, rightTableX, deductionLineY + 13, tableW, true, "#B91C1C");

  // Net Pay
  const netY = 458;
  doc.fillColor("#F3F4F6").roundedRect(left, netY, width, 54, 8).fill();

  doc.font("Helvetica-Bold").fontSize(11.2).fillColor("#111827").text("NET PAY", 60, netY + 14);
  doc.font("Helvetica").fontSize(7.3).fillColor("#6B7280").text("Amount payable to employee", 60, netY + 31);

  doc.font("Helvetica-Bold").fontSize(20).fillColor("#047857").text(money(netPay), 340, netY + 15, {
    width: 190,
    align: "right",
  });

  // Employer Contribution
  const employerY = 535;
  box(doc, left, employerY, width, 62);

  doc.font("Helvetica-Bold").fontSize(10.4).fillColor("#111827").text(
    "Employer Contribution",
    55,
    employerY + 12
  );

  let contributionX = 55;
  employerItems.forEach(([label, value]) => {
    doc.font("Helvetica").fontSize(7.4).fillColor("#374151").text(label, contributionX, employerY + 33, {
      width: 145,
    });

    doc.font("Helvetica-Bold").fontSize(8.2).fillColor("#111827").text(money(value), contributionX, employerY + 46, {
      width: 145,
    });

    contributionX += 165;
  });

  // YTD Summary
  const ytdY = 620;
  box(doc, left, ytdY, width, 92);

  doc.font("Helvetica-Bold").fontSize(10.4).fillColor("#111827").text(
    "Year To Date (YTD) Summary",
    55,
    ytdY + 10
  );

  const gap = 8;
  const cardW = (width - 30 - gap * 4) / 5;
  const cardY = ytdY + 29;
  const startX = left + 15;

  ytdCard(doc, "Gross Pay YTD", ytdGross, startX, cardY, cardW);
  ytdCard(doc, "EPF YTD", ytdEpf, startX + (cardW + gap), cardY, cardW);
  ytdCard(doc, "SOCSO YTD", ytdSocso, startX + (cardW + gap) * 2, cardY, cardW);
  ytdCard(doc, "PCB YTD", ytdPcb, startX + (cardW + gap) * 3, cardY, cardW);
  ytdCard(doc, "Net Pay YTD", ytdNet, startX + (cardW + gap) * 4, cardY, cardW);

  doc.font("Helvetica").fontSize(6.8).fillColor("#6B7280").text(
    `YTD figures include salary payroll records from 01/01/${year} until ${payPeriod.split(" - ")[1]}.`,
    55,
    ytdY + 76,
    { width: 480 }
  );

  // Confirmation
  const confirmationY = 735;
  doc.font("Helvetica").fontSize(8).fillColor("#111827");
  doc.text("Prepared By: HR Department", 55, confirmationY);
  doc.text("Approved By: ____________________", 315, confirmationY);

  // Footer
  doc.font("Helvetica").fontSize(7).fillColor("#6B7280").text(
    "This payslip is computer-generated by the HR Management System. No signature is required.",
    left,
    782,
    { align: "center", width }
  );

  doc.end();
  return doc;
}
