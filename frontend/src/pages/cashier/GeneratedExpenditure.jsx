// GeneratedExpenditure.jsx
import React, { useMemo, useState } from "react";
import DataTable from "../../components/DataTable/DataTable";
import TableButton from "../../components/ui/TableButton";
import { useNavigate } from "react-router-dom";
import { useCashierExpenditures } from "../../hooks/useCashierExpenditures.js";
import { deleteExpenditure } from "../../api/expenditure.api.js";
import { LuReceipt } from "react-icons/lu";
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

const todayStr = () => new Date().toISOString().slice(0, 10);

// ── Modal: shows voucher no + gross/net amount in a table, with gross total ──
const ExpenditureListModal = ({ title, rows, onClose }) => {
  const total = rows.reduce((sum, r) => sum + (r.grossAmountNum || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-lg shadow-lg flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
          <h2 className="font-unbounded text-lg font-normal">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 text-xl leading-none"
            aria-label="Close">
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-3">
          {rows.length === 0 ? (
            <p className="text-sm text-zinc-400 py-8 text-center">
              No expenditures found.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-200">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Voucher No</th>
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 text-right">Gross Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id} className="border-b border-zinc-100">
                    <td className="py-2 pr-2 text-zinc-400">{idx + 1}</td>
                    <td className="py-2 pr-2 font-medium">{r.voucherNo}</td>
                    <td className="py-2 pr-2">
                      {r.voucherDate
                        ? new Date(r.voucherDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="py-2 text-right">
                      {r.grossAmountNum.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {rows.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-200 bg-zinc-50 rounded-b-lg">
            <span className="text-sm text-zinc-500">
              {rows.length} voucher{rows.length !== 1 ? "s" : ""}
            </span>
            <span className="font-unbounded text-base">
              Gross Amount: ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Clickable stat card ──
const StatCard = ({ label, count, onClick, accent = "blue" }) => {
  const accentClasses =
    accent === "blue"
      ? "border-blue-200 hover:bg-blue-50"
      : "border-zinc-200 hover:bg-zinc-50";

  return (
    <button
      onClick={onClick}
      disabled={count === 0}
      className={`flex flex-col items-start gap-1 px-5 py-4 rounded-lg border ${accentClasses} transition text-left disabled:opacity-60 disabled:cursor-not-allowed`}>
      <span className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className="font-unbounded text-2xl font-normal">{count}</span>
    </button>
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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeModal, setActiveModal] = useState(null); // "today" | "filtered" | null

  const handleDeleteClick = (row) => {
    setConfirmModal({ isOpen: true, id: row.id, voucherNo: row.voucherNo });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExpenditure(confirmModal.id);
      invalidate();
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

  // ── Rows with a raw ISO date + numeric gross amount for filtering/summing ──
  const enrichedExpenditures = useMemo(() => {
    return (expenditures || []).map((row) => ({
      ...row,
      rawDate: row.voucherDate ? String(row.voucherDate).slice(0, 10) : "",
      grossAmountNum: Number(row.grossAmount) || 0,
    }));
  }, [expenditures]);

  // ── Today's generated expenditures ──
  const todayExpenditures = useMemo(
    () => enrichedExpenditures.filter((r) => r.rawDate === todayStr()),
    [enrichedExpenditures],
  );

  // ── Date-filtered expenditures ──
  const hasDateFilter = Boolean(fromDate || toDate);
  const filteredExpenditures = useMemo(() => {
    if (!hasDateFilter) return [];
    return enrichedExpenditures.filter((r) => {
      if (fromDate && r.rawDate < fromDate) return false;
      if (toDate && r.rawDate > toDate) return false;
      return true;
    });
  }, [enrichedExpenditures, fromDate, toDate, hasDateFilter]);

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
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
      render: (_, row) => <Truncate text={row.ddo?.ddoName} max={25} />,
    },
    {
      key: "chequeNo",
      label: "Cheque No",
      render: (value) => <Truncate text={value} max={15} />,
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

      {/* ── Stats + Date Filter ── */}
      <div className="flex flex-wrap items-end gap-4">
        <StatCard
          label="Today's Generated Expenditures"
          count={todayExpenditures.length}
          onClick={() => setActiveModal("today")}
        />

        {hasDateFilter && (
          <StatCard
            label="Filtered Expenditures"
            count={filteredExpenditures.length}
            onClick={() => setActiveModal("filtered")}
            accent="zinc"
          />
        )}

        <div className="flex items-end gap-3 ml-auto">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 text-sm border border-zinc-300 rounded"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 text-sm border border-zinc-300 rounded"
            />
          </div>
          {hasDateFilter && (
            <button
              onClick={clearDateFilter}
              className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-800">
              Clear
            </button>
          )}
        </div>
      </div>

      <DataTable
        data={hasDateFilter ? filteredExpenditures : enrichedExpenditures}
        columns={columns}
        loading={loading}
        emptyMessage={loading ? "Loading..." : "No data found"}
        searchableKeys={[
          "voucherNo",
          "treasuryVoucherNo",
          "majorHead",
          "chequeNo",
          "grossAmount",
        ]}
        pageSize={30}
        actionSlot={
          <div className="flex items-center gap-2">
            <TableButton
              name="Add New Expenditure"
              onClick={() => navigate("/expenditures")}
            />
            <TableButton
              name="Cheque Details"
              icon={<LuReceipt />}
              onClick={() => navigate("/cheque-details")}
            />
          </div>
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

      {activeModal === "today" && (
        <ExpenditureListModal
          title="Today's Generated Expenditures"
          rows={todayExpenditures}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "filtered" && (
        <ExpenditureListModal
          title={`Expenditures (${fromDate || "…"} to ${toDate || "…"})`}
          rows={filteredExpenditures}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

export default GeneratedExpenditure;
