import React from "react";

const openingBalance = [
  {
    id: 1,
    major_head: 1,
    previour_year: "2",
    current_year: "3",
    total: "4",
  },
  {
    id: 2,
    major_head: "-",
    previour_year: "-",
    current_year: "-",
    total: "-",
  },
  {
    id: 3,
    major_head: "-",
    previour_year: "-",
    current_year: "-",
    total: "-",
  },
  {
    id: 4,
    major_head: "-",
    previour_year: "-",
    current_year: "-",
    total: "-",
  },
];

const numbers = ["(1)", "(2)", "(3)", "(4)", "(5)", "(6)"];

const Statement1 = () => {
  const Total = openingBalance.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="w-full overflow-x-auto border-2 bg-white">
      <div className="flex flex-col items-center py-2">
        <h1 className="font-bold text-lg">STATEMENT NO. 1</h1>
        <h2 className="py-2 font-semibold">
          Summary of Transactions (Council Sector Only)
        </h2>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />
      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-280 mx-4 border border-black text-[11px] text-center ">
          <thead>
            <tr className="border ">
              <th rowSpan={2} className="w-1/4 py-2">RECEIPTS</th>

              <th colSpan={2} className="border py-2 w-1/4">ACTUAL</th>

              <th rowSpan={2} className="border w-1/4">DISBURSEMENTS</th>
              <th colSpan={2} className="border w-1/4">ACTUAL</th>

            </tr>
              <tr>
                <th className="border">kangkan</th>
                <th className="py-2">kangkan</th>

                <th className="border">kangkan</th>
                <th>kangkan</th>
              </tr>
            <tr>
              {numbers.map((num, index) => {
                return (
                  <th key={index} className="border py-2">
                    {num}
                  </th>
                );
              })}
            </tr>
            <tr>
              <th colSpan={3} className="border py-2">Part-I District Fund</th>
              <th colSpan={3} className="border py-2"></th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />
      <div className="px-4 py-2 text-start tracking-wide">
        <p>Explanatory Notes</p>
      </div>
    </div>
  );
};

export default Statement1;
