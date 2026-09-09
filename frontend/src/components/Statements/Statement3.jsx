import React from "react";
// import { LiaRupeeSignSolid } from "react-icons/lia";
import {
  useStatement3Debt,
  useStatement3WaysAndMeans,
} from "../../hooks/admin/useStatement3";
import { Loader } from "../ui/Loader";

const AmountCell = ({ value, bold = false }) => (
  <td className={`border px-4 py-2 ${bold ? "font-bold" : ""}`}>
    <span className="flex items-center justify-end gap-1">
      {Number(value ?? 0).toFixed(2)}
    </span>
  </td>
);

const Statement3 = ({ sector, dateRange }) => {
  const {
    debtData,
    loading: debtLoading,
    error: debtError,
  } = useStatement3Debt({ sector, dateRange });

  const {
    waysAndMeansData,
    loading: wamLoading,
    error: wamError,
  } = useStatement3WaysAndMeans({ sector, dateRange });

  if (debtLoading || wamLoading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <Loader />
      </div>
    );
  }

  if (debtError || wamError) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-red-600">
          Failed to load data. Please try again.
        </p>
      </div>
    );
  }

  const { rows: debtRows, total } = debtData;

  return (
    <div className="w-full overflow-x-auto border-1 bg-white">
      <div className="flex flex-col items-center py-4">
        <h1 className="font-bold text-lg">STATEMENT NO. 3</h1>
        {/* {sector && (
          <p className="text-sm font-medium text-gray-600">Sector: {sector}</p>
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
        <h2 className="pb-4 font-semibold">Debt Position</h2>
      </div>

      <hr className="w-full mb-4 bg-black" />

      {/* ── Table 1: Debt Position ── */}
      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-280 mx-auto border border-black text-[11px] text-center">
          <thead>
            <tr>
              <th className="border font capitalize tracking-wide py-2">
                Nature of Dept
              </th>
              <th className="border font capitalize tracking-wide py-2">
                Balance of 1st <br /> April
              </th>
              <th className="border font capitalize tracking-wide py-2">
                Receipts during <br /> the year
              </th>
              <th className="border font capitalize tracking-wide py-2">
                Repayments during <br /> the year
              </th>
              <th className="border font capitalize tracking-wide py-2">
                Balance during 31st <br /> March
              </th>
              <th className="border font capitalize tracking-wide py-2">
                Net Increase(+) <br /> Decrease(-)
              </th>
            </tr>
          </thead>
          <tbody>
            {(!debtRows || debtRows.length === 0) && (
              <tr>
                <td colSpan={6} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {debtRows?.map((item) => (
              <tr key={item.id} className="border">
                <td className="border px-4 py-2 text-left font-medium">
                  {item.natureDept}
                </td>
                <AmountCell value={item.april} />
                <AmountCell value={item.receipts} />
                <AmountCell value={item.repayments} />
                <AmountCell value={item.march} />
                <AmountCell value={item.increaseDecrease} />
              </tr>
            ))}

            {debtRows && debtRows.length > 0 && (
              <tr className="bg-gray-300 border">
                <td className="border px-4 py-3 text-right font-bold tracking-wider text-sm">
                  TOTAL
                </td>
                <AmountCell value={total.april} bold />
                <AmountCell value={total.receipts} bold />
                <AmountCell value={total.repayments} bold />
                <AmountCell value={total.march} bold />
                <AmountCell value={total.increaseDecrease} bold />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="w-full mt-10  bg-black" />

      <div className="py-6 px-4 leading-8">
        <p className="font-bold">
          Ways and means position may be given in an explanatory note in the
          following manner below Statement No. 3
        </p>
        <p>
          The following Statement shows the ways and means position of the
          Council month by month during the year under report:
        </p>
      </div>

      <hr className="w-full mb-10  bg-black" />

      {/* ── Table 2: Ways and Means ── */}
      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-280 mx-auto border border-black text-[11px] text-center">
          <thead>
            <tr>
              <th className="border font capitalize tracking-wide py-2">
                Month
              </th>
              <th className="border font capitalize tracking-wide py-2">
                Opening Balance
              </th>
              <th className="border font capitalize tracking-wide py-2">
                Receipt
              </th>
              <th className="border font capitalize tracking-wide py-2">
                Disbursement
              </th>
              <th className="border font capitalize tracking-wide py-2">
                Closing Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {(!waysAndMeansData || waysAndMeansData.length === 0) && (
              <tr>
                <td colSpan={5} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {waysAndMeansData?.map((item) => {
              const isTotalRow =
                item.monthNum === null || item.monthNum === undefined;

              return (
                <tr
                  key={item.month}
                  className={`border ${isTotalRow ? "bg-gray-300" : ""}`}>
                  <td
                    className={`border px-4 py-2 text-left ${
                      isTotalRow
                        ? "font-bold tracking-wider text-sm text-right"
                        : ""
                    }`}>
                    {isTotalRow ? "TOTAL" : item.month}
                  </td>
                  <AmountCell value={item.openingBalance} bold={isTotalRow} />
                  <AmountCell value={item.receipt} bold={isTotalRow} />
                  <AmountCell value={item.disbursement} bold={isTotalRow} />
                  <AmountCell value={item.closingBalance} bold={isTotalRow} />
                </tr>
              );
            })}
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

export default Statement3;
