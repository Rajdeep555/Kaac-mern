import React, { useState } from "react";
import DataTable from "../../components/DataTable/DataTable";
import TableButton from "../../components/ui/TableButton";
import { useNavigate } from "react-router-dom";
import { useCashierExpenditures } from "../../hooks/useCashierExpenditures.js";
import { deleteExpenditure } from "../../api/expenditure.api.js";

// ✅ Truncate helper
const Truncate = ({ text, max = 20 }) => {
  if (!text) return "-";
  const str = String(text);
  if (str.length <= max) return str;
  return (
    <span title={str} className="cursor-help">
      {str.slice(0, max)}...
    </span>
  );
};

const GeneratedExpenditure = () => {
  const navigate = useNavigate();
  const {
    data: expenditures,
    loading,
    invalidate,
  } = useCashierExpenditures({
    sector: ["COUNCIL", "STATE"],
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    voucherNo: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (row) => {
    setConfirmModal({ isOpen: true, id: row.id, voucherNo: row.voucherNo });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExpenditure(confirmModal.id);
      invalidate(); // ✅ clears cache and triggers refetch
      setConfirmModal({ isOpen: false, id: null, voucherNo: "" });
    } catch (error) {
      console.error("Failed to delete expenditure", error);
      alert("Failed to delete expenditure. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmModal({ isOpen: false, id: null, voucherNo: "" });
  };

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
      render: (_, row) => (
        <Truncate text={row.ddo?.ddoName} max={25} /> // ✅ truncate long DDO names
      ),
    },
    {
      key: "treasuryVoucherNo",
      label: "Treasury Voucher No",
      render: (value) => <Truncate text={value} max={15} />,
    },
    { key: "grossAmount", label: "Gross Amount" },
    { key: "netAmount", label: "Net Amount" },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <button
            className="text-green-600 hover:underline text-sm"
            onClick={() => navigate(`/expenditures/${row.id}/view`)}>
            View
          </button>
          <button
            className="text-blue-600 hover:underline text-sm"
            onClick={() => navigate(`/expenditures/${row.id}`)}>
            Edit
          </button>
          <button
            className="text-red-500 hover:underline text-sm"
            onClick={() => handleDeleteClick(row)}>
            Delete
          </button>
        </div>
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
        emptyMessage={loading ? "Loading..." : "No data found"}
        searchableKeys={["voucherNo", "treasuryVoucherNo", "majorHead"]}
        pageSize={10}
        actionSlot={
          <TableButton
            name="Add New Expenditure"
            onClick={() => navigate("/expenditures")}
          />
        }
      />

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Confirm Delete
            </h2>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete voucher{" "}
              <span className="font-semibold text-gray-900">
                {confirmModal.voucherNo}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 
                           text-gray-700 hover:bg-gray-100 disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white 
                           hover:bg-red-600 disabled:opacity-50">
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratedExpenditure;
