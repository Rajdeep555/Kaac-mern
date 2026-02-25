import React from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useForm7A } from "../../hooks/admin/useForm7A";

// Amount display helper
const AmountCell = ({ value, bold = false }) => (
  <td className={`border py-2 px-2 ${bold ? "font-bold" : ""}`}>
    <div className="flex items-center justify-center gap-1">
      <LiaRupeeSignSolid />
      {Number(value ?? 0).toFixed(2)}
    </div>
  </td>
);

const Form7A = ({ sector }) => {
  const { form7AData, loading, error } = useForm7A({ sector });
  const year = new Date().getFullYear();

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 7A data...</p>
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

  const { groups = [], grandTotal = 0 } = form7AData ?? {};

  return (
    <div className="w-full overflow-x-auto bg-white border-2">
      {/* Header */}
      <div className="flex bg-gray-300 pb-4 flex-col px-2 items-center gap-1">
        <h1 className="text-center py-2 text-xl font-bold">Form No. 7A</h1>
        <div className="w-full flex flex-col items-center">
          <p className="font-semibold">Compilation sheet for Year {year}</p>
          <p className="font-semibold">Major Head of Accounts - Payment</p>
          <p className="font-semibold">Year: {year}</p>
          {sector && (
            <p className="text-sm font-medium text-gray-600 mt-1">
              Sector: {sector}
            </p>
          )}
        </div>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto">
        <table className="w-[95%] border-2 border-black mx-4 text-[14px] px-2 my-2 text-center">
          <thead>
            <tr>
              <th className="py-4 border-r">MAJOR HEAD</th>
              <th className="border-r">MINOR HEAD</th>
              <th className="border-r">DETAIL HEAD</th>
              <th className="border-r">VOUCHER NO</th>
              <th className="border-r">DATE</th>
              <th>AMOUNT</th>
            </tr>
          </thead>

          <tbody className="py-2 text-sm">
            {/* No data */}
            {(!groups || groups.length === 0) && (
              <tr>
                <td colSpan={6} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {groups.map((mhGroup, mhIndex) =>
              mhGroup.minorHeads.map((mnhGroup, mnhIndex) =>
                mnhGroup.detailHeads.map((dhGroup, dhIndex) => (
                  <React.Fragment key={`${mhIndex}-${mnhIndex}-${dhIndex}`}>
                    {/* Entry rows for this detailHead */}
                    {dhGroup.entries.map((entry, entryIndex) => (
                      <tr
                        key={`entry-${entry.id}-${entryIndex}`}
                        className="border">
                        <td className="border-r py-2">
                          {/* Show majorHead only on very first entry */}
                          {mnhIndex === 0 && dhIndex === 0 && entryIndex === 0
                            ? mhGroup.majorHead
                            : ""}
                        </td>
                        <td className="border-r">
                          {/* Show minorHead only on first entry of this minorHead */}
                          {dhIndex === 0 && entryIndex === 0
                            ? mnhGroup.minorHead
                            : ""}
                        </td>
                        <td className="border-r">
                          {/* Show detailHead only on first entry of this detailHead */}
                          {entryIndex === 0 ? dhGroup.detailHead : ""}
                        </td>
                        <td className="border-r">{entry.voucherNo}</td>
                        <td className="border-r">{entry.date}</td>
                        <AmountCell value={entry.amount} />
                      </tr>
                    ))}

                    {/* Detail Head subtotal */}
                    <tr className="border bg-gray-50">
                      <td
                        colSpan={5}
                        className="py-2 font-semibold border text-start px-4 tracking-wider">
                        Total - Detail Head ({dhGroup.detailHead})
                      </td>
                      <AmountCell value={dhGroup.detailTotal} bold />
                    </tr>

                    {/* Minor Head subtotal — only after last detailHead of this minorHead */}
                    {dhIndex === mnhGroup.detailHeads.length - 1 && (
                      <tr className="border bg-gray-100">
                        <td
                          colSpan={5}
                          className="py-2 border font-semibold text-start px-4 tracking-wider">
                          Total - Minor Head ({mnhGroup.minorHead})
                        </td>
                        <AmountCell value={mnhGroup.minorTotal} bold />
                      </tr>
                    )}

                    {/* Major Head subtotal — only after last minorHead and last detailHead */}
                    {mnhIndex === mhGroup.minorHeads.length - 1 &&
                      dhIndex === mnhGroup.detailHeads.length - 1 && (
                        <tr className="border bg-gray-200">
                          <td
                            colSpan={5}
                            className="py-2 border text-start px-4 font-semibold tracking-wider">
                            Total - Major Head ({mhGroup.majorHead})
                          </td>
                          <AmountCell value={mhGroup.majorTotal} bold />
                        </tr>
                      )}
                  </React.Fragment>
                )),
              ),
            )}

            {/* Grand Total */}
            {groups.length > 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-2 text-start bg-gray-300 px-4 font-bold border-r">
                  GRAND TOTAL
                </td>
                <td className="py-2 font-bold bg-gray-300">
                  <div className="flex items-center justify-center gap-1">
                    <LiaRupeeSignSolid />
                    {Number(grandTotal).toFixed(2)}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      <div className="mx-4 my-6 text-sm text-gray-600 leading-7">
        <p>
          NB: (i) Compilation may be made detailed headwise after assigning a
          serial no. to each detailed head.
        </p>
        <p>
          (ii) Deductions like Provident Fund, recovery of loan and advances
          from the voucher when the same is to be accounted for under different
          head of the account should be posted separately.
        </p>
      </div>

      <hr className="w-full my-4 h-0.5 bg-black" />

      <div>
        <p className="text-start text-sm mb-4 px-2">Secretary</p>
      </div>
    </div>
  );
};

export default Form7A;
