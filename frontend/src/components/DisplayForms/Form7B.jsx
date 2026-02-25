import React from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useForm7B } from "../../hooks/admin/useForm7B";

const AmountCell = ({ value, bold = false, colSpan = 1 }) => (
  <td
    colSpan={colSpan}
    className={`border py-2 px-2 ${bold ? "font-bold" : ""}`}>
    <div className="flex items-center justify-center gap-1">
      <LiaRupeeSignSolid />
      {Number(value ?? 0).toFixed(2)}
    </div>
  </td>
);

const Form7B = ({ sector }) => {
  const { form7BData, loading, error } = useForm7B({ sector });
  const year = new Date().getFullYear();

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 7B data...</p>
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

  const { groups = [], grandTotal = 0 } = form7BData ?? {};

  return (
    <div className="w-full overflow-x-auto bg-white border-2">
      {/* Header */}
      <div className="flex bg-gray-300 pb-4 flex-col px-2 items-center gap-1">
        <h1 className="text-center py-2 text-xl font-bold">Form No. 7B</h1>
        <div className="w-full flex flex-col items-center">
          <p className="font-semibold">Compilation sheet for Year {year}</p>
          <p className="font-semibold">Receipt</p>
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
              <th className="border-r">CASHBOOK ITEM NO</th>
              <th className="border-r">DATE</th>
              <th>AMOUNT</th>
            </tr>
          </thead>

          <tbody className="py-2 text-sm">
            {/* No data */}
            {(!groups || groups.length === 0) && (
              <tr>
                <td colSpan={5} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {groups.map((mhGroup, mhIndex) =>
              mhGroup.minorHeads.map((mnhGroup, mnhIndex) => (
                <React.Fragment key={`${mhIndex}-${mnhIndex}`}>
                  {/* Entry rows for this minorHead */}
                  {mnhGroup.entries.map((entry, entryIndex) => (
                    <tr
                      key={`entry-${mhIndex}-${mnhIndex}-${entryIndex}`}
                      className="border">
                      <td className="border-r py-2">
                        {/* Show majorHead only on very first entry of this majorHead */}
                        {mnhIndex === 0 && entryIndex === 0
                          ? mhGroup.majorHead
                          : ""}
                      </td>
                      <td className="border-r">
                        {/* Show minorHead only on first entry of this minorHead */}
                        {entryIndex === 0 ? mnhGroup.minorHead : ""}
                      </td>
                      <td className="border-r">{entry.cashbookNo}</td>
                      <td className="border-r">{entry.date}</td>
                      <AmountCell value={entry.amount} />
                    </tr>
                  ))}

                  {/* Minor Head subtotal */}
                  <tr className="border bg-gray-50">
                    <td
                      colSpan={4}
                      className="py-2 font-semibold border text-start px-4 tracking-wider">
                      Total - Minor Head ({mnhGroup.minorHead})
                    </td>
                    <AmountCell value={mnhGroup.minorTotal} bold />
                  </tr>

                  {/* Major Head subtotal — only after last minorHead of this group */}
                  {mnhIndex === mhGroup.minorHeads.length - 1 && (
                    <tr className="border bg-gray-100">
                      <td
                        colSpan={4}
                        className="py-2 border text-start px-4 font-semibold tracking-wider">
                        Total - Major Head ({mhGroup.majorHead})
                      </td>
                      <AmountCell value={mhGroup.majorTotal} bold />
                    </tr>
                  )}
                </React.Fragment>
              )),
            )}

            {/* Grand Total */}
            {groups.length > 0 && (
              <tr>
                <td
                  colSpan={4}
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

      <hr className="w-full my-4 h-0.5 bg-black" />

      <div>
        <p className="text-start text-sm mb-4 px-2">Secretary</p>
      </div>
    </div>
  );
};

export default Form7B;
