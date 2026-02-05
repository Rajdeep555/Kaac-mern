import React from "react";

const openingBalance = [
    {
        id: 1,
        heads: "1",
        actuals: "2",
    },
    {
        id: 2,
        heads: "-",
        actuals: "-",
    },
    {
        id: 3,
        heads: "-",
        actuals: "-",
    },
    {
        id: 4,
        heads: "-",
        actuals: "-",
    },
];

const Statement5 = () => {

    const Total = openingBalance.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="w-full overflow-x-auto border-2 bg-white">
            <div className="flex flex-col items-center py-4">
                <h1 className="font-bold text-lg">STATEMENT NO. 5</h1>
                <h2 className="py-4 font-semibold">Detailed Account of Revenue Receipt by Minor Heads</h2>
            </div>
            <hr className=" w-full mb-4 h-0.5 bg-black" />
            <div className="w-full overflow-x-auto my-8">
                <table className="min-w-280 mx-auto border border-black text-[11px] text-center ">
                    <thead>
                        {/* <!-- Table Headers Row */}
                        {/* "font" is a common use of css in index (using @apply) */}
                        <tr>
                            <th className="border font uppercase tracking-wide py-2">Heads</th>
                            <th className="border font uppercase tracking-wide py-2">Actuals for 199....</th>
                        </tr>
                    </thead>
                    <tbody>
                        {openingBalance.map((data) => {
                            return (
                                <tr key={data.id} className="border font-small">
                                    <td className="border py-1">{data.heads}</td>
                                    <td className="border py-1">{data.actuals}</td>
                                </tr>
                            )
                        })}
                        <td className="text-center px-4 py-2 font-semibold text-base border">Grand Total</td>
                        <td className="text-center px-4 py-2 text-base">{Total}</td>
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

export default Statement5;
