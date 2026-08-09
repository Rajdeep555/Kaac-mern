// GeneratedExpenditure.jsx
import React, { useMemo, useState } from "react";
import DataTable from "../../components/DataTable/DataTable";
import TableButton from "../../components/ui/TableButton";
import { useNavigate } from "react-router-dom";
import { useCashierExpenditures } from "../../hooks/useCashierExpenditures.js";
import { deleteExpenditure } from "../../api/expenditure.api.js";
import { LuReceipt, LuDownload } from "react-icons/lu";
// ✅ Truncate helper
const Truncate = ({ text, max = 20 }) => {
  if (!text) return "-";
  const str = String(text);
  if (str.length <= max) return str;
  return (
    <span title={str} className="cursor-help">
      {str.slice(0, max)}...
    </span>
  );
};

const todayStr = () => new Date().toISOString().slice(0, 10);

// Modal shows only the major head code (not the full head chain used in
// the main table's "codes" column)
const headCode = (row) => row.majorHead || "-";

// ── CSV export — no external dependency, plain Blob download ──
const csvField = (value) => {
  const str = value === null || value === undefined ? "" : String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

const downloadExpenditureCsv = (groupedByDate, title) => {
  const lines = [
    ["#", "Date", "Head Code", "Voucher No", "Gross Amount"]
      .map(csvField)
      .join(","),
  ];

  let srNo = 1;
  let grandTotal = 0;

  groupedByDate.forEach(({ date, headGroups, subtotal }) => {
    headGroups.forEach(({ head, rows: headRows, headSubtotal }) => {
      headRows.forEach((r) => {
        lines.push(
          [srNo, date, head, r.voucherNo, r.grossAmountNum.toFixed(2)]
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

// ── Modal: rows grouped by date, then by head code within each date — Sr No,
//    Date, Head Code, Voucher No, Gross Amount — with a semibold subtotal
//    row per head code, a bold total row per date, and a grand total ──
const ExpenditureListModal = ({ title, rows, onClose }) => {
  const groupedByDate = useMemo(() => {
    const byDate = new Map();
    // Stable date order, oldest first
    [...rows]
      .sort((a, b) =>
        a.rawDate < b.rawDate ? -1 : a.rawDate > b.rawDate ? 1 : 0,
      )
      .forEach((r) => {
        const key = r.rawDate || "Unknown Date";
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
          headSubtotal: headRows.reduce(
            (sum, r) => sum + (r.grossAmountNum || 0),
            0,
          ),
        }),
      );

      return {
        date,
        headGroups,
        subtotal: groupRows.reduce(
          (sum, r) => sum + (r.grossAmountNum || 0),
          0,
        ),
      };
    });
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
                onClick={() => downloadExpenditureCsv(groupedByDate, title)}
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
              No expenditures found.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-200">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Head Code</th>
                  <th className="py-2 pr-2">Voucher No</th>
                  <th className="py-2 text-right">Gross Amount</th>
                </tr>
              </thead>
              <tbody>
                {groupedByDate.map((group) => (
                  <React.Fragment key={group.date}>
                    {group.headGroups.map((hg) => (
                      <React.Fragment key={`${group.date}-${hg.head}`}>
                        {hg.rows.map((r) => {
                          runningSrNo++;
                          return (
                            <tr key={r.id} className="border-b border-zinc-100">
                              <td className="py-2 pr-2 text-zinc-400">
                                {runningSrNo}
                              </td>
                              <td className="py-2 pr-2">{group.date}</td>
                              <td className="py-2 pr-2">{hg.head}</td>
                              <td className="py-2 pr-2 font-medium">
                                {r.voucherNo}
                              </td>
                              <td className="py-2 text-right">
                                {r.grossAmountNum.toLocaleString("en-IN")}
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
                ))}
              </tbody>
            </table>
          )}
        </div>

        {rows.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-200 bg-zinc-50 rounded-b-lg">
            <span className="text-sm text-zinc-500">
              {rows.length} voucher{rows.length !== 1 ? "s" : ""} across{" "}
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

const GeneratedExpenditure = () => {
  const navigate = useNavigate();
  const {
    data: expenditures,
    loading,
    invalidate,
  } = useCashierExpenditures({
    sector: ["COUNCIL", "STATE"],
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    voucherNo: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeModal, setActiveModal] = useState(null); // "today" | "filtered" | null

  const handleDeleteClick = (row) => {
    setConfirmModal({ isOpen: true, id: row.id, voucherNo: row.voucherNo });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteExpenditure(confirmModal.id);
      invalidate();
      setConfirmModal({ isOpen: false, id: null, voucherNo: "" });
    } catch (error) {
      console.error("Failed to delete expenditure", error);
      alert("Failed to delete expenditure. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmModal({ isOpen: false, id: null, voucherNo: "" });
  };

  // ── Rows with a raw ISO date + numeric gross amount for filtering/summing ──
  const enrichedExpenditures = useMemo(() => {
    return (expenditures || []).map((row) => ({
      ...row,
      rawDate: row.voucherDate ? String(row.voucherDate).slice(0, 10) : "",
      grossAmountNum: Number(row.grossAmount) || 0,
    }));
  }, [expenditures]);

  // ── Today's generated expenditures ──
  const todayExpenditures = useMemo(
    () => enrichedExpenditures.filter((r) => r.rawDate === todayStr()),
    [enrichedExpenditures],
  );

  // ── Date-filtered expenditures ──
  const hasDateFilter = Boolean(fromDate || toDate);
  const filteredExpenditures = useMemo(() => {
    if (!hasDateFilter) return [];
    return enrichedExpenditures.filter((r) => {
      if (fromDate && r.rawDate < fromDate) return false;
      if (toDate && r.rawDate > toDate) return false;
      return true;
    });
  }, [enrichedExpenditures, fromDate, toDate, hasDateFilter]);

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
  };

  const columns = [
    { key: "voucherNo", label: "Voucher No" },
    {
      key: "voucherDate",
      label: "Date",
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "codes",
      label: "Major - Sub Detail Head",
      render: (_, row) =>
        `${row.majorHead}-${row.subMajorHead}-${row.minorHead}-${row.detailHead}`,
    },
    {
      key: "ddo",
      label: "DDO",
      render: (_, row) => <Truncate text={row.ddo?.ddoName} max={25} />,
    },
    {
      key: "chequeNo",
      label: "Cheque No",
      render: (value) => <Truncate text={value} max={15} />,
    },
    {
      key: "treasuryVoucherNo",
      label: "Treasury Voucher No",
      render: (value) => <Truncate text={value} max={15} />,
    },
    { key: "grossAmount", label: "Gross Amount" },
    { key: "netAmount", label: "Net Amount" },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <button
            className="text-green-600 hover:underline text-sm"
            onClick={() => navigate(`/expenditures/${row.id}/view`)}>
            View
          </button>
          <button
            className="text-blue-600 hover:underline text-sm"
            onClick={() => navigate(`/expenditures/${row.id}`)}>
            Edit
          </button>
          <button
            className="text-red-500 hover:underline text-sm"
            onClick={() => handleDeleteClick(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="font-unbounded text-3xl font-normal">Expenditures</h1>

      {/* ── Stats + Date Filter ── */}
      <div className="flex flex-wrap items-end gap-4">
        <StatCard
          label="Today's Generated Expenditures"
          count={todayExpenditures.length}
          onClick={() => setActiveModal("today")}
        />

        {hasDateFilter && (
          <StatCard
            label="Filtered Expenditures"
            count={filteredExpenditures.length}
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
        data={hasDateFilter ? filteredExpenditures : enrichedExpenditures}
        columns={columns}
        loading={loading}
        emptyMessage={loading ? "Loading..." : "No data found"}
        searchableKeys={[
          "voucherNo",
          "treasuryVoucherNo",
          "majorHead",
          "chequeNo",
          "grossAmount",
        ]}
        pageSize={100}
        actionSlot={
          <div className="flex items-center gap-2">
            <TableButton
              name="Add New Expenditure"
              onClick={() => navigate("/expenditures")}
            />
            <TableButton
              name="Cheque Details"
              icon={<LuReceipt />}
              onClick={() => navigate("/cheque-details")}
            />
          </div>
        }
      />

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Confirm Delete
            </h2>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete voucher{" "}
              <span className="font-semibold text-gray-900">
                {confirmModal.voucherNo}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 
                           text-gray-700 hover:bg-gray-100 disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white 
                           hover:bg-red-600 disabled:opacity-50">
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "today" && (
        <ExpenditureListModal
          title="Today's Generated Expenditures"
          rows={todayExpenditures}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "filtered" && (
        <ExpenditureListModal
          title={`Expenditures (${fromDate || "…"} to ${toDate || "…"})`}
          rows={filteredExpenditures}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

export default GeneratedExpenditure;
