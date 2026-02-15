import React, { useEffect, useState } from "react";
import DataTable from "../../components/DataTable/DataTable";
import { getAllChallans } from "../../api/challan.api";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../utils/toast";

const GeneratedChallans = () => {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchChallans = async () => {
      try {
        const res = await getAllChallans({ page: 1, limit: 50 });

        if (res.data.success) {
          const formatted = res.data.data.map((c) => ({
            id: c.id,
            challanNo: c.challanNo,
            challanDate: c.challanDate?.slice(0, 10),
            codes: `${c.majorHead}-${c.subMajorHead}-${c.subSubMajorHead}-${c.minorHead}-${c.detailHead}`,
            ddo: c.ddo?.name || "",
            treasuryChallanNo: c.treasuryChallanNo,
            totalAmount: Number(c.amount).toLocaleString("en-IN"),
          }));

          setChallans(formatted);
        }
      } catch (error) {
        console.error(error);
        showToast("Failed to fetch challans", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchChallans();
  }, []);

  // ================= TABLE COLUMNS =================
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

  // ================= LOADING UI =================
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="font-unbounded text-3xl font-normal">Challans</h1>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-400">
          <div className="w-10 h-10 border-4 border-zinc-300 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm">Fetching challans...</p>
        </div>
      </div>
    );
  }

  // ================= MAIN UI =================
  return (
    <div className="p-6 space-y-6">
      <h1 className="font-unbounded text-3xl font-normal">Challans</h1>

      <DataTable
        data={challans}
        columns={columns}
        searchableKeys={[
          "challanNo",
          "treasuryChallanNo",
          "totalAmount",
          "codes",
        ]}
        pageSize={10}
      />
    </div>
  );
};

export default GeneratedChallans;
