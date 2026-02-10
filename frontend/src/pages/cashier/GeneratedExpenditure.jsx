import React from "react";
import DataTable from "../../components/DataTable/DataTable";
import TableButton from "../../components/ui/TableButton";
import { useNavigate } from "react-router-dom";
import { useCashierExpenditures } from "../../hooks/useCashierExpenditures.js";

const GeneratedExpenditure = () => {
  const navigate = useNavigate();

  // Example: COUNCIL + both treasury / non-treasury
  const { data: expenditures, loading } = useCashierExpenditures({
    sector: "COUNCIL",
  });

  const columns = [
    { key: "voucherNo", label: "Voucher No" },
    {
      key: "voucherDate",
      label: "Date",
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "codes",
      label: "Major - Sub Detail Head",
      render: (_, row) =>
        `${row.majorHead}-${row.subMajorHead}-${row.minorHead}-${row.detailHead}`,
    },
    {
      key: "ddo",
      label: "DDO",
      render: (_, row) => row.ddo?.name || "-",
    },
    { key: "treasuryVoucherNo", label: "Treasury Voucher No" },
    { key: "grossAmount", label: "Gross Amount" },
    { key: "netAmount", label: "Net Amount" },

    // ✅ ACTIONS COLUMN
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <button
          className="text-blue-600 hover:underline"
          onClick={() => navigate(`/expenditures/${row.id}`)}>
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="font-unbounded text-3xl font-normal">Expenditures</h1>

      <DataTable
        data={expenditures}
        columns={columns}
        loading={loading}
        searchableKeys={["voucherNo", "treasuryVoucherNo", "majorHead"]}
        pageSize={10}
        actionSlot={
          <TableButton
            name="Add New Expenditure"
            onClick={() => navigate("/expenditures")}
          />
        }
      />
    </div>
  );
};

export default GeneratedExpenditure;
