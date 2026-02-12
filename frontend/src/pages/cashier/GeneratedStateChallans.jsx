import React from "react";
import DataTable from "../../components/DataTable/DataTable";

const GeneratedStateChallans = () => {
  const challans = [
    {
      id: 1,
      challanNo: "1234",
      challanDate: "20-12-2025",
      codes: "200-102-2211-3880",
      ddo: "DDO",
      treasuryChallanNo: "1220-1D",
      totalAmount: "99100",
    },
  ];
  const columns = [
    { key: "challanNo", label: "Challan No" },
    { key: "challanDate", label: "Date" },
    { key: "codes", label: "Major - Detail Head" },
    { key: "ddo", label: "DDO" },
    { key: "treasuryChallanNo", label: "Treasury Challan No" },
    { key: "totalAmount", label: "Amount" },
  ];

  return (
    <>
      <div className={`p-6 space-y-6`}>
        {/* Page Heading */}
        <h1 className="font-unbounded text-3xl font-normal">State Challan</h1>

        {/*  Table */}
        <DataTable
          data={challans}
          columns={columns}
          searchableKeys={[
            "challanNo",
            "treasuryChallanNo",
            "totalAmount",
            "codes",
          ]}
          statusKey="treasuryChallanNo"
          pageSize={10}
          // actionSlot={
          //   <TableButton
          //     name="Add New Division"
          //     onClick={() => setIsModalOpen(true)}
          //   />
          // }
        />
      </div>
    </>
  );
};


export default GeneratedStateChallans;
