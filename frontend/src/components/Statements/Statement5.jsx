import { useStatement5 } from "../../hooks/admin/useStatement5";
import { Loader } from "../ui/Loader";

const AmountCell = ({ value, bold = false }) => (
  <td className={`border px-4 py-2 align-top ${bold ? "font-bold" : ""}`}>
    <span className="flex items-center justify-end gap-1">
      {Number(value ?? 0).toFixed(2)}
    </span>
  </td>
);

const HEADS_CELL_STYLES = {
  major: "font-bold text-gray-900 pl-3",
  sub: "font-medium text-gray-700 pl-8",
  minor: "text-gray-800 pl-12",
  total: "font-bold text-gray-900 pl-3",
  grandTotal: "font-bold text-gray-900 pl-3 uppercase tracking-wide",
};

const isTotalReceiptLabel = (row) =>
  /total\s+(revenue\s+)?receipt/i.test((row.headsLines ?? []).join(" "));

const HeadsCell = ({ row, forceBold }) => (
  <td className="border px-3 py-2 text-left align-top">
    <div
      className={`leading-snug ${HEADS_CELL_STYLES[row.type] ?? ""} ${
        forceBold ? "font-bold uppercase tracking-wide" : ""
      }`}>
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

  const grandTotal = (statement5Data ?? [])
    .filter((row) => row.type === "minor")
    .reduce((sum, row) => sum + Number(row.total ?? 0), 0);

  return (
    <div className="w-full overflow-x-auto border-1 bg-white">
      {/* 🔸 Print-only rule, scoped to Statement 5 only via this
          component-local class name. Keeps GRAND TOTAL + hr +
          Explanatory Notes as ONE unbreakable unit. If it doesn't
          fit on the current page, the whole group (including the
          actual total figure) moves together onto the next page —
          so the trailing page always shows real data instead of
          being nearly empty. */}
      <style>{`
        @media print {
          .statement5-tail-block {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="flex flex-col items-center py-4">
        <h1 className="font-bold text-lg">STATEMENT NO. 5</h1>
        {(dateRange?.from || dateRange?.to) && (
          <p className="text-xs text-gray-800">
            {(() => {
              const date = new Date(dateRange.from || dateRange.to);
              const year =
                date.getMonth() >= 3
                  ? date.getFullYear()
                  : date.getFullYear() - 1;

              return `${year} - ${year + 1}`;
            })()}
          </p>
        )}
        <h2 className="pb-4 font-semibold">
          Detailed Account of Revenue Receipt by Minor Heads
        </h2>
      </div>

      <hr className="w-full mb-4 bg-black" />

      <div className="w-full my-8">
        <table className="w-full mx-auto border border-black text-[11px] text-center">
          <thead>
            <tr>
              <th className="border font uppercase tracking-wide py-2 w-3/4">
                Heads
              </th>
              <th className="border font uppercase tracking-wide py-2 w-1/4">
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
              const forceBold = isTotalReceiptLabel(row);
              const isBoldTotalRow =
                row.type === "total" || row.type === "grandTotal" || forceBold;
              const rowBgClass =
                row.type === "grandTotal" || forceBold
                  ? "bg-gray-200"
                  : row.type === "total"
                    ? "bg-gray-100"
                    : "";
              return (
                <tr
                  key={`row-${idx}-${row.heads}`}
                  className={`border ${rowBgClass}`}>
                  <HeadsCell row={row} forceBold={forceBold} />
                  {isHeaderRow && !forceBold ? (
                    <td className="border px-4 py-2" />
                  ) : (
                    <AmountCell value={row.total} bold={isBoldTotalRow} />
                  )}
                </tr>
              );
            })}
            {/* 🔸 GRAND TOTAL row removed from here — moved below,
                out of the main table, so it can travel together with
                the hr + Explanatory Notes as one atomic print block. */}
          </tbody>
        </table>
      </div>

      {/* 🔸 NEW — GRAND TOTAL + hr + Explanatory Notes, grouped so
          they never get split apart across a page break, and never
          left stranded alone on an otherwise-empty page. */}
      <div className="statement5-tail-block">
        {statement5Data && statement5Data.length > 0 && (
          <div className="w-full mb-8">
            <table className="w-full mx-auto border border-black text-[11px] text-center">
              <tbody>
                <tr className="bg-gray-300 border">
                  <td className="border px-4 py-3 text-right font-bold tracking-wider text-sm w-3/4">
                    GRAND TOTAL
                  </td>
                  <AmountCell value={grandTotal} bold />
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <hr className="w-full mb-4 bg-black" />

        <div className="px-4 py-2 text-start tracking-wide">
          <p className="font-semibold">Explanatory Notes</p>
        </div>
      </div>
    </div>
  );
};

export default Statement5;
