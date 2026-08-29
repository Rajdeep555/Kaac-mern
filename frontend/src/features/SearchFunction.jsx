import React, { useState } from "react";
import { TbDownload } from "react-icons/tb";
import { FiPrinter, FiFilter } from "react-icons/fi";

// Sensible default range — adjust as you like
const todayStr = new Date().toISOString().slice(0, 10);
const DEFAULT_FROM = "2025-04-01";
const DEFAULT_TO = todayStr;

const SearchFunction = ({ onFilter, onDownload, onPrint }) => {
  const [fromDate, setFromDate] = useState(DEFAULT_FROM);
  const [toDate, setToDate] = useState(DEFAULT_TO);
  const [applied, setApplied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [dateError, setDateError] = useState(null);

  const handleApply = () => {
    if (!fromDate || !toDate) {
      setDateError("Please select both dates");
      return;
    }
    if (fromDate > toDate) {
      setDateError("From date must be before To date");
      return;
    }
    setDateError(null);
    setApplied(true);
    if (onFilter) onFilter({ from: fromDate, to: toDate });
    setTimeout(() => setApplied(false), 2000);
  };

  const handleDownload = async () => {
    if (!onDownload || isDownloading) return;
    setIsDownloading(true);
    try {
      await onDownload({ from: fromDate, to: toDate });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = async () => {
    if (!onPrint || isPrinting) return;
    setIsPrinting(true);
    try {
      await onPrint();
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div
      className="w-full rounded-lg border overflow-hidden"
      style={{
        background: "#ffffff",
        borderColor: "#e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        fontFamily: "'Georgia', serif",
      }}>
      {/* Header strip unchanged... */}
      <div
        className="px-5 py-3 flex items-center justify-between border-b"
        style={{ background: "#0f2744", borderColor: "#1a3a5c" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{
              background: "rgba(201,168,76,0.2)",
              border: "1px solid #c9a84c",
            }}>
            <FiFilter size={12} style={{ color: "#c9a84c" }} />
          </div>
          <p className="text-xs font-bold text-white tracking-wide uppercase">
            Search & Filter
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={isDownloading} /* ...unchanged... */
          >
            {isDownloading ? "Generating PDF…" : "Download"}
          </button>
          <button
            onClick={handlePrint}
            disabled={isPrinting} /* ...unchanged... */
          >
            {isPrinting ? "Preparing…" : "Print"}
          </button>
        </div>
      </div>

      {/* ── Filter body — date range instead of FY badge ── */}
      <div className="px-5 py-4 flex items-end gap-4 flex-wrap">
        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "#374151" }}>
            From
          </label>
          <input
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-4 py-2.5 text-xs rounded border"
            style={{
              background: "#f9fafb",
              borderColor: "#d1d5db",
              color: "#111827",
              minWidth: "160px",
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "#374151" }}>
            To
          </label>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-4 py-2.5 text-xs rounded border"
            style={{
              background: "#f9fafb",
              borderColor: "#d1d5db",
              color: "#111827",
              minWidth: "160px",
            }}
          />
        </div>

        <button
          onClick={handleApply}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded cursor-pointer active:scale-95 transition-all duration-150"
          style={{
            background: applied ? "#14532d" : "#0f2744",
            color: applied ? "#ffffff" : "#c9a84c",
            border: `1.5px solid ${applied ? "#14532d" : "#c9a84c"}`,
            letterSpacing: "0.5px",
          }}>
          <FiFilter size={12} style={{ color: applied ? "#fff" : "#c9a84c" }} />
          {applied ? "Filter Applied" : "Apply Filter"}
        </button>

        {applied && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold"
            style={{
              background: "rgba(20,83,45,0.08)",
              border: "1px solid rgba(20,83,45,0.2)",
              color: "#14532d",
            }}>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#22c55e" }}
            />
            Showing: {fromDate} to {toDate}
          </div>
        )}

        {dateError && (
          <p className="text-xs text-red-600 w-full">{dateError}</p>
        )}
      </div>
    </div>
  );
};

export default SearchFunction;
