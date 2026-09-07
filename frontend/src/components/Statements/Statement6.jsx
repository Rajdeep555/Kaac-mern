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

const HeadsCell = ({ lines }) => (
  <td className="border px-4 py-2 text-left align-top">
    {lines.map((line, idx) => (
      <div key={idx} className={LEVEL_CLASS[line.level] ?? ""}>
        {line.text}
      </div>
    ))}
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

  const { rows, grandTotal } = statement6Data;

  return (
    <div className="w-full overflow-x-auto border-2 bg-white">
      <div className="flex flex-col items-center py-4">
        <h1 className="font-bold text-lg">STATEMENT NO. 6</h1>
        {/* {sector && (
          <p className="text-sm font-medium text-gray-600">Sector: {sector}</p>
        )} */}
        <h2 className="py-4 font-semibold">
          Detailed Account of Expenditure by Minor Heads
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
                Non-Plan
              </th>
              <th className="border font uppercase tracking-wide py-2">Plan</th>
              <th className="border font uppercase tracking-wide py-2">
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

            {rows && rows.length > 0 && (
              <tr className="bg-gray-400 border">
                <td
                  colSpan={3}
                  className="border px-4 py-3 text-right font-bold tracking-wider text-sm text-gray-900">
                  GRAND TOTAL
                </td>
                <AmountCell value={grandTotal} isTotal />
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

export default Statement6;
