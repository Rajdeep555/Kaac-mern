import React from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useStatement1 } from "../../hooks/admin/useStatement1";

// Renders a ₹ amount cell
const AmountCell = ({ value, bold = false, className = "" }) => (
  <td className={`border px-2 py-1 ${bold ? "font-bold" : ""} ${className}`}>
    <span className="flex items-center justify-center gap-0.5">
      <LiaRupeeSignSolid />
      {Number(value ?? 0).toFixed(2)}
    </span>
  </td>
);

// Renders a pair [prevFY, currFY] as two amount cells
const PairCells = ({ pair, bold = false }) => (
  <>
    <AmountCell value={pair?.[0]} bold={bold} />
    <AmountCell value={pair?.[1]} bold={bold} />
  </>
);

// A standard data row: label | prev | curr | label | prev | curr
const DataRow = ({
  receiptLabel,
  receiptPair,
  disbursementLabel,
  disbursementPair,
  bold = false,
}) => (
  <tr>
    <td
      className={`border px-4 py-1 ${bold ? "font-bold text-sm" : "font-medium"}`}>
      {receiptLabel}
    </td>
    <PairCells pair={receiptPair} bold={bold} />
    <td
      className={`border px-4 py-1 ${bold ? "font-bold text-sm" : "font-medium"}`}>
      {disbursementLabel}
    </td>
    <PairCells pair={disbursementPair} bold={bold} />
  </tr>
);

// A section header row spanning all 6 columns
const SectionHeader = ({ label, align = "start" }) => (
  <tr>
    <td
      colSpan={6}
      className={`border py-2 font-semibold text-sm px-4 bg-gray-50 text-${align}`}>
      {label}
    </td>
  </tr>
);

const Statement1 = ({ sector, financialYear }) => {
  const {
    statement1Data: d,
    loading,
    error,
  } = useStatement1({
    sector,
    financialYear,
  });

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Statement 1 data...</p>
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

  const prevFY = d.financialYear?.previous ?? "Previous Year";
  const currFY = d.financialYear?.current ?? "Current Year";

  return (
    <div className="w-full overflow-x-auto border-2 bg-white">
      <div className="flex flex-col items-center py-2">
        <h1 className="font-bold text-lg">STATEMENT NO. 1</h1>
        {sector && (
          <p className="text-sm font-medium text-gray-600">Sector: {sector}</p>
        )}
        <h2 className="py-2 font-semibold">Summary of Transactions</h2>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-280 mx-4 border border-black text-[11px] text-center">
          <thead>
            {/* Column headers */}
            <tr className="border">
              <th rowSpan={2} className="border w-1/4 py-2">
                RECEIPTS
              </th>
              <th colSpan={2} className="border py-2 w-1/4">
                ACTUAL
              </th>
              <th rowSpan={2} className="border w-1/4">
                DISBURSEMENTS
              </th>
              <th colSpan={2} className="border w-1/4">
                ACTUAL
              </th>
            </tr>
            <tr>
              <th className="border py-2">{prevFY}</th>
              <th className="border py-2">{currFY}</th>
              <th className="border py-2">{prevFY}</th>
              <th className="border py-2">{currFY}</th>
            </tr>
            <tr>
              {["(1)", "(2)", "(3)", "(4)", "(5)", "(6)"].map((n) => (
                <th key={n} className="border py-2">
                  {n}
                </th>
              ))}
            </tr>
            <tr>
              <th colSpan={3} className="border py-2 font-bold">
                Part-I District Fund
              </th>
              <th colSpan={3} className="border py-2" />
            </tr>
          </thead>

          <tbody>
            {/* ── Part I: Revenue ── */}
            <SectionHeader label="1. Revenue" />
            <DataRow
              receiptLabel="Total Revenue Receipts"
              receiptPair={d.revenueReceipts}
              disbursementLabel="Total Expenditure on Revenue Account"
              disbursementPair={d.revenueExpenditure}
            />
            <DataRow
              receiptLabel="Revenue Deficit"
              receiptPair={d.revenueDeficit}
              disbursementLabel="Revenue Surplus"
              disbursementPair={d.revenueSurplus}
            />

            {/* ── Part I: Capital ── */}
            <SectionHeader label="2. Capital" />
            <DataRow
              receiptLabel="Total Capital Receipts"
              receiptPair={d.capitalReceipts}
              disbursementLabel="Total Expenditure on Capital Account"
              disbursementPair={d.capitalExpenditure}
            />
            <DataRow
              receiptLabel="Capital Deficit"
              receiptPair={d.capitalDeficit}
              disbursementLabel="Capital Surplus"
              disbursementPair={d.capitalSurplus}
            />

            {/* ── Part I: Debt ── */}
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

            {/* ── Part II: Deposit Fund ── */}
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

            {/* ── Grand Totals & Balances ── */}
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

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="px-4 py-2 text-start tracking-wide">
        <p className="font-semibold">Explanatory Notes</p>
      </div>
    </div>
  );
};

export default Statement1;
