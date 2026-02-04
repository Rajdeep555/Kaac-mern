// import React from "react";

// const registerData = [
//   {
//     id: 1,
//     cashBookItemNo: "CB-001",
//     cpfSub: 5000.0,
//     cash:545454
//   },
// ];

// const data = [
//   {
//       head:"Balance as shown in the Treasury Pass Book (PLA)",
//       number:1,
//       amount: 0,
//       total: Rs. P.
//   },
//   {
//       head:"Add amount credited by the Council but not accounted for by the Treasury.",
//       number:2,
//       amount: 0,
//       total: -,
//   },
//   {
//       head:"Less Cheques drawn by the Council but not enchased in Treasury.",
//       number:3,
//       amount: 0,
//       total: -,
//   },
//   {
//       head:"Balance as per Cash Book of the Council",
//       number:4,
//       amount: 0,
//       total: "₹",
//   },
// ];

// const Form11 = () => {
//   const year = "2026";
//   return (
//     <div className="w-full overflow-x-auto bg-white border-2">
//       <div className="flex bg-gray-300 pb-4 flex-col px-2 items-center gap-1  ">
//         <h1 className="text-center py-2 text-xl font-bold">Form No. 11</h1>
//         <div className="w-full flex flex-col items-center">
//           <p className="font-semibold">Tresury (PLA) reconcilliation statement at 30/31st (Month)</p>
//           <p className="font-semibold">(To be appended to the Monthly Account)</p>
//           <p className="font-semibold">Year: 2025</p>
//         </div>
//       </div>
//       <hr className=" w-full mb-4 h-0.5 bg-black" />

//       <div className="w-full overflow-x-auto">
//         <table className="w-[95%]  border border-black mx-4 text-[11px] px-2 my-2 ">
//           <thead>
//           </thead>
//           <tbody className="py-2 text-sm">
//             {data.map((data, index) => {
//               return (
//                   <tr className="border text-[13px]" key={index}>
//                     <td className="border py-2 px-4">{data.number}</td>
//                     <td className="border text-start px-8">{data.head}</td>
//                     <td className="border px-4">{data.amount}</td>
//                     <td className="px-4">{data.total}</td>
//                   </tr>
//                 )
//             })}
//           </tbody>
//         </table>
//       </div>
//       <div className="mx-4 my-6 text-sm leading-7 text-gray-600">
//         <p>Certified that the Cash Book balance shown above agrees with the balance shown in the Treasury (PLA) column of the Cash Book.</p>
//       </div>
//       <hr className=" w-full my-4 h-0.5 bg-black" />
//       <div className="flex justify-between">
//         <p className="text-end text-sm mb-4 px-2">Date</p>
//         <p className="text-end text-sm mb-4 px-2">Designation</p>
//       </div>
//     </div>
//   );
// };

// export default Form11;







// The second option where we made two array then we merge it so the first two columns are static and the third and fourth are dynamic which come from database



import React from "react";

const tableStructure = [
  { number: 1, head: "Balance as shown in the Treasury Pass Book (PLA)" },
  { number: 2, head: "Add amount credited by the Council but not accounted for by the Treasury" },
  { number: 3, head: "Less Cheques drawn by the Council but not enchased in Treasury" },
  { number: 4, head: "Balance as per Cash Book of the Council" },
];


const dbData = [
  { number: 1, amount: 0.00, total: "Rs. P." },
  { number: 2, amount: 0.00, total: "-" },
  { number: 3, amount: 0.00, total: "-" },
  { number: 4, amount: 0.00, total: "₹" },
];


const Form11 = () => {

  const data = tableStructure.map(row => {
  const match = dbData.find(d => d.number === row.number);

  return {
    ...row,
    amount: match?.amount ?? 0,
    total: match?.total ?? "",
  };
});

  return (
    <div className="w-full overflow-x-auto bg-white border-2">
      <div className="flex bg-gray-300 pb-4 flex-col px-2 items-center gap-1  ">
        <h1 className="text-center py-2 text-xl font-bold">Form No. 11</h1>
        <div className="w-full flex flex-col items-center">
          <p className="font-semibold">
            Tresury (PLA) reconcilliation statement at 30/31st (Month)
          </p>
          <p className="font-semibold">
            (To be appended to the Monthly Account)
          </p>
          <p className="font-semibold">Year: 2025</p>
        </div>
      </div>
      <hr className=" w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto">
        <table className="w-[95%]  border border-black mx-4 text-[11px] px-2 my-2 ">
          <thead>
          </thead>
          <tbody className="py-2 text-sm">
            {data.map((data, index) => {
              return (
                <tr className="border text-[14px] font-semibold text-center" key={index}>
                  <td className="border py-2 px-4">{data.number}</td>
                  <td className="border text-start px-8">{data.head}</td>
                  <td className="border px-4">{data.amount}</td>
                  <td className="px-4">{data.total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mx-4 my-6 text-sm leading-7 text-gray-600">
        <p>
          Certified that the Cash Book balance shown above agrees with the
          balance shown in the Treasury (PLA) column of the Cash Book.
        </p>
      </div>
      <hr className=" w-full my-4 h-0.5 bg-black" />
      <div className="flex justify-between">
        <p className="text-end text-sm mb-4 px-2">Date</p>
        <p className="text-end text-sm mb-4 px-2">Designation</p>
      </div>
    </div>
  );
};

export default Form11;
