import React from "react";
import { useStatement1 } from "../../hooks/admin/useStatement1";
import { Loader } from "../ui/Loader";

// Convert date into Indian Financial Year format
// Example:
// 2025-04-01 -> 2025-2026
const getFinancialYear = (date) => {
  if (!date) return "";

  const dateString = String(date);

  const year = Number(dateString.slice(0, 4));
  const month = Number(dateString.slice(5, 7));

  if (!year || !month) return "";

  const startYear = month >= 4 ? year : year - 1;

  return `${startYear}-${startYear + 1}`;
};

// Renders an amount cell
const AmountCell = ({ value, bold = false, className = "" }) => (
  <td
    className={`border px-2 py-1 text-right ${
      bold ? "font-bold" : ""
    } ${className}`}>
    {Number(value ?? 0).toFixed(2)}
  </td>
);

// Renders a pair [previousFY, currentFY]
const PairCells = ({ pair, bold = false }) => (
  <>
    <AmountCell value={pair?.[0]} bold={bold} />
    <AmountCell value={pair?.[1]} bold={bold} />
  </>
);

// Standard data row
// label | previous | current | label | previous | current
const DataRow = ({
  receiptLabel,
  receiptPair,
  disbursementLabel,
  disbursementPair,
  bold = false,
}) => (
  <tr>
    {/* Receipt label */}
    <td
      className={`border px-4 py-1 text-left ${
        bold ? "font-bold text-sm" : "font-medium"
      }`}>
      {receiptLabel}
    </td>

    {/* Receipt amounts */}
    <PairCells pair={receiptPair} bold={bold} />

    {/* Disbursement label */}
    <td
      className={`border px-4 py-1 text-left ${
        bold ? "font-bold text-sm" : "font-medium"
      }`}>
      {disbursementLabel}
    </td>

    {/* Disbursement amounts */}
    <PairCells pair={disbursementPair} bold={bold} />
  </tr>
);

// Section header
const SectionHeader = ({ label, align = "left" }) => (
  <tr>
    <td
      colSpan={6}
      className={`border py-2 font-semibold text-sm px-4 text-${align} bg-gray-50`}>
      {label}
    </td>
  </tr>
);

