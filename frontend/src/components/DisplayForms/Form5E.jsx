import React, { useMemo } from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useForm5E } from "../../hooks/admin/useForm5E";

const Amt = ({ value }) => (
  <td className="border border-black px-2 py-2 text-center">
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
  <td className="border border-black px-2 py-2 font-bold text-center">
    <span className="flex items-center justify-center gap-1">
      <LiaRupeeSignSolid />
      {Number(value ?? 0).toFixed(2)}
    </span>
  </td>
);

const Form5E = ({ sector }) => {
  const { form5EData, loading, error } = useForm5E({ sector });

  // Zip receipt and payment rows side by side
  const zippedRows = useMemo(() => {
    const rcpt = form5EData?.receiptRows ?? [];
    const pymt = form5EData?.paymentRows ?? [];
    const len = Math.max(rcpt.length, pymt.length);
    return Array.from({ length: len }, (_, i) => ({
      r: rcpt[i] ?? null,
      p: pymt[i] ?? null,
      key: `row-${i}`,
    }));
  }, [form5EData]);

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 5E data...</p>
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

  const rt = form5EData?.receiptTotals ?? {};
  const pt = form5EData?.paymentTotals ?? {};

  return (
    <div className="w-full overflow-x-auto border-2">
      <h1 className="text-center py-4 text-xl font-bold">Form No. 5E</h1>

      <div className="flex flex-col items-center gap-1 mb-10">
        <p className="font-semibold text-sm">
          Classified cum consolidated abstract for receipts and payments for the
          month of <span className="text-blue-500">All Period</span>
        </p>
        <p className="text-sm font-semibold">
          Part II Deposit Fund (Transactions relating to
          Debt-Deposit-Remittances)
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
          className="border-collapse border border-black text-[11px] text-center mx-4"
          style={{ minWidth: "1200px" }}>
          <thead>
            {/* Level 1 */}
            <tr>
              <th
                colSpan={7}
                className="border border-black py-2 text-base uppercase">
                Receipts
              </th>
              <th
                colSpan={8}
                className="border border-black py-2 text-base uppercase">
                Payments
              </th>
            </tr>

            {/* Level 2 */}
            <tr>
              {/* Receipt columns */}
              <th className="border border-black p-2 w-24">
                CASH BOOK
                <br />
                ITEM NO.
              </th>
              <th className="border border-black p-2">
                RECOVERIES OF CPF
                <br />
                SUBSCRIPTIONS
              </th>
              <th className="border border-black p-2">SECURITY DEPOSIT</th>
              <th className="border border-black p-2">
                EARNEST MONEY
                <br />
                DEPOSIT
              </th>
              <th className="border border-black p-2">
                DEPOSITS FROM
                <br />
                GOVT
              </th>
              <th className="border border-black p-2">CHEQUES DRAWN</th>
              <th className="border border-black p-2 bg-gray-100">TOTAL</th>

              {/* Payment columns */}
              <th className="border border-black p-2 w-24">VR. NO.</th>
              <th className="border border-black p-2">
                PAYMENT OF CPF
                <br />
                ADVANCES
              </th>
              <th className="border border-black p-2">
                REMITTANCE CPF
                <br />
                TO P.O.
              </th>
              <th className="border border-black p-2">
                PAYMENT SECURITY
                <br />
                DEPOSIT
              </th>
              <th className="border border-black p-2">
                REPAYMENT EARNEST
                <br />
                MONEY
              </th>
              <th className="border border-black p-2">TRANSFER ITEMS</th>
              <th className="border border-black p-2">
                REMITTANCE TO
                <br />
                TREASURY
              </th>
              <th className="border border-black p-2 bg-gray-100">TOTAL</th>
            </tr>
          </thead>

          <tbody>
            {zippedRows.length === 0 && (
              <tr>
                <td
                  colSpan={15}
                  className="border border-black py-6 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {zippedRows.map(({ r, p, key }) => (
              <tr key={key} className="border border-black">
                {/* Receipt side */}
                <td className="border border-black px-2 py-2">
                  {r?.cashBookItemNo ?? "-"}
                </td>
                <Amt value={r?.cpfSub} />
                <Amt value={r?.securityDep} />
                <Amt value={r?.earnestMoney} />
                <Amt value={r?.govtDeposit} />
                <Amt value={r?.chequesDrawn} />
                <Amt value={r?.totalReceipt} />

                {/* Payment side */}
                <td className="border border-black px-2 py-2">
                  {p?.vrNo ?? "-"}
                </td>
                <Amt value={p?.cpfAdvances} />
                <Amt value={p?.remitCpf} />
                <Amt value={p?.paySecurityDep} />
                <Amt value={p?.repayEarnest} />
                <Amt value={p?.transferItems} />
                <Amt value={p?.remittanceTreasury} />
                <Amt value={p?.totalPayment} />
              </tr>
            ))}

            {/* Grand Totals row */}
            {zippedRows.length > 0 && (
              <tr className="bg-gray-300 border border-black">
                <td className="border border-black px-2 py-2 font-bold text-right">
                  TOTAL
                </td>
                <AmtBold value={rt.cpfSub} />
                <AmtBold value={rt.securityDep} />
                <AmtBold value={rt.earnestMoney} />
                <AmtBold value={rt.govtDeposit} />
                <AmtBold value={rt.chequesDrawn} />
                <AmtBold value={rt.totalReceipt} />

                <td className="border border-black px-2 py-2 font-bold">-</td>
                <AmtBold value={pt.cpfAdvances} />
                <AmtBold value={pt.remitCpf} />
                <AmtBold value={pt.paySecurityDep} />
                <AmtBold value={pt.repayEarnest} />
                <AmtBold value={pt.transferItems} />
                <AmtBold value={pt.remittanceTreasury} />
                <AmtBold value={pt.totalPayment} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="px-4 tracking-wide font-semibold py-2">
        <p>Secretary</p>
        <p>Date: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default Form5E;
