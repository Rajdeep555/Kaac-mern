import { useStatement5 } from "../../hooks/admin/useStatement5";
import { Loader } from "../ui/Loader";

const AmountCell = ({ value, bold = false }) => (
  <td className={`border px-4 py-2 align-top ${bold ? "font-bold" : ""}`}>
    <span className="flex items-center justify-end gap-1">
      {Number(value ?? 0).toFixed(2)}
    </span>
  </td>
);

// Row-type-aware Heads cell:
// - "major": bold, no indent — top of the hierarchy
// - "sub": indented once, medium weight
// - "minor": indented twice, normal weight
// - "total": bold "Total under Major Head X" line
// - "grandTotal": bold, uppercase-ish sector-level total line
const HEADS_CELL_STYLES = {
  major: "font-bold text-gray-900 pl-3",
  sub: "font-medium text-gray-700 pl-8",
  minor: "text-gray-800 pl-12",
  total: "font-bold text-gray-900 pl-3",
  grandTotal: "font-bold text-gray-900 pl-3 uppercase tracking-wide",
};

const HeadsCell = ({ row }) => (
  <td className="border px-3 py-2 text-left align-top">
    <div className={`leading-snug ${HEADS_CELL_STYLES[row.type] ?? ""}`}>
      {row.headsLines.map((line, idx) => (
        <span key={idx}>{line}</span>
      ))}
    </div>
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

  // Page-level GRAND TOTAL is the sum of leaf ("minor") amounts only —
  // "total" rows (per major head) AND "grandTotal" rows (per sector)
  // are both already sums of leaves, so including them here would
  // double- (or triple-) count.
  const grandTotal = (statement5Data ?? [])
    .filter((row) => row.type === "minor")
    .reduce((sum, row) => sum + Number(row.total ?? 0), 0);

  return (
    <div className="w-full overflow-x-auto border-2 bg-white">
      <div className="flex flex-col items-center py-4">
        <h1 className="font-bold text-lg">STATEMENT NO. 5</h1>
        {/* {sector && (
          <p className="text-sm font-medium text-gray-600">Sector: {sector}</p>
        )} */}
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

            {statement5Data?.map((row, idx) => {
              const isHeaderRow = row.type === "major" || row.type === "sub";
              const isBoldTotalRow =
                row.type === "total" || row.type === "grandTotal";
              const rowBgClass =
                row.type === "grandTotal"
                  ? "bg-gray-200"
                  : row.type === "total"
                    ? "bg-gray-100"
                    : "";
              return (
                <tr
                  key={`row-${idx}-${row.heads}`}
                  className={`border ${rowBgClass}`}>
                  <HeadsCell row={row} />
                  {isHeaderRow ? (
                    <td className="border px-4 py-2" />
                  ) : (
                    <AmountCell value={row.total} bold={isBoldTotalRow} />
                  )}
                </tr>
              );
            })}

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
