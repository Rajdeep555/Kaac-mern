import React, { useMemo } from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useForm5D } from "../../hooks/admin/useForm5D";

const Amt = ({ value }) => (
  <td className="border border-black px-2 py-2">
    {Number(value ?? 0) > 0 ? (
      <span className="flex items-center justify-center gap-1">
        <LiaRupeeSignSolid />
        {Number(value).toFixed(2)}
      </span>
    ) : (
      <span className="text-gray-400">-</span>
    )}
  </td>
);

const AmtBold = ({ value }) => (
  <td className="border border-black px-2 py-2 font-bold">
    <span className="flex items-center justify-center gap-1">
      <LiaRupeeSignSolid />
      {Number(value ?? 0).toFixed(2)}
    </span>
  </td>
);

const Form5D = ({ sector }) => {
  const { form5DData, loading, error } = useForm5D({ sector });

  // Zip receipt and payment rows side-by-side
  const zippedRows = useMemo(() => {
    const rcpt = form5DData?.receiptRows ?? [];
    const pymt = form5DData?.paymentRows ?? [];
    const len = Math.max(rcpt.length, pymt.length);

    return Array.from({ length: len }, (_, i) => ({
      receipt: rcpt[i] ?? null,
      payment: pymt[i] ?? null,
      key: `row-${i}`,
    }));
  }, [form5DData]);

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 5D data...</p>
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

  const rt = form5DData?.receiptTotals ?? {};
  const pt = form5DData?.paymentTotals ?? {};

  return (
    <div className="w-full overflow-x-auto border-2">
      <h1 className="text-center py-4 text-xl font-bold">Form No. 5D</h1>

      <div className="flex flex-col items-center gap-1 mb-10">
        <p className="font-semibold text-sm">
          Classified cum consolidated abstract for receipts and payments for the
          month of <span className="text-blue-500">All Period</span>
        </p>
        <p className="text-sm font-semibold">
          Part I District Fund (Division III) Debt
        </p>
        <p className="text-sm font-semibold">
          (Copy to be appended to the Monthly account)
        </p>
        {sector && (
          <p className="text-sm font-medium text-gray-600">Sector: {sector}</p>
        )}
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto my-8">
        <table
          className="border-collapse border border-black text-[10px] text-center mx-4"
          style={{ minWidth: "1100px" }}>
          <thead>
            {/* Level 1 */}
            <tr>
              {/* Receipt side */}
              <th rowSpan={2} className="border border-black px-2 py-2">
                CASH BOOK
                <br />
                ITEM NO.
              </th>
              <th rowSpan={2} className="border border-black px-2">
                LOANS FROM
                <br />
                GOVT.
              </th>
              <th rowSpan={2} className="border border-black px-2">
                LOANS FROM
                <br />
                OTHER SOURCES
              </th>
              <th colSpan={3} className="border border-black py-2">
                RECEIPTS
              </th>
              <th rowSpan={2} className="border border-black px-2">
                TOTAL
                <br />
                RECEIPTS
              </th>

              {/* Payment side */}
              <th rowSpan={2} className="border border-black px-2">
                VR. NO.
              </th>
              <th colSpan={3} className="border border-black py-2">
                PAYMENTS
              </th>
              <th rowSpan={2} className="border border-black px-2">
                TOTAL
                <br />
                PAYMENTS
              </th>
            </tr>

            {/* Level 2 sub-headers */}
            <tr>
              <th className="border border-black p-1">H/B LOAN</th>
              <th className="border border-black p-1">CAR LOAN</th>
              <th className="border border-black p-1">OTHER RECEIPTS</th>

              <th className="border border-black p-1">
                REPAYMENT LOANS
                <br />
                (GOVT)
              </th>
              <th className="border border-black p-1">
                REPAYMENT LOANS
                <br />
                (OTHER)
              </th>
              <th className="border border-black p-1">
                PAYMENTS LOANS
                <br />/ ADVANCES
              </th>
            </tr>
          </thead>

          <tbody>
            {zippedRows.length === 0 && (
              <tr>
                <td
                  colSpan={12}
                  className="border border-black py-6 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {zippedRows.map(({ receipt: r, payment: p, key }) => (
              <tr key={key} className="border border-black">
                {/* ── Receipt side ── */}
                <td className="border border-black px-2 py-2">
                  {r?.cashBookItemNo ?? "-"}
                </td>
                <Amt value={r?.loansGovt} />
                <Amt value={r?.loansOther} />
                <Amt value={r?.hbLoan} />
                <Amt value={r?.carLoan} />
                <Amt value={r?.otherReceipts} />
                <Amt value={r?.totalReceipts} />

                {/* ── Payment side ── */}
                <td className="border border-black px-2 py-2">
                  {p?.vrNo ?? "-"}
                </td>
                <Amt value={p?.repayGovt} />
                <Amt value={p?.repayOther} />
                <Amt value={p?.loansAdvances} />
                <Amt value={p?.totalPayments} />
              </tr>
            ))}

            {/* Grand totals row */}
            {zippedRows.length > 0 && (
              <tr className="bg-gray-300 border border-black">
                <td className="border border-black px-2 py-2 font-bold text-right">
                  TOTAL
                </td>
                <AmtBold value={rt.loansGovt} />
                <AmtBold value={rt.loansOther} />
                <AmtBold value={rt.hbLoan} />
                <AmtBold value={rt.carLoan} />
                <AmtBold value={rt.otherReceipts} />
                <AmtBold value={rt.totalReceipts} />

                <td className="border border-black px-2 py-2 font-bold">-</td>
                <AmtBold value={pt.repayGovt} />
                <AmtBold value={pt.repayOther} />
                <AmtBold value={pt.loansAdvances} />
                <AmtBold value={pt.totalPayments} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="px-4 py-2 font-semibold">
        <p>Secretary</p>
        <p>Date: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default Form5D;
