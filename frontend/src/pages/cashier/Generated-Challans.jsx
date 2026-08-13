import React, { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/DataTable/DataTable";
import { getAllChallans, deleteChallan } from "../../api/challan.api";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../utils/toast";
import { LuDownload, LuTrash2 } from "react-icons/lu";

// ── Module-level cache — survives tab switches, cleared on mutation ──
let _challanCache = null;

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

  groupedByDate.forEach(({ date, headGroups, subtotal }) => {
    headGroups.forEach(({ head, rows: headRows, headSubtotal }) => {
      headRows.forEach((r) => {
        lines.push(
          [srNo, date, head, r.challanNo, r.amount.toFixed(2)]
            .map(csvField)
            .join(","),
        );
        srNo++;
      });
      lines.push(
        ["", "", "", `Total for Head ${head}`, headSubtotal.toFixed(2)]
          .map(csvField)
          .join(","),
      );
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

// ── CSV export for the pivot view — Date row x Head columns matrix ──
const downloadPivotCsv = (
  heads,
  headLabels,
  pivotRows,
  headTotals,
  grandTotal,
  title,
) => {
  const lines = [
    ["Date", ...heads.map((h) => headLabels[h]), "Total"]
      .map(csvField)
      .join(","),
  ];

  pivotRows.forEach((row) => {
    lines.push(
      [
        row.date,
        ...heads.map((h) => (row.amounts[h] ? row.amounts[h].toFixed(2) : "")),
        row.total.toFixed(2),
      ]
        .map(csvField)
        .join(","),
    );
  });

  lines.push(
    [
      "TOTAL",
      ...heads.map((h) => (headTotals[h] ? headTotals[h].toFixed(2) : "")),
      grandTotal.toFixed(2),
    ]
      .map(csvField)
      .join(","),
  );

  const csv = lines.join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/\s+/g, "-")}-head-wise.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ── Modal: rows grouped by date, then by head code within each date — Sr No,
//    Date, Head Code, Challan No, Gross Amount — with a semibold subtotal
//    row per head code, a bold total row per date, and a grand total.
//    Also offers a "Head-wise Matrix" view: Date rows x Head columns. ──
const ChallanListModal = ({ title, rows, onClose }) => {
  const [viewMode, setViewMode] = useState("list"); // "list" | "pivot"

  const groupedByDate = useMemo(() => {
    const byDate = new Map();
    // Stable date order, oldest first
    [...rows]
      .sort((a, b) =>
        a.challanDate < b.challanDate
          ? -1
          : a.challanDate > b.challanDate
            ? 1
            : 0,
      )
      .forEach((r) => {
        const key = r.challanDate || "Unknown Date";
        if (!byDate.has(key)) byDate.set(key, []);
        byDate.get(key).push(r);
      });

    return Array.from(byDate.entries()).map(([date, groupRows]) => {
      // ── Head-wise breakdown within this date, stable order of first
      //    appearance ──
      const byHead = new Map();
      groupRows.forEach((r) => {
        const key = headCode(r);
        if (!byHead.has(key)) byHead.set(key, []);
        byHead.get(key).push(r);
      });

      const headGroups = Array.from(byHead.entries()).map(
        ([head, headRows]) => ({
          head,
          rows: headRows,
          headSubtotal: headRows.reduce((sum, r) => sum + (r.amount || 0), 0),
        }),
      );

      return {
        date,
        headGroups,
        subtotal: groupRows.reduce((sum, r) => sum + (r.amount || 0), 0),
      };
    });
  }, [rows]);

  const grandTotal = groupedByDate.reduce((sum, g) => sum + g.subtotal, 0);

  // ── Pivot: fixed 17 columns (Head 01 – Head 17). Each column corresponds
  //    to the numeric value of majorHead (e.g. "011" -> 11 -> "11"), not
  //    to the order codes happen to appear in the data. Columns with no
  //    data for a given date are left blank. Any code that doesn't parse
  //    to 1-17 is bucketed separately and ignored in the fixed grid. ──
  const HEAD_COUNT = 17;

  const normalizeHead = (code) => {
    const num = parseInt(code, 10);
    if (isNaN(num) || num < 1 || num > HEAD_COUNT) return null;
    return String(num).padStart(2, "0");
  };

  const { heads, headLabels, pivotRows, headTotals } = useMemo(() => {
    // Fixed set of column keys: "01".."17"
    const fixedHeads = Array.from({ length: HEAD_COUNT }, (_, i) =>
      String(i + 1).padStart(2, "0"),
    );

    const labelByCode = {};
    fixedHeads.forEach((code) => {
      labelByCode[code] = code;
    });

    const byDate = new Map();
    rows.forEach((r) => {
      const normalized = normalizeHead(headCode(r));
      if (!normalized) return; // skip codes outside 1-17, or unparsable
      const dateKey = r.challanDate || "Unknown Date";
      if (!byDate.has(dateKey)) byDate.set(dateKey, {});
      const bucket = byDate.get(dateKey);
      bucket[normalized] = (bucket[normalized] || 0) + (r.amount || 0);
    });

    const sortedDates = Array.from(byDate.keys()).sort((a, b) =>
      a < b ? -1 : a > b ? 1 : 0,
    );

    const rowsOut = sortedDates.map((date) => {
      const amounts = byDate.get(date);
      const total = Object.values(amounts).reduce((s, v) => s + v, 0);
      return { date, amounts, total };
    });

    const totalsOut = {};
    fixedHeads.forEach((code) => {
      totalsOut[code] = rowsOut.reduce((s, r) => s + (r.amounts[code] || 0), 0);
    });

    return {
      heads: fixedHeads,
      headLabels: labelByCode,
      pivotRows: rowsOut,
      headTotals: totalsOut,
    };
  }, [rows]);

  const pivotGrandTotal = Object.values(headTotals).reduce((s, v) => s + v, 0);
  const handleDownload = () => {
    if (viewMode === "list") {
      downloadChallanCsv(groupedByDate, title);
    } else {
      downloadPivotCsv(
        heads,
        headLabels,
        pivotRows,
        headTotals,
        pivotGrandTotal,
        title,
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}>
      <div
        className={`w-full bg-white rounded-lg shadow-lg flex flex-col max-h-[80vh] ${
          viewMode === "pivot" ? "max-w-5xl" : "max-w-2xl"
        }`}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 gap-3 flex-wrap">
          <h2 className="font-unbounded text-lg font-normal">{title}</h2>
          <div className="flex items-center gap-3">
            {/* ── View toggle ── */}
            <div className="flex rounded-md border border-zinc-300 overflow-hidden text-xs font-semibold">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 transition ${
                  viewMode === "list"
                    ? "bg-zinc-800 text-white"
                    : "bg-white text-zinc-600 hover:bg-zinc-50"
                }`}>
                List
              </button>
              <button
                onClick={() => setViewMode("pivot")}
                className={`px-3 py-1.5 transition border-l border-zinc-300 ${
                  viewMode === "pivot"
                    ? "bg-zinc-800 text-white"
                    : "bg-white text-zinc-600 hover:bg-zinc-50"
                }`}>
                Head 01-{String(heads.length).padStart(2, "0")}
              </button>
            </div>

            {rows.length > 0 && (
              <button
                onClick={handleDownload}
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

        <div className="overflow-auto px-5 py-3">
          {rows.length === 0 ? (
            <p className="text-sm text-zinc-400 py-8 text-center">
              No challans found.
            </p>
          ) : viewMode === "list" ? (
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
                {groupedByDate.map((group) => {
                  let runningSrNo = 0;
                  return (
                    <React.Fragment key={group.date}>
                      {group.headGroups.map((hg) => (
                        <React.Fragment key={`${group.date}-${hg.head}`}>
                          {hg.rows.map((r) => {
                            runningSrNo++;
                            return (
                              <tr
                                key={r.id}
                                className="border-b border-zinc-100">
                                <td className="py-2 pr-2 text-zinc-400">
                                  {runningSrNo}
                                </td>
                                <td className="py-2 pr-2">{group.date}</td>
                                <td className="py-2 pr-2">{hg.head}</td>
                                <td className="py-2 pr-2 font-medium">
                                  {r.challanNo}
                                </td>
                                <td className="py-2 text-right">
                                  {r.amount.toLocaleString("en-IN")}
                                </td>
                              </tr>
                            );
                          })}
                          {/* ── Per-head subtotal (semibold) ── */}
                          <tr className="bg-zinc-50/60 border-b border-zinc-100">
                            <td
                              colSpan={4}
                              className="py-1.5 pr-2 text-right font-semibold text-zinc-600">
                              Total for Head {hg.head}
                            </td>
                            <td className="py-1.5 text-right font-semibold text-zinc-700">
                              ₹{hg.headSubtotal.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                      {/* ── Per-date total (bold) ── */}
                      <tr className="bg-zinc-100 border-b border-zinc-200">
                        <td
                          colSpan={4}
                          className="py-1.5 pr-2 text-right font-bold text-zinc-700">
                          Total for {group.date}
                        </td>
                        <td className="py-1.5 text-right font-bold text-zinc-900">
                          ₹{group.subtotal.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-200">
                  <th className="py-2 pr-2 sticky left-0 bg-white">Date</th>
                  {heads.map((h) => (
                    <th
                      key={h}
                      className="py-2 px-2 text-right whitespace-nowrap">
                      {headLabels[h]}
                    </th>
                  ))}
                  <th className="py-2 pl-2 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {pivotRows.map((row) => (
                  <tr key={row.date} className="border-b border-zinc-100">
                    <td className="py-2 pr-2 font-medium sticky left-0 bg-white">
                      {row.date}
                    </td>
                    {heads.map((h) => (
                      <td key={h} className="py-2 px-2 text-right">
                        {row.amounts[h]
                          ? row.amounts[h].toLocaleString("en-IN")
                          : ""}
                      </td>
                    ))}
                    <td className="py-2 pl-2 text-right font-semibold">
                      ₹{row.total.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
                {/* ── Head-wise totals row ── */}
                <tr className="bg-zinc-100 border-t border-zinc-300">
                  <td className="py-2 pr-2 font-bold sticky left-0 bg-zinc-100">
                    TOTAL
                  </td>
                  {heads.map((h) => (
                    <td key={h} className="py-2 px-2 text-right font-bold">
                      {headTotals[h]
                        ? headTotals[h].toLocaleString("en-IN")
                        : ""}
                    </td>
                  ))}
                  <td className="py-2 pl-2 text-right font-bold">
                    ₹{pivotGrandTotal.toLocaleString("en-IN")}
                  </td>
                </tr>
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

// ── Delete confirmation modal ──
const DeleteConfirmModal = ({ challan, onCancel, onConfirm, deleting }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}>
      <div
        className="w-full max-w-sm bg-white rounded-lg shadow-lg p-5"
        onClick={(e) => e.stopPropagation()}>
        <h2 className="font-unbounded text-lg font-normal mb-2">
          Delete Challan
        </h2>
        <p className="text-sm text-zinc-500 mb-5">
          Are you sure you want to delete challan{" "}
          <span className="font-semibold text-zinc-700">
            {challan.challanNo}
          </span>
          ? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm rounded border border-zinc-300 text-zinc-600 hover:bg-zinc-50 transition disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50">
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
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
  const [challanToDelete, setChallanToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
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
          majorHead: c.majorHead,
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

  // ── Delete handling ──
  const handleDeleteConfirm = async () => {
    if (!challanToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteChallan(challanToDelete.id);
      if (res.data.success) {
        showToast("Challan deleted", "success");
        invalidateChallanCache();
        setChallans((prev) => prev.filter((c) => c.id !== challanToDelete.id));
        setChallanToDelete(null);
      } else {
        showToast(res.data.message || "Failed to delete challan", "error");
      }
    } catch (error) {
      console.error(error);
      showToast(
        error?.response?.data?.message || "Failed to delete challan",
        "error",
      );
    } finally {
      setDeleting(false);
    }
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/challan/${row.id}`)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
            Edit
          </button>
          <button
            onClick={() => setChallanToDelete(row)}
            title="Delete challan"
            className="flex items-center justify-center w-8 h-8 rounded border border-red-200 text-red-600 hover:bg-red-50 transition">
            <LuTrash2 size={14} />
          </button>
        </div>
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
        pageSize={100}
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

      {challanToDelete && (
        <DeleteConfirmModal
          challan={challanToDelete}
          deleting={deleting}
          onCancel={() => setChallanToDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

export const invalidateChallanCache = () => {
  _challanCache = null;
};

export default GeneratedChallans;
