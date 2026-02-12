import React from "react";

const challanData = [
  {
    id: 1,
    clnNo: "CLN-5520",
    date: "2026-01-10",
    treasury: "Guwahati-I",
    amount: 5000.0,
    refItemNo: "CB-12",
    classification: "Revenue",
    remarks: "Tax deposit",
  },
  {
    id: 2,
    clnNo: "CLN-5521",
    date: "2026-01-12",
    treasury: "Dispur",
    amount: 12500.75,
    refItemNo: "CB-15",
    classification: "Capital",
    remarks: "Unspent balance",
  },
  {
    id: 3,
    clnNo: "CLN-5522",
    date: "2026-01-15",
    treasury: "Guwahati-II",
    amount: 3200.0,
    refItemNo: "CB-19",
    classification: "Misc",
    remarks: "",
  },
];

const Form4 = ({ sector }) => {
  return (
    <div className="w-full overflow-x-auto border-2">
      <div className="flex flex-col items-center py-4">
        <h1 className="font-bold text-lg">FORM NO. 4</h1>
        {sector && (
          <p className="text-sm font-medium text-gray-600">Sector: {sector}</p>
        )}
        <h2 className="py-4 font-semibold">
          Register of Remittances to Treasury (PLA)
        </h2>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />
      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-full border mx-4 border-black text-[11px] text-center">
          <thead>
            {/* <!-- Table Headers Row */}
            {/* "font" is a common use of css in index (using @apply) */}
            <tr>
              <th className="border border-black font">Challan No</th>
              <th className="border border-black font">Date</th>
              <th className="border border-black font">Name of Treasury</th>
              <th className="border border-black font">Amount remitted</th>
              <th className="border border-black font ">
                Reference to Cash
                <br />
                Book item No
              </th>
              <th className="border border-black font">Classification</th>
              <th className="border border-black font">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {challanData.map((data) => {
              const {
                clnNo,
                date,
                treasury,
                amount,
                refItemNo,
                classification,
                remarks,
              } = data;
              return (
                <tr key={data.id} className="border font-small">
                  <td className="border py-1">{clnNo}</td>
                  <td className="border py-1">{date}</td>
                  <td className="border py-1">{treasury}</td>
                  <td className="border py-1">{amount}</td>
                  <td className="border py-1">{refItemNo}</td>
                  <td className="border py-1">{classification}</td>
                  <td className="border py-1">{remarks}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />
      <div className="font-semibold px-4 py-2 text-end">
        <p>Signature of the Officer</p>
      </div>
    </div>
  );
};

export default Form4;
