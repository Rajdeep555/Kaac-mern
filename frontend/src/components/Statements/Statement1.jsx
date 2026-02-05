import React from "react";

const revenueReceipt = ["325500", "245404337"];
const expenditure_revenue = ["31089224", "550540744"];
const revenueDeficit = ["30763724", "305136407"];
const revenueSurplus = ["0", "0"];

// --- Capital (Council Sector) ---
const totalCapitalReceipts = ["0", "0"];
const capitalDeficit = ["0", "0"];
const totalExpenditureCapital = ["0", "0"];
const capitalSurplus = ["0", "0"];

// --- Debt (Receipts Side) ---
const loanFromStateGovt = ["0", "0"];
const loanFromOtherSources = ["0", "0"];
const recoveriesOfLoans = ["134352", "790740"];
const recoveriesOfAdvances = ["0", "0"];
const totalRecoveries = ["134352", "790740"];

// --- Debt (Disbursements Side) ---
const repaymentLoanStateGovt = ["0", "0"];
const repaymentLoanOtherSources = ["0", "0"];
const disbursementOfLoans = ["0", "0"];
const disbursementOfAdvances = ["0", "0"];
const totalDisbursementLoans = ["0", "0"];

// --- Total Part-I (District Fund) ---
const totalReceiptPart1 = ["459852", "246195077"];
const totalDisbursementPart1 = ["31089224", "550540744"];

// --- Receipts Side ---
const fundsReceivedDeposits = ["0", "0"];
const taxesDeductedSource = ["142307", "5355674"];
const securityDepositsDeducted = ["0", "5292751"];
const otherRecoveries = ["57685", "250600"];
const totalReceiptPart2 = ["199992", "10899025"];

// --- Disbursements Side ---
const expenditureAgainstDeposits = ["0", "0"];
const depositTaxesDeducted = ["142307", "5355674"];
const securityDepositsRefunded = ["578900", "2349000"];
const otherDeposits = ["0", "0"];
const totalDisbursementPart2 = ["721207", "7704674"];

// --- Summary Totals ---
const totalReceipts = ["659844", "257094102"];
const totalDisbursements = ["31810431", "558245418"];

// --- Closing/Opening Balances ---
const cashBalance = ["0", "0"]; // Appears on both sides
const treasuryBalanceReceiptSide = ["0", "-31150587"];
const treasuryBalanceDisbursementSide = ["-31150587", "-332301903"];

// --- Grand Total ---
const grandTotal = ["659844", "225943515"];

const numbers = ["(1)", "(2)", "(3)", "(4)", "(5)", "(6)"];

