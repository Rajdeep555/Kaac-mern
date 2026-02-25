import React, { useMemo } from "react";
import { useForm12 } from "../../hooks/admin/useForm12";

// Static structure for Form 12 (your original rows)
const structure = [
  {
    id: "r1",
    re_sl: "1.",
    re_particulars: "To Opening Balance Cash",
    di_sl: "1.",
    di_particulars: "Part I",
  },
  {
    id: "r2",
    re_sl: "",
    re_particulars: "Treasury (PLA)",
    di_sl: "",
    di_particulars: "",
  },
  {
    id: "r3",
    re_sl: "",
    re_particulars: "Total",
    di_sl: "",
    di_particulars: "",
  },
  {
    id: "r4",
    re_sl: "2",
    re_particulars: "Part I (To be posted from Part-I Div I of Form No 5A)",
    di_sl: "",
    di_particulars:
      "Part I (By expenditure under all Major Heads of A/cs – Gross Expenditure)",
  },
  {
    id: "r5",
    re_sl: "(a)",
    re_particulars: "To Revenue Receipts of the Council",
    di_sl: "(a)",
    di_particulars: "By Repayment of loan received from the Govt",
  },
  {
    id: "r6",
    re_sl: "(b)",
    re_particulars: "Grants-in-aids received from the Govt",
    di_sl: "(b)",
    di_particulars: "Payment of loans and advances made by Council",
  },
  {
    id: "r7",
    re_sl: "(c)",
    re_particulars: "Other Misc Receipts",
    di_sl: "(c)",
    di_particulars: "Repayment of loans received from other sources",
  },
  {
    id: "r8",
    re_sl: "(d)",
    re_particulars: "Cash Receipts",
    di_sl: "",
    di_particulars: "",
  },
  {
    id: "r9",
    re_sl: "3.",
    re_particulars: "PART II (To be posted from Part-I Div II of Form No 5D)",
    di_sl: "3.",
    di_particulars: "PART III (To be posted from ........ Form No 5E)",
  },
  {
    id: "r10",
    re_sl: "(a)",
    re_particulars: "To Loans received from the Govt",
    di_sl: "(a)",
    di_particulars: "By Payment of CPF",
  },
  {
    id: "r11",
    re_sl: "(b)",
    re_particulars: "Loans received from other sources",
    di_sl: "(b)",
    di_particulars: "Remittance of contribution into Post Office",
  },
  {
    id: "r12",
    re_sl: "(c)",
    re_particulars: "Recoveries of loans/advances paid by the Council",
    di_sl: "(c)",
    di_particulars: "Repayment of Security Deposits",
  },
  {
    id: "r13",
    re_sl: "(d)",
    re_particulars: "Other categories of receipts",
    di_sl: "(d)",
    di_particulars: "Repayment of Earnest Money Deposits",
  },
  {
    id: "r14",
    re_sl: "4.",
    re_particulars: "PART III (To be posted from Part-II of Form No 5E)",
    di_sl: "4.",
    di_particulars: "PART IV (To be posted from Part-II of Form No 5E)",
  },
  {
    id: "r15",
    re_sl: "(a)",
    re_particulars: "To Recoveries of CPF",
    di_sl: "",
    di_particulars: "By expenditure in respect of transferred functions",
  },
  {
    id: "r16",
    re_sl: "(b)",
    re_particulars: "Security Deposits",
    di_sl: "",
    di_particulars: "",
  },
  {
    id: "r17",
    re_sl: "(c)",
    re_particulars: "Earnest Money Deposits",
    di_sl: "",
    di_particulars: "",
  },
  {
    id: "r18",
    re_sl: "5.",
    re_particulars:
      "PART IV (To be posted from Part-II of Form No 5E) To Deposits received from Govt for transferred functions",
    di_sl: "5.",
    di_particulars: "PART V (To be posted from Form No 4 Form No 3)",
  },
  {
    id: "r19",
    re_sl: "7.",
    re_particulars: "PART V (To be posted from Form No 3 Form No 4)",
    di_sl: "(a)",
    di_particulars: "Remittance into the Treasury (PLA)",
  },
  {
    id: "r20",
    re_sl: "(a)",
    re_particulars: "District Council Cheques (PLA)",
    di_sl: "(b)",
    di_particulars: "District Council Cheques (PLA)",
  },
  {
    id: "r21",
    re_sl: "(b)",
    re_particulars: "Remittance into the Treasury (PLA)",
    di_sl: "",
    di_particulars: "Total Disbursement",
  },
  {
    id: "r22",
    re_sl: "",
    re_particulars: "Grand Total",
    di_sl: "",
    di_particulars: "Grand Total",
  },
];

