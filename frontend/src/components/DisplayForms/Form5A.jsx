import React from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useForm5A } from "../../hooks/admin/useForm5A";

const AmountCell = ({ value, bold = false }) => (
  <td className={`border px-4 py-2 ${bold ? "font-bold" : ""}`}>
    <span className="flex items-center justify-center gap-1">
      <LiaRupeeSignSolid />
      {Number(value ?? 0).toFixed(2)}
    </span>
  </td>
);

const Form5A = ({ sector }) => {
  const { form5AData, loading, error } = useForm5A({ sector });

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 5A data...</p>
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

  // ── Calculate grand total from all groups ────────────────
  const grandTotal = (form5AData ?? []).reduce(
    (sum, group) => sum + Number(group.total ?? 0),
    0,
  );

  return (
    <div className="w-full overflow-x-auto border-2">
      <div className="flex flex-col items-center">
        <h1 className="font-bold text-lg py-2">FORM NO. 5A</h1>
        <p className="font-semibold tracking-wide">
          Part I District Fund (Division)
        </p>
        <p className="font-semibold tracking-wide">
          Classified Abstract of receipts for the month of .............
        </p>
        <p className="font-semibold tracking-wide mb-7">
          (To be appended with monthly account)
        </p>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-290 border border-black text-[11px] text-center mx-4">
          <thead>
            <tr>
              <th className="border text-sm py-2">HEAD CODE & DESCRIPTION</th>
              <th className="border text-sm">DETAIL HEAD</th>
              <th className="border text-sm">DETAIL HEAD</th>
              <th className="border text-sm">DETAIL HEAD</th>
              <th className="border text-sm">AMOUNT</th>
            </tr>
          </thead>

          <tbody>
            {(!form5AData || form5AData.length === 0) && (
              <tr>
                <td colSpan={5} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {form5AData?.map((group, groupIndex) => (
              <React.Fragment key={`group-${groupIndex}-${group.majorHead}`}>
                {group.rows.map((row, index) => (
                  <tr key={`${groupIndex}-row-${index}`} className="border">
                    <td className="border px-4 py-2 text-left">
                      {[row.majorHead, row.subMajor, row.minorHead]
                        .filter((p) => p && p !== "-")
                        .join("-")}
                    </td>
                    <td className="border px-4 py-2">00</td>
                    <td className="border px-4 py-2">00</td>
                    <td className="border px-4 py-2">00</td>
                    <AmountCell value={row.amount} />
                  </tr>
                ))}

                {group.hasMultiple && (
                  <tr className="bg-gray-100 font-bold border">
                    <td className="border px-4 py-2 text-left" colSpan={4}>
                      Total — {group.majorHead}
                    </td>
                    <AmountCell value={group.total} bold />
                  </tr>
                )}
              </React.Fragment>
            ))}

            {/* Grand Total row */}
            {form5AData && form5AData.length > 0 && (
              <tr className="bg-gray-300 border">
                <td
                  colSpan={4}
                  className="border px-4 py-3 text-right font-bold tracking-wider text-sm">
                  GRAND TOTAL
                </td>
                <AmountCell value={grandTotal} bold />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="px-4 py-2 tracking-wide font-semibold leading-7">
        <p>Secretary</p>
        <p>Date: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default Form5A;
