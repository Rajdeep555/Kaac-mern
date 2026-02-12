import React from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";

const totalRows = [
  {
    id: 1,
    label: "Major Head",
    val1: "102",
    val2: "45",
    val3: "01",
    val4: "88",
    val5: "12",
    val6: "00",
    amount: "45800",
  },
  {
    id: 2,
    label: "Total Capital Expenditure",
    val1: "102",
    val2: "45",
    val3: "01",
    val4: "88",
    val5: "12",
    val6: "01",
    amount: "12540600",
  },
];

const Form5C = ({ sector }) => {
  return (
    <div className="w-full overflow-x-auto border-2">
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-lg py-2">FORM NO. 5C</h1>
          <p className="font-semibold tracking-wide">
            Part I District Fund (Division II)
          </p>
          <p className="font-semibold tracking-wide">
            Classified Abstract of expenditure for the month of .............
          </p>
          <p className="font-semibold tracking-wide mb-7">
            (To be appended with monthly account to be sent to the AG)
          </p>
        </div>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />
      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-350 border border-black text-[11px] text-center mx-4">
          <thead>
            {/* <!-- Table Headers Row */}
            <tr>
              <th className="border text-base py-2 px-10">
                MAJOR HEAD <br /> MINOR HEAD{" "}
              </th>
              <th className="border text-base ">PAY OF OFFICERS</th>
              <th className="border text-base ">PAY OF ESTABLISHMENT</th>
              <th className="border text-base ">ALLOWANCES AND HONIARA</th>
              <th className="border text-base ">CONTINGENCIES</th>
              <th className="border text-base ">GRANTS-IN-AID</th>
              <th className="border text-base px-2">WORKS</th>
              <th className="border text-base ">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {totalRows.map((row) => {
              const { id, label, val1, val2, val3, amount } = row;
              return (
                <tr key={id} className="text-base border">
                  {/* Changed span to td for valid table structure */}
                  <td className="border px-4 py-2">{label}</td>
                  <td className="font-normal border px-4 py-2">
                    <div className="flex justify-center items-center gap-2">
                      <LiaRupeeSignSolid />
                      {val1}
                    </div>
                  </td>
                  <td className="font-normal border px-4 py-2">
                    <div className="flex justify-center items-center gap-2">
                      <LiaRupeeSignSolid />
                      {val2}
                    </div>
                  </td>
                  <td className="font-normal border px-4 py-2">
                    <div className="flex justify-center items-center gap-2">
                      <LiaRupeeSignSolid />
                      {val3}
                    </div>
                  </td>
                  <td className="font-normal border px-4 py-2">
                    <div className="flex justify-center items-center gap-2">
                      <LiaRupeeSignSolid />
                      {val3}
                    </div>
                  </td>
                  <td className="font-normal border px-4 py-2">
                    <div className="flex justify-center items-center gap-2">
                      <LiaRupeeSignSolid />
                      {val3}
                    </div>
                  </td>
                  <td className="font-normal border px-4 py-2">
                    <div className="flex justify-center items-center gap-2">
                      <LiaRupeeSignSolid />
                      {val3}
                    </div>
                  </td>
                  <td className="font-normal px-4 py-2 tracking-wider">
                    <div className="flex items-center justify-center gap-2">
                      <LiaRupeeSignSolid />
                      {amount}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />
      <div>
        <div className="px-4 leading-7 font-semibold py-2 tracking-wide">
          <p>Secretary</p>
          <p>Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Form5C;
