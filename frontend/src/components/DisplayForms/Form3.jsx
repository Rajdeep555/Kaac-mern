import React from "react";

const chequeData = [
    {
        id: 1,
        chqNo: "CHQ-88291",         
        drawDate: "2024-03-15",     
        amount: 15400.00,           
        treasury: "Guwahati-II",    
        refItemNo: "CB-45",         
        encashDate: "2024-03-20",   
        remarks: "Salary Payment"   
    },
    {
        id: 2,
        chqNo: "CHQ-88292",
        drawDate: "2024-03-16",
        amount: 2500.50,
        treasury: "Dispur Treasury",
        refItemNo: "CB-48",
        encashDate: null,           
        remarks: "Office Supplies"
    },
    {
        id: 3,
        chqNo: "CHQ-88293",
        drawDate: "2024-03-18",
        amount: 120000.00,
        treasury: "Guwahati-II",
        refItemNo: "CB-52",
        encashDate: "2024-03-25",
        remarks: "Contractor Bill"
    }
];

const Form3 = () => {
    return (
        <div className="w-full overflow-x-auto p-4 bg-white">
            <div className="flex flex-col items-center">
                <h1 className="font-bold text-lg">FORM NO. 3</h1>
              <h2 className="py-4 font-semibold">Register of cheque drawn during the month ..................</h2>
            </div>
            <table className="min-w-330 border border-black text-[11px] text-center">
                <thead>

                    {/* <!-- Table Headers Row */}
                    {/* "font" is a common use of css in index (using @apply) */}
                    <tr>
                        <th className="border border-black font">No. of Cheque</th>
                        <th className="border border-black font">Date of drawal</th>
                        <th className="border border-black font">No. of Cheque</th>
                        <th className="border border-black font">Amount RS</th>
                        <th className="border border-black font ">
                            Name of the Reasury
                            <br />
                            on which drawn
                        </th>
                        <th className="border border-black font">
                            Reference to item
                            <br />
                            No. in the Cash Book
                        </th>
                        <th className="border border-black font">Date of encashment</th>
                        <th className="border border-black font">Remarks</th>
                    </tr>
                </thead>
                <tbody>

                    {chequeData.map((data) => {
                     const { chqNo, drawDate, amount, treasury, refItemNo, encashDate, remarks } = data
                        return (
                            <tr key={data.id} className="border font-small">
                                <td className="border py-1">{chqNo}</td>
                                <td className="border py-1">{drawDate}</td>
                                <td className="border py-1">{chqNo}</td>
                                <td className="border py-1">{amount}</td>
                                <td className="border py-1">{treasury}</td>
                                <td className="border py-1">{refItemNo}</td>
                                <td className="border py-1">{encashDate}</td>
                                <td className="border py-1">{remarks}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default Form3;
