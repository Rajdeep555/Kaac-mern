import React from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";

const totalRows = [
  {
    id: 1,
    label: "Major Head",
    val1: "01",
    val2: "02",
    val3: "03",
    amount: "0402546",
  },
  {
    id: 2,
    label: "Minor Head(i)",
    val1: "01",
    val2: "02",
    val3: "03",
    amount: "0402546",
  },
  {
    id: 3,
    label: "Minor Head(ii)",
    val1: "01",
    val2: "02",
    val3: "03",
    amount: "0402546",
  },
  {
    id: 4,
    label: "Total Major Head",
    val1: "01",
    val2: "02",
    val3: "03",
    amount: "0402546",
  },
  {
    id: 5,
    label: "Major Head",
    val1: "01",
    val2: "02",
    val3: "03",
    amount: "0402546",
  },
  {
    id: 6,
    label: "Minor Head(i)",
    val1: "01",
    val2: "02",
    val3: "03",
    amount: "0402546",
  },
  {
    id: 7,
    label: "Minor Head(ii)",
    val1: "01",
    val2: "02",
    val3: "03",
    amount: "0402546",
  },
  {
    id: 8,
    label: "Total Major Head",
    val1: "01",
    val2: "02",
    val3: "03",
    amount: "0402546",
  },
];

const Form5A = () => {
  return (
    <div className="w-full overflow-x-auto border-2">
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-lg py-2">FORM NO. 5A</h1>
          <p className="font-semibold tracking-wide">
            Part I District Fund (Division)
          </p>
          <p className="font-semibold tracking-wide">
            Classified Abstract of receipts for the month of .............
          </p>
          <p className="font-semibold tracking-wide mb-7">
            (To be appended with monthly account)
          </p>
        </div>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />
      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-290 border border-black text-[11px] text-center mx-4">
          <thead>
            {/* <!-- Table Headers Row */}
            <tr>
              <th className="border text-base py-2">HEAD CODE & DESCRIPTION</th>
              <th className="border text-base ">DETAIL HEAD</th>
              <th className="border text-base ">DETAIL HEAD</th>
              <th className="border text-base ">DETAIL HEAD</th>
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
                  <td className="font-normal border px-4 py-2">{val1}</td>
                  <td className="font-normal border px-4 py-2">{val2}</td>
                  <td className="font-normal border px-4 py-2">{val3}</td>
                  <td className="font-normal px-4 py-2 flex items-center tracking-wider justify-center gap-2"><LiaRupeeSignSolid />{amount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />
      <div className="px-4 py-2 tracking-wide font-semibold leading-7">
        <p>Secretary</p>
        <p>Date: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default Form5A;
