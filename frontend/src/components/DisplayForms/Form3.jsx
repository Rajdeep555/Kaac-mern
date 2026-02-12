import React from "react";

const Form3 = ({ data = [], title }) => {
  return (
    <div className="w-full overflow-x-auto border-2 bg-white">
      <div className="flex flex-col items-center py-4">
        <h1 className="font-bold text-lg">FORM NO. 3</h1>
        <h2 className="py-4 font-semibold">{title}</h2>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-330 border border-black text-[11px] text-center mx-4">
          <thead>
            <tr>
              <th className="border border-black font">No. of Cheque</th>
              <th className="border border-black font">Date of drawal</th>
              <th className="border border-black font">No. of Cheque</th>
              <th className="border border-black font">Amount Rs</th>
              <th className="border border-black font">
                Name of the Treasury <br /> on which drawn
              </th>
              <th className="border border-black font">
                Reference to item <br /> No. in the Cash Book
              </th>
              <th className="border border-black font">Date of encashment</th>
              <th className="border border-black font">Remarks</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan="8" className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {data.map((item) => (
              <tr key={item.id} className="border font-small">
                <td className="border py-1">{item.chequeNo}</td>
                <td className="border py-1">
                  {item.chequeIssueDate
                    ? new Date(item.chequeIssueDate).toLocaleDateString()
                    : "-"}
                </td>
                <td className="border py-1">{item.chequeNo}</td>
                <td className="border py-1">
                  ₹{Number(item.grossAmount).toFixed(2)}
                </td>
                <td className="border py-1">{item.treasuryName}</td>
                <td className="border py-1">{item.voucherNo}</td>
                <td className="border py-1">
                  {item.treasuryDate
                    ? new Date(item.treasuryDate).toLocaleDateString()
                    : "-"}
                </td>
                <td className="border py-1">{item.remarks || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="px-4 py-2 tracking-wide font-semibold">
        <p>Secretary</p>
      </div>
    </div>
  );
};

export default Form3;
