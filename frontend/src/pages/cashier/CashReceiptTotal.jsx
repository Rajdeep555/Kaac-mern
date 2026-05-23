import React, { useState } from "react";
import Breadcrumbs from "../../components/ui/Breadcrumbs";
import { getCashReceiptTotal } from "../../api/cashReceipt.api";
import { showToast } from "../../utils/toast";

// ── Financial years — generate last 10 FYs from current ──
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth(); // 0-indexed; April = 3
const currentFyStart = currentMonth >= 3 ? currentYear : currentYear - 1;

const FY_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const start = currentFyStart - i;
  return {
    label: `${start}-${String(start + 1).slice(-2)}`,
    value: start,
  };
});

const MONTHS = [
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
];

// Build days array for a given month+year (accounts for leap years etc.)
const getDaysInMonth = (monthNum, fyYear) => {
  if (!monthNum || !fyYear) return [];
  const calendarYear =
    Number(monthNum) >= 4 ? Number(fyYear) : Number(fyYear) + 1;
  const daysCount = new Date(calendarYear, Number(monthNum), 0).getDate();
  return Array.from({ length: daysCount }, (_, i) => ({
    label: String(i + 1).padStart(2, "0"),
    value: i + 1,
  }));
};

const FILTER_TYPES = [
  { label: "Financial Year", value: "fy" },
  { label: "Monthly", value: "monthly" },
  { label: "Day", value: "daily" },
];

const CashReceiptTotal = () => {
  const [filterType, setFilterType] = useState("fy");
  const [selectedFy, setSelectedFy] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // ── Validation ────────────────────────────────────────────────────────────
  const canSearch =
    filterType === "fy"
      ? selectedFy !== ""
      : filterType === "monthly"
        ? selectedFy !== "" && selectedMonth !== ""
        : /* daily */ selectedFy !== "" &&
          selectedMonth !== "" &&
          selectedDay !== "";

  // ── Days list reacts to month + FY selection ──────────────────────────────
  const dayOptions = getDaysInMonth(selectedMonth, selectedFy);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const resetResult = () => {
    setResult(null);
    setSearched(false);
  };

  const handleFilterTypeChange = (type) => {
    setFilterType(type);
    setSelectedMonth("");
    setSelectedDay("");
    resetResult();
  };

  const handleFyChange = (val) => {
    setSelectedFy(val);
    setSelectedDay("");
    resetResult();
  };

  const handleMonthChange = (val) => {
    setSelectedMonth(val);
    setSelectedDay("");
    resetResult();
  };

  const handleSearch = async () => {
    if (!canSearch) return;
    setLoading(true);
    setResult(null);
    setSearched(false);
    try {
      const params = { filterType, fy: selectedFy };
      if (filterType === "monthly" || filterType === "daily")
        params.month = selectedMonth;
      if (filterType === "daily") params.day = selectedDay;

      const res = await getCashReceiptTotal(params);
      if (res.data.success) {
        setResult(res.data);
        setSearched(true);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to fetch total", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFy("");
    setSelectedMonth("");
    setSelectedDay("");
    setResult(null);
    setSearched(false);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatINR = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val ?? 0);

  const fyLabel =
    FY_OPTIONS.find((f) => f.value === Number(selectedFy))?.label ?? "";
  const monthLabel =
    MONTHS.find((m) => m.value === Number(selectedMonth))?.label ?? "";

  const filterLabel =
    filterType === "fy"
      ? `FY ${fyLabel}`
      : filterType === "monthly"
        ? `${monthLabel} — FY ${fyLabel}`
        : /* daily */ `${selectedDay ? String(selectedDay).padStart(2, "0") : ""} ${monthLabel} — FY ${fyLabel}`;

  return (
    <div className="min-h-screen w-full px-5 py-3 pb-10">
      {/* ── Header ── */}
      <div className="border-b border-zinc-400 leading-9 mb-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", path: "/" },
            { label: "Cash Receipt", path: "/generated-cash-receipt" },
            { label: "Check Total" },
          ]}
        />
        <h1 className="font-unbounded text-2xl font-normal">
          Cash Receipt — Total
        </h1>
        <p className="text-sm text-zinc-500 mb-1">
          Select a filter to view the total amount collected.
        </p>
      </div>

      {/* ── Filter Card ── */}
      <div className="max-w-xl bg-white border border-zinc-200 rounded-xl shadow-sm p-6 space-y-5">
        {/* Filter type toggle */}
        <div>
          <p className="text-sm font-medium text-zinc-700 mb-2">Filter By</p>
          <div className="flex gap-2 flex-wrap">
            {FILTER_TYPES.map((ft) => (
              <button
                key={ft.value}
                onClick={() => handleFilterTypeChange(ft.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                  filterType === ft.value
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-50"
                }`}>
                {ft.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Financial Year ── always visible */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Financial Year <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedFy}
            onChange={(e) => handleFyChange(e.target.value)}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400">
            <option value="">— Select FY —</option>
            {FY_OPTIONS.map((fy) => (
              <option key={fy.value} value={fy.value}>
                {fy.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Month ── visible for monthly + daily */}
        {(filterType === "monthly" || filterType === "daily") && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Month <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              disabled={!selectedFy}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-400">
              <option value="">— Select Month —</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {!selectedFy && (
              <p className="text-xs text-zinc-400 mt-1">
                Select a Financial Year first
              </p>
            )}
          </div>
        )}

        {/* ── Day ── visible only for daily */}
        {filterType === "daily" && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Day <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDay}
              onChange={(e) => {
                setSelectedDay(e.target.value);
                resetResult();
              }}
              disabled={!selectedMonth || !selectedFy}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-400">
              <option value="">— Select Day —</option>
              {dayOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            {!selectedMonth && (
              <p className="text-xs text-zinc-400 mt-1">Select a Month first</p>
            )}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleSearch}
            disabled={!canSearch || loading}
            className="flex-1 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? "Calculating..." : "Get Total"}
          </button>
          {searched && (
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-zinc-300 text-zinc-600 rounded-lg text-sm hover:bg-zinc-50 transition">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="max-w-xl mt-6 flex items-center gap-3 text-zinc-500">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="3" />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="#0f2744"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm">Calculating total...</span>
        </div>
      )}

      {/* ── Result ── */}
      {searched && result && !loading && (
        <div className="max-w-xl mt-6 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-zinc-900 px-6 py-4">
            <p className="text-zinc-400 text-xs uppercase tracking-widest">
              Total Collected
            </p>
            <p className="text-white font-unbounded text-3xl font-semibold mt-1">
              {formatINR(result.total)}
            </p>
          </div>
          <div className="px-6 py-4 space-y-3 text-sm text-zinc-600">
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-500">Period</span>
              <span className="font-medium text-zinc-800">{filterLabel}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-500">From</span>
              <span className="font-medium text-zinc-800">
                {result.from
                  ? new Date(result.from).toLocaleDateString("en-GB")
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-500">To</span>
              <span className="font-medium text-zinc-800">
                {result.to
                  ? new Date(result.to).toLocaleDateString("en-GB")
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">No. of Receipts</span>
              <span className="font-medium text-zinc-800">{result.count}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {searched && result && result.count === 0 && !loading && (
        <div className="max-w-xl mt-6 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-6 py-4 text-sm">
          No receipts found for the selected period.
        </div>
      )}
    </div>
  );
};

export default CashReceiptTotal;
