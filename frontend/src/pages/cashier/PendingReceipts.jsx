import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable/DataTable";
import Breadcrumbs from "../../components/ui/Breadcrumbs";
import { getPendingReceipts } from "../../api/cashReceipt.api";
import { showToast } from "../../utils/toast";

const PendingReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await getPendingReceipts();
      if (res.data.success) {
        setReceipts(res.data.data);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch pending receipts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const columns = [
    {
      key: "id",
      label: "#",
      render: (_, row) => receipts.findIndex((r) => r.id === row.id) + 1,
    },
    {
      key: "counterfoilNo",
      label: "Counterfoil No",
    },
    {
      key: "date",
      label: "Date",
      render: (value) =>
        value ? new Date(value).toLocaleDateString("en-GB") : "—",
    },
    {
      key: "receivedFrom",
      label: "Received From",
    },
    {
      key: "rupeesInCash",
      label: "Amount",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-zinc-400 leading-9 mb-4">
        <Breadcrumbs
          items={[
            { label: "Dashboard", path: "/" },
            { label: "Cash Receipt", path: "/generated-cash-receipt" },
            { label: "Pending Receipts" },
          ]}
        />
        <div className="flex items-center justify-between">
          <h1 className="font-unbounded text-2xl font-normal">
            Pending Receipts
            {!loading && (
              <span className="ml-3 text-base font-normal text-red-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                {receipts.length} unlinked
              </span>
            )}
          </h1>

          {/* Refresh */}
          <button
            onClick={fetchPending}
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

        <p className="text-sm text-zinc-500 mb-2">
          These receipts have not been linked to any Challan yet.
        </p>
      </div>

      <DataTable
        data={receipts}
        columns={columns}
        loading={loading}
        searchableKeys={["counterfoilNo", "receivedFrom"]}
        pageSize={10}
        emptyMessage="No pending receipts. All counterfoils are linked to a Challan."
      />
    </div>
  );
};

export default PendingReceipts;
