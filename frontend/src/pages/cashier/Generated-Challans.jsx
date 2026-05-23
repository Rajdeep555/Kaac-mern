import React, { useEffect, useState } from "react";
import DataTable from "../../components/DataTable/DataTable";
import { getAllChallans } from "../../api/challan.api";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../utils/toast";

// ── Module-level cache — survives tab switches, cleared on mutation ──
let _challanCache = null;

const GeneratedChallans = () => {
  const [challans, setChallans] = useState(_challanCache || []);
  const [loading, setLoading] = useState(!_challanCache);
  const navigate = useNavigate();

  const fetchChallans = async (force = false) => {
    // Skip if cache exists and not forced
    if (_challanCache && !force) {
      setChallans(_challanCache);
      return;
    }
    setLoading(true);
    try {
      const res = await getAllChallans({ page: 1, limit: 100 });
      if (res.data.success) {
        const formatted = res.data.data.map((c) => ({
          id: c.id,
          challanNo: c.challanNo,
          challanDate: c.challanDate?.slice(0, 10),
          codes: `${c.majorHead}-${c.subMajorHead}-${c.subSubMajorHead}-${c.minorHead}-${c.detailHead}`,
          ddo: c.ddo?.ddoName || "",
          treasuryChallanNo: c.treasuryChallanNo,
          totalAmount: Number(c.amount).toLocaleString("en-IN"),
        }));
        _challanCache = formatted; // store in cache
        setChallans(formatted);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch challans", "error");
    } finally {
      setLoading(false);
    }
  };

  // Only fetches if no cache
  useEffect(() => {
    fetchChallans();
  }, []);

  const columns = [
    { key: "challanNo", label: "Challan No" },
    { key: "challanDate", label: "Date" },
    { key: "codes", label: "Major - Detail Head" },
    { key: "ddo", label: "DDO" },
    { key: "treasuryChallanNo", label: "Treasury Challan No" },
    { key: "totalAmount", label: "Amount" },
    {
      key: "action",
      label: "Action",
      render: (_, row) => (
        <button
          onClick={() => navigate(`/challan/${row.id}`)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
          Edit
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-unbounded text-3xl font-normal">Challans</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-400">
          <div className="w-10 h-10 border-4 border-zinc-300 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm">Fetching challans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-unbounded text-3xl font-normal">Challans</h1>

        {/* Force refresh button */}
        <button
          onClick={() => fetchChallans(true)}
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
        data={challans}
        columns={columns}
        searchableKeys={[
          "challanNo",
          "treasuryChallanNo",
          "totalAmount",
          "codes",
        ]}
        pageSize={50}
      />
    </div>
  );
};

// ── Export cache invalidator so edit/create pages can call it after mutation ──
export const invalidateChallanCache = () => {
  _challanCache = null;
};

export default GeneratedChallans;
