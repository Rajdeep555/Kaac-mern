import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getExpenditureById } from "../../api/expenditure.api.js";
import { TbDownload } from "react-icons/tb";
import { FiPrinter } from "react-icons/fi";

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-3 border-b border-gray-100 last:border-0">
    <span className="text-sm font-medium text-gray-500 sm:w-64 shrink-0">
      {label}
    </span>
    <span className="text-sm text-gray-900">{value ?? "-"}</span>
  </div>
);

const Section = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
      <h2 className="text-base font-semibold text-gray-700">{title}</h2>
    </div>
    <div className="px-6 py-2">{children}</div>
  </div>
);

const fmt = (val) =>
  val != null && val !== "0" && val !== 0
    ? `₹ ${Number(val).toLocaleString("en-IN")}`
    : "₹ 0";

const fmtDate = (val) =>
  val
    ? new Date(val).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

// ── CSV download helper ──────────────────────────────────────────
const downloadCSV = (e) => {
  const safe = (val) => {
    if (val == null || val === "") return "-";
    return String(val).replace(/"/g, '""');
  };

  const amtRaw = (val) =>
    val != null && val !== "0" && val !== 0 ? Number(val) : 0;

  const rows = [
    // Header
    ["EXPENDITURE DETAIL REPORT"],
    [
      `Voucher No: ${safe(e.voucherNo)}`,
      `Financial Year: ${safe(e.financialYear)}`,
    ],
    [`Generated On: ${new Date().toLocaleDateString("en-IN")}`],
    [],

    // Voucher Information
    ["VOUCHER INFORMATION"],
    ["Field", "Value"],
    ["Voucher No", safe(e.voucherNo)],
    ["Voucher Date", fmtDate(e.voucherDate)],
    ["Requisition No", safe(e.requisitionNo)],
    ["Requisition Date", fmtDate(e.requisitionDate)],
    ["Grant No", safe(e.grant?.code)],
    ["Sector", safe(e.sector)],
    ["Financial Year", safe(e.financialYear)],
    ["Expenditure Type", safe(e.expenditureType)],
    ["Salary Type", safe(e.salaryType)],
    ["Plan Type", safe(e.planType)],
    ["Work Name", safe(e.workName)],
    [],

    // Head Codes
    ["HEAD CODES"],
    ["Field", "Value"],
    ["Major Head", safe(e.majorHead)],
    ["Sub Major Head", safe(e.subMajorHead)],
    ["Minor Head", safe(e.minorHead)],
    ["Sub Head", safe(e.subHead)],
    ["Sub Sub Head", safe(e.subSubHead)],
    ["Detail Head", safe(e.detailHead)],
    ["Sub Detail Head", safe(e.subDetailHead)],
    ["Object Head", safe(e.objectHead)],
    [
      "Full Code",
      `${safe(e.majorHead)}-${safe(e.subMajorHead)}-${safe(e.minorHead)}-${safe(e.detailHead)}`,
    ],
    [],

    // DDO & Department
    ["DDO & DEPARTMENT DETAILS"],
    ["Field", "Value"],
    ["DDO Name", safe(e.ddo?.ddoName)],
    ["DDO Code", safe(e.ddo?.ddoCode)],
    ["Department", safe(e.department?.name)],
    ["Department Code", safe(e.department?.code)],
    [],

    // Pay Details
    ["PAY DETAILS"],
    ["Field", "Amount (₹)"],
    ["Pay Officers", amtRaw(e.payOfficers)],
    ["Pay Establishment", amtRaw(e.payEstablishment)],
    ["Allowance / Honorary", amtRaw(e.allowanceHonorary)],
    ["Contingencies", amtRaw(e.contingencies)],
    ["Grants in Aid", amtRaw(e.grantsInAid)],
    ["Works", amtRaw(e.works)],
    ["Loans & Advances", amtRaw(e.loansAdvances)],
    ["Transfer Payment", amtRaw(e.transferPayment)],
    [],

    // Amount Summary
    ["AMOUNT SUMMARY"],
    ["Field", "Amount (₹)"],
    ["Gross Amount", amtRaw(e.grossAmount)],
    ["Gross Deduction", amtRaw(e.grossDeduction)],
    ["Net Deduction", amtRaw(e.netDeduction)],
    ["Net Amount", amtRaw(e.netAmount)],
    ["Amount Payable", amtRaw(e.amountPayable)],
    ["Amount in Words", safe(e.amountInWords)],
    [],

    // Deductions
    ["DEDUCTION BREAKDOWN"],
    ["Field", "Amount (₹)"],
    ["CGST", amtRaw(e.cgst)],
    ["SGST", amtRaw(e.sgst)],
    ["IGST", amtRaw(e.igst)],
    ["Professional Tax", amtRaw(e.ptax)],
    ["Income Tax", amtRaw(e.itax)],
    ["Security Deposit", amtRaw(e.securityDeposit)],
    ["Security Deposit Deduction", amtRaw(e.securityDepositsDeduction)],
    ["Earnest Money", amtRaw(e.earnestMoney)],
    ["Earnest Money Deduction", amtRaw(e.earnestMoneyDeduction)],
    ["Forest Royalty", amtRaw(e.forestRoyalty)],
    ["IT on Forest Royalty", amtRaw(e.itForestRoyalty)],
    ["Labour Cess", amtRaw(e.labourCess)],
    ["Monopoly", amtRaw(e.monopoly)],
    ["VAT", amtRaw(e.vat)],
    ["Advance Recovery", amtRaw(e.advanceRecovery)],
    ["Other Deductions", amtRaw(e.otherDeductions)],
    ["CPF Council", amtRaw(e.cpfCouncil)],
    ["CPF Contribution", amtRaw(e.cpfContribution)],
    ["CPF Recovery", amtRaw(e.cpfRecovery)],
    ["CPF Payable", amtRaw(e.cpfPayable)],
    ["House Rent", amtRaw(e.houseRent)],
    ["House Loan Recovery", amtRaw(e.houseLoanRecovery)],
    ["Car Loan Recovery", amtRaw(e.carLoanRecovery)],
    ["MDRRF", amtRaw(e.mdrrf)],
    ["DMFT", amtRaw(e.dmft)],
    ["MC Forest Royalty", amtRaw(e.mcForestRoyalty)],
    [],

    // Cheque & Treasury
    ["CHEQUE & TREASURY DETAILS"],
    ["Field", "Value"],
    ["Cheque Book No", safe(e.chequeBookNo)],
    ["Cheque No", safe(e.chequeNo)],
    ["Cheque Issue Date", fmtDate(e.chequeIssueDate)],
    ["Treasury Name", safe(e.treasuryName)],
    ["Treasury Voucher No", safe(e.treasuryVoucherNo)],
    ["Treasury Date", fmtDate(e.treasuryDate)],
  ];

  if (e.remarks) {
    rows.push([], ["REMARKS"], [safe(e.remarks)]);
  }

  // Serialize to CSV
  const csv = rows
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const BOM = "\uFEFF"; // UTF-8 BOM so ₹ renders in Excel
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Expenditure_${e.voucherNo || id}_${e.financialYear || "FY"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Print helper ─────────────────────────────────────────────────
const printDetail = (e) => {
  const row = (label, value) =>
    `<tr><td style="padding:6px 12px;font-weight:600;color:#6b7280;width:260px;border-bottom:1px solid #f3f4f6">${label}</td><td style="padding:6px 12px;border-bottom:1px solid #f3f4f6">${value ?? "-"}</td></tr>`;

  const section = (title, content) => `
    <div style="margin-bottom:20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <div style="background:#f9fafb;padding:10px 16px;border-bottom:1px solid #e5e7eb;font-weight:700;color:#374151">${title}</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px">${content}</table>
    </div>`;

  const win = window.open("", "_blank", "width=900,height=800");
  win.document.write(`
    <!DOCTYPE html><html><head>
      <title>Expenditure — ${e.voucherNo}</title>
      <style>
        body { font-family: 'Georgia', serif; margin: 24px; color: #111; }
        h1 { font-size: 18px; color: #0f2744; margin-bottom: 4px; }
        p  { font-size: 12px; color: #9ca3af; margin: 0 0 16px; }
        @media print { body { margin: 0; } }
      </style>
    </head><body>
      <h1>Expenditure Detail — ${e.voucherNo}</h1>
      <p>Financial Year: ${e.financialYear ?? "-"} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString("en-IN")}</p>
      ${section(
        "Voucher Information",
        [
          row("Voucher No", e.voucherNo),
          row("Voucher Date", fmtDate(e.voucherDate)),
          row("Requisition No", e.requisitionNo),
          row("Requisition Date", fmtDate(e.requisitionDate)),
          row("Grant No", e.grant?.code),
          row("Sector", e.sector),
          row("Financial Year", e.financialYear),
          row("Expenditure Type", e.expenditureType),
          row("Salary Type", e.salaryType),
          row("Plan Type", e.planType),
          row("Work Name", e.workName),
        ].join(""),
      )}
      ${section(
        "Head Codes",
        [
          row("Major Head", e.majorHead),
          row("Sub Major Head", e.subMajorHead),
          row("Minor Head", e.minorHead),
          row("Sub Head", e.subHead),
          row("Detail Head", e.detailHead),
          row("Sub Detail Head", e.subDetailHead),
          row("Object Head", e.objectHead),
          row(
            "Full Code",
            `${e.majorHead}-${e.subMajorHead}-${e.minorHead}-${e.detailHead}`,
          ),
        ].join(""),
      )}
      ${section(
        "DDO & Department",
        [
          row("DDO Name", e.ddo?.ddoName),
          row("DDO Code", e.ddo?.ddoCode),
          row("Department", e.department?.name),
          row("Department Code", e.department?.code),
        ].join(""),
      )}
      ${section(
        "Amount Summary",
        [
          row("Gross Amount", fmt(e.grossAmount)),
          row("Gross Deduction", fmt(e.grossDeduction)),
          row("Net Deduction", fmt(e.netDeduction)),
          row("Net Amount", fmt(e.netAmount)),
          row("Amount Payable", fmt(e.amountPayable)),
          row("Amount in Words", e.amountInWords),
        ].join(""),
      )}
      ${section(
        "Cheque & Treasury",
        [
          row("Cheque Book No", e.chequeBookNo),
          row("Cheque No", e.chequeNo),
          row("Cheque Issue Date", fmtDate(e.chequeIssueDate)),
          row("Treasury Name", e.treasuryName),
          row("Treasury Voucher No", e.treasuryVoucherNo),
          row("Treasury Date", fmtDate(e.treasuryDate)),
        ].join(""),
      )}
      ${e.remarks ? section("Remarks", row("Remarks", e.remarks)) : ""}
    </body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
  win.close();
};

// ────────────────────────────────────────────────────────────────
const ExpenditureDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [expenditure, setExpenditure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await getExpenditureById(id);
        setExpenditure(res.data.data);
        console.log("Expenditure detail:", res.data.data);
      } catch (err) {
        console.error("Error detail:", err.response?.data);
        setError(
          err.response?.data?.message ?? "Failed to load expenditure details.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-40" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !expenditure) {
    return (
      <div className="p-6 text-red-500 text-sm">
        {error ?? "Expenditure not found."}
      </div>
    );
  }

  const e = expenditure;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <button
            className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-2"
            onClick={() => navigate(-1)}>
            ← Back to list
          </button>
          <h1 className="font-unbounded text-2xl font-normal">
            Expenditure Detail
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Voucher No:{" "}
            <span className="text-gray-700 font-semibold">{e.voucherNo}</span>
            <span className="mx-2">·</span>
            <span className="text-gray-500">{e.financialYear}</span>
          </p>
        </div>

        {/* ✅ Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => printDetail(e)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-150"
            style={{
              color: "#0f2744",
              background: "#f9fafb",
              borderColor: "#d1d5db",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f0f4f8";
              e.currentTarget.style.borderColor = "#1a3a5c";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}>
            <FiPrinter size={15} />
            Print
          </button>

          <button
            onClick={() => downloadCSV(e)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border transition-all duration-150"
            style={{
              color: "#14532d",
              background: "#f0fdf4",
              borderColor: "#bbf7d0",
            }}
            onMouseEnter={(ev) => {
              ev.currentTarget.style.background = "#dcfce7";
              ev.currentTarget.style.borderColor = "#86efac";
            }}
            onMouseLeave={(ev) => {
              ev.currentTarget.style.background = "#f0fdf4";
              ev.currentTarget.style.borderColor = "#bbf7d0";
            }}>
            <TbDownload size={15} />
            Download CSV
          </button>

          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition"
            style={{ background: "#1a3a5c" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#0f2744")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1a3a5c")}
            onClick={() => navigate(`/expenditures/${id}`)}>
            Edit
          </button>
        </div>
      </div>

      {/* ── Voucher Information ── */}
      <Section title="Voucher Information">
        <DetailRow label="Voucher No" value={e.voucherNo} />
        <DetailRow label="Voucher Date" value={fmtDate(e.voucherDate)} />
        <DetailRow label="Requisition No" value={e.requisitionNo} />
        <DetailRow
          label="Requisition Date"
          value={fmtDate(e.requisitionDate)}
        />
        <DetailRow label="Grant No" value={e.grant?.code} />
        <DetailRow label="Sector" value={e.sector} />
        <DetailRow label="Financial Year" value={e.financialYear} />
        <DetailRow label="Expenditure Type" value={e.expenditureType} />
        <DetailRow label="Salary Type" value={e.salaryType} />
        <DetailRow label="Plan Type" value={e.planType} />
        <DetailRow label="Work Name" value={e.workName} />
      </Section>

      {/* ── Head Codes ── */}
      <Section title="Head Codes">
        <DetailRow label="Major Head" value={e.majorHead} />
        <DetailRow label="Sub Major Head" value={e.subMajorHead} />
        <DetailRow label="Minor Head" value={e.minorHead} />
        <DetailRow label="Sub Head" value={e.subHead} />
        <DetailRow label="Sub Sub Head" value={e.subSubHead} />
        <DetailRow label="Detail Head" value={e.detailHead} />
        <DetailRow label="Sub Detail Head" value={e.subDetailHead} />
        <DetailRow label="Object Head" value={e.objectHead} />
        <DetailRow
          label="Full Code"
          value={`${e.majorHead}-${e.subMajorHead}-${e.minorHead}-${e.detailHead}`}
        />
      </Section>

      {/* ── DDO & Department ── */}
      <Section title="DDO & Department Details">
        <DetailRow label="DDO Name" value={e.ddo?.ddoName} />
        <DetailRow label="DDO Code" value={e.ddo?.ddoCode} />
        <DetailRow label="Department" value={e.department?.name} />
        <DetailRow label="Department Code" value={e.department?.code} />
      </Section>

      {/* ── Pay Details ── */}
      <Section title="Pay Details">
        <DetailRow label="Pay Officers" value={fmt(e.payOfficers)} />
        <DetailRow label="Pay Establishment" value={fmt(e.payEstablishment)} />
        <DetailRow
          label="Allowance / Honorary"
          value={fmt(e.allowanceHonorary)}
        />
        <DetailRow label="Contingencies" value={fmt(e.contingencies)} />
        <DetailRow label="Grants in Aid" value={fmt(e.grantsInAid)} />
        <DetailRow label="Works" value={fmt(e.works)} />
        <DetailRow label="Loans & Advances" value={fmt(e.loansAdvances)} />
        <DetailRow label="Transfer Payment" value={fmt(e.transferPayment)} />
      </Section>

      {/* ── Amount Summary ── */}
      <Section title="Amount Summary">
        <DetailRow label="Gross Amount" value={fmt(e.grossAmount)} />
        <DetailRow label="Gross Deduction" value={fmt(e.grossDeduction)} />
        <DetailRow label="Net Deduction" value={fmt(e.netDeduction)} />
        <DetailRow label="Net Amount" value={fmt(e.netAmount)} />
        <DetailRow label="Amount Payable" value={fmt(e.amountPayable)} />
        <DetailRow label="Amount in Words" value={e.amountInWords} />
      </Section>

      {/* ── Deductions ── */}
      <Section title="Deduction Breakdown">
        <DetailRow label="CGST" value={fmt(e.cgst)} />
        <DetailRow label="SGST" value={fmt(e.sgst)} />
        <DetailRow label="IGST" value={fmt(e.igst)} />
        <DetailRow label="Professional Tax" value={fmt(e.ptax)} />
        <DetailRow label="Income Tax" value={fmt(e.itax)} />
        <DetailRow label="Security Deposit" value={fmt(e.securityDeposit)} />
        <DetailRow
          label="Security Deposit Deduction"
          value={fmt(e.securityDepositsDeduction)}
        />
        <DetailRow label="Earnest Money" value={fmt(e.earnestMoney)} />
        <DetailRow
          label="Earnest Money Deduction"
          value={fmt(e.earnestMoneyDeduction)}
        />
        <DetailRow label="Forest Royalty" value={fmt(e.forestRoyalty)} />
        <DetailRow
          label="IT on Forest Royalty"
          value={fmt(e.itForestRoyalty)}
        />
        <DetailRow label="Labour Cess" value={fmt(e.labourCess)} />
        <DetailRow label="Monopoly" value={fmt(e.monopoly)} />
        <DetailRow label="VAT" value={fmt(e.vat)} />
        <DetailRow label="Advance Recovery" value={fmt(e.advanceRecovery)} />
        <DetailRow label="Other Deductions" value={fmt(e.otherDeductions)} />
        <DetailRow label="CPF Council" value={fmt(e.cpfCouncil)} />
        <DetailRow label="CPF Contribution" value={fmt(e.cpfContribution)} />
        <DetailRow label="CPF Recovery" value={fmt(e.cpfRecovery)} />
        <DetailRow label="CPF Payable" value={fmt(e.cpfPayable)} />
        <DetailRow label="House Rent" value={fmt(e.houseRent)} />
        <DetailRow
          label="House Loan Recovery"
          value={fmt(e.houseLoanRecovery)}
        />
        <DetailRow label="Car Loan Recovery" value={fmt(e.carLoanRecovery)} />
        <DetailRow label="MDRRF" value={fmt(e.mdrrf)} />
        <DetailRow label="DMFT" value={fmt(e.dmft)} />
        <DetailRow label="MC Forest Royalty" value={fmt(e.mcForestRoyalty)} />
      </Section>

      {/* ── Cheque / Treasury ── */}
      <Section title="Cheque & Treasury Details">
        <DetailRow label="Cheque Book No" value={e.chequeBookNo} />
        <DetailRow label="Cheque No" value={e.chequeNo} />
        <DetailRow
          label="Cheque Issue Date"
          value={fmtDate(e.chequeIssueDate)}
        />
        <DetailRow label="Treasury Name" value={e.treasuryName} />
        <DetailRow label="Treasury Voucher No" value={e.treasuryVoucherNo} />
        <DetailRow label="Treasury Date" value={fmtDate(e.treasuryDate)} />
      </Section>

      {/* ── Remarks ── */}
      {e.remarks && (
        <Section title="Remarks">
          <p className="text-sm text-gray-700 py-3">{e.remarks}</p>
        </Section>
      )}
    </div>
  );
};

export default ExpenditureDetailPage;
