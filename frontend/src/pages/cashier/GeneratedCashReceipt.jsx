import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable/DataTable";
import {
  getAllCashReceipts,
  getPendingReceiptsCount,
} from "../../api/cashReceipt.api";
import { showToast } from "../../utils/toast";

// ── Module-level cache ──
let _receiptCache = null;

const GeneratedCashReceipt = () => {
  const [receipts, setReceipts] = useState(_receiptCache || []);
  const [loading, setLoading] = useState(!_receiptCache);
  const [pendingCount, setPendingCount] = useState(null);
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
          date: item.date
            ? new Date(item.date).toLocaleDateString("en-GB")
            : "",
          letterDate: item.letterDate
            ? new Date(item.letterDate).toLocaleDateString("en-GB")
            : "",
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

      <DataTable
        data={receipts}
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
    </div>
  );
};

export const invalidateReceiptCache = () => {
  _receiptCache = null;
};

export default GeneratedCashReceipt;
