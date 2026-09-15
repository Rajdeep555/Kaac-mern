import React, { useMemo, useEffect, useRef, useState } from "react";
import { useCashbook } from "../../hooks/admin/useCashbook";
import { useCashbookSummary } from "../../hooks/admin/useCashbookSummary";
import { showToast } from "../../utils/toast.js";
import { Loader } from "../ui/Loader.jsx";
import ErrorMessage from "../ui/ErrorMessage.jsx";

// ── Helpers ──────────────────────────────────────────────────
const splitRows = (data) => ({
  drRows: data.filter((r) => r.receiptDate !== null),
  crRows: data.filter((r) => r.disbursementDate !== null),
});

const emptyDr = {
  rowType: "data",
  receiptDate: null,
  receiptItemNo: null,
  receiptCounterfoilNo: null,
  receiptParticulars: null,
  receiptCashAmount: null,
  receiptPlaColumn: null,
  receiptClassification: null,
};

const emptyCr = {
  rowType: "data",
  disbursementDate: null,
  voucherNo: null,
  disbursementCounterfoilNo: null,
  disbursementDetails: null,
  disbursementCashAmount: null,
  chequeNo: null,
  plaColumnPayment: null,
  treasuryClassification: null,
};

const fmt = (v) => (v !== null && v !== undefined && v !== "" ? v : "-");
const fmtAmt = (v) =>
  v !== null && v !== undefined ? `₹${Number(v).toFixed(2)}` : "-";

// ── Calculate totals from raw data ───────────────────────────
const calculateTotals = (data) => {
  let receiptCashColumn = 0;
  let receiptTreasuryPla = 0;
  let disbursementCashColumn = 0;
  let disbursementTreasuryPla = 0;

  // Day-total marker rows are already sums of the day's data rows —
  // including them here too would double-count, so they're excluded
  // from the grand total.
  data
    .filter((row) => row.rowType !== "dayTotal")
    .forEach((row) => {
      if (row.receiptCashAmount !== null)
        receiptCashColumn += Number(row.receiptCashAmount);
      if (row.receiptPlaColumn !== null)
        receiptTreasuryPla += Number(row.receiptPlaColumn);
      if (row.disbursementCashAmount !== null)
        disbursementCashColumn += Number(row.disbursementCashAmount);
      if (row.plaColumnPayment !== null)
        disbursementTreasuryPla += Number(row.plaColumnPayment);
    });

  return {
    receiptCashColumn,
    receiptTreasuryPla,
    disbursementCashColumn,
    disbursementTreasuryPla,
  };
};