const formatAmt = (v) =>
  v !== undefined && v !== null && v !== "-" ? Number(v).toFixed(2) : "-";

const Form12 = ({ sector }) => {
  const { form12Data, loading, error } = useForm12({ sector });

  const moneyMap = useMemo(() => form12Data?.money ?? {}, [form12Data]);

  const finalRows = useMemo(
    () =>
      structure.map((row) => {
        // receipts use key = id
        const reKey = row.id;
        // disbursements use key = id + "_di"
        const diKey = row.id + "_di";
        return {
          ...row,
          re_amount: moneyMap[reKey]?.re_amount ?? "-",
          di_amount: moneyMap[diKey]?.di_amount ?? "-",
        };
      }),
    [moneyMap],
  );

  if (loading) {
    return (
      <div className="w-full overflow-x-auto bg-white border-2 p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 12 data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full overflow-x-auto bg-white border-2 p-8 text-center">
        <p className="font-medium text-red-600">
          Failed to load Form 12 data. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white border-2">
      {/* Header */}
      <div className="flex bg-gray-300 pb-4 flex-col px-2 items-center gap-1">
        <h1 className="text-center py-2 text-xl font-bold">Form No. 12</h1>
        <div className="w-full flex flex-col items-center">
          <p className="font-semibold">
            Treasury (PLA) reconciliation statement at 30/31st (Month)
          </p>
          <p className="font-semibold">
            (To be appended to the Monthly Account)
          </p>
          <p className="font-semibold">Year: 2025</p>
          {sector && (
            <p className="text-sm font-medium text-gray-600">
              Sector: {sector}
            </p>
          )}
        </div>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border border-black mx-4 text-[11px] px-2 my-2">
          <thead>
            <tr>
              <th
                colSpan={3}
                className="border w-1/2 py-4 text-center font-bold">
                RECEIPTS
              </th>
              <th colSpan={3} className="border w-1/2 text-center font-bold">
                DISBURSEMENTS
              </th>
            </tr>
            <tr>
              <th className="border py-2">SL NO</th>
              <th className="border">PARTICULARS</th>
              <th className="border px-4">RS. P.</th>
              <th className="border px-4">SL NO</th>
              <th className="border">PARTICULARS</th>
              <th className="border px-4">RS. P.</th>
            </tr>
          </thead>

          <tbody className="py-2 text-sm text-center">
            {finalRows.map((row) => (
              <tr className="border" key={row.id}>
                {/* Receipts side */}
                <td className="border-r py-2 px-4 text-center">{row.re_sl}</td>
                <td className="border-r py-2 text-left">
                  {row.re_particulars}
                </td>
                <td className="border-r px-4">{formatAmt(row.re_amount)}</td>

                {/* Disbursements side */}
                <td className="border-r">{row.di_sl}</td>
                <td className="border-r text-left">{row.di_particulars}</td>
                <td>{formatAmt(row.di_amount)}</td>
              </tr>
            ))}

            {/* Closing section: ONLY Disbursement side (Receipt side is empty) */}
            <tr className="border font-semibold bg-gray-50">
              {/* Receipt side - EMPTY */}
              <td className="border-r py-2 px-4 text-center"></td>
              <td className="border-r py-2 text-left"></td>
              <td className="border-r px-4"></td>

              {/* Disbursement side - Cash Rs. */}
              <td className="border-r"></td>
              <td className="border-r text-left">Cash Rs.</td>
              <td>{formatAmt(moneyMap.cashRs?.di_amount)}</td>
            </tr>

            <tr className="border font-semibold bg-gray-50">
              {/* Receipt side - EMPTY */}
              <td className="border-r py-2 px-4 text-center"></td>
              <td className="border-r py-2 text-left"></td>
              <td className="border-r px-4"></td>

              {/* Disbursement side - Treasury (PLA) */}
              <td className="border-r"></td>
              <td className="border-r text-left">Treasury (PLA)</td>
              <td>{formatAmt(moneyMap.treasuryPla?.di_amount)}</td>
            </tr>

            <tr className="border font-bold bg-gray-100">
              {/* Receipt side - EMPTY */}
              <td className="border-r py-2 px-4 text-center"></td>
              <td className="border-r py-2 text-left"></td>
              <td className="border-r px-4"></td>

              {/* Disbursement side - Grand Total */}
              <td className="border-r"></td>
              <td className="border-r text-left">Grand Total</td>
              <td>{formatAmt(moneyMap.grandTotalD?.di_amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer text */}
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

export default Form12;
