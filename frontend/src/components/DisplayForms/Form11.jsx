import React from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useForm11 } from "../../hooks/admin/useForm11";

const AmountDisplay = ({ value }) => (
  <span className="inline-flex items-center gap-1">
    <LiaRupeeSignSolid />
    {Number(value ?? 0).toFixed(2)}
  </span>
);

const Form11 = ({ sector }) => {
  const { form11Data, loading, error } = useForm11({ sector });
  const year = new Date().getFullYear();

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 11 data...</p>
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

  const { rows = [], breakdown = {} } = form11Data ?? {};

  return (
    <div className="w-full overflow-x-auto bg-white border-2">
      {/* Header */}
      <div className="flex bg-gray-300 pb-4 flex-col px-2 items-center gap-1">
        <h1 className="text-center py-2 text-xl font-bold">Form No. 11</h1>
        <div className="w-full flex flex-col items-center">
          <p className="font-semibold">
            Treasury (PLA) Reconciliation Statement at 30/31st (Month)
          </p>
          <p className="font-semibold">
            (To be appended to the Monthly Account)
          </p>
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
        <table className="w-[95%] border border-black mx-4 text-[11px] px-2 my-2">
          <thead />
          <tbody className="py-2 text-sm">
            {rows.map((row, index) => (
              <React.Fragment key={row.number}>
                <tr
                  className={`border text-[14px] font-semibold text-center ${
                    row.number === 4 ? "bg-gray-100" : ""
                  }`}>
                  {/* Row number */}
                  <td className="border py-3 px-4 w-10">{row.number}</td>

                  {/* Description */}
                  <td className="border text-start px-8 py-3">{row.head}</td>

                  {/* Amount column */}
                  <td className="border px-4 py-3 text-right">
                    {/* Row 3 shown as negative (deduction) */}
                    {row.number === 3 ? (
                      <span className="text-red-600">
                        (<AmountDisplay value={row.amount} />)
                      </span>
                    ) : (
                      <AmountDisplay value={row.amount} />
                    )}
                  </td>

                  {/* Total column — shown for rows 1 and 4 */}
                  <td className="px-4 py-3 text-right w-32">
                    {row.showTotal ? (
                      <span className={row.number === 4 ? "font-bold" : ""}>
                        <AmountDisplay value={row.amount} />
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>

                {/* Row 2 breakdown — show sub-totals from each table */}
                {row.number === 2 && breakdown?.row2 && (
                  <>
                    <tr className="text-[11px] text-gray-500 bg-gray-50">
                      <td className="border py-1 px-4"></td>
                      <td className="border text-start px-12 py-1 italic">
                        Challan (no treasury challan no.)
                      </td>
                      <td className="border px-4 py-1 text-right">
                        <AmountDisplay value={breakdown.row2.challan} />
                      </td>
                      <td className="px-4"></td>
                    </tr>
                    <tr className="text-[11px] text-gray-500 bg-gray-50">
                      <td className="border py-1 px-4"></td>
                      <td className="border text-start px-12 py-1 italic">
                        Challan Two (no treasury challan no.)
                      </td>
                      <td className="border px-4 py-1 text-right">
                        <AmountDisplay value={breakdown.row2.challanTwo} />
                      </td>
                      <td className="px-4"></td>
                    </tr>
                    <tr className="text-[11px] text-gray-500 bg-gray-50">
                      <td className="border py-1 px-4"></td>
                      <td className="border text-start px-12 py-1 italic">
                        Challan From Bill (specific deductions, no treasury
                        challan no.)
                      </td>
                      <td className="border px-4 py-1 text-right">
                        <AmountDisplay value={breakdown.row2.challanFromBill} />
                      </td>
                      <td className="px-4"></td>
                    </tr>
                  </>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formula note */}
      <div className="mx-4 mt-2 mb-4 text-xs text-gray-500 px-2">
        Formula: Row 4 = Row 1 + Row 2 − Row 3
      </div>

      <div className="mx-4 my-6 text-sm leading-7 text-gray-600">
        <p>
          Certified that the Cash Book balance shown above agrees with the
          balance shown in the Treasury (PLA) column of the Cash Book.
        </p>
      </div>

      <hr className="w-full my-4 h-0.5 bg-black" />

      <div className="flex justify-between">
        <p className="text-start text-sm mb-4 px-2">Date</p>
        <p className="text-end text-sm mb-4 px-2">Designation</p>
      </div>
    </div>
  );
};

export default Form11;