const Statement1 = () => {
  const Total = revenueReceipt.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="w-full overflow-x-auto border-2 bg-white">
      <div className="flex flex-col items-center py-2">
        <h1 className="font-bold text-lg">STATEMENT NO. 1</h1>
        <h2 className="py-2 font-semibold">
          Summary of Transactions (Council Sector Only)
        </h2>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />
      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-280 mx-4 border border-black text-[11px] text-center ">
          <thead>
            <tr className="border ">
              <th rowSpan={2} className="w-1/4 py-2">
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
              <th className="border">2024-2025</th>
              <th className="py-2">2025-2026</th>

              <th className="border">2024-2025</th>
              <th>2025-2026</th>
            </tr>
            <tr>
              {numbers.map((num, index) => {
                return (
                  <th key={index} className="border py-2">
                    {num}
                  </th>
                );
              })}
            </tr>
            <tr>
              <th colSpan={3} className="border py-2">
                Part-I District Fund
              </th>
              <th colSpan={3} className="border py-2"></th>
            </tr>
          </thead>
          <tbody>

            {/* Part I Revenue (Council Sector) */}
            <tr>
              <td colSpan={3} className="border py-2 font-semibold text-start px-4 text-sm">
                1.Revenue (Council Sector)
              </td>
            </tr>
            <tr>
              <td className="border py-2 font-medium">Total Revenue Receipt</td>
              {revenueReceipt.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">
                Total Expenditure on Revenue Account
              </td>
              {expenditure_revenue.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border py-2 font-medium">Revenue Deficit</td>
              {revenueDeficit.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">Revenue Surplus</td>
              {revenueSurplus.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>

            {/* Capital (Council Sector) */}
            <tr>
              <td colSpan={3} className="border py-2 font-semibold text-start px-4 text-sm">
                2.Capital (Council Sector)
              </td>
            </tr>
            <tr>
              <td className="border py-2 font-medium">Total Capital Receipt</td>
              {totalCapitalReceipts.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">
                Total Expenditure on Capital Account
              </td>
              {totalExpenditureCapital.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border py-2 font-medium">Capital Deficit</td>
              {capitalDeficit.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">
                Capital Surplus
              </td>
              {capitalSurplus.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>

            {/* Debt */}
            <tr>
              <td colSpan={3} className="border py-2 font-semibold text-start px-4 text-sm">
                2.Debt
              </td>
            </tr>
            <tr>
              <td className="border py-2 font-medium">Loans Received from State Govt</td>
              {loanFromStateGovt.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">
                Repayment of Loan Received from State Govt
              </td>
              {repaymentLoanStateGovt.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border py-2 font-medium">Loan Received from other sources</td>
              {loanFromOtherSources.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">
                Repayments of Loan Received from other sources
              </td>
              {repaymentLoanOtherSources.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border py-2 font-medium">Recoveries of Loans</td>
              {recoveriesOfLoans.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">
                Disbursements of Loans
              </td>
              {disbursementOfLoans.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border py-2 font-medium">Recoveries of Advances</td>
              {recoveriesOfAdvances.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">
                Disbursements of Advances
              </td>
              {disbursementOfAdvances.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border py-2 font-medium">Total Recoveries of Loans and Advances</td>
              {totalRecoveries.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">
                Total Disbursement of Loans and Advances
              </td>
              {totalDisbursementLoans.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>
            {/* Total Receipt and Disbursement */}
            <tr>
              <td className="border py-2 font-medium text-sm">Total Receipt (Part-I District Fund)</td>
              {totalReceiptPart1.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium text-sm">
                Total Disbursement (Part-I District Fund)
              </td>
              {totalDisbursementPart1.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>

            {/* Part-II (Deposit Fund) */}
            <tr>
              <td colSpan={3} className="border py-2 font-semibold text-center px-4 text-sm">
                Part-II Deposit Fund
              </td>
            </tr>

            <tr>
              <td className="border py-2 font-medium">Funds Received as Deposit</td>
              {fundsReceivedDeposits.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">
                Expenditure Against Deposit
              </td>
              {expenditureAgainstDeposits.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>

            <tr>
              <td className="border py-2 font-medium">Taxes Deducted at Source</td>
              {taxesDeductedSource.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">
                Deposit of Taxes Deducted at Source
              </td>
              {depositTaxesDeducted.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>

            <tr>
              <td className="border py-2 font-medium">Security Deposits Deducted</td>
              {securityDepositsDeducted.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">
                Security Deposits Refunded
              </td>
              {securityDepositsRefunded.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>

            <tr>
              <td className="border py-2 font-medium">Other Recoveries</td>
              {otherRecoveries.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">
                Other Deposits
              </td>
              {otherDeposits.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>
            {/* Total Receipt and Deposit (Part-II) */}
            <tr>
              <td className="border py-2 font-medium text-sm">Total Receipt (Part-II Deposit)</td>
              {totalReceiptPart2.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium text-sm">
                Total Disbursement (Part-II)
              </td>
              {totalDisbursementPart2.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>

            {/* Grand Totals & Balances */}
            <tr>
              <td className="border py-2 font-medium text-sm">Total Receipt</td>
              {totalReceipts.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium text-sm">
                Total Disbursement
              </td>
              {totalDisbursements.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>

            <tr>
              <td className="border py-2 font-medium">Opening Balance</td>
              {otherRecoveries.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">
                Closing Balance
              </td>
              {otherDeposits.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>

            <tr>
              <td className="border py-2 font-medium">Cash Balance</td>
              {cashBalance.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">
                Cash Balance
              </td>
              {cashBalance.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>

            <tr>
              <td className="border py-2 font-medium">Treasury Balance as Cash Book</td>
              {treasuryBalanceReceiptSide.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium">
                Treasury Balance as Cash Book (Disbursement Side)
              </td>
              {treasuryBalanceDisbursementSide.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>

            {/* Grand Total */}
            <tr>
              <td className="border py-2 font-medium text-sm">Grand Total</td>
              {grandTotal.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
              <td className="border font-medium text-sm">
                Grand Total
              </td>
              {grandTotal.map((row, index) => (
                <td className="border" key={index}>
                  {row}
                </td>
              ))}
            </tr>

          </tbody>
        </table>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />
      <div className="px-4 py-2 text-start tracking-wide">
        <p>Explanatory Notes</p>
      </div>
    </div>
  );
};

export default Statement1;