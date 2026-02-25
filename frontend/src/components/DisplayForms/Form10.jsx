import React from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useForm10 } from "../../hooks/admin/useForm10";

const COLUMNS = [
  { key: "voucherNo", label: "CASH BOOK ITEM NO.", number: 1 },
  { key: "workName", label: "NAME OF THE WORK/SCHEME", number: 2 },
  { key: "receipt", label: "RECEIPTS", number: 3 },
  { key: "payment", label: "PAYMENTS", number: 4 },
  { key: "remarks", label: "REMARKS", number: 5 },
];

// Text columns — no rupee sign
const TEXT_KEYS = new Set(["voucherNo", "workName", "remarks"]);

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

const Form10 = ({ sector }) => {
  const { form10Data, loading, error } = useForm10({ sector });
  const year = new Date().getFullYear();

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 10 data...</p>
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

  const { rows = [], summary = {} } = form10Data ?? {};

  return (
    <div className="w-full overflow-x-auto bg-white border-2">
      {/* Header */}
      <div className="flex bg-gray-300 pb-4 flex-col px-2 items-center gap-1">
        <h1 className="text-center py-2 text-xl font-bold">Form No. 10</h1>
        <div className="w-full flex flex-col items-center">
          <p className="font-semibold">
            Receipts and Payment Schedules in respect of Dept-deposit heads
          </p>
          <p className="font-semibold">
            (Copy to be appended to the Monthly account)
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
        <table className="w-[95%] border border-black mx-4 text-[11px] px-2 my-2 text-center">
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
            {/* No data */}
            {(!rows || rows.length === 0) && (
              <tr>
                <td colSpan={5} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {rows.map((row) => (
              <tr key={row.id} className="border">
                {COLUMNS.map((col) => (
                  <td key={col.key} className="border py-2 px-2">
                    {TEXT_KEYS.has(col.key) ? (
                      // Show "-" for empty text fields
                      row[col.key] && row[col.key] !== "-" ? (
                        row[col.key]
                      ) : (
                        "-"
                      )
                    ) : (
                      <AmountCell value={row[col.key]} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary box
      <div className="border leading-8 mx-4 my-4 py-4 px-4">
        <p className="font-semibold mb-1">Summary</p>
        <p>
          Total Receipts:{" "}
          <span className="inline-flex items-center gap-1 font-medium">
            <LiaRupeeSignSolid />
            {Number(summary.totalReceipts ?? 0).toFixed(2)}
          </span>
        </p>
        <p>
          Total Payments:{" "}
          <span className="inline-flex items-center gap-1 font-medium">
            <LiaRupeeSignSolid />
            {Number(summary.totalPayments ?? 0).toFixed(2)}
          </span>
        </p>
        <p>
          Net Amount:{" "}
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              (summary.netAmount ?? 0) < 0 ? "text-red-600" : "text-green-600"
            }`}>
            <LiaRupeeSignSolid />
            {Number(summary.netAmount ?? 0).toFixed(2)}
          </span>
        </p>
      </div> */}

      <div className="mx-4 my-6 text-sm text-gray-600">
        <p>
          NB: Posting should be made from Cash Book. Separate Schedule should be
          prepared for each head of account.
        </p>
        <p>
          1. Certified that all receipts as per Cash Book have been included in
          this schedule.
        </p>
        <p>
          2. Certified that all vouchers along with the quittances in support of
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

export default Form10;
