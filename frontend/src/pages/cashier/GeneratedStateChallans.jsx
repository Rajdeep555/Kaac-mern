import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable/DataTable";
import { useStateChallan } from "../../hooks/useStateChallan";
import { showToast } from "../../utils/toast";

const GeneratedStateChallans = () => {
  const navigate = useNavigate();
  const { challans, loading, error, fetchAll } = useStateChallan();
  const [formattedChallans, setFormattedChallans] = useState([]);

  useEffect(() => {
    if (challans && challans.length > 0) {
      const formatted = challans.map((item) => ({
        ...item,
        challanDate: item.challanDate
          ? new Date(item.challanDate).toLocaleDateString("en-GB")
          : "",
        codes: [
          item.majorHead,
          item.subMajorHead,
          item.minorHead,
          item.subHead,
          item.subSubHead,
          item.detailHead,
          item.subDetailHead,
        ]
          .filter(Boolean)
          .join(" - "),
      }));
      setFormattedChallans(formatted);
    } else {
      setFormattedChallans([]);
    }
  }, [challans]);

  useEffect(() => {
    if (error) showToast(error, "error");
  }, [error]);

  const columns = [
    { key: "challanNo", label: "Challan No" },
    { key: "challanDate", label: "Date" },
    { key: "codes", label: "Major - Detail Head" },
    { key: "ddo", label: "DDO" },
    { key: "treasuryChallanNo", label: "Treasury Challan No" },
    { key: "totalAmount", label: "Amount" },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <button
          onClick={() => navigate(`/state-challan/${row.id}`)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition">
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-unbounded text-3xl font-normal">State Challan</h1>

        {/* Manual refresh button */}
        <button
          onClick={() => fetchAll(true)} // force=true bypasses cache
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
        data={formattedChallans}
        columns={columns}
        loading={loading}
        searchableKeys={[
          "challanNo",
          "treasuryChallanNo",
          "totalAmount",
          "codes",
        ]}
        statusKey="treasuryChallanNo"
        pageSize={10}
      />
    </div>
  );
};

export default GeneratedStateChallans;
