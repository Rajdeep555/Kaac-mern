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
const Form5D = () => {
  return (
    <div className="w-full overflow-x-auto p-4 bg-white">
      <h1 className="text-center py-4 text-xl font-bold">Form No. 5D</h1>

      <div className="flex flex-col items-center gap-1 mb-10">
        <p className="font-semibold text-sm">
          Classified cum consolidated abstract for receipts and payments for the
          mouth of <span className="text-blue-500">All Period</span>
        </p>
        <p className="text-sm font-semibold">
          Part I District Fund (Division III) Debt
        </p>
        <p className="text-sm font-semibold">
          (Copy to be appended to the Monthly account)
        </p>
      </div>

      <table className="min-w-350 border-collapse border border-black text-[10px] text-center">
        <thead>
          <tr>
            {/* Single columns stretch down two rows */}
            <th rowSpan={2} className="border border-black px-2">CASH BOOK ITEM NO.</th>
            <th rowSpan={2} className="border border-black px-2">LOANS FROM GOVT.</th>
            <th rowSpan={2} className="border border-black px-2">LOANS FROM OTHER SOURCES</th>
            
            {/* Grouped Header */}
            <th colSpan={3} className="border border-black py-2">RECEIPTS</th>
            
            <th rowSpan={2} className="border border-black px-2">TOTAL RECEIPTS</th>
            <th rowSpan={2} className="border border-black px-2">VR. NO.</th>
            
            {/* Grouped Header */}
            <th colSpan={3} className="border border-black py-2">PAYMENTS</th>
            
            <th rowSpan={2} className="border border-black px-2">TOTAL PAYMENTS</th>
          </tr>
          
          <tr>
            {/* Receipt Sub-heads */}
            <th className="border border-black p-1">H/B LOAN</th>
            <th className="border border-black p-1">CAR LOAN</th>
            <th className="border border-black p-1">OTHER RECEIPTS</th>
            
            {/* Payment Sub-heads */}
            <th className="border border-black p-1">REPAYMENT LOANS (GOVT)</th>
            <th className="border border-black p-1">REPAYMENT LOANS (OTHER)</th>
            <th className="border border-black p-1">PAYMENTS LOANS/ADVANCES</th>
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
            } = data;
            return (
              <tr key={data.id} className="border">
                <td className="border semibold py-2">{receiptDate}</td>
                <td className="border semibold ">{receiptItemNo}</td>
                <td className="border semibold ">{receiptParticulars}</td>
                <td className="border semibold ">{receiptCashAmount}</td>
                <td className="border semibold ">{receiptPlaColumn}</td>
                <td className="border semibold ">{receiptClassification}</td>
                <td className="border semibold ">{disbursementDate}</td>
                <td className="border semibold ">{voucherNo}</td>
                <td className="border semibold ">{disbursementDetails}</td>
                <td className="border semibold ">{disbursementCashAmount}</td>
                <td className="border semibold ">{chequeNo}</td>
                <td className="border semibold ">{plaColumnPayment}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Form5D;
