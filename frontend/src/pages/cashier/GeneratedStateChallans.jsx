import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable/DataTable";
import { useStateChallan } from "../../hooks/useStateChallan";
import { showToast } from "../../utils/toast";
import { LuDownload } from "react-icons/lu";

const todayStr = () => new Date().toISOString().slice(0, 10);

// Modal shows only the major head code (not the full head chain used in
// the main table's "codes" column)
const headCode = (row) => row.majorHead || "-";

// ── CSV export — no external dependency, plain Blob download ──
const csvField = (value) => {
  const str = value === null || value === undefined ? "" : String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

const downloadChallanCsv = (groupedByDate, title) => {
  const lines = [
    ["#", "Date", "Head Code", "Challan No", "Gross Amount"]
      .map(csvField)
      .join(","),
  ];

  let srNo = 1;
  let grandTotal = 0;

  groupedByDate.forEach(({ date, rows, subtotal }) => {
    rows.forEach((r) => {
      lines.push(
        [srNo, date, headCode(r), r.challanNo, r.amount.toFixed(2)]
          .map(csvField)
          .join(","),
      );
      srNo++;
    });
    lines.push(
      ["", "", "", `Total for ${date}`, subtotal.toFixed(2)]
        .map(csvField)
        .join(","),
    );
    grandTotal += subtotal;
  });

  lines.push(
    ["", "", "", "GRAND TOTAL", grandTotal.toFixed(2)].map(csvField).join(","),
  );

  const csv = lines.join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/\s+/g, "-")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ── Modal: rows grouped by date — Sr No, Date, Head Code, Challan No, Gross
//    Amount — with a subtotal row per date and a grand total at the bottom ──
const ChallanListModal = ({ title, rows, onClose }) => {
  const groupedByDate = useMemo(() => {
    const byDate = new Map();
    // Stable date order, oldest first
    [...rows]
      .sort((a, b) =>
        a.rawDate < b.rawDate ? -1 : a.rawDate > b.rawDate ? 1 : 0,
      )
      .forEach((r) => {
        const key = r.challanDate || "Unknown Date";
        if (!byDate.has(key)) byDate.set(key, []);
        byDate.get(key).push(r);
      });

    return Array.from(byDate.entries()).map(([date, groupRows]) => ({
      date,
      rows: groupRows,
      subtotal: groupRows.reduce((sum, r) => sum + (r.amount || 0), 0),
    }));
  }, [rows]);

  const grandTotal = groupedByDate.reduce((sum, g) => sum + g.subtotal, 0);

  let runningSrNo = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white rounded-lg shadow-lg flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">
          <h2 className="font-unbounded text-lg font-normal">{title}</h2>
          <div className="flex items-center gap-3">
            {rows.length > 0 && (
              <button
                onClick={() => downloadChallanCsv(groupedByDate, title)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition">
                <LuDownload size={13} />
                Download CSV
              </button>
            )}
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-700 text-xl leading-none"
              aria-label="Close">
              ×
            </button>
          </div>
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
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Head Code</th>
                  <th className="py-2 pr-2">Challan No</th>
                  <th className="py-2 text-right">Gross Amount</th>
                </tr>
              </thead>
              <tbody>
                {groupedByDate.map((group) => (
                  <React.Fragment key={group.date}>
                    {group.rows.map((r) => {
                      runningSrNo++;
                      return (
                        <tr key={r.id} className="border-b border-zinc-100">
                          <td className="py-2 pr-2 text-zinc-400">
                            {runningSrNo}
                          </td>
                          <td className="py-2 pr-2">{group.date}</td>
                          <td className="py-2 pr-2">{headCode(r)}</td>
                          <td className="py-2 pr-2 font-medium">
                            {r.challanNo}
                          </td>
                          <td className="py-2 text-right">
                            {r.amount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                    {/* ── Per-date subtotal ── */}
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <td
                        colSpan={4}
                        className="py-1.5 pr-2 text-right font-semibold text-zinc-600">
                        Total for {group.date}
                      </td>
                      <td className="py-1.5 text-right font-semibold text-zinc-700">
                        ₹{group.subtotal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {rows.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-200 bg-zinc-50 rounded-b-lg">
            <span className="text-sm text-zinc-500">
              {rows.length} challan{rows.length !== 1 ? "s" : ""} across{" "}
              {groupedByDate.length} date{groupedByDate.length !== 1 ? "s" : ""}
            </span>
            <span className="font-unbounded text-base">
              Grand Total: ₹{grandTotal.toLocaleString("en-IN")}
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

const GeneratedStateChallans = () => {
  const navigate = useNavigate();
  const { challans, loading, error, fetchAll, remove } = useStateChallan();
  const [formattedChallans, setFormattedChallans] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeModal, setActiveModal] = useState(null); // "today" | "filtered" | null

  useEffect(() => {
    if (challans && challans.length > 0) {
      const formatted = challans.map((item) => ({
        ...item,
        // ── Raw ISO date kept for filtering / "today" comparisons ──
        rawDate: item.challanDate ? item.challanDate.slice(0, 10) : "",
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
        amount: Number(item.totalAmount) || 0,
      }));
      setFormattedChallans(formatted);
    } else {
      setFormattedChallans([]);
    }
  }, [challans]);

  useEffect(() => {
    if (error) showToast(error, "error");
  }, [error]);

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Delete challan "${row.challanNo}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      setDeletingId(row.id);
      await remove(row.id);
      showToast("Challan deleted successfully", "success");
    } catch (err) {
      // error state is already set inside the hook and surfaced via the
      // error useEffect above, but we catch here so the promise
      // rejection doesn't bubble up unhandled.
    } finally {
      setDeletingId(null);
    }
  };

  // ── Today's generated challans ──
  const todayChallans = useMemo(
    () => formattedChallans.filter((c) => c.rawDate === todayStr()),
    [formattedChallans],
  );

  // ── Date-filtered challans ──
  const hasDateFilter = Boolean(fromDate || toDate);
  const filteredChallans = useMemo(() => {
    if (!hasDateFilter) return [];
    return formattedChallans.filter((c) => {
      if (fromDate && c.rawDate < fromDate) return false;
      if (toDate && c.rawDate > toDate) return false;
      return true;
    });
  }, [formattedChallans, fromDate, toDate, hasDateFilter]);

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/state-challan/${row.id}`)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition">
            Edit
          </button>
          <button
            onClick={() => handleDelete(row)}
            disabled={deletingId === row.id}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition disabled:opacity-50">
            {deletingId === row.id ? "Deleting..." : "Delete"}
          </button>
        </div>
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
        data={hasDateFilter ? filteredChallans : formattedChallans}
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

export default GeneratedStateChallans;
