import React from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useForm6 } from "../../hooks/admin/useForm6";

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

// Helper for amount display
const AmountCell = ({ value }) =>
  value > 0 ? (
    <span className="flex items-center justify-center gap-1">
      <LiaRupeeSignSolid />
      {Number(value).toFixed(2)}
    </span>
  ) : (
    "-"
  );

const Form6 = ({ sector }) => {
  const { form6Data, loading, error } = useForm6({ sector });
  const year = new Date().getFullYear();

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 6 data...</p>
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

  const { rows = [], grandTotalMonths = {}, grandTotal = 0 } = form6Data ?? {};

  return (
    <div className="w-full overflow-x-auto bg-white border-2">
      <div className="flex flex-col px-2 items-center gap-1">
        <h1 className="text-center py-2 text-xl font-bold">Form No. 6</h1>
        <p className="font-semibold text-sm">
          (Not to be appended with monthly accounts)
        </p>
        <p className="text-sm font-semibold mb-6">
          Classified cum Consolidated Abstract - Year {year}
        </p>
      </div>

      <hr className="w-full my-4 h-0.5 bg-black" />

      <div className="w-full flex justify-between px-4 mb-6">
        <button className="bg-black text-white text-sm text-center px-4 py-1 cursor-pointer">
          MAJOR HEAD
        </button>
        <button className="bg-black text-white text-sm text-center px-4 py-1 cursor-pointer">
          EXPENDITURE
        </button>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border border-black mx-4 text-[11px] px-2 my-2 text-center">
          <thead>
            {/* Row 1 — Head label + month names + total */}
            <tr className="border">
              <th className="border py-2 px-4 text-left">FULL HEAD CODE</th>
              {MONTHS.map((month) => (
                <th key={month} className="border py-2">
                  {month}
                </th>
              ))}
              <th className="border py-2 px-2">TOTAL</th>
            </tr>

            {/* Row 2 — year under each month */}
            <tr>
              <th className="border py-2"></th>
              {MONTHS.map((month) => (
                <th key={month} className="border py-2">
                  {year}
                </th>
              ))}
              <th className="border py-2"></th>
            </tr>
          </thead>

          <tbody>
            {/* No data message */}
            {(!rows || rows.length === 0) && (
              <tr>
                <td colSpan={15} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {/* Data rows */}
            {rows.map((row, index) => (
              <tr key={`${index}-${row.headCode}`} className="border">
                {/* Full head code broken into parts for readability */}
                <td className="border py-2 px-4 text-left">
                  <div className="font-semibold">{row.headCode}</div>
                  {/* Show individual head labels below the full code */}
                  {/* <div className="text-[9px] text-gray-500 mt-1 space-y-0.5">
                    {row.majorHead !== "-" && <div>Major: {row.majorHead}</div>}
                    {row.subMajorHead !== "-" && (
                      <div>Sub Major: {row.subMajorHead}</div>
                    )}
                    {row.minorHead !== "-" && <div>Minor: {row.minorHead}</div>}
                    {row.subHead !== "-" && <div>Sub Head: {row.subHead}</div>}
                    {row.subSubHead !== "-" && (
                      <div>Sub Sub Head: {row.subSubHead}</div>
                    )}
                    {row.detailHead !== "-" && (
                      <div>Detail: {row.detailHead}</div>
                    )}
                    {row.subDetailHead !== "-" && (
                      <div>Sub Detail: {row.subDetailHead}</div>
                    )}
                  </div> */}
                </td>

                {/* Monthly amounts */}
                {MONTHS.map((month) => (
                  <td key={month} className="border py-2">
                    <AmountCell value={row.months[month]} />
                  </td>
                ))}

                {/* Row total */}
                <td className="border py-2 font-semibold">
                  <AmountCell value={row.total} />
                </td>
              </tr>
            ))}

            {/* Grand Total Row — always shown at the bottom */}
            {rows.length > 0 && (
              <tr className="bg-gray-200 font-bold border">
                <td className="border px-4 py-2 text-left">GRAND TOTAL</td>
                {MONTHS.map((month) => (
                  <td key={month} className="border py-2">
                    <AmountCell value={grandTotalMonths[month]} />
                  </td>
                ))}
                <td className="border py-2">
                  <AmountCell value={grandTotal} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="w-full my-4 h-0.5 bg-black" />

      <div>
        <p className="text-end text-sm mb-4 px-2">Secretary</p>
      </div>
    </div>
  );
};

export default Form6;
