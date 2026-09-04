import React from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useStatement5 } from "../../hooks/admin/useStatement5";

const AmountCell = ({ value, bold = false }) => (
  <td className={`border px-4 py-2 align-top ${bold ? "font-bold" : ""}`}>
    <span className="flex items-center justify-center gap-1">
      <LiaRupeeSignSolid />
      {Number(value ?? 0).toFixed(2)}
    </span>
  </td>
);

const HeadsCell = ({ group }) => (
  <td className="border px-3 py-2 text-left align-top">
    <div className="leading-snug">
      {group.headsLines.map((line, idx) => {
        const isLast = idx === group.headsLines.length - 1;
        return (
          <span key={idx}>
            <span
              className={
                isLast ? "font-medium text-gray-900" : "text-gray-500"
              }>
              {line}
            </span>
            {!isLast && <span className="mx-1 text-gray-300">›</span>}
          </span>
        );
      })}
    </div>
    {!group.matched && (
      <span className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-700">
        Unmapped
      </span>
    )}
  </td>
);

const Statement5 = ({ sector, dateRange }) => {
  const { statement5Data, loading, error } = useStatement5({
    sector,
    dateRange,
  });

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Statement 5 data...</p>
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

  const grandTotal = (statement5Data ?? []).reduce(
    (sum, group) => sum + Number(group.total ?? 0),
    0,
  );

  return (
    <div className="w-full overflow-x-auto border-2 bg-white">
      <div className="flex flex-col items-center py-4">
        <h1 className="font-bold text-lg">STATEMENT NO. 5</h1>
        {sector && (
          <p className="text-sm font-medium text-gray-600">Sector: {sector}</p>
        )}
        {(dateRange?.from || dateRange?.to) && (
          <p className="text-xs text-gray-500">
            {dateRange?.from || "…"} to {dateRange?.to || "…"}
          </p>
        )}
        <h2 className="py-4 font-semibold">
          Detailed Account of Revenue Receipt by Minor Heads
        </h2>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-280 mx-auto border border-black text-[11px] text-center">
          <thead>
            <tr>
              <th className="border font uppercase tracking-wide py-2">
                Heads
              </th>
              <th className="border font uppercase tracking-wide py-2">
                Actuals
              </th>
            </tr>
          </thead>

          <tbody>
            {(!statement5Data || statement5Data.length === 0) && (
              <tr>
                <td colSpan={2} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {statement5Data?.map((group, groupIndex) => (
              <tr key={`group-${groupIndex}-${group.heads}`} className="border">
                <HeadsCell group={group} />
                <AmountCell value={group.total} />
              </tr>
            ))}

            {statement5Data && statement5Data.length > 0 && (
              <tr className="bg-gray-300 border">
                <td className="border px-4 py-3 text-right font-bold tracking-wider text-sm">
                  GRAND TOTAL
                </td>
                <AmountCell value={grandTotal} bold />
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

export default Statement5;
