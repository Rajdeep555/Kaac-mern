import React from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useForm9 } from "../../hooks/admin/useForm9";

const COLUMNS = [
  { key: "voucherNo", label: "CASH BOOK VR NO.", number: 1 },
  { key: "detailHead", label: "NAME OF DEPARTMENT", number: 2 },
  { key: "payOfficers", label: "PAY OF OFFICER", number: 3 },
  { key: "payEstablishment", label: "PAY OF ESTABLISHMENT", number: 4 },
  { key: "allowanceHonorary", label: "TRAVELLING ALLOWANCES", number: 5 },
  { key: "contingencies", label: "CONTINGENCY", number: 6 },
  { key: "grantsInAid", label: "GRANT-IN-AID", number: 7 },
  { key: "works", label: "WORKS", number: 8 },
  { key: "transferPayment", label: "PAYMENT FOR TRANSFERRED ITEMS", number: 9 }, // 👈 new
  { key: "totalPayment", label: "TOTAL PAYMENTS", number: 10 }, // 👈 number bumped
];

// Non-amount columns — rendered as plain text
const TEXT_KEYS = new Set(["voucherNo", "detailHead"]);

const AmountCell = ({ value }) => (
  <span className="flex items-center justify-center gap-1">
    {value > 0 ? (
      <>
        <LiaRupeeSignSolid />
        {Number(value).toFixed(2)}
      </>
    ) : (
      "-"
    )}
  </span>
);

const Form9 = ({ sector }) => {
  const { form9Data, loading, error } = useForm9({ sector });
  const year = new Date().getFullYear();

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 9 data...</p>
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

  const { rows = [], grandTotals = {} } = form9Data ?? {};

  return (
    <div className="w-full overflow-x-auto bg-white border-2">
      {/* Header */}
      <div className="flex bg-gray-300 pb-4 flex-col px-2 items-center gap-1">
        <h1 className="text-center py-2 text-xl font-bold">Form No. 9</h1>
        <div className="w-full flex flex-col items-center">
          <p className="font-semibold">
            Copy to be appended to the Monthly account
          </p>
          <p className="font-semibold">Payment Schedule</p>
          <p className="font-semibold">Revenue Head</p>
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
        <table className="w-full border border-black mx-4 text-[11px] px-2 my-2 text-center">
          <thead>
            <tr className="border">
              {COLUMNS.map((col) => (
                <th key={col.key} className="border py-4 text-sm">
                  {col.label}
                  <br />
                  <br />
                  {col.number}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="py-2 text-sm">
            {(!rows || rows.length === 0) && (
              <tr>
                <td colSpan={10} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {rows.map((row) => (
              <tr key={row.id} className="border">
                {COLUMNS.map((col) => (
                  <td key={col.key} className="border py-2 px-1">
                    {TEXT_KEYS.has(col.key) ? (
                      row[col.key]
                    ) : (
                      <AmountCell value={row[col.key]} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          {/* Grand totals row */}
          {rows.length > 0 && (
            <tfoot>
              <tr className="font-bold bg-gray-100 border">
                <td
                  colSpan={2}
                  className="border py-2 px-2 text-center font-bold">
                  GRAND TOTAL
                </td>
                {COLUMNS.filter((col) => !TEXT_KEYS.has(col.key)).map((col) => (
                  <td key={col.key} className="border py-2 px-1">
                    <AmountCell value={grandTotals[col.key]} />
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Grand total summary box */}
      {rows.length > 0 && (
        <div className="border mx-4 my-4 py-4 px-4">
          <span className="font-semibold">
            Grand Total Amount:{" "}
            <span className="inline-flex items-center gap-1">
              <LiaRupeeSignSolid />
              {Number(grandTotals.totalPayment ?? 0).toFixed(2)}
            </span>
          </span>
        </div>
      )}

      <div className="mx-4 my-6 text-sm text-gray-600">
        <p>(NB - to be posted from Cash Book)</p>
        <p>
          Certified that all vouchers along with the quittances in support of
          the payments included in this schedule have been retained in the
          office.
        </p>
      </div>

      <hr className="w-full my-4 h-0.5 bg-black" />

      <div>
        <p className="text-end text-sm mb-4 px-2">Designation</p>
      </div>
    </div>
  );
};

export default Form9;