const Statement1 = ({ sector, dateRange }) => {
  const {
    statement1Data: d,
    loading,
    error,
  } = useStatement1({
    sector,
    dateRange,
  });

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-red-600">
          Failed to load data. Please try again.
        </p>
      </div>
    );
  }

  /*
   * Generate current financial year dynamically
   *
   * Example:
   * 2025-04-01 -> 2025-2026
   */
  const currentFY = getFinancialYear(dateRange?.from);

  /*
   * Generate previous financial year dynamically
   *
   * Example:
   * currentFY = 2025-2026
   * previousFY = 2024-2025
   */
  const previousFY = currentFY
    ? `${Number(currentFY.slice(0, 4)) - 1}-${Number(currentFY.slice(0, 4))}`
    : "Previous Year";

  // CONSOLIDATED requests come back with a sectorBreakdown (COUNCIL/STATE
  // split). When that's present, the combined "Total Revenue Receipts" /
  // "Total Expenditure on Revenue Account" and "Total Capital Receipts" /
  // "Total Expenditure on Capital Account" rows are hidden — the
  // COUNCIL/STATE breakdown rows below already cover that same data.
  // Revenue/Capital Deficit and Surplus combined rows are unaffected and
  // still shown either way.
  const isConsolidated = Boolean(d.sectorBreakdown);

  return (
    <div className="w-full overflow-x-auto border-2 bg-white">
      {/* =========================
          STATEMENT HEADER
      ========================== */}
      <div className="flex flex-col items-center py-2">
        <h1 className="font-bold text-lg">STATEMENT NO. 1</h1>

        <h2 className="py-2 font-semibold">Summary of Transactions</h2>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      {/* =========================
          TABLE
      ========================== */}
      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-280 mx-4 border border-black text-[11px]">
          {/* =========================
              TABLE HEADER
          ========================== */}
          <thead>
            {/* Main headings */}
            <tr className="border text-center">
              <th rowSpan={2} className="border w-1/4 py-2 text-center">
                RECEIPTS
              </th>

              <th colSpan={2} className="border py-2 w-1/4 text-center">
                ACTUAL
              </th>

              <th rowSpan={2} className="border w-1/4 py-2 text-center">
                DISBURSEMENTS
              </th>

              <th colSpan={2} className="border py-2 w-1/4 text-center">
                ACTUAL
              </th>
            </tr>

            {/* Financial Year */}
            <tr className="text-center">
              <th className="border py-2 text-center">{previousFY}</th>

              <th className="border py-2 text-center">
                {currentFY || "Current Year"}
              </th>

              <th className="border py-2 text-center">{previousFY}</th>

              <th className="border py-2 text-center">
                {currentFY || "Current Year"}
              </th>
            </tr>

            {/* Column numbers */}
            <tr className="text-center">
              {["(1)", "(2)", "(3)", "(4)", "(5)", "(6)"].map((n) => (
                <th key={n} className="border py-2 text-center">
                  {n}
                </th>
              ))}
            </tr>

            {/* =========================
                PART-I DISTRICT FUND
                FULL 6 COLUMN ROW
            ========================== */}
            <tr>
              <th colSpan={6} className="border py-2 font-bold text-center">
                Part-I District Fund
              </th>
            </tr>
          </thead>

          {/* =========================
              TABLE BODY
          ========================== */}
          <tbody>
            {/* =========================
                PART I - REVENUE
            ========================== */}
            <SectionHeader label="1. Revenue" />

            {!isConsolidated && (
              <DataRow
                receiptLabel="Total Revenue Receipts"
                receiptPair={d.revenueReceipts}
                disbursementLabel="Total Expenditure on Revenue Account"
                disbursementPair={d.revenueExpenditure}
              />
            )}

            {!isConsolidated && (
              <DataRow
                receiptLabel="Revenue Deficit"
                receiptPair={d.revenueDeficit}
                disbursementLabel="Revenue Surplus"
                disbursementPair={d.revenueSurplus}
              />
            )}

            {/* CONSOLIDATED - COUNCIL / STATE */}
            {d.sectorBreakdown && (
              <>
                <DataRow
                  receiptLabel="Total Revenue Receipts (COUNCIL)"
                  receiptPair={d.sectorBreakdown.council.revenueReceipts}
                  disbursementLabel="Total Expenditure on Revenue Account (COUNCIL)"
                  disbursementPair={
                    d.sectorBreakdown.council.revenueExpenditure
                  }
                />

                <DataRow
                  receiptLabel="Revenue Deficit (COUNCIL)"
                  receiptPair={d.sectorBreakdown.council.revenueDeficit}
                  disbursementLabel="Revenue Surplus (COUNCIL)"
                  disbursementPair={d.sectorBreakdown.council.revenueSurplus}
                />

                <DataRow
                  receiptLabel="Total Revenue Receipts (STATE)"
                  receiptPair={d.sectorBreakdown.state.revenueReceipts}
                  disbursementLabel="Total Expenditure on Revenue Account (STATE)"
                  disbursementPair={d.sectorBreakdown.state.revenueExpenditure}
                />

                <DataRow
                  receiptLabel="Revenue Deficit (STATE)"
                  receiptPair={d.sectorBreakdown.state.revenueDeficit}
                  disbursementLabel="Revenue Surplus (STATE)"
                  disbursementPair={d.sectorBreakdown.state.revenueSurplus}
                />
              </>
            )}

            {/* =========================
                PART I - CAPITAL
            ========================== */}
            <SectionHeader label="2. Capital" />

            {!isConsolidated && (
              <DataRow
                receiptLabel="Total Capital Receipts"
                receiptPair={d.capitalReceipts}
                disbursementLabel="Total Expenditure on Capital Account"
                disbursementPair={d.capitalExpenditure}
              />
            )}

            {!isConsolidated && (
              <DataRow
                receiptLabel="Capital Deficit"
                receiptPair={d.capitalDeficit}
                disbursementLabel="Capital Surplus"
                disbursementPair={d.capitalSurplus}
              />
            )}

            {/* CONSOLIDATED - COUNCIL / STATE */}
            {d.sectorBreakdown && (
              <>
                <DataRow
                  receiptLabel="Total Capital Receipts (COUNCIL)"
                  receiptPair={d.sectorBreakdown.council.capitalReceipts}
                  disbursementLabel="Total Expenditure on Capital Account (COUNCIL)"
                  disbursementPair={
                    d.sectorBreakdown.council.capitalExpenditure
                  }
                />

                <DataRow
                  receiptLabel="Capital Deficit (COUNCIL)"
                  receiptPair={d.sectorBreakdown.council.capitalDeficit}
                  disbursementLabel="Capital Surplus (COUNCIL)"
                  disbursementPair={d.sectorBreakdown.council.capitalSurplus}
                />

                <DataRow
                  receiptLabel="Total Capital Receipts (STATE)"
                  receiptPair={d.sectorBreakdown.state.capitalReceipts}
                  disbursementLabel="Total Expenditure on Capital Account (STATE)"
                  disbursementPair={d.sectorBreakdown.state.capitalExpenditure}
                />

                <DataRow
                  receiptLabel="Capital Deficit (STATE)"
                  receiptPair={d.sectorBreakdown.state.capitalDeficit}
                  disbursementLabel="Capital Surplus (STATE)"
                  disbursementPair={d.sectorBreakdown.state.capitalSurplus}
                />
              </>
            )}

            {/* =========================
                PART I - DEBT
            ========================== */}
            <SectionHeader label="3. Debt" />

            <DataRow
              receiptLabel="Loans Received from State Govt"
              receiptPair={d.loanStateGovt}
              disbursementLabel="Repayment of Loan Received from State Govt"
              disbursementPair={d.loanRepayGovt}
            />

            <DataRow
              receiptLabel="Loan Received from Other Sources"
              receiptPair={d.loanOtherSources}
              disbursementLabel="Repayment of Loan Received from Other Sources"
              disbursementPair={d.loanRepayOther}
            />

            <DataRow
              receiptLabel="Recoveries of Loans"
              receiptPair={d.recoveriesLoans}
              disbursementLabel="Disbursement of Loans"
              disbursementPair={d.disbursementLoans}
            />

            <DataRow
              receiptLabel="Recoveries of Advances"
              receiptPair={d.recoveriesAdvances}
              disbursementLabel="Disbursement of Advances"
              disbursementPair={d.disbursementAdvances}
            />

            <DataRow
              receiptLabel="Total Recoveries of Loans and Advances"
              receiptPair={d.totalRecoveriesLoansAdvances}
              disbursementLabel="Total Disbursement of Loans and Advances"
              disbursementPair={d.totalDisbursementLoansAdvances}
              bold
            />

            <DataRow
              receiptLabel="Total Receipt (Part-I District Fund)"
              receiptPair={d.totalReceiptPart1}
              disbursementLabel="Total Disbursement (Part-I District Fund)"
              disbursementPair={d.totalDisbursementPart1}
              bold
            />

            {/* =========================
                PART II - DEPOSIT FUND
            ========================== */}
            <SectionHeader label="Part-II Deposit Fund" align="center" />

            <DataRow
              receiptLabel="Funds Received as Deposits"
              receiptPair={d.fundsReceivedDeposits}
              disbursementLabel="Expenditure Against Deposits"
              disbursementPair={d.expenditureAgainstDeposits}
            />

            <DataRow
              receiptLabel="Taxes Deducted at Source"
              receiptPair={d.taxesDeducted}
              disbursementLabel="Deposit of Taxes Deducted at Source"
              disbursementPair={d.taxesDeductedDisbursement}
            />

            <DataRow
              receiptLabel="Security Deposits Deducted"
              receiptPair={d.securityDeducted}
              disbursementLabel="Security Deposits Refunded"
              disbursementPair={d.securityRefunded}
            />

            <DataRow
              receiptLabel="Other Recoveries"
              receiptPair={d.otherRecoveries}
              disbursementLabel="Other Deposits"
              disbursementPair={d.otherDeposits}
            />

            <DataRow
              receiptLabel="Total Receipt (Part-II Deposit)"
              receiptPair={d.totalReceiptPart2}
              disbursementLabel="Total Disbursement (Part-II)"
              disbursementPair={d.totalDisbursementPart2}
              bold
            />

            {/* =========================
                GRAND TOTALS
            ========================== */}
            <DataRow
              receiptLabel="Total Receipts"
              receiptPair={d.totalReceipts}
              disbursementLabel="Total Disbursements"
              disbursementPair={d.totalDisbursements}
              bold
            />

            <DataRow
              receiptLabel="Opening Balance (Cash)"
              receiptPair={d.openingCashBalance}
              disbursementLabel="Closing Balance (Cash)"
              disbursementPair={d.closingCashBalance}
            />

            <DataRow
              receiptLabel="Treasury Balance as Cash Book"
              receiptPair={d.treasuryBalanceReceiptSide}
              disbursementLabel="Treasury Balance as Cash Book"
              disbursementPair={d.treasuryBalanceDisbursementSide}
            />

            <DataRow
              receiptLabel="Grand Total"
              receiptPair={d.grandTotalReceipt}
              disbursementLabel="Grand Total"
              disbursementPair={d.grandTotalDisbursement}
              bold
            />
          </tbody>
        </table>
      </div>

      {/* =========================
          EXPLANATORY NOTES
      ========================== */}
      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="px-4 py-2 text-left tracking-wide">
        <p className="font-semibold">Explanatory Notes</p>
      </div>
    </div>
  );
};

export default Statement1;
