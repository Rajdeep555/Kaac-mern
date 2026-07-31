import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable/DataTable";
import {
  getAllCashReceipts,
  getPendingReceiptsCount,
} from "../../api/cashReceipt.api";
import { showToast } from "../../utils/toast";

// ── Module-level cache ──
let _receiptCache = null;

const todayStr = () => new Date().toISOString().slice(0, 10);

// ── Modal: shows counterfoil no + amount in a table, with gross total ──
const ReceiptListModal = ({ title, rows, onClose }) => {
  const total = rows.reduce((sum, r) => sum + (r.amount || 0), 0);

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
              No receipts found.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-200">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Counterfoil No</th>
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id} className="border-b border-zinc-100">
                    <td className="py-2 pr-2 text-zinc-400">{idx + 1}</td>
                    <td className="py-2 pr-2 font-medium">{r.counterfoilNo}</td>
                    <td className="py-2 pr-2">{r.date}</td>
                    <td className="py-2 text-right">
                      {r.amount.toLocaleString("en-IN")}
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
              {rows.length} receipt{rows.length !== 1 ? "s" : ""}
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

const GeneratedCashReceipt = () => {
  const [receipts, setReceipts] = useState(_receiptCache || []);
  const [loading, setLoading] = useState(!_receiptCache);
  const [pendingCount, setPendingCount] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeModal, setActiveModal] = useState(null); // "today" | "filtered" | null
  const navigate = useNavigate();

  const fetchReceipts = async (force = false) => {
    if (_receiptCache && !force) {
      setReceipts(_receiptCache);
      return;
    }
    setLoading(true);
    try {
      // Fetch all records — DataTable handles client-side pagination
      const res = await getAllCashReceipts({ page: 1, limit: 10000 });
      if (res.data.success) {
        const formatted = res.data.data.map((item) => ({
          ...item,
          // ── Raw ISO date kept for filtering / "today" comparisons ──
          rawDate: item.date ? item.date.slice(0, 10) : "",
          date: item.date
            ? new Date(item.date).toLocaleDateString("en-GB")
            : "",
          letterDate: item.letterDate
            ? new Date(item.letterDate).toLocaleDateString("en-GB")
            : "",
          amount: Number(item.rupeesInCash) || 0,
        }));
        _receiptCache = formatted;
        setReceipts(formatted);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch receipts", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await getPendingReceiptsCount();
      if (res.data.success) {
        setPendingCount(res.data.count);
      }
    } catch (error) {
      console.error("Failed to fetch pending count", error);
    }
  };

  useEffect(() => {
    fetchReceipts();
    fetchPendingCount();
  }, []);

  // ── Today's generated receipts ──
  const todayReceipts = useMemo(
    () => receipts.filter((r) => r.rawDate === todayStr()),
    [receipts],
  );

  // ── Date-filtered receipts ──
  const hasDateFilter = Boolean(fromDate || toDate);
  const filteredReceipts = useMemo(() => {
    if (!hasDateFilter) return [];
    return receipts.filter((r) => {
      if (fromDate && r.rawDate < fromDate) return false;
      if (toDate && r.rawDate > toDate) return false;
      return true;
    });
  }, [receipts, fromDate, toDate, hasDateFilter]);

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
  };

  const columns = [
    { key: "counterfoilNo", label: "Counterfoil No" },
    { key: "date", label: "Date" },
    { key: "receivedFrom", label: "Received From" },
    { key: "letterNo", label: "Letter No" },
    { key: "letterDate", label: "Letter Date" },
    { key: "rupeesInCash", label: "Amount" },
    { key: "byChequeBank", label: "Cheque/Bank" },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <button
          onClick={() => navigate(`/cash-receipt/${row.id}`)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition">
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-unbounded text-3xl font-normal">Cash Receipt</h1>

        <div className="flex items-center gap-3">
          {/* ── Check Total Button ── */}
          <button
            onClick={() => navigate("/cash-receipt/total")}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-50 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-100 transition font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Check Total
          </button>

          {/* ── Pending Receipts Button ── */}
          <button
            onClick={() => navigate("/cash-receipt/pending")}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-50 border border-red-300 text-amber-700 rounded hover:bg-amber-100 transition font-medium">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-900 text-white text-xs font-bold">
              {pendingCount ?? "…"}
            </span>
            Pending Receipts
          </button>

          {/* ── Refresh Button ── */}
          <button
            onClick={() => fetchReceipts(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-zinc-300 rounded hover:bg-zinc-50 transition disabled:opacity-50">
            <svg
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115-3.87M20 15a9 9 0 01-15 3.87"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats + Date Filter ── */}
      <div className="flex flex-wrap items-end gap-4">
        <StatCard
          label="Today's Generated Receipts"
          count={todayReceipts.length}
          onClick={() => setActiveModal("today")}
        />

        {hasDateFilter && (
          <StatCard
            label="Filtered Receipts"
            count={filteredReceipts.length}
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
        data={hasDateFilter ? filteredReceipts : receipts}
        columns={columns}
        loading={loading}
        searchableKeys={[
          "counterfoilNo",
          "receivedFrom",
          "letterNo",
          "rupeesInCash",
        ]}
        pageSize={70}
      />

      {activeModal === "today" && (
        <ReceiptListModal
          title="Today's Generated Receipts"
          rows={todayReceipts}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "filtered" && (
        <ReceiptListModal
          title={`Receipts (${fromDate || "…"} to ${toDate || "…"})`}
          rows={filteredReceipts}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

export const invalidateReceiptCache = () => {
  _receiptCache = null;
};

export default GeneratedCashReceipt;
