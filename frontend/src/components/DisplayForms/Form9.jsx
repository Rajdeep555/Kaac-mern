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
      head:"CASH BOOK VR NO.",
      number:1
  },
  {
      head:"NAME OF DEPARTMENT",
      number:2
  },
  {
      head:"PAY OF OFFICER",
      number:3
  },
  {
      head:"PAY OF ESTABLISHMENT",
      number:4
  },
  {
      head:"TRAVELLING ALLOWANCES",
      number:5
  },
  {
      head:"CONTINGENCY",
      number:6
  },
  {
      head:"GRANT-IN-AID",
      number:7
  },
  {
      head:"WORKS",
      number:8
  },
  {
      head:"TOTAL PAYMENTS",
      number:9
  },
];

const Form9 = () => {
  const year = "2026";
  return (
    <div className="w-full overflow-x-auto bg-white border-2">
      <div className="flex bg-gray-300 pb-4 flex-col px-2 items-center gap-1  ">
        <h1 className="text-center py-2 text-xl font-bold">Form No. 9</h1>
        <div className="w-full flex flex-col items-center">
          <p className="font-semibold">Copy to be appended to the Monthly account</p>
          <p className="font-semibold">Payment Schedule</p>
          <p className="font-semibold">Revenue Head</p>
          <p className="font-semibold">Year: 2025</p>
        </div>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto">
        <table className="w-full border border-black mx-4 text-[11px] px-2 my-2 text-center">
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
      <div className="border mx-4 my-4 py-4 px-4">
        <span>Grand Total Amount: 120000</span>
      </div>
      <div className="mx-4 my-6 text-sm text-gray-600">
        <p>(NB - to be posted from Cash Book)</p>
        <p>Certified that all vouchers along with the quittances in support of the payments included in this schedule have been retained in the office.</p>
      </div>
      <hr className=" w-full my-4 h-0.5 bg-black" />
      <div>
        <p className="text-end text-sm mb-4 px-2">Designation</p>
      </div>
    </div>
  );
};

export default Form9;
