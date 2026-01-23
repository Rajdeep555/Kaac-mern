import React from "react";

const registerData = [
  {
    id: 1,
    // left side
    receiptDate: "2024-03-01",
    receiptItemNo: "001",
    receiptParticulars: "Opening Balance",
    receiptCashAmount: 50000.00,
    receiptPlaColumn: "PLA-99",
    receiptClassification: "General",

    // right side
    disbursementDate: "2024-03-02",
    voucherNo: "V-101",
    disbursementDetails: "Office Stationery Purchase",
    disbursementCashAmount: 1200.00,
    chequeNo: "CHQ-5521",
    plaColumnPayment: "PLA-99",
    treasuryClassification: "Administrative"
  },
  {
    id: 2,
    // left side
    receiptDate: "2024-03-05",
    receiptItemNo: "002",
    receiptParticulars: "Grant received from Treasury",
    receiptCashAmount: 25000.00,
    receiptPlaColumn: "PLA-102",
    receiptClassification: "Grant-in-Aid",

    // right side
    disbursementDate: "2024-03-06",
    voucherNo: "V-102",
    disbursementDetails: "Electricity Bill Payment",
    disbursementCashAmount: 4500.00,
    chequeNo: "Online Transfer",
    plaColumnPayment: "PLA-102",
    treasuryClassification: "Utility"
  },
  {
    id: 3,
    // left side
    receiptDate: "2024-03-05",
    receiptItemNo: "003",
    receiptParticulars: "Grant received from Treasury",
    receiptCashAmount: 25000.00,
    receiptPlaColumn: "PLA-102",
    receiptClassification: "Grant-in-Aid",

    // right side
    disbursementDate: "2024-03-06",
    voucherNo: "V-102",
    disbursementDetails: "Electricity Bill Payment",
    disbursementCashAmount: 4500.00,
    chequeNo: "Online Transfer",
    plaColumnPayment: "PLA-102",
    treasuryClassification: "Utility"
  }
];
const Form1 = () =>
  { 
  return (
    <div className="w-full overflow-x-auto p-4 bg-white">
      <table className="min-w-330 border border-black text-[11px] text-center">
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
            <th className="border border-black px-10">Date</th>
            <th className="border border-black px-1">No. of item</th>
            <th className="border border-black px-1 w-60">
              Particulars (Full details with reference to receipts, challans,
              cheques etc.)
            </th>
            <th className="border border-black px-1">
              Receipts (Amount)
              <br />
              Cash Column
            </th>
            <th className="border border-black px-1">
              Treasury
              <br />
              PLA Column
            </th>
            <th className="border border-black px-1">classNameification</th>

            <th className="border border-black px-10">Date</th>
            <th className="border border-black px-1">
              No. of item
              <br />
              (Voucher No.)
            </th>
            <th className="border border-black px-1 w-52">
              classNameification (Full details of claims)
            </th>
            <th className="border border-black px-1">
              Disbursement
              <br />
              Cash Column
            </th>
            <th className="border border-black px-1">
              No. of Cheque
              <br />
              Cheque Book
            </th>
            <th className="border border-black px-1">
              PLA
              <br />
              Column
            </th>
            <th className="border border-black px-1">
              Treasury
              <br />
              classNameification
            </th>
          </tr>
        </thead>
        <tbody>
          
            {registerData.map((data) => {
                const {receiptDate , receiptItemNo , receiptParticulars , receiptCashAmount , receiptPlaColumn , receiptClassification , disbursementDate , voucherNo , disbursementDetails , disbursementCashAmount , chequeNo , plaColumnPayment , treasuryClassification } = data
              return (
                
                <tr key={data.id} className="border">
                  <td className="border">{receiptDate}</td>
                  <td className="border">{receiptItemNo}</td>
                  <td className="border">{receiptParticulars}</td>
                  <td className="border">{receiptCashAmount}</td>
                  <td className="border">{receiptPlaColumn}</td>
                  <td className="border">{receiptClassification}</td>
                  <td className="border">{disbursementDate}</td>
                  <td className="border">{voucherNo}</td>
                  <td className="border">{disbursementDetails}</td>
                  <td className="border">{disbursementCashAmount}</td>
                  <td className="border">{chequeNo}</td>
                  <td className="border">{plaColumnPayment}</td>
                  <td className="border">{treasuryClassification}</td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  );
};

export default Form1;
