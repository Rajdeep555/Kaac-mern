import React from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useStatement7 } from "../../hooks/admin/useStatement7";

const AmountCell = ({ value, bold = false }) => (
  <td className={`border px-4 py-2 ${bold ? "font-bold" : ""}`}>
    <span className="flex items-center justify-center gap-1">
      <LiaRupeeSignSolid />
      {Number(value ?? 0).toFixed(2)}
    </span>
  </td>
);

const Statement7 = ({ sector }) => {
  const { statement7Data, loading, error } = useStatement7({ sector });

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Statement 7 data...</p>
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

  const grandTotal = (statement7Data ?? []).reduce(
    (sum, item) => sum + Number(item.closingBalance ?? 0),
    0,
  );

  return (
    <div className="w-full overflow-x-auto border-2 bg-white">
      <div className="flex flex-col items-center py-4">
        <h1 className="font-bold text-lg">STATEMENT NO. 7</h1>
        {sector && (
          <p className="text-sm font-medium text-gray-600">Sector: {sector}</p>
        )}
        <h2 className="py-4 font-semibold text-center px-4">
          Statement of Receipts, Disbursements and balance under heads relating
          to District Fund and Deposit Fund
        </h2>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-280 mx-auto border border-black text-[11px] text-center">
          <thead>
            <tr>
              <th className="border font uppercase tracking-wide py-2">
                Head of Account
              </th>
              <th className="border font uppercase tracking-wide py-2">
                Opening Balance
              </th>
              <th className="border font uppercase tracking-wide py-2">
                Receipts
              </th>
              <th className="border font uppercase tracking-wide py-2">
                Disbursement
              </th>
              <th className="border font uppercase tracking-wide py-2">
                Closing Balance
              </th>
            </tr>
          </thead>

          <tbody>
            {(!statement7Data || statement7Data.length === 0) && (
              <tr>
                <td colSpan={5} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {statement7Data?.map((item) => (
              <tr key={item.id} className="border">
                <td className="border px-4 py-2">{item.headOfAccount}</td>
                <AmountCell value={item.openingBalance} />
                <AmountCell value={item.receipts} />
                <AmountCell value={item.disbursement} />
                <AmountCell value={item.closingBalance} />
              </tr>
            ))}

            {/* Grand Total */}
            {statement7Data && statement7Data.length > 0 && (
              <tr className="bg-gray-300 border">
                <td className="border px-4 py-3 text-right font-bold tracking-wider text-sm">
                  GRAND TOTAL
                </td>
                <td className="border" />
                <td className="border" />
                <td className="border" />
                <AmountCell value={grandTotal} bold />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="px-4 py-2 text-start tracking-wide">
        <p className="font-semibold">Explanatory Notes</p>
        <p>
          <span className="font-medium">Notes:</span> Other Statements as
          thought necessary may be proposed when the first accounts are actually
          prepared.
        </p>
      </div>
    </div>
  );
};

export default Statement7;
