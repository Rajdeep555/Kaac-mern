// ChallanOfRecoveryFromBills.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable/DataTable";
import TableButton from "../../components/ui/TableButton";
import { useChallanFromBill } from "../../hooks/useChallanFromBill.js";

const ChallanOfRecoveryFromBills = () => {
  const navigate = useNavigate();

  const { challans, loading } = useChallanFromBill(); // ✅ cashier-wise auto

  const columns = [
    {
      key: "id",
      label: "ID",
    },
    {
      key: "challanNo",
      label: "Challan No",
    },
    {
      key: "voucharDate", // ✅ matches your schema field name (typo in schema)
      label: "Voucher Date",
      render: (value) => (value ? new Date(value).toLocaleDateString() : "-"),
    },
    {
      key: "majorHead",
      label: "Major Head",
      render: (_, row) =>
        `${row.majorHead || "-"}-${row.subMajor || "-"}-${row.minorHead || "-"}`,
    },
    {
      key: "ddo",
      label: "DDO",
      render: (_, row) => row.expenditure?.ddo?.ddoName || "-",
    },
    {
      key: "amount",
      label: "Amount",
      render: (value) =>
        value ? `₹ ${Number(value).toLocaleString("en-IN")}` : "-",
    },
    {
      key: "amountType",
      label: "Amount Type",
    },
    {
      key: "treasuryChallanNo",
      label: "Treasury Challan No",
      render: (value) => value || "-",
    },
    {
      key: "treasuryChallanDate",
      label: "Treasury Challan Date",
      render: (value) => (value ? new Date(value).toLocaleDateString() : "-"),
    },
    // {
    //   key: "actions",
    //   label: "Actions",
    //   render: (_, row) => (
    //     <button
    //       className="text-blue-600 hover:underline"
    //       onClick={() => navigate(`/challan-from-bill/${row.id}`)}>
    //       View
    //     </button>
    //   ),
    // },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="font-unbounded text-3xl font-normal">
        Challan of Recovery from Bills
      </h1>

      <DataTable
        data={challans}
        columns={columns}
        loading={loading}
        searchableKeys={["challanNo", "majorHead", "treasuryChallanNo"]}
        pageSize={10}
        actionSlot={
          <TableButton
            name="Add New Challan"
            onClick={() => navigate("/challan-from-bill/new")}
          />
        }
      />
    </div>
  );
};

export default ChallanOfRecoveryFromBills;
