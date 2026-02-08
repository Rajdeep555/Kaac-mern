import React from "react";

const openingBalance = [
    {
        id: 1,
        slno: 1,
        opening_balance: "2",
        receipts: "3",
        disbursement: "4",
        closing_balance: "5",
    },
    {
        id: 2,
        slno: "-",
        opening_balance: "-",
        receipts: "-",
        disbursement: "-",
        closing_balance: "-",
    },
    {
        id: 3,
        slno: "-",
        opening_balance: "-",
        receipts: "-",
        disbursement: "-",
        closing_balance: "-",
    },
];

const Statement7 = () => {

    const Total = openingBalance.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="w-full overflow-x-auto border-2 bg-white">
            <div className="flex flex-col items-center py-4">
                <h1 className="font-bold text-lg">STATEMENT NO. 7</h1>
                <h2 className="py-4 font-semibold">Statement of Receipts, Disbursements and balance under heads relating to District Fund and Deposit Fund</h2>
            </div>
            <hr className=" w-full mb-4 h-0.5 bg-black" />
            <div className="w-full overflow-x-auto my-8">
                <table className="min-w-280 mx-auto border border-black text-[11px] text-center ">
                    <thead>
                        {/* <!-- Table Headers Row */}
                        {/* "font" is a common use of css in index (using @apply) */}
                        <tr>
                            <th className="border font uppercase tracking-wide py-2">Head of Account</th>
                            <th className="border font uppercase tracking-wide py-2">Opening Balance</th>
                            <th className="border font uppercase tracking-wide py-2">Receipts</th>
                            <th className="border font uppercase tracking-wide py-2">Disbursement</th>
                            <th className="border font uppercase tracking-wide py-2">Closing Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {openingBalance.map((data) => {
                            return (
                                <tr key={data.id} className="border font-small">
                                    <td className="border py-1">{data.slno}</td>
                                    <td className="border py-1">{data.opening_balance}</td>
                                    <td className="border py-1">{data.receipts}</td>
                                    <td className="border py-1">{data.disbursement}</td>
                                    <td className="border py-1">{data.closing_balance}</td>
                                </tr>
                            )
                        })}
                        <td colSpan={4} className="text-start px-4 py-2 text-base border">Total</td>
                        <td colSpan={4} className="text-start px-4 py-2 text-base">{Total}</td>
                    </tbody>
                </table>
            </div>
            <hr className=" w-full mb-4 h-0.5 bg-black" />
            <div className="px-4 py-2 text-start tracking-wide">
                <p>Explanatory Notes</p>
                <p><span className="">Notes:</span> Other Statements as thought neccessary may be proposed when the first accounts are actually prepared.</p>
            </div>
        </div>
    );
};

export default Statement7;
