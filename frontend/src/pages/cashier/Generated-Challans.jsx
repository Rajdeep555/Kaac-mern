import React, { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/DataTable/DataTable";
import { getAllChallans } from "../../api/challan.api";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../utils/toast";

// ── Module-level cache — survives tab switches, cleared on mutation ──
let _challanCache = null;

const todayStr = () => new Date().toISOString().slice(0, 10);

// ── Modal: shows challan no + amount in a table, with gross total ──
const ChallanListModal = ({ title, rows, onClose }) => {
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
              No challans found.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-200">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Challan No</th>
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id} className="border-b border-zinc-100">
                    <td className="py-2 pr-2 text-zinc-400">{idx + 1}</td>
                    <td className="py-2 pr-2 font-medium">{r.challanNo}</td>
                    <td className="py-2 pr-2">{r.challanDate}</td>
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
              {rows.length} challan{rows.length !== 1 ? "s" : ""}
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

const GeneratedChallans = () => {
  const [challans, setChallans] = useState(_challanCache || []);
  const [loading, setLoading] = useState(!_challanCache);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeModal, setActiveModal] = useState(null); // "today" | "filtered" | null
  const navigate = useNavigate();

  const fetchChallans = async (force = false) => {
    if (_challanCache && !force) {
      setChallans(_challanCache);
      return;
    }
    setLoading(true);
    try {
      // ── Fetch ALL records — DataTable handles client-side pagination ──
      const res = await getAllChallans({ page: 1, limit: 10000 });
      if (res.data.success) {
        const formatted = res.data.data.map((c) => ({
          id: c.id,
          challanNo: c.challanNo,
          challanDate: c.challanDate?.slice(0, 10),
          counterfoilNo: c.counterfoilNo || "—",
          codes: `${c.majorHead}-${c.subMajorHead}-${c.minorHead}-${c.detailHead}`,
          ddo: c.ddo?.ddoName || "",
          treasuryChallanNo: c.treasuryChallanNo,
          amount: Number(c.amount),
          totalAmount: Number(c.amount).toLocaleString("en-IN"),
        }));
        _challanCache = formatted;
        setChallans(formatted);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch challans", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, []);

  // ── Today's generated challans ──
  const todayChallans = useMemo(
    () => challans.filter((c) => c.challanDate === todayStr()),
    [challans],
  );

  // ── Date-filtered challans ──
  const hasDateFilter = Boolean(fromDate || toDate);
  const filteredChallans = useMemo(() => {
    if (!hasDateFilter) return [];
    return challans.filter((c) => {
      if (fromDate && c.challanDate < fromDate) return false;
      if (toDate && c.challanDate > toDate) return false;
      return true;
    });
  }, [challans, fromDate, toDate, hasDateFilter]);

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
  };

  const columns = [
    { key: "challanNo", label: "Challan No" },
    { key: "challanDate", label: "Date" },
    { key: "counterfoilNo", label: "Counterfoil No" },
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

      {/* ── Stats + Date Filter ── */}
      <div className="flex flex-wrap items-end gap-4">
        <StatCard
          label="Today's Generated Challans"
          count={todayChallans.length}
          onClick={() => setActiveModal("today")}
        />

        {hasDateFilter && (
          <StatCard
            label="Filtered Challans"
            count={filteredChallans.length}
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
        data={hasDateFilter ? filteredChallans : challans}
        columns={columns}
        searchableKeys={[
          "challanNo",
          "counterfoilNo",
          "treasuryChallanNo",
          "totalAmount",
          "codes",
          "ddo",
        ]}
        pageSize={70}
      />

      {activeModal === "today" && (
        <ChallanListModal
          title="Today's Generated Challans"
          rows={todayChallans}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "filtered" && (
        <ChallanListModal
          title={`Challans (${fromDate || "…"} to ${toDate || "…"})`}
          rows={filteredChallans}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

export const invalidateChallanCache = () => {
  _challanCache = null;
};

export default GeneratedChallans;
