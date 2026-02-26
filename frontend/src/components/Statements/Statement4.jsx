import React from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useStatement4 } from "../../hooks/admin/useStatement4";

const AmountCell = ({ value, bold = false }) => (
  <td className={`border px-4 py-2 ${bold ? "font-bold" : ""}`}>
    <span className="flex items-center justify-center gap-1">
      <LiaRupeeSignSolid />
      {Number(value ?? 0).toFixed(2)}
    </span>
  </td>
);

const Statement4 = ({ sector }) => {
  const { statement4Data, loading, error } = useStatement4({ sector });

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Statement 4 data...</p>
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

  const { rows, total } = statement4Data;

  return (
    <div className="w-full overflow-x-auto border-2 bg-white">
      <div className="flex flex-col items-center py-4">
        <h1 className="font-bold text-lg">STATEMENT NO. 4</h1>
        {sector && (
          <p className="text-sm font-medium text-gray-600">Sector: {sector}</p>
        )}
        <h2 className="py-4 font-semibold">
          Loans and Advances by the Council
        </h2>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-280 mx-4 border border-black text-[11px] text-center">
          <thead>
            <tr>
              <th className="border font uppercase tracking-wide px-2 py-2">
                Categories of <br /> Loans and Advances
              </th>
              <th className="border font uppercase tracking-wide px-2 py-2">
                Balance <br /> outstanding on <br /> 1st April
              </th>
              <th className="border font uppercase tracking-wide px-2 py-2">
                Amount paid <br /> during the year
              </th>
              <th className="border font uppercase tracking-wide px-2 py-2">
                Amount Recovered <br /> during the year
              </th>
              <th className="border font uppercase tracking-wide px-2 py-2">
                Balance <br /> outstanding on <br /> 31st March
              </th>
              <th className="border font uppercase tracking-wide px-2 py-2">
                Net Increase(+) <br /> Decrease(-) <br /> during the year
              </th>
            </tr>
          </thead>

          <tbody>
            {(!rows || rows.length === 0) && (
              <tr>
                <td colSpan={6} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {rows?.map((item) => (
              <tr key={item.id} className="border">
                <td className="border px-4 py-2 text-left font-medium">
                  {item.loans}
                </td>
                <AmountCell value={item.april} />
                <AmountCell value={item.amountPaid} />
                <AmountCell value={item.amountRecover} />
                <AmountCell value={item.march} />
                <AmountCell value={item.increaseDecrease} />
              </tr>
            ))}

            {/* Total row */}
            {rows && rows.length > 0 && (
              <tr className="bg-gray-300 border">
                <td
                  colSpan={2}
                  className="border px-4 py-3 text-right font-bold tracking-wider text-sm">
                  TOTAL
                </td>
                <AmountCell value={total.amountPaid} bold />
                <AmountCell value={total.amountRecover} bold />
                <AmountCell value={total.march} bold />
                <AmountCell value={total.increaseDecrease} bold />
              </tr>
            )}
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

export default Statement4;
