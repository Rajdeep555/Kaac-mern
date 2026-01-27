import React from "react";

const receiptData = [
  {
    id: 1,
    cbItemNo: 1, // Cash Book Item No
    deptName: "Public Works", // Name of the Deptt
    councilRev: 45000.0, // Revenue receipts of the Council
    govGrant: 120000.0, // Grants-in-aid received from the Govt
    miscRcpt: 1500.0, // Other Misc receipts
    total: 166500.0, // Total receipts
  },
  {
    id: 2,
    cbItemNo: 2,
    deptName: "Education",
    councilRev: 12000.0,
    govGrant: 85000.0,
    miscRcpt: 500.0,
    total: 97500.0,
  },
  {
    id: 3,
    cbItemNo: 3,
    deptName: "Health",
    councilRev: 8500.0,
    govGrant: 50000.0,
    miscRcpt: 2200.0,
    total: 60700.0,
  },
  {
    id: 4,
    cbItemNo: 4,
    deptName: "Education",
    councilRev: 12000.0,
    govGrant: 85000.0,
    miscRcpt: 500.0,
    total: 97500.0,
  },
  {
    id: 5,
    cbItemNo: 5,
    deptName: "Health",
    councilRev: 8500.0,
    govGrant: 50000.0,
    miscRcpt: 2200.0,
    total: 60700.0,
  },
];

const Form8 = () => {
  return (
    <div className="w-full overflow-x-auto p-4 bg-white">
      <div className="flex flex-col items-center">
        <h1 className="font-bold text-lg">FORM NO. 8</h1>
        <div className="w-full flex justify-around">
          <p className="font-semibold">(Receipt Schedule)</p>
          <p className="font-semibold">(Revenue Head)</p>
        </div>
        <h2 className="py-4 font-semibold tracking-wide">
          (Copy to be appended to the Monthly account)
        </h2>
      </div>
      <table className="min-w-290 border border-black text-[11px] text-center px-1">
        <thead>
          {/* <!-- Table Headers Row */}
          {/* "font" is a common use of css in index (using @apply) */}
          <tr>
            <th className="border border-black font">Cash Book Item No</th>
            <th className="border border-black font  ">
              Name of the Deptt
              <br />
              Nomenclature of the
              <br />
              Receipt Head
            </th>
            <th className="border border-black font ">
              Revenue receipts of
              <br />
              the Council
            </th>
            <th className="border border-black font ">
              Grants-in-aid
              <br />
              received from the
              <br />
              Govt
            </th>
            <th className="border border-black font">Other Misc receipts</th>
            <th className="border border-black font">Total receipts</th>
          </tr>
        </thead>
        <tbody>
          {receiptData.map((data) => {
            const {
              cbItemNo,
              deptName,
              councilRev,
              govGrant,
              miscRcpt,
              total,
            } = data;
            return (
              <tr key={data.id} className="border font-small">
                <td className="border py-1">{cbItemNo}</td>
                <td className="border py-1">{deptName}</td>
                <td className="border py-1">{councilRev}</td>
                <td className="border py-1">{govGrant}</td>
                <td className="border py-1">{miscRcpt}</td>
                <td className="border py-1">{total}</td>
              </tr>
            );
          })}
        </tbody>
        {/* Here, you need to total the value as the given in the hard copy , I don't know that is the total values but given the space if you want to fill, otherwise remove this section */}
        <tr className="text-lg">
            <span>Total</span>
            <th className="font-normal text-blue-500">dynamic values</th>
            <th className="font-normal text-blue-500">dynamic values</th>
            <th className="font-normal text-blue-500">dynamic values</th>
            <th className="font-normal text-blue-500">dynamic values</th>
            <th className="font-normal text-blue-500">dynamic values</th>
        </tr>
      </table>
      {/* when you working in this , remove this two line, I just write because of it is given in the hardcopy. */}
      <p className="my-4">NB:- Posting should be made from Cash Book</p>
      <p>Cetified that the receipts as per Cash Book have been included in this schedule.</p>
    </div>
  );
};

export default Form8;
