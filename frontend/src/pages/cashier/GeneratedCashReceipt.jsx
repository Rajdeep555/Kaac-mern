import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable/DataTable";
import { getAllCashReceipts } from "../../api/cashReceipt.api";
import { showToast } from "../../utils/toast";

const GeneratedCashReceipt = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const navigate = useNavigate();

  // =========================
  // Fetch Receipts
  // =========================
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const res = await getAllCashReceipts({
          page: 1,
          limit: 10,
        });

        if (res.data.success) {
          // Format date before setting
          const formatted = res.data.data.map((item) => ({
            ...item,
            date: item.date
              ? new Date(item.date).toLocaleDateString("en-GB")
              : "",
            letterDate: item.letterDate
              ? new Date(item.letterDate).toLocaleDateString("en-GB")
              : "",
          }));

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

    fetchReceipts();
  }, []);

  // =========================
  // Table Columns
  // =========================
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
      <h1 className="font-unbounded text-3xl font-normal">Cash Receipt</h1>

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

export default GeneratedCashReceipt;
