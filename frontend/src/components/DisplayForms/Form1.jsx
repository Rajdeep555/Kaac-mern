import React from "react";

const registerData = [
  {
    id: 1,
    // left side
    receiptDate: "2024-03-01",
    receiptItemNo: "001",
    receiptParticulars: "Opening Balance",
    receiptCashAmount: 50000.0,
    receiptPlaColumn: "PLA-99",
    receiptClassification: "General",

    // right side
    disbursementDate: "2024-03-02",
    voucherNo: "V-101",
    disbursementDetails: "Office Stationery Purchase",
    disbursementCashAmount: 1200.0,
    chequeNo: "CHQ-5521",
    plaColumnPayment: "PLA-99",
    treasuryClassification: "Administrative",
  },
  {
    id: 2,
    // left side
    receiptDate: "2024-03-05",
    receiptItemNo: "002",
    receiptParticulars: "Grant received from Treasury",
    receiptCashAmount: 25000.0,
    receiptPlaColumn: "PLA-102",
    receiptClassification: "Grant-in-Aid",

    // right side
    disbursementDate: "2024-03-06",
    voucherNo: "V-102",
    disbursementDetails: "Electricity Bill Payment",
    disbursementCashAmount: 4500.0,
    chequeNo: "Online Transfer",
    plaColumnPayment: "PLA-102",
    treasuryClassification: "Utility",
  },
  {
    id: 3,
    // left side
    receiptDate: "2024-03-05",
    receiptItemNo: "003",
    receiptParticulars: "Grant received from Treasury",
    receiptCashAmount: 25000.0,
    receiptPlaColumn: "PLA-102",
    receiptClassification: "Grant-in-Aid",

    // right side
    disbursementDate: "2024-03-06",
    voucherNo: "V-102",
    disbursementDetails: "Electricity Bill Payment",
    disbursementCashAmount: 4500.0,
    chequeNo: "Online Transfer",
    plaColumnPayment: "PLA-102",
    treasuryClassification: "Utility",
  },
];
const Form1 = () => {
  return (
    <div className="w-full overflow-x-auto  bg-white border-2">
      <h1 className="text-center py-4 text-xl font-bold">Form No. 1</h1>
      <div className="py-4 text-center font-semibold">
        <p>Cash Book of <span>..........</span> for the month of <span>.........</span></p>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />
        <div className="w-full overflow-x-auto my-8">
        <table className="min-w-360 border border-black text-[11px] text-center mx-4">
        <thead>
          {/* <!-- Top Heading --> */}
          <tr>
            <th colSpan={6} className="border border-black py-1 ">
              Dr (Receipt)
            </th>
            <th colSpan={7} className="border border-black py-1 ">
              Cr (Disbursement)
            </th>
          </tr>

          {/* <!-- Main Header Row --> (Here,  we Created the lebels of the table) */}
          <tr>
            <th className="border px-10">Date</th>
            <th className="border px-1">No. of item</th>
            <th className="border px-1 w-60">
              Particulars (Full details with reference to receipts, challans,
              cheques etc.)
            </th>

            <th colSpan={2} className="border border-black p-0 align-top">
              <div className="border-b border-black py-2 font-bold text-center">
                Receipts (Amount)
              </div>
              <div className="flex w-full font-bold">
                <div className="w-1/2 border-r border-black py-2">
                  Cash Column
                </div>
                <div className="w-1/2 py-2">
                  Treasury <br /> PLA column
                </div>
              </div>
            </th>

            {/* <th colSpan={2} className="border">
              <div className="border-b border-black py-2 font-bold text-center">
                Receipts (Amount)
              </div>
              <div className="flex w-full font-bold">
                <div className="w-1/2 border-r py-2  ">
                  Cash <br /> Column
                </div>
                <div className="w-1/2 py-2 px-1 ">
                  Treasury <br /> PLA Column
                </div>
              </div>
            </th> */}

            <th className="border px-1">classNameification</th>

            <th className="border px-10">Date</th>
            <th className="border px-1">
              No. of item
              <br />
              (Voucher No.)
            </th>
            <th className="border px-1 w-52">
              classNameification (Full details of claims)
            </th>

            <th colSpan={2} className="border p-0 align-top">
              <div className="border-b py-2 font-bold text-center">
                Disbursement
              </div>
              <div className="flex w-full font-bold">
                <div className="w-1/2 border-r py-2">
                  Cash Column
                </div>
                <div className="w-1/2 py-2">
                  No of Cheque <br /> cheque book
                </div>
              </div>
            </th>

            <th colSpan={2} className="border align-top">
              <div className="border-b py-2 font-bold text-center">
                Treasury
              </div>
              <div className="flex w-full font-bold">
                <div className="w-1/2 py-2 border-r">PLA <br /> column</div>
                <div className="w-1/2 py-2">Classification</div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {registerData.map((data) => {
            const {
              receiptDate,
              receiptItemNo,
              receiptParticulars,
              receiptCashAmount,
              receiptPlaColumn,
              receiptClassification,
              disbursementDate,
              voucherNo,
              disbursementDetails,
              disbursementCashAmount,
              chequeNo,
              plaColumnPayment,
              treasuryClassification,
            } = data;
            return (
              <tr key={data.id} className="border">
                <td className="border py-2">{receiptDate}</td>
                <td className="border">{receiptItemNo}</td>
                <td className="border">{receiptParticulars}</td>
                <td className="border w-1/15">{receiptCashAmount}</td>
                <td className="border w-1/15">{receiptPlaColumn}</td>
                <td className="border">{receiptClassification}</td>
                <td className="border">{disbursementDate}</td>
                <td className="border">{voucherNo}</td>
                <td className="border">{disbursementDetails}</td>
                <td className="border w-1/15">{disbursementCashAmount}</td>
                <td className="border w-1/15">{chequeNo}</td>
                <td className="border w-1/15">{plaColumnPayment}</td>
                <td className="border w-1/15">{treasuryClassification}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />
      <div className="px-4 py-4 tracking-wide flex justify-between font-semibold">
        <p>Cashier</p>
        <p>Officer i/c of the Cash Book</p>
      </div>
    </div>
  );
};

export default Form1;
