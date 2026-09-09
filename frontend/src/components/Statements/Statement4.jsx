import { useStatement4 } from "../../hooks/admin/useStatement4";
import { Loader } from "../ui/Loader";

const AmountCell = ({ value, bold = false }) => (
  <td className={`border px-4 py-2 ${bold ? "font-bold" : ""}`}>
    <span className="flex items-center justify-end gap-1">
      {Number(value ?? 0).toFixed(2)}
    </span>
  </td>
);

const Statement4 = ({ sector, dateRange }) => {
  const { statement4Data, loading, error } = useStatement4({
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

  const { rows, total } = statement4Data;

  return (
    <div className="w-full overflow-x-auto border-1 bg-white">
      {/* 🔸 Print-only spacing trim, scoped to this component. The
          my-8 / mb-4 gaps below are sized for comfortable on-screen
          viewing, but on a short statement like this one they were
          part of what pushed the signature footer onto its own
          near-empty trailing page. Tightening them for print only
          (never touching the screen look) buys back vertical room
          so the whole statement — table + notes — sits on one page. */}
      <style>{`
        @media print {
          .statement4-hr {
            margin-bottom: 6px !important;
          }
          .statement4-table-wrap {
            margin-top: 10px !important;
            margin-bottom: 10px !important;
          }
        }
      `}</style>

      <div className="flex flex-col items-center py-4">
        <h1 className="font-bold text-lg">STATEMENT NO. 4</h1>
        {/* {sector && (
          <p className="text-sm font-medium text-gray-600">Sector: {sector}</p>
        )}
        {(dateRange?.from || dateRange?.to) && (
          <p className="text-xs text-gray-500">
            {dateRange?.from || "…"} to {dateRange?.to || "…"}
          </p>
        )} */}

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
          Loans and Advances by the Council
        </h2>
      </div>

      <hr className="statement4-hr w-full mb-4 bg-black" />

      <div className="statement4-table-wrap w-full overflow-x-auto my-8">
        <table className="min-w-280 mx-4 border border-black text-[11px] text-center">
          <thead>
            <tr>
              <th className="border font capitalize tracking-wide px-2 py-2">
                Categories of Loans and Advances
              </th>
              <th className="border font capitalize tracking-wide px-2 py-2">
                Balance <br /> outstanding on <br /> 1st April
              </th>
              <th className="border font capitalize tracking-wide px-2 py-2">
                Amount paid <br /> during the year
              </th>
              <th className="border font capitalize tracking-wide px-2 py-2">
                Amount Recovered <br /> during the year
              </th>
              <th className="border font capitalize tracking-wide px-2 py-2">
                Balance <br /> outstanding on <br /> 31st March
              </th>
              <th className="border font capitalize tracking-wide px-2 py-2">
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
                <td className="border px-3 py-3 text-left font-bold tracking-wide text-[10px] leading-snug">
                  Total Loan disbursed to Autonomous Council Employees under
                  Major Head 661 - Loans &amp; Advances to Autonomous Council
                  Employees
                </td>
                <AmountCell value={total.april} bold />
                <AmountCell value={total.amountPaid} bold />
                <AmountCell value={total.amountRecover} bold />
                <AmountCell value={total.march} bold />
                <AmountCell value={total.increaseDecrease} bold />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="statement4-hr w-full mb-4 bg-black" />

      <div className="px-4 py-2 text-start tracking-wide">
        <p className="font-semibold">Explanatory Notes</p>
      </div>
    </div>
  );
};

export default Statement4;
