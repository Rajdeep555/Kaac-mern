import React from "react";

const registerData = [
  {
    id: 1,
    cashBookItemNo: "CB-001",
    cpfSub: 5000.0,
    securityDep: 2000.0,
    earnestMoney: 1000.0,
    govtDeposit: 0.0,
    chequesDrawn: 15000.0,
    totalReceipt: 23000.0,
    vrNo: "V-101",
    cpfAdvances: 1200.0,
    cpfPostOffice: 500.0,
    paySecurityDep: 0.0,
    repayEarnest: 0.0,
    transferItems: 0.0,
    remittanceTreasury: 10000.0,
    totalPayment: 11700.0,
  },
];

const Form5E = ({ sector }) => {
  return (
    <div className="w-full overflow-x-auto border-2">
      <h1 className="text-center py-4 text-xl font-bold">Form No. 5E</h1>

      <div className="flex flex-col items-center gap-1 mb-10">
        <p className="font-semibold text-sm">
          Classified cum consolidated abstract for receipts and payments for the
          mouth of <span className="text-blue-500">All Period</span>
        </p>
        <p className="text-sm font-semibold">
          Part II Deposit Fund (Transactions relating to
          Debt-Deposit-Remittances)
        </p>
        <p className="text-sm font-semibold">
          (Copy to be appended to the Monthly account)
        </p>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />
      <div className="w-full overflow-x-auto my-8">
      <table className="min-w-500 border border-black text-[11px] text-center mx-4">
        <thead>
          {/* Level 1: Receipt vs Payment */}
          <tr>
            <th
              colSpan={7}
              className="border border-black py-2 text-base uppercase"
            >
              Receipts
            </th>
            <th
              colSpan={8}
              className="border border-black py-2 text-base uppercase"
            >
              Payments
            </th>
          </tr>
          {/* Level 2: Actual Columns */}
          <tr className="bg-white">
            {/* Receipt Side */}
            <th className="border border-black p-1 w-20">CASH BOOK ITEM NO.</th>
            <th className="border border-black p-1">RECOVERS OF CPF SUBSCRIPTIONS</th>
            <th className="border border-black p-1">SECURITY DEPOSIT</th>
            <th className="border border-black p-1">EARNEST MONEY DEPOSIT</th>
            <th className="border border-black p-1">DEPOSITS FROM GOVT</th>
            <th className="border border-black p-1">CHEQUES DRAWN</th>
            <th className="border border-black p-1 bg-gray-100">TOTAL</th>

            {/* Payment Side */}
            <th className="border border-black p-1">VR. NO.</th>
            <th className="border border-black p-1">PAYMENT OF CPF ADVANCES</th>
            <th className="border border-black p-1">REMITTANCE CPF TO P.O.</th>
            <th className="border border-black p-1">PAYMENT SECURITY DEPOSIT</th>
            <th className="border border-black p-1">REPAYMENT EARNEST MONEY</th>
            <th className="border border-black p-1">TRANSFER ITEMS</th>
            <th className="border border-black p-1">REMITTANCE TO TREASURY</th>
            <th className=" p-1 bg-gray-100">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {registerData.map((data) => {
            const {
              id,
              cashBookItemNo,
              cpfSub,
              securityDep,
              earnestMoney,
              govtDeposit,
              chequesDrawn,
              totalReceipt,
              vrNo,
              cpfAdvances,
              cpfPostOffice,
              paySecurityDep,
              repayEarnest,
              transferItems,
              remittanceTreasury,
              totalPayment,
            } = data;
            return (
              <tr key={data.id} className="border">
                <td className="border semibold py-2">{cashBookItemNo}</td>
                <td className="border semibold">{cpfSub}</td>
                <td className="border semibold">{securityDep}</td>
                <td className="border semibold">{earnestMoney}</td>
                <td className="border semibold">{govtDeposit}</td>
                <td className="border semibold">{chequesDrawn}</td>
                <td className="border semibold">{totalReceipt}</td>
                <td className="border semibold">{vrNo}</td>
                <td className="border semibold">{cpfAdvances}</td>
                <td className="border semibold">{cpfPostOffice}</td>
                <td className="border semibold">{paySecurityDep}</td>
                <td className="border semibold">{repayEarnest}</td>
                <td className="border semibold">{transferItems}</td>
                <td className="border semibold">{remittanceTreasury}</td>
                <td className="border semibold">{totalPayment}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
            <hr className=" w-full mb-4 h-0.5 bg-black" />
      <div className="px-4 tracking-wide font-semibold py-2">
        <p>Secretary</p>
      </div>
    </div>
  );
};

export default Form5E;
