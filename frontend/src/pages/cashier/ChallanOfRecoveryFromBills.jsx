// ChallanOfRecoveryFromBills.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable/DataTable";
import TableButton from "../../components/ui/TableButton";
import { useChallanFromBill } from "../../hooks/useChallanFromBill.js";
import { LuDownload } from "react-icons/lu";

const todayStr = () => new Date().toISOString().slice(0, 10);

// Modal shows only the major head code
const headCode = (row) => row.majorHead || "-";

// ── CSV export — no external dependency, plain Blob download ──
const csvField = (value) => {
  const str = value === null || value === undefined ? "" : String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

const downloadRecoveryChallanCsv = (groupedByDate, title) => {
  const lines = [
    ["#", "Date", "Head Code", "Challan No", "Amount Type", "Amount"]
      .map(csvField)
      .join(","),
  ];

  let srNo = 1;
  let grandTotal = 0;

  groupedByDate.forEach(({ date, rows, subtotal }) => {
    rows.forEach((r) => {
      lines.push(
        [
          srNo,
          date,
          headCode(r),
          r.challanNo,
          r.amountType || "-",
          r.amountNum.toFixed(2),
        ]
          .map(csvField)
          .join(","),
      );
      srNo++;
    });
    lines.push(
      ["", "", "", "", `Total for ${date}`, subtotal.toFixed(2)]
        .map(csvField)
        .join(","),
    );
    grandTotal += subtotal;
  });

  lines.push(
    ["", "", "", "", "GRAND TOTAL", grandTotal.toFixed(2)]
      .map(csvField)
      .join(","),
  );

  const csv = lines.join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/\s+/g, "-")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ── Modal: rows grouped by date — Sr No, Date, Head Code, Challan No,
//    Amount Type, Amount — with a subtotal row per date and a grand total ──
const RecoveryChallanListModal = ({ title, rows, onClose }) => {
  const groupedByDate = useMemo(() => {
    const byDate = new Map();
    [...rows]
      .sort((a, b) =>
        (a.rawDate || "") < (b.rawDate || "")
          ? -1
          : (a.rawDate || "") > (b.rawDate || "")
            ? 1
            : 0,
      )
      .forEach((r) => {
        const key = r.rawDate || "Unknown Date";
        if (!byDate.has(key)) byDate.set(key, []);
        byDate.get(key).push(r);
      });

    return Array.from(byDate.entries()).map(([date, groupRows]) => ({
      date,
      rows: groupRows,
      subtotal: groupRows.reduce((sum, r) => sum + (r.amountNum || 0), 0),
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
                onClick={() => downloadRecoveryChallanCsv(groupedByDate, title)}
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
                  <th className="py-2 pr-2">Amount Type</th>
                  <th className="py-2 text-right">Amount</th>
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
                          <td className="py-2 pr-2">{r.amountType || "-"}</td>
                          <td className="py-2 text-right">
                            {r.amountNum.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                    {/* ── Per-date subtotal ── */}
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <td
                        colSpan={5}
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

const ChallanOfRecoveryFromBills = () => {
  const navigate = useNavigate();

  const { challans, loading } = useChallanFromBill(); // ✅ cashier-wise or all, depending on permissions

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeModal, setActiveModal] = useState(null); // "today" | "filtered" | null

  // ── Rows with a raw ISO date + numeric amount for filtering/summing ──
  const enrichedChallans = useMemo(() => {
    return (challans || []).map((row) => ({
      ...row,
      rawDate: row.voucharDate ? String(row.voucharDate).slice(0, 10) : "",
      amountNum: Number(row.amount) || 0,
    }));
  }, [challans]);

  const todayChallans = useMemo(
    () => enrichedChallans.filter((r) => r.rawDate === todayStr()),
    [enrichedChallans],
  );

  const hasDateFilter = Boolean(fromDate || toDate);
  const filteredChallans = useMemo(() => {
    if (!hasDateFilter) return [];
    return enrichedChallans.filter((r) => {
      if (fromDate && r.rawDate < fromDate) return false;
      if (toDate && r.rawDate > toDate) return false;
      return true;
    });
  }, [enrichedChallans, fromDate, toDate, hasDateFilter]);

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
  };

  const columns = [
    {
      key: "id",
      label: "ID",
    },
    {
      key: "challanNo",
      label: "Challan No",
    },
    {
      key: "voucharDate", // ✅ matches your schema field name (typo in schema)
      label: "Voucher Date",
      render: (value) => (value ? new Date(value).toLocaleDateString() : "-"),
    },
    {
      key: "majorHead",
      label: "Major Head",
      render: (_, row) =>
        `${row.majorHead || "-"}-${row.subMajor || "-"}-${row.minorHead || "-"}`,
    },
    {
      key: "ddo",
      label: "DDO",
      render: (_, row) => row.expenditure?.ddo?.ddoName || "-",
    },
    {
      key: "amount",
      label: "Amount",
      render: (value) =>
        value ? `₹ ${Number(value).toLocaleString("en-IN")}` : "-",
    },
    {
      key: "amountType",
      label: "Amount Type",
    },
    {
      key: "treasuryChallanNo",
      label: "Treasury Challan No",
      render: (value) => value || "-",
    },
    {
      key: "treasuryChallanDate",
      label: "Treasury Challan Date",
      render: (value) => (value ? new Date(value).toLocaleDateString() : "-"),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="font-unbounded text-3xl font-normal">
        Challan of Recovery from Bills
      </h1>

      {/* ── Stats + Date Filter ── */}
      <div className="flex flex-wrap items-end gap-4">
        <StatCard
          label="Today's Recovery Challans"
          count={todayChallans.length}
          onClick={() => setActiveModal("today")}
        />

        {hasDateFilter && (
          <StatCard
            label="Filtered Recovery Challans"
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
        data={hasDateFilter ? filteredChallans : enrichedChallans}
        columns={columns}
        loading={loading}
        searchableKeys={[
          "challanNo",
          "majorHead",
          "treasuryChallanNo",
          "amount",
        ]}
        pageSize={200}
      />

      {activeModal === "today" && (
        <RecoveryChallanListModal
          title="Today's Recovery Challans"
          rows={todayChallans}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "filtered" && (
        <RecoveryChallanListModal
          title={`Recovery Challans (${fromDate || "…"} to ${toDate || "…"})`}
          rows={filteredChallans}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

export default ChallanOfRecoveryFromBills;
