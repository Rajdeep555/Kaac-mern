import { useStatement2 } from "../../hooks/admin/useStatement2";
import { Loader } from "../ui/Loader";

const AmountCell = ({ value, bold = false }) => (
  <td className={`border px-4 py-3 text-right ${bold ? "font-bold" : ""}`}>
    {Number(value ?? 0).toFixed(2)}
  </td>
);

const Statement2 = ({ sector, dateRange }) => {
  const { statement2Data, loading, error } = useStatement2({
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

  const { rows, total, period } = statement2Data;

  // Current financial year
  const currentFyLabel = period?.current || "Current Period";

  // Example:
  // "2023-2024 & 2024-2025" -> "2024-2025"
  // "2024-2025 & 2025-2026" -> "2025-2026"
  const previousFyLabel =
    period?.previous?.split(" & ").pop()?.trim() || "Previous Period";

  return (
    <div className="w-full overflow-x-auto border-2 bg-white">
      {/* Header */}
      <div className="flex flex-col items-center py-5">
        <h1 className="font-bold text-xl tracking-wide">STATEMENT NO. 2</h1>

        {sector && (
          <p className="text-sm font-semibold text-gray-600 mt-1">
            Sector: {sector}
          </p>
        )}

        <h2 className="py-4 font-semibold text-base text-center px-4">
          Capital Outlay - Progressive Capital Outlay to end of {currentFyLabel}
        </h2>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      {/* Table */}
      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-280 mx-auto border border-black text-sm text-center">
          <thead>
            <tr className="bg-gray-200">
              {/* Major Head - LEFT aligned */}
              <th className="border font-bold capitalize tracking-wide py-3 px-4 text-left">
                Major Head of Account
              </th>

              {/* Previous FY - dynamically extracted */}
              <th className="border font-bold capitalize tracking-wide py-3 px-4">
                Expenditure to end of {previousFyLabel}
              </th>

              {/* Current FY */}
              <th className="border font-bold capitalize tracking-wide py-3 px-4">
                Expenditure during {currentFyLabel}
              </th>

              {/* Total */}
              <th className="border font-bold capitalize tracking-wide py-3 px-4">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {/* No records */}
            {(!rows || rows.length === 0) && (
              <tr>
                <td colSpan={4} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {/* Data rows */}
            {rows?.map((item) => (
              <tr key={item.id} className="border hover:bg-gray-50">
                {/* Major Head - LEFT aligned */}
                <td className="border px-4 py-3 text-left font-medium">
                  {item.majorHead}
                </td>

                {/* Amounts - RIGHT aligned */}
                <AmountCell value={item.previousYear} />
                <AmountCell value={item.currentYear} />
                <AmountCell value={item.total} />
              </tr>
            ))}

            {/* Grand Total */}
            {rows && rows.length > 0 && (
              <tr className="bg-gray-300 border">
                <td className="border px-4 py-3 text-right font-bold tracking-wider text-sm">
                  TOTAL
                </td>

                <AmountCell value={total.previousYear} bold />

                <AmountCell value={total.currentYear} bold />

                <AmountCell value={total.total} bold />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      {/* Explanatory Notes */}
      <div className="px-4 py-2 text-start tracking-wide">
        <p className="font-semibold">Explanatory Notes</p>
      </div>
    </div>
  );
};

export default Statement2;
