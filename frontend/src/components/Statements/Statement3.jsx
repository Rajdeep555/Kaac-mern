import React from "react";

// For The First Table
const deptPosition = [
  {
    id: 1,
    nature_dept: "1",
    april: "2",
    receipts: "3",
    repayments: "4",
    march:"5",
    increase_decrease:"6"
  },
  {
    id: 2,
    nature_dept: "-",
    april: "-",
    receipts: "-",
    repayments: "-",
    march:"-",
    increase_decrease:"-"
  },
  {
    id: 3,
    nature_dept: "-",
    april: "-",
    receipts: "-",
    repayments: "-",
    march:"-",
    increase_decrease:"-"
  },
  {
    id: 4,
    nature_dept: "-",
    april: "-",
    receipts: "-",
    repayments: "-",
    march:"-",
    increase_decrease:"-"
  },
];

// For The Second Table
const councilMonth = [
    {
        id:1,
        month:"1",
        opening_balance:"2",
        receipt:"3",
        disbursement:"4",
        closing_balance:"5"
    },
    {
        id:2,
        month:"April",
        opening_balance:"-",
        receipt:"-",
        disbursement:"-",
        closing_balance:"-"
    },
    {
        id:3,
        month:"May",
        opening_balance:"-",
        receipt:"-",
        disbursement:"-",
        closing_balance:"-"
    },
    {
        id:4,
        month:"June",
        opening_balance:"-",
        receipt:"-",
        disbursement:"-",
        closing_balance:"-"
    },
    {
        id:5,
        month:"July",
        opening_balance:"-",
        receipt:"-",
        disbursement:"-",
        closing_balance:"-"
    },
]

const Statement3 = () => {
  const Total = deptPosition.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="w-full overflow-x-auto border-2 bg-white">
      <div className="flex flex-col items-center py-4">
        <h1 className="font-bold text-lg">STATEMENT NO. 3</h1>
        <h2 className="py-4 font-semibold">Debt Position</h2>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />

      {/* First Table */}
      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-280 mx-auto border border-black text-[11px] text-center ">
          <thead>
            {/* <!-- Table Headers Row */}
            {/* "font" is a common use of css in index (using @apply) */}
            <tr>
              <th className="border font uppercase tracking-wide py-2">
                Nature of Dept
              </th>
              <th className="border font uppercase tracking-wide py-2">
                Balance of 1st <br /> April
              </th>
              <th className="border font uppercase tracking-wide py-2">
                Receipts during <br /> the year
              </th>
              <th className="border font uppercase tracking-wide py-2">
                Repayments during <br /> the year
              </th>
              <th className="border font uppercase tracking-wide py-2">
                Balance during 31st <br /> March
              </th>
              <th className="border font uppercase tracking-wide py-2">
                Net Increase(+) <br /> Decrease(-)
              </th>
            </tr>
          </thead>
          <tbody>
            {deptPosition.map((data) => {
              return (
                <tr key={data.id} className="border font-small">
                  <td className="border py-1">{data.nature_dept}</td>
                  <td className="border py-1">{data.april}</td>
                  <td className="border py-1">{data.receipts}</td>
                  <td className="border py-1">{data.repayments}</td>
                  <td className="border py-1">{data.march}</td>
                  <td className="border py-1">{data.increase_decrease}</td>
                </tr>
              );
            })}
            <td
              colSpan={5}
              className="text-start px-4 py-2 text-base font-semibold border"
            >
              Total
            </td>
            <td colSpan={5} className="text-start px-4 py-2 text-base">
              {Total}
            </td>
          </tbody>
        </table>
      </div>

      <hr className=" w-full mt-10 h-0.5 bg-black" />

      <div className="py-6 px-4 leading-8">
        <p className="font-bold">Ways and means position may be given in an explanatory note in the following manner below Statement No. 3</p>
        <p>The following Statement shows the ways and means position of the Council month by month during the year under report:</p>
      </div>
      <hr className=" w-full mb-10 h-0.5 bg-black" />

      {/* Second Table */}
      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-280 mx-auto border border-black text-[11px] text-center ">
          <thead>
            {/* <!-- Table Headers Row */}
            {/* "font" is a common use of css in index (using @apply) */}
            <tr>
              <th className="border font uppercase tracking-wide py-2">
                Month
              </th>
              <th className="border font uppercase tracking-wide py-2">
                Opening Balance
              </th>
              <th className="border font uppercase tracking-wide py-2">
                Receipt
              </th>
              <th className="border font uppercase tracking-wide py-2">
                Disbursement
              </th>
              <th className="border font uppercase tracking-wide py-2">
                Closing Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {councilMonth.map((data) => {
              return (
                <tr key={data.id} className="border font-small">
                  <td className="border py-1">{data.month}</td>
                  <td className="border py-1">{data.opening_balance}</td>
                  <td className="border py-1">{data.receipt}</td>
                  <td className="border py-1">{data.disbursement}</td>
                  <td className="border py-1">{data.closing_balance}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />
      <div className="px-4 py-2 text-start tracking-wide">
        <p>Explanatory Notes</p>
      </div>
    </div>
  );
};

export default Statement3;
