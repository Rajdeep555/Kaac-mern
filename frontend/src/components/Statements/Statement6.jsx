import { useStatement6 } from "../../hooks/admin/useStatement6";
import { Loader } from "../ui/Loader";

const AmountCell = ({ value, isTotal = false }) => (
  <td
    className={`border px-4 py-2 align-top ${isTotal ? "font-bold text-gray-900" : ""}`}>
    <span className="flex items-center justify-end gap-1">
      {Number(value ?? 0).toFixed(2)}
    </span>
  </td>
);

const LEVEL_CLASS = {
  major: "font-bold",
  subMajor: "font-semibold",
  minor: "font-normal text-gray-700",
  total: "font-bold text-gray-900",
};

// 🔸 NEW — safety net, same pattern used in Statement5: bold+uppercase
// a heads line based on its actual text ("Total Expenditure of ...
// Sector", "Total Capital Receipt - ... Sector", etc.) regardless of
// whether the backend tagged that line's `level` as "total" or not.
const isSectorTotalLine = (text) =>
  /^total\s+(expenditure|capital receipt|revenue receipt|receipt)/i.test(
    (text ?? "").trim(),
  );

const HeadsCell = ({ lines }) => (
  <td className="border px-4 py-2 text-left align-top">
    {lines.map((line, idx) => {
      const forceBold = isSectorTotalLine(line.text);
      return (
        <div
          key={idx}
          className={`${LEVEL_CLASS[line.level] ?? ""} ${
            forceBold ? "font-bold uppercase tracking-wide text-gray-900" : ""
          }`}>
          {line.text}
        </div>
      );
    })}
  </td>
);

const Statement6 = ({ sector, dateRange }) => {
  const { statement6Data, loading, error } = useStatement6({
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

  // 🔸 grandNonPlan / grandPlan are NEW fields — see the
  // getStatement6Data patch. Until the backend actually computes
  // real numbers for them, they'll safely fall back to 0.00 via
  // AmountCell's `Number(value ?? 0)`.
  const { rows, grandTotal, grandNonPlan, grandPlan } = statement6Data;

  return (
    <div className="w-full overflow-x-auto border-1 bg-white">
      <div className="flex flex-col items-center py-4">
        <h1 className="font-bold text-lg">STATEMENT NO. 6</h1>
        {/* {sector && (
          <p className="text-sm font-medium text-gray-600">Sector: {sector}</p>
        )} */}
        <h2 className="py-4 font-semibold">
          Detailed Account of Expenditure by Minor Heads
        </h2>
      </div>

      <hr className="w-full mb-4  bg-black" />

      {/* 🔸 CHANGED — `min-w-280` removed (was forcing this 4-column
          table wider than its container, causing the horizontal
          scroll). `w-full` + explicit proportions on the 4 header
          cells below keeps it always exactly as wide as its
          container. */}
      <div className="w-full my-8">
        <table className="w-full mx-auto border border-black text-[11px] text-center">
          <thead>
            <tr>
              <th className="border font uppercase tracking-wide py-2 w-2/5">
                Heads
              </th>
              <th className="border font uppercase tracking-wide py-2 w-1/5">
                Non-Plan
              </th>
              <th className="border font uppercase tracking-wide py-2 w-1/5">
                Plan
              </th>
              <th className="border font uppercase tracking-wide py-2 w-1/5">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {(!rows || rows.length === 0) && (
              <tr>
                <td colSpan={4} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {rows?.map((item) => (
              <tr
                key={item.id}
                className={`border ${item.isTotal ? "bg-gray-200" : ""}`}>
                <HeadsCell lines={item.heads} />
                <AmountCell value={item.nonPlan} isTotal={item.isTotal} />
                <AmountCell value={item.plan} isTotal={item.isTotal} />
                <AmountCell value={item.total} isTotal={item.isTotal} />
              </tr>
            ))}

            {/* 🔸 CHANGED — colSpan dropped from 3 to 1 so Non-Plan and
                Plan each get their own cell (and their own real value)
                instead of being merged into the label and lost. */}
            {rows && rows.length > 0 && (
              <tr className="bg-gray-400 border">
                <td className="border px-4 py-3 text-right font-bold tracking-wider text-sm text-gray-900">
                  GRAND TOTAL
                </td>
                <AmountCell value={grandNonPlan} isTotal />
                <AmountCell value={grandPlan} isTotal />
                <AmountCell value={grandTotal} isTotal />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="w-full mb-4  bg-black" />

      <div className="px-4 py-2 text-start tracking-wide">
        <p className="font-semibold">Explanatory Notes</p>
      </div>
    </div>
  );
};

export default Statement6;
