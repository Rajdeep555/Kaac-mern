import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable/DataTable";
import { getAllCashReceipts } from "../../api/cashReceipt.api";
import { showToast } from "../../utils/toast";

// ── Module-level cache ──
let _receiptCache = null;
let _metaCache = null;

const GeneratedCashReceipt = () => {
  const [receipts, setReceipts] = useState(_receiptCache || []);
  const [loading, setLoading] = useState(!_receiptCache);
  const [meta, setMeta] = useState(_metaCache || null);
  const navigate = useNavigate();

  const fetchReceipts = async (force = false) => {
    // Skip if cache exists and not forced
    if (_receiptCache && !force) {
      setReceipts(_receiptCache);
      setMeta(_metaCache);
      return;
    }
    setLoading(true);
    try {
      const res = await getAllCashReceipts({ page: 1, limit: 10 });
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
        _receiptCache = formatted; // store in cache
        _metaCache = res.data.meta;
        setReceipts(formatted);
        setMeta(res.data.meta);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch receipts", "error");
    } finally {
      setLoading(false);
    }
  };

  // Only fetches if no cache
  useEffect(() => {
    fetchReceipts();
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

        {/* Force refresh button */}
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
        pageSize={10}
      />

      {meta && (
        <div className="text-sm text-gray-500">
          Page {meta.page} of {meta.totalPages} | Total Records: {meta.total}
        </div>
      )}
    </div>
  );
};

// ── Export cache invalidator — call this after create/edit/delete ──
export const invalidateReceiptCache = () => {
  _receiptCache = null;
  _metaCache = null;
};

export default GeneratedCashReceipt;
