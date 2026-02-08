import React from "react";

const openingBalance = [
    {
        id: 1,
        loans: 1,
        april: "2",
        amount_paid: "3",
        amount_recover: "4",
        march: "5",
        increase_decrease: "6",
    },
    {
        id: 2,
        loans: "-",
        april: "-",
        amount_paid: "-",
        amount_recover: "-",
        march: "-",
        increase_decrease: "-",
    },
    {
        id: 3,
        loans: "-",
        april: "-",
        amount_paid: "-",
        amount_recover: "-",
        march: "-",
        increase_decrease: "-",
    },
    {
        id: 4,
        loans: "-",
        april: "-",
        amount_paid: "-",
        amount_recover: "-",
        march: "-",
        increase_decrease: "-",
    },
];

const Statement4 = () => {

    const Total = openingBalance.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="w-full overflow-x-auto border-2 bg-white">
            <div className="flex flex-col items-center py-4">
                <h1 className="font-bold text-lg">STATEMENT NO. 4</h1>
                <h2 className="py-4 font-semibold">Loans and Advances by the Council</h2>
            </div>
            <hr className=" w-full mb-4 h-0.5 bg-black" />
            <div className="w-full overflow-x-auto my-8">
                <table className="min-w-280 mx-4 border border-black text-[11px] text-center ">
                    <thead>
                        {/* <!-- Table Headers Row */}
                        {/* "font" is a common use of css in index (using @apply) */}
                        <tr>
                            <th className="border font uppercase tracking-wide px-2 py-2">Categories of <br /> Loans and Advances</th>
                            <th className="border font uppercase tracking-wide px-2 py-2">Balance <br /> outstanding on <br /> 1st April</th>
                            <th className="border font uppercase tracking-wide px-2 py-2">Amount paid <br /> during the year</th>
                            <th className="border font uppercase tracking-wide px-2 py-2">Amount Recovered <br /> during the year</th>
                            <th className="border font uppercase tracking-wide px-2 py-2">Balance <br /> outstanding on <br /> 31st March</th>
                            <th className="border font uppercase tracking-wide px-2 py-2">Net Increase(+) <br /> Decrease(-) <br /> during the year</th>
                        </tr>
                    </thead>
                    <tbody>
                        {openingBalance.map((data) => {
                            return (
                                <tr key={data.id} className="border font-small">
                                    <td className="border py-1">{data.loans}</td>
                                    <td className="border py-1">{data.april}</td>
                                    <td className="border py-1">{data.amount_paid}</td>
                                    <td className="border py-1">{data.amount_recover}</td>
                                    <td className="border py-1">{data.march}</td>
                                    <td className="border py-1">{data.increase_decrease}</td>
                                </tr>
                            )
                        })}
                        <td colSpan={5} className="text-start px-4 py-2 text-base font-semibold border">Total</td>
                        <td colSpan={5} className="text-start px-4 py-2 text-base">{Total}</td>
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

export default Statement4;
