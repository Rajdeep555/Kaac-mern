import React from "react";

const registerData = [
  {
    id: 1,
    cashBookItemNo: "CB-001",
    cpfSub: 5000.0,
    cash:545454
  },
];

const months = [
  {
      head:"CASH BOOK ITEM NO.",
      number:1
  },
  {
      head:"NAME OF THE WORK/SCHEME",
      number:2
  },
  {
      head:"RECEIPTS",
      number:3
  },
  {
      head:"PAYMENTS",
      number:4
  },
  {
      head:"REMARKS",
      number:5
  },
];

const Form10 = ({ sector }) => {
  const year = "2026";
  return (
    <div className="w-full overflow-x-auto bg-white border-2">
      <div className="flex bg-gray-300 pb-4 flex-col px-2 items-center gap-1  ">
        <h1 className="text-center py-2 text-xl font-bold">Form No. 10</h1>
        <div className="w-full flex flex-col items-center">
          <p className="font-semibold">Receipts and Payment Schedules in respect of Dept-deposit heads</p>
          <p className="font-semibold">(Copy to be appended to the Monthly account)</p>
          <p className="font-semibold">Year: 2025</p>
        </div>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto">
        <table className="w-[95%]  border border-black mx-4 text-[11px] px-2 my-2 text-center">
          <thead>
            <tr className="border">
              {months.map((month, index) => {
                return (
                  <th key={month.number} className="border py-4 text-sm ">
                    {month.head} <br /> <br /> {month.number}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="py-2 text-sm">
            <tr>
              {registerData.map((kd, ind) => {
                return (
                  <>
                    <td className="border py-2">{kd.cashBookItemNo}</td>
                    <td className="border py-2">{kd.cpfSub}</td>
                    <td className="border py-2">{kd.cpfSub}</td>
                    <td className="border py-2">{kd.cpfSub}</td>
                    <td className="border py-2">{kd.cpfSub}</td>
                  </>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="border leading-8 mx-4 my-4 py-4 px-4">
        <p className="font-semibold">Summary</p>
        <p>Total Receipts: 0</p>
        <p>Total Payments: 0</p>
        <p>Net Amount: 0</p>
      </div>
      <div className="mx-4 my-6 text-sm text-gray-600">
        <p>NB: Posting should be made from Cash Book. Separate Schedule should be prepared for each head of account.</p>
        <p>1. Certified that all receipts as per Cash Book have been included in this schedule.</p>
        <p>2. Certified that all vouchers along with the quittances in support of the payments included in this schedule have been retained in the office.</p>
      </div>
      <hr className=" w-full my-4 h-0.5 bg-black" />
      <div>
        <p className="text-end text-sm mb-4 px-2">Designation</p>
      </div>
    </div>
  );
};

export default Form10;
