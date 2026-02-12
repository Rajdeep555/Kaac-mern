import React from "react";

const headDetails = [
  {
    major_head: 204,
    minor_head: 2040102,
    detail_head: 204010204,
    voucher_no: "KAAC-0002",
    date: "01-12-2025",
    amount: 26010000,
  },
  {
    major_head: 8443,
    minor_head: 120,
    detail_head: 0,
    voucher_no: "KAAC-0001",
    date: "29-05-2025",
    amount: 1910900,
  },
]

const Form7A = ({ sector }) => {

  const grandTotal = headDetails.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="w-full overflow-x-auto bg-white border-2">
      <div className="flex bg-gray-300 pb-4 flex-col px-2 items-center gap-1  ">
        <h1 className="text-center py-2 text-xl font-bold">Form No. 7A</h1>
        <div className="w-full flex flex-col items-center">
          <p className="font-semibold">Compilation sheet for Year 2025</p>
          <p className="font-semibold">Major Head of Accounts - Payment</p>
          <p className="font-semibold">Year: 2025</p>
        </div>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto">
        <table className="w-[95%]  border-2 border-black mx-4 text-[14px] px-2 my-2 text-center">
          <thead>
            <tr>
              <th className="py-4 border-r">MAJOR HEAD</th>
              <th className="border-r">MINOR HEAD</th>
              <th className="border-r">DETAIL HEAD</th>
              <th className="border-r">VOUCHER NO</th>
              <th className="border-r">DATE</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody className="py-2 text-sm">
          {headDetails.map((head, index) => {
            return (
              <>
              <tr className="border">
                <td className="border-r py-2">{head.major_head}</td>
                <td className="border-r">{head.minor_head}</td>
                <td className="border-r">{head.detail_head}</td>
                <td className="border-r">{head.voucher_no}</td>
                <td className="border-r">{head.date}</td>
                <td className="border-r">{head.amount}</td>
              </tr>

              {/* detail head */}
              <tr className="border">
                <td colSpan={5} className="py-2 font-semibold border text-end px-4 tracking-wider">Total - Detail Head({head.detail_head})</td>
                <td>{head.amount}</td>
              </tr>

              {/* minor head */}
              <tr>
                <td colSpan={5} className="py-2 border font-semibold text-end px-4 tracking-wider">Total - Minor Head({head.minor_head})</td>
                <td>{head.amount}</td>
              </tr>

              {/* major head */}
              <tr className="border">
                <td colSpan={5} className="py-2 border text-end px-4 font-semibold tracking-wider">Total - Major Head({head.major_head})</td>
                <td>{head.amount}</td>
              </tr>
              </>
            )
          })}
          <td colSpan={5} className="py-2 text-end px-4 font-bold border-r">GRAND TOTAL</td>
          <td className="py-2 font-bold "> {grandTotal}</td>
          </tbody>
        </table>
      </div>
      <div className="mx-4 my-6 text-sm text-gray-600 leading-7">
        <p>NB: (i) Compilation may be made detailed headwise after assinging a seriel no. to each detailed head.</p>
        <p>(ii) Deduction like Provident Fund, recovery of loan and advances from the voucher when the same is to be accounted for under different head of the account should be posted separtely.</p>
      </div>
      <hr className=" w-full my-4 h-0.5 bg-black" />
      <div>
        <p className="text-start text-sm mb-4 px-2">Secretary</p>
      </div>
    </div>
  );
};

export default Form7A;
