import React, { useMemo } from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useForm5C } from "../../hooks/admin/useForm5C";

const AmountCell = ({ value, bold = false }) => (
  <td className={`border px-4 py-2 ${bold ? "font-bold" : ""}`}>
    <div className="flex justify-center items-center gap-1">
      <LiaRupeeSignSolid />
      {Number(value ?? 0).toFixed(2)}
    </div>
  </td>
);

const AMOUNT_KEYS = [
  "payOfficers",
  "payEstablishment",
  "allowanceHonorary",
  "contingencies",
  "grantsInAid",
  "works",
  "grossAmount",
];

const Form5C = ({ sector }) => {
  const { form5CData, loading, error } = useForm5C({ sector });

  // ── Grand total: sum each column across all groups ───────
  const grandTotals = useMemo(() => {
    const totals = Object.fromEntries(AMOUNT_KEYS.map((k) => [k, 0]));

    (form5CData ?? []).forEach((group) => {
      AMOUNT_KEYS.forEach((key) => {
        totals[key] += Number(group.totals?.[key] ?? 0);
      });
    });

    return totals;
  }, [form5CData]);

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 5C data...</p>
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

  return (
    <div className="w-full overflow-x-auto border-2">
      <div className="flex flex-col items-center">
        <h1 className="font-bold text-lg py-2">FORM NO. 5C</h1>
        <p className="font-semibold tracking-wide">
          Part I District Fund (Division II)
        </p>
        <p className="font-semibold tracking-wide">
          Classified Abstract of expenditure for the month of .............
        </p>
        <p className="font-semibold tracking-wide mb-7">
          (To be appended with monthly account to be sent to the AG)
        </p>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-350 border border-black text-[11px] text-center mx-4">
          <thead>
            <tr>
              <th className="border text-sm py-2 px-10">
                MAJOR HEAD <br /> MINOR HEAD
              </th>
              <th className="border text-sm">PAY OF OFFICERS</th>
              <th className="border text-sm">PAY OF ESTABLISHMENT</th>
              <th className="border text-sm">ALLOWANCES AND HONORARIA</th>
              <th className="border text-sm">CONTINGENCIES</th>
              <th className="border text-sm">GRANTS-IN-AID</th>
              <th className="border text-sm px-2">WORKS</th>
              <th className="border text-sm">TOTAL</th>
            </tr>
          </thead>

          <tbody>
            {(!form5CData || form5CData.length === 0) && (
              <tr>
                <td colSpan={8} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {form5CData?.map((group, groupIndex) => (
              <React.Fragment key={`group-${groupIndex}-${group.majorHead}`}>
                {/* Detail rows */}
                {group.rows.map((row, index) => (
                  <tr
                    key={`${groupIndex}-row-${index}`}
                    className="text-base border">
                    <td className="border px-4 py-2 text-left">
                      {row.headCode}
                    </td>
                    <AmountCell value={row.payOfficers} />
                    <AmountCell value={row.payEstablishment} />
                    <AmountCell value={row.allowanceHonorary} />
                    <AmountCell value={row.contingencies} />
                    <AmountCell value={row.grantsInAid} />
                    <AmountCell value={row.works} />
                    <AmountCell value={row.grossAmount} />
                  </tr>
                ))}

                {/* Group subtotal — only when multiple rows */}
                {group.hasMultiple && (
                  <tr className="bg-gray-100 font-semibold border">
                    <td className="border px-4 py-2 text-left">
                      Total — {group.majorHead}
                    </td>
                    <AmountCell value={group.totals.payOfficers} bold />
                    <AmountCell value={group.totals.payEstablishment} bold />
                    <AmountCell value={group.totals.allowanceHonorary} bold />
                    <AmountCell value={group.totals.contingencies} bold />
                    <AmountCell value={group.totals.grantsInAid} bold />
                    <AmountCell value={group.totals.works} bold />
                    <AmountCell value={group.totals.grossAmount} bold />
                  </tr>
                )}
              </React.Fragment>
            ))}

            {/* Grand Total row */}
            {form5CData && form5CData.length > 0 && (
              <tr className="bg-gray-300 border">
                <td className="border px-4 py-3 text-right font-bold tracking-wider text-sm">
                  GRAND TOTAL
                </td>
                <AmountCell value={grandTotals.payOfficers} bold />
                <AmountCell value={grandTotals.payEstablishment} bold />
                <AmountCell value={grandTotals.allowanceHonorary} bold />
                <AmountCell value={grandTotals.contingencies} bold />
                <AmountCell value={grandTotals.grantsInAid} bold />
                <AmountCell value={grandTotals.works} bold />
                <AmountCell value={grandTotals.grossAmount} bold />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="px-4 leading-7 font-semibold py-2 tracking-wide">
        <p>Secretary</p>
        <p>Date: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default Form5C;
