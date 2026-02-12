import React from "react";

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
    di_particulars: "Part I (To be posted from Part-I Div III of Form No 5D)",
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
    re_particulars:
      "PART II (To be posted from Part-I Div II of Form No 5D)",
    di_sl: "3.",
    di_particulars:
      "PART III (To be posted from ........ Form No 5E)",
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
    re_particulars:
      "PART III (To be posted from Part-II of Form No 5E)",
    di_sl: "4.",
    di_particulars:
      "PART IV (To be posted from Part-II of Form No 5E)",
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
    di_particulars:
      "PART V (To be posted from Form No 4 Form No 3)",
  },
  {
    id: "r19",
    re_sl: "7.",
    re_particulars:
      "PART V (To be posted from Form No 3 Form No 4)",
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

const dbMoney = [
  {
    id: "r1",
    re_amount: 1200.5,
    di_amount: 900.0,
  },
  {
    id: "r2",
    re_amount: 0.00,
  },
  {
    id: "r3",
    re_amount: 0.00,
  },
];

const Form12 = ({ sector }) => {

const moneyMap = Object.fromEntries(
  dbMoney.map(item => [item.id, item])
);


const finalRows = structure.map(row => {
  const money = moneyMap[row.id];

  return {
    ...row,
    re_amount: money?.re_amount ?? "-",
    di_amount: money?.di_amount ?? "-",
  };
});


  return (
    <div className="w-full overflow-x-auto bg-white border-2">
      <div className="flex bg-gray-300 pb-4 flex-col px-2 items-center gap-1  ">
        <h1 className="text-center py-2 text-xl font-bold">Form No. 12</h1>
        <div className="w-full flex flex-col items-center">
          <p className="font-semibold">
            Tresury (PLA) reconcilliation statement at 30/31st (Month)
          </p>
          <p className="font-semibold">
            (To be appended to the Monthly Account)
          </p>
          <p className="font-semibold">Year: 2025</p>
        </div>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto">
        <table className="w-full  border border-black mx-4 text-[11px] px-2 my-2 ">
          <thead>
            <tr>
              <th
                colSpan={3}
                className="border w-1/2 py-4 text-center font-bold"
              >
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
            {finalRows.map((row, index) => {
              console.log(row);
              return (
                <tr className="border " key={index}>
                  <td className="border-r py-2 px-4 text-center">{row.re_sl}</td>
                  <td className="border-r py-2">{row.re_particulars}</td>
                  <td className="border-r px-4">{row.re_amount}</td>
                  <td className="border-r">{row.di_sl}</td>
                  <td className="border-r">{row.di_particulars}</td>
                  <td>{row.di_amount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mx-4 my-6 text-sm leading-7 text-gray-600">
        <p>
          Certified that the Cash Book balance shown above agrees with the
          balance shown in the Treasury (PLA) column of the Cash Book.
        </p>
      </div>
      <hr className=" w-full my-4 h-0.5 bg-black" />
      <div className="flex justify-between">
        <p className="text-end text-sm mb-4 px-2">Date</p>
        <p className="text-end text-sm mb-4 px-2">Designation</p>
      </div>
    </div>
  );
};

export default Form12;