// ── Closing Balance section helpers ──────────────────────────
// NOTE: These two figures are fixed opening-balance carry-overs from
// before this system existed (i.e. not derivable from stored rows).
// If a future financial year needs a different opening balance, these
// constants (or their sourcing) will need to be revisited.
const OPENING_BALANCE_CASH_COLUMN = 20596820; // ₹2,05,96,820 — COUNCIL & CONSOLIDATED only
const OPENING_BALANCE_TREASURY_PLA_CONSOLIDATED = -2961936280; // CONSOLIDATED only, receipt side, combined (no Council/State split)

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatMonthYear = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return `${monthNames[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
};

// Works for any selected range — a single day filter or a full
// financial-year range — since it just formats the month/year of
// each end of the range (e.g. 01-04-2025 to 31-03-2026 → "April-2025
// to March-2026").
const formatPeriodLabel = (from, to) => {
  if (!from || !to) return "";
  const fromLabel = formatMonthYear(from);
  const toLabel = formatMonthYear(to);
  return fromLabel && toLabel ? `${fromLabel} to ${toLabel}` : "";
};

// Financial year label derived the same way the auto-save effect
// derives it (start year of the selected range's `from` date).
const formatFinancialYearLabel = (from) => {
  if (!from) return "";
  const year = new Date(from).getUTCFullYear();
  if (isNaN(year)) return "";
  return `${year}-${year + 1}`;
};

const inrFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

// Indian-grouped number formatting with a "(-)" prefix for negatives,
// to match the closing-balance sheet's display convention.
const fmtClosing = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "-";
  const rounded = Math.round(num);
  const isNegative = rounded < 0;
  const formatted = inrFormatter.format(Math.abs(rounded));
  return isNegative ? `(-) ${formatted}` : formatted;
};

// ── Closing Balance section ──────────────────────────────────
const ClosingBalanceSection = ({ sector, from, to, totals }) => {
  // Cash-column opening balance: only COUNCIL & CONSOLIDATED, since
  // there is no cash receipt under sector = STATE.
  const showOpeningCash = sector === "COUNCIL" || sector === "CONSOLIDATED";
  // Treasury PLA opening balance: only CONSOLIDATED, shown as one
  // combined figure (not split into Council/State parts).
  const showOpeningTreasury = sector === "CONSOLIDATED";

  const openingCash = showOpeningCash ? OPENING_BALANCE_CASH_COLUMN : 0;
  const openingTreasury = showOpeningTreasury
    ? OPENING_BALANCE_TREASURY_PLA_CONSOLIDATED
    : 0;

  const totalReceiptCash = totals.receiptCashColumn;
  const totalReceiptTreasury = totals.receiptTreasuryPla;
  const totalReceiptTotal = totalReceiptCash + totalReceiptTreasury;

  const openingTotal = openingCash + openingTreasury;

  const grantReceiptCash = totalReceiptCash + openingCash;
  const grantReceiptTreasury = totalReceiptTreasury + openingTreasury;
  const grantReceiptTotal = grantReceiptCash + grantReceiptTreasury;

  const totalExpCash = totals.disbursementCashColumn;
  const totalExpTreasury = totals.disbursementTreasuryPla;
  const totalExpTotal = totalExpCash + totalExpTreasury;

  // Closing Balance — Cash column (FY 2025-2026 onward): Receipt-side
  // Cash Column total − Disbursement-side Cash Column total for the
  // period (opening balance is not added in here — it's its own row).
  const closingCash = totalReceiptCash - totalExpCash;
  // Closing Balance — Treasury PLA column, per spec:
  // Receipt Treasury PLA − Expenditure/Disbursement Treasury PLA + Receipt-side Opening Treasury PLA.
  // (Opening balance is itself typically negative, so this effectively
  // subtracts its absolute value.)
  const closingTreasury =
    totalReceiptTreasury - totalExpTreasury + openingTreasury;
  const closingTotal = closingCash + closingTreasury;

  const grantExpCash = totalExpCash + closingCash;
  const grantExpTreasury = totalExpTreasury + closingTreasury;
  const grantExpTotal = grantExpCash + grantExpTreasury;

  const periodLabel = formatPeriodLabel(from, to);
  const fyLabel = formatFinancialYearLabel(from);

  const headCellCls = "border border-black px-2 py-1 bg-gray-50 font-semibold";
  const valCls = "border border-black px-2 py-1 text-red-600 font-semibold";
  const rowLabelCls =
    "border border-black px-2 py-1 text-left font-semibold bg-gray-50";
  const totalRowLabelCls =
    "border border-black px-2 py-1 text-left font-bold bg-gray-300";
  const totalRowValCls =
    "border border-black px-2 py-1 font-bold bg-gray-300 text-red-700";

  return (
    <div className="px-4 pb-6">
      <div className="text-center font-semibold mb-3">
        <p>Closing Balance during the Financial year {fyLabel || "—"}.</p>
        {periodLabel && <p className="text-sm">{periodLabel}</p>}
      </div>

      <div className="flex flex-col md:flex-row gap-4 overflow-x-auto">
        {/* Receipt table */}
        <table
          className="border-collapse border border-black text-[11px] text-center flex-1"
          style={{ minWidth: "420px" }}>
          <thead>
            <tr>
              <th
                colSpan={4}
                className="border border-black bg-gray-50 uppercase py-2 text-sm">
                Receipt
              </th>
            </tr>
            <tr>
              <th className={headCellCls}></th>
              <th className={headCellCls}>Cash Column</th>
              <th className={headCellCls}>Treasury (PLA) Column</th>
              <th className={headCellCls}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={rowLabelCls}>Total Receipt</td>
              <td className={valCls}>{fmtClosing(totalReceiptCash)}</td>
              <td className={valCls}>{fmtClosing(totalReceiptTreasury)}</td>
              <td className={valCls}>{fmtClosing(totalReceiptTotal)}</td>
            </tr>
            <tr>
              <td className={rowLabelCls}>Opening Balance</td>
              <td className={valCls}>
                {showOpeningCash ? fmtClosing(openingCash) : "-"}
              </td>
              <td className={valCls}>
                {showOpeningTreasury ? fmtClosing(openingTreasury) : "-"}
              </td>
              <td className={valCls}>
                {showOpeningCash || showOpeningTreasury
                  ? fmtClosing(openingTotal)
                  : "-"}
              </td>
            </tr>
            <tr>
              <td className={totalRowLabelCls}>Grant Total</td>
              <td className={totalRowValCls}>{fmtClosing(grantReceiptCash)}</td>
              <td className={totalRowValCls}>
                {fmtClosing(grantReceiptTreasury)}
              </td>
              <td className={totalRowValCls}>
                {fmtClosing(grantReceiptTotal)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Expenditure table */}
        <table
          className="border-collapse border border-black text-[11px] text-center flex-1"
          style={{ minWidth: "420px" }}>
          <thead>
            <tr>
              <th
                colSpan={4}
                className="border border-black bg-gray-50 uppercase py-2 text-sm">
                Expenditure
              </th>
            </tr>
            <tr>
              <th className={headCellCls}></th>
              <th className={headCellCls}>Cash Column</th>
              <th className={headCellCls}>Treasury (PLA) Column</th>
              <th className={headCellCls}>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={rowLabelCls}>Total Expenditure</td>
              <td className={valCls}>{fmtClosing(totalExpCash)}</td>
              <td className={valCls}>{fmtClosing(totalExpTreasury)}</td>
              <td className={valCls}>{fmtClosing(totalExpTotal)}</td>
            </tr>
            <tr>
              <td className={rowLabelCls}>Closing Balance</td>
              <td className={valCls}>{fmtClosing(closingCash)}</td>
              <td className={valCls}>{fmtClosing(closingTreasury)}</td>
              <td className={valCls}>{fmtClosing(closingTotal)}</td>
            </tr>
            <tr>
              <td className={totalRowLabelCls}>Grant Total</td>
              <td className={totalRowValCls}>{fmtClosing(grantExpCash)}</td>
              <td className={totalRowValCls}>{fmtClosing(grantExpTreasury)}</td>
              <td className={totalRowValCls}>{fmtClosing(grantExpTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// dateRange: { from: "YYYY-MM-DD", to: "YYYY-MM-DD" }
const Form1 = ({ data: dataProp = [], title, sector, dateRange }) => {
  const { save, saving } = useCashbookSummary();
  const { from, to } = dateRange ?? {};

  // Track if we've already saved for this sector+range session
  const hasSaved = useRef(false);

  // Status label shown to user during save
  const [saveStatus, setSaveStatus] = useState(null);
  // "calculating" | "inserting" | null

  const {
    data: councilData,
    loading: councilLoading,
    error: councilError,
  } = useCashbook(
    { from, to, sector: "COUNCIL" },
    { enabled: sector === "COUNCIL" || sector === "CONSOLIDATED" },
  );

  const {
    data: stateData,
    loading: stateLoading,
    error: stateError,
  } = useCashbook(
    { from, to, sector: "STATE" },
    { enabled: sector === "STATE" || sector === "CONSOLIDATED" },
  );

  const rawData = useMemo(() => {
    if (sector === "COUNCIL") return councilData ?? [];
    if (sector === "STATE") return stateData ?? [];
    if (sector === "CONSOLIDATED") {
      return [...(councilData ?? []), ...(stateData ?? [])].sort((a, b) => {
        const dA = a.receiptDate || a.disbursementDate || "";
        const dB = b.receiptDate || b.disbursementDate || "";
        return dA.localeCompare(dB);
      });
    }
    return dataProp;
  }, [sector, councilData, stateData, dataProp]);

  const loading =
    sector === "COUNCIL"
      ? councilLoading
      : sector === "STATE"
        ? stateLoading
        : sector === "CONSOLIDATED"
          ? councilLoading || stateLoading
          : false;

  const error =
    sector === "COUNCIL"
      ? councilError
      : sector === "STATE"
        ? stateError
        : sector === "CONSOLIDATED"
          ? councilError || stateError
          : null;

  // ── Auto-save after data loads ───────────────────────────
  useEffect(() => {
    // Only run when data is loaded, not empty, range is set, and not already saved
    if (
      loading ||
      error ||
      !from ||
      !to ||
      rawData.length === 0 ||
      hasSaved.current
    )
      return;

    const runSave = async () => {
      hasSaved.current = true; // prevent double-save

      try {
        // Step 1 — Calculating
        setSaveStatus("calculating");
        // Small delay so user sees the label
        await new Promise((r) => setTimeout(r, 800));

        const totals = calculateTotals(rawData);

        // Current month and year (for the "when saved" bookkeeping fields)
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();

        // Financial year derived from the selected range's start date
        const rangeStartYear = new Date(from).getFullYear();
        const financialYear = `${rangeStartYear}-${rangeStartYear + 1}`;

        // Step 2 — Inserting
        setSaveStatus("inserting");

        if (sector === "CONSOLIDATED") {
          // Save COUNCIL and STATE separately for CONSOLIDATED view
          await Promise.all([
            save({
              sector: "COUNCIL",
              month: currentMonth,
              year: currentYear,
              financialYear,
              fromDate: from,
              toDate: to,
              receiptCashColumn: totals.receiptCashColumn,
              receiptTreasuryPla: totals.receiptTreasuryPla,
              disbursementCashColumn: totals.disbursementCashColumn,
              disbursementTreasuryPla: totals.disbursementTreasuryPla,
            }),
            save({
              sector: "STATE",
              month: currentMonth,
              year: currentYear,
              financialYear,
              fromDate: from,
              toDate: to,
              receiptCashColumn: totals.receiptCashColumn,
              receiptTreasuryPla: totals.receiptTreasuryPla,
              disbursementCashColumn: totals.disbursementCashColumn,
              disbursementTreasuryPla: totals.disbursementTreasuryPla,
            }),
          ]);
        } else {
          await save({
            sector,
            month: currentMonth,
            year: currentYear,
            financialYear,
            fromDate: from,
            toDate: to,
            receiptCashColumn: totals.receiptCashColumn,
            receiptTreasuryPla: totals.receiptTreasuryPla,
            disbursementCashColumn: totals.disbursementCashColumn,
            disbursementTreasuryPla: totals.disbursementTreasuryPla,
          });
        }

        setSaveStatus(null);
        showToast("✅ Cashbook data updated successfully", "success");
      } catch (err) {
        setSaveStatus(null);
        showToast("❌ Failed to update cashbook data", "error");
        hasSaved.current = false; // allow retry
      }
    };

    runSave();
  }, [loading, rawData, sector, from, to]);

  // Reset hasSaved when sector or date range changes
  useEffect(() => {
    hasSaved.current = false;
  }, [sector, from, to]);

  // ── Split and zip rows ───────────────────────────────────
  const { drRows, crRows } = useMemo(() => splitRows(rawData), [rawData]);
  const maxLen = Math.max(drRows.length, crRows.length);
  const zippedRows = Array.from({ length: maxLen }, (_, i) => ({
    dr: drRows[i] ?? emptyDr,
    cr: crRows[i] ?? emptyCr,
    key: `row-${i}`,
  }));

  // Totals for the current filtered period — reused by both the main
  // table's totals row and the Closing Balance section below.
  const periodTotals = useMemo(() => calculateTotals(rawData), [rawData]);

  const getTitle = () => {
    if (title) return title;
    switch (sector) {
      case "COUNCIL":
        return "Cash Book of COUNCIL for the month";
      case "STATE":
        return "Cash Book of STATE for the month";
      case "CONSOLIDATED":
        return "Cash Book CONSOLIDATED (Council & State) for the month";
      default:
        return "Cash Book for the month";
    }
  };

  if (!from || !to) {
    return (
      <div className="w-full border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">
          Select a date range to view Form 1 data.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full border-2 bg-white p-8 text-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full border-2 bg-white p-8 text-center">
        <ErrorMessage title="Failed to load cashbook data." />
      </div>
    );
  }

  return (
    <div className="w-full bg-white border-2">
      {/* Header */}
      <div className="py-4 text-center font-semibold">
        <b className="text-start underline mb-3">
          PART-II MONTHLY AND SUBSIDIARY ACCOUNTS
        </b>
        <h1 className="text-xl font-bold">Form No. 1</h1>
        {sector && <p className="text-sm text-gray-600">Sector: {sector}</p>}
        <p>{getTitle()}</p>
        <p className="text-xs text-gray-500 font-normal">
          {from} to {to}
        </p>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      {/* Save status overlay banner */}
      {saveStatus && (
        <div className="mx-4 mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          {/* Spinner */}
          <svg
            className="animate-spin h-5 w-5 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-blue-700 font-medium text-sm">
            {saveStatus === "calculating"
              ? "Calculating cashbook totals..."
              : "Inserting cashbook data..."}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table
          className="border-collapse border border-black text-[11px] text-center mx-4 my-4"
          style={{ minWidth: "1200px" }}>
          <thead>
            <tr>
              <th
                colSpan={7}
                className="border border-black bg-gray-50 uppercase py-2 text-sm">
                Dr (Receipt)
              </th>
              <th
                colSpan={8}
                className="border border-black bg-gray-50 uppercase py-2 text-sm">
                Cr (Disbursement)
              </th>
            </tr>
            <tr>
              {/* DR side */}
              <th rowSpan={2} className="border border-black px-2 py-1 w-10">
                No. of item
              </th>
              <th rowSpan={2} className="border border-black px-2 py-1 w-20">
                Counterfoil No.
              </th>
              <th rowSpan={2} className="border border-black px-2 py-1 w-14">
                Date
              </th>
              <th rowSpan={2} className="border border-black px-3 py-1 w-48">
                Particulars
                <br />
                <span className="font-normal text-[10px]">
                  (Full details with reference to receipts, challans, cheques
                  etc.)
                </span>
              </th>
              <th colSpan={2} className="border border-black py-1">
                Receipts (Amount)
              </th>
              <th rowSpan={2} className="border border-black px-2 py-1 w-28">
                Classification
              </th>
              {/* CR side */}
              <th rowSpan={2} className="border border-black px-2 py-1 w-14">
                Date
              </th>
              <th rowSpan={2} className="border border-black px-2 py-1 w-20">
                No. of item
                <br />
                <span className="font-normal text-[10px]">(Voucher No.)</span>
              </th>
              <th rowSpan={2} className="border border-black px-2 py-1 w-20">
                Counterfoil No.
              </th>
              <th rowSpan={2} className="border border-black px-3 py-1 w-48">
                Classification
                <br />
                <span className="font-normal text-[10px]">
                  (Full details of claims)
                </span>
              </th>
              <th colSpan={2} className="border border-black py-1">
                Disbursement
              </th>
              <th colSpan={2} className="border border-black py-1">
                Treasury
              </th>
            </tr>
            <tr>
              <th className="border border-black px-2 py-1 w-24">
                Cash Column
              </th>
              <th className="border border-black px-2 py-1 w-24">
                Treasury PLA Column
              </th>
              <th className="border border-black px-2 py-1 w-24">
                Cash Column
              </th>
              <th className="border border-black px-2 py-1 w-24">
                No of Cheque / cheque book
              </th>
              <th className="border border-black px-2 py-1 w-24">PLA column</th>
              <th className="border border-black px-2 py-1 w-28">
                Classification
              </th>
            </tr>
          </thead>

          <tbody>
            {zippedRows.length === 0 && (
              <tr>
                <td
                  colSpan={15}
                  className="border border-black py-8 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {zippedRows.map(({ dr, cr, key }) => {
              // Darker background + bold text for day-total marker rows
              // (either side can independently be a day-total row).
              const isDrTotal = dr.rowType === "dayTotal";
              const isCrTotal = cr.rowType === "dayTotal";
              const drCellClass = isDrTotal
                ? "border border-black px-1 bg-gray-300 font-bold"
                : "border border-black px-1";
              const crCellClass = isCrTotal
                ? "border border-black px-1 bg-gray-300 font-bold"
                : "border border-black px-1";

              return (
                <tr key={key} className="border border-black">
                  {/* DR side */}
                  <td className={`${drCellClass} py-2`}>
                    {fmt(dr.receiptItemNo)}
                  </td>
                  <td className={drCellClass}>
                    {fmt(dr.receiptCounterfoilNo)}
                  </td>
                  <td className={drCellClass}>{fmt(dr.receiptDate)}</td>
                  <td
                    className={`${isDrTotal ? "border border-black bg-gray-300 font-bold" : "border border-black"} px-2 text-left`}>
                    {fmt(dr.receiptParticulars)}
                  </td>
                  <td className={drCellClass}>
                    {dr.receiptCashAmount !== null
                      ? fmtAmt(dr.receiptCashAmount)
                      : "-"}
                  </td>
                  <td className={drCellClass}>
                    {dr.receiptPlaColumn !== null
                      ? fmtAmt(dr.receiptPlaColumn)
                      : "-"}
                  </td>
                  <td className={drCellClass}>
                    {fmt(dr.receiptClassification)}
                  </td>

                  {/* CR side */}
                  <td className={`${crCellClass} py-2`}>
                    {fmt(cr.disbursementDate)}
                  </td>
                  <td className={crCellClass}>{fmt(cr.voucherNo)}</td>
                  <td className={crCellClass}>
                    {fmt(cr.disbursementCounterfoilNo)}
                  </td>
                  <td
                    className={`${isCrTotal ? "border border-black bg-gray-300 font-bold" : "border border-black"} px-2 text-left`}>
                    {fmt(cr.disbursementDetails)}
                  </td>
                  <td className={crCellClass}>
                    {cr.disbursementCashAmount !== null
                      ? fmtAmt(cr.disbursementCashAmount)
                      : "-"}
                  </td>
                  <td className={crCellClass}>{fmt(cr.chequeNo)}</td>
                  <td className={crCellClass}>
                    {cr.plaColumnPayment !== null
                      ? fmtAmt(cr.plaColumnPayment)
                      : "-"}
                  </td>
                  <td className={crCellClass}>
                    {fmt(cr.treasuryClassification)}
                  </td>
                </tr>
              );
            })}

            {/* Totals row */}
            {zippedRows.length > 0 && (
              <tr className="font-bold bg-gray-400 border border-black">
                <td
                  colSpan={4}
                  className="border border-black px-2 py-2 text-right">
                  TOTAL
                </td>
                <td className="border border-black px-1">
                  {fmtAmt(periodTotals.receiptCashColumn)}
                </td>
                <td className="border border-black px-1">
                  {fmtAmt(periodTotals.receiptTreasuryPla)}
                </td>
                <td className="border border-black px-1"></td>
                {/* CR totals */}
                <td colSpan={4} className="border border-black px-2 text-right">
                  TOTAL
                </td>
                <td className="border border-black px-1">
                  {fmtAmt(periodTotals.disbursementCashColumn)}
                </td>
                <td className="border border-black px-1"></td>
                <td className="border border-black px-1">
                  {fmtAmt(periodTotals.disbursementTreasuryPla)}
                </td>
                <td className="border border-black px-1"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="px-4 py-4 tracking-wide flex justify-between font-semibold">
        <p>Cashier</p>
        <p>Officer i/c of the Cash Book</p>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      {/* Closing Balance summary — shown for every filter (single day,
          custom range, or full financial year) since it's derived
          from the same period totals used above. */}
      <ClosingBalanceSection
        sector={sector}
        from={from}
        to={to}
        totals={periodTotals}
      />
    </div>
  );
};

export default Form1;
