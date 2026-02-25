import React from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useForm8 } from "../../hooks/admin/useForm8";

// Amount display — shows "-" if zero
const Amt = ({ value }) =>
  value > 0 ? (
    <span className="flex items-center justify-center gap-1">
      <LiaRupeeSignSolid />
      {Number(value).toFixed(2)}
    </span>
  ) : (
    "-"
  );

const Form8 = ({ sector }) => {
  const { form8Data, loading, error } = useForm8({ sector });

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 8 data...</p>
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

  const { rows = [], totals = {} } = form8Data ?? {};

  return (
    <div className="w-full overflow-x-auto bg-white border-2">
      <div className="flex flex-col items-center">
        <h1 className="font-bold text-lg">FORM NO. 8</h1>
        <div className="w-full flex justify-around">
          <p className="font-semibold">(Receipt Schedule)</p>
          <p className="font-semibold">(Revenue Head)</p>
        </div>
        <h2 className="py-4 font-semibold tracking-wide">
          (Copy to be appended to the Monthly account)
        </h2>
        {sector && (
          <p className="text-sm font-medium text-gray-600 mb-2">
            Sector: {sector}
          </p>
        )}
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto">
        <table className="min-w-290 border border-black text-[11px] text-center mx-4 my-4">
          <thead>
            <tr>
              <th className="border border-black font">Cash Book Item No</th>
              <th className="border border-black font">
                Name of the Deptt
                <br />
                Nomenclature of the
                <br />
                Receipt Head
              </th>
              <th className="border border-black font">
                Revenue receipts of
                <br />
                the Council
              </th>
              <th className="border border-black font">
                Grants-in-aid
                <br />
                received from the
                <br />
                Govt
              </th>
              <th className="border border-black font">Other Misc receipts</th>
              <th className="border border-black font">Total receipts</th>
            </tr>
          </thead>

          <tbody>
            {/* No data */}
            {(!rows || rows.length === 0) && (
              <tr>
                <td colSpan={6} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {rows.map((row, index) => (
              <tr key={index} className="border font-small">
                <td className="border py-1">{row.cbItemNo}</td>
                <td className="border py-1 text-left px-2">
                  {row.nomenclature}
                </td>
                <td className="border py-1">
                  <Amt value={row.councilRevenue} />
                </td>
                <td className="border py-1">
                  <Amt value={row.grantsInAid} />
                </td>
                <td className="border py-1">
                  <Amt value={row.miscReceipt} />
                </td>
                <td className="border py-1">
                  <Amt value={row.total} />
                </td>
              </tr>
            ))}
          </tbody>

          {/* Column totals row */}
          {rows.length > 0 && (
            <tfoot>
              <tr className="font-bold bg-gray-100">
                <td className="border py-2 px-2 text-left" colSpan={2}>
                  TOTAL
                </td>
                <td className="border py-2">
                  <Amt value={totals.councilRevenue} />
                </td>
                <td className="border py-2">
                  <Amt value={totals.grantsInAid} />
                </td>
                <td className="border py-2">
                  <Amt value={totals.miscReceipt} />
                </td>
                <td className="border py-2">
                  <Amt value={totals.total} />
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <hr className="w-full my-4 h-0.5 bg-black" />

      <div className="px-4 mb-2 tracking-wider">
        <p className="my-4">NB:- Posting should be made from Cash Book</p>
        <p>
          Certified that the receipts as per Cash Book have been included in
          this schedule.
        </p>
      </div>

      <hr className="w-full my-4 h-0.5 bg-black" />

      <div>
        <p className="text-start text-sm mb-4 px-2">Secretary</p>
      </div>
    </div>
  );
};

export default Form8;
