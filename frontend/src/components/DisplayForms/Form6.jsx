import React from "react";

const registerData = [
  {
    id: 1,
    cashBookItemNo: "CB-001",
    cpfSub: 5000.0,
  },
];

const Form6 = ({ sector }) => {
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const year = "2026";
  return (
    <div className="w-full overflow-x-auto bg-white border-2">

      <div className="flex flex-col px-2 items-center gap-1  ">
      <h1 className="text-center py-2 text-xl font-bold">Form No. 6</h1>
        <p className="font-semibold text-sm">(Not to be appended with monthly accounts)
        </p>
        <p className="text-sm font-semibold mb-6">
          Classified cum Consolidated Abstract - Year 2026
        </p>
      </div>
      <hr className=" w-full my-4 h-0.5 bg-black" />
      <div className=" w-full flex justify-between px-4 mb-6 ">
        <button className="bg-black text-white text-center px-4 py-2 cursor-pointer">MAJOR HEAD</button>
        <button className="bg-black text-white text-center px-4 py-2 cursor-pointer">EXPENDITURE</button>
      </div>

<div className="w-full overflow-x-auto">
          <table className="w-full border border-black mx-4 text-[11px] px-2 my-2 text-center">
        <thead>
          {/* Level 1: Receipt vs Payment */}
          {/* Level 2: Actual Columns */}
          <tr className="border">
            {months.map((month, index) => {
              return <th key={index} className="border py-2">{month}</th>
            })}
          </tr>
            <tr>
              {months.map((nothing, index) => {
                return <th className="border py-2" key={index}>{year}</th>
              }
              )}
            </tr>
        </thead>
        <tbody className="py-2 ">
          <tr>
           {registerData.map((kd, ind) => {
            return <> 
              <td className="border py-2">{kd.cashBookItemNo}</td>
              <td className="border py-2">{kd.cpfSub}</td>
              <td className="border py-2">{kd.cpfSub}</td>
              <td className="border py-2">{kd.cpfSub}</td>
              <td className="border py-2">{kd.cpfSub}</td>
              <td className="border py-2">{kd.cpfSub}</td>
              <td className="border py-2">{kd.cpfSub}</td>
              <td className="border py-2">{kd.cpfSub}</td>
              <td className="border py-2">{kd.cpfSub}</td>
              <td className="border py-2">{kd.cpfSub}</td>
              <td className="border py-2">{kd.cpfSub}</td>
              <td className="border py-2">{kd.cpfSub}</td>
              </>
           })}
          </tr>
        </tbody>
      </table>
</div>
      <hr className=" w-full my-4 h-0.5 bg-black" />
      <div>
        <p className="text-end text-sm mb-4 px-2">Secretary</p>
      </div>
    </div>
  );
};

export default Form6;
