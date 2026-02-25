import React, { useMemo, useEffect, useRef, useState } from "react";
import { useCashbook } from "../../hooks/admin/useCashbook";
import { useCashbookSummary } from "../../hooks/admin/useCashbookSummary";
import { showToast } from "../../utils/toast.js";

// ── Helpers ──────────────────────────────────────────────────
const splitRows = (data) => ({
  drRows: data.filter((r) => r.receiptDate !== null),
  crRows: data.filter((r) => r.disbursementDate !== null),
});

const emptyDr = {
  receiptDate: null,
  receiptItemNo: null,
  receiptCounterfoilNo: null,
  receiptParticulars: null,
  receiptCashAmount: null,
  receiptPlaColumn: null,
  receiptClassification: null,
};

const emptyCr = {
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

  data.forEach((row) => {
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

// ─────────────────────────────────────────────────────────────
const Form1 = ({ data: dataProp = [], title, sector, year = 2025 }) => {
  const { save, saving } = useCashbookSummary();

  // Track if we've already saved for this sector+year session
  const hasSaved = useRef(false);

  // Status label shown to user during save
  const [saveStatus, setSaveStatus] = useState(null);
  // "calculating" | "inserting" | null

  const {
    data: councilData,
    loading: councilLoading,
    error: councilError,
  } = useCashbook(
    { year, sector: "COUNCIL" },
    { enabled: sector === "COUNCIL" || sector === "CONSOLIDATED" },
  );

  const {
    data: stateData,
    loading: stateLoading,
    error: stateError,
  } = useCashbook(
    { year, sector: "STATE" },
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
    // Only run when data is loaded, not empty, and not already saved
    if (loading || error || rawData.length === 0 || hasSaved.current) return;

    const runSave = async () => {
      hasSaved.current = true; // prevent double-save

      try {
        // Step 1 — Calculating
        setSaveStatus("calculating");
        // Small delay so user sees the label
        await new Promise((r) => setTimeout(r, 800));

        const totals = calculateTotals(rawData);

        // Current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();
        const financialYear = `${year}-${year + 1}`;

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
  }, [loading, rawData, sector, year]);

  // Reset hasSaved when sector or year changes
  useEffect(() => {
    hasSaved.current = false;
  }, [sector, year]);

  // ── Split and zip rows ───────────────────────────────────
  const { drRows, crRows } = useMemo(() => splitRows(rawData), [rawData]);
  const maxLen = Math.max(drRows.length, crRows.length);
  const zippedRows = Array.from({ length: maxLen }, (_, i) => ({
    dr: drRows[i] ?? emptyDr,
    cr: crRows[i] ?? emptyCr,
    key: `row-${i}`,
  }));

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

  if (loading) {
    return (
      <div className="w-full border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 1 data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full border-2 bg-white p-8 text-center">
        <p className="font-medium text-red-600">
          Failed to load cashbook data. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border-2">
      {/* Header */}
      <div className="py-4 text-center font-semibold">
        <h1 className="text-xl font-bold">Form No. 1</h1>
        {sector && <p className="text-sm text-gray-600">Sector: {sector}</p>}
        <p>{getTitle()}</p>
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

            {zippedRows.map(({ dr, cr, key }) => (
              <tr key={key} className="border border-black">
                {/* DR side */}
                <td className="border border-black py-2 px-1">
                  {fmt(dr.receiptItemNo)}
                </td>
                <td className="border border-black px-1">
                  {fmt(dr.receiptCounterfoilNo)}
                </td>
                <td className="border border-black px-1">
                  {fmt(dr.receiptDate)}
                </td>
                <td className="border border-black px-2 text-left">
                  {fmt(dr.receiptParticulars)}
                </td>
                <td className="border border-black px-1">
                  {dr.receiptCashAmount !== null
                    ? fmtAmt(dr.receiptCashAmount)
                    : "-"}
                </td>
                <td className="border border-black px-1">
                  {dr.receiptPlaColumn !== null
                    ? fmtAmt(dr.receiptPlaColumn)
                    : "-"}
                </td>
                <td className="border border-black px-1">
                  {fmt(dr.receiptClassification)}
                </td>

                {/* CR side */}
                <td className="border border-black py-2 px-1">
                  {fmt(cr.disbursementDate)}
                </td>
                <td className="border border-black px-1">
                  {fmt(cr.voucherNo)}
                </td>
                <td className="border border-black px-1">
                  {fmt(cr.disbursementCounterfoilNo)}
                </td>
                <td className="border border-black px-2 text-left">
                  {fmt(cr.disbursementDetails)}
                </td>
                <td className="border border-black px-1">
                  {cr.disbursementCashAmount !== null
                    ? fmtAmt(cr.disbursementCashAmount)
                    : "-"}
                </td>
                <td className="border border-black px-1">{fmt(cr.chequeNo)}</td>
                <td className="border border-black px-1">
                  {cr.plaColumnPayment !== null
                    ? fmtAmt(cr.plaColumnPayment)
                    : "-"}
                </td>
                <td className="border border-black px-1">
                  {fmt(cr.treasuryClassification)}
                </td>
              </tr>
            ))}

            {/* Totals row */}
            {zippedRows.length > 0 &&
              (() => {
                const t = calculateTotals(rawData);
                return (
                  <tr className="font-bold bg-gray-100 border border-black">
                    <td
                      colSpan={4}
                      className="border border-black px-2 py-2 text-right">
                      TOTAL
                    </td>
                    <td className="border border-black px-1">
                      {fmtAmt(t.receiptCashColumn)}
                    </td>
                    <td className="border border-black px-1">
                      {fmtAmt(t.receiptTreasuryPla)}
                    </td>
                    <td className="border border-black px-1"></td>
                    {/* CR totals */}
                    <td
                      colSpan={4}
                      className="border border-black px-2 text-right">
                      TOTAL
                    </td>
                    <td className="border border-black px-1">
                      {fmtAmt(t.disbursementCashColumn)}
                    </td>
                    <td className="border border-black px-1"></td>
                    <td className="border border-black px-1">
                      {fmtAmt(t.disbursementTreasuryPla)}
                    </td>
                    <td className="border border-black px-1"></td>
                  </tr>
                );
              })()}
          </tbody>
        </table>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="px-4 py-4 tracking-wide flex justify-between font-semibold">
        <p>Cashier</p>
        <p>Officer i/c of the Cash Book</p>
      </div>
    </div>
  );
};

export default Form1;
