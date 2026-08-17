import React, { useState } from "react";
import { TbDownload } from "react-icons/tb";
import { FiPrinter, FiFilter } from "react-icons/fi";

// ── Financial year — locked to 2025–26 only ─────────────────────
const FIXED_FY = {
  label: "2025 – 26",
  value: "2025-2026",
};

// ────────────────────────────────────────────────────────────────

const SearchFunction = ({ onFilter, onDownload, onPrint }) => {
  const selectYear = FIXED_FY.value;
  const [applied, setApplied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleApply = () => {
    setApplied(true);
    // ✅ Lift selected FY up to parent so the form/statement can filter its data
    if (onFilter) onFilter(selectYear);
    setTimeout(() => setApplied(false), 2000);
  };

  const handleDownload = async () => {
    if (!onDownload || isDownloading) return;
    setIsDownloading(true);
    try {
      // Await in case the parent's handler is async (e.g. server-side PDF
      // generation) — keeps the button disabled/spinning for the full
      // duration instead of resetting immediately.
      await onDownload(selectYear);
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
      {/* ── Header strip ── */}
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

        {/* Download + Print */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded cursor-pointer transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              color: "#c9a84c",
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.3)",
            }}
            onMouseEnter={(e) => {
              if (!isDownloading)
                e.currentTarget.style.background = "rgba(201,168,76,0.25)";
            }}
            onMouseLeave={(e) => {
              if (!isDownloading)
                e.currentTarget.style.background = "rgba(201,168,76,0.15)";
            }}>
            {isDownloading ? (
              <svg
                className="animate-spin"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <TbDownload size={13} />
            )}
            {isDownloading ? "Generating PDF…" : "Download"}
          </button>

          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded cursor-pointer transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              color: "#ffffff",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
            onMouseEnter={(e) => {
              if (!isPrinting)
                e.currentTarget.style.background = "rgba(255,255,255,0.18)";
            }}
            onMouseLeave={(e) => {
              if (!isPrinting)
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}>
            {isPrinting ? (
              <svg
                className="animate-spin"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <FiPrinter size={13} />
            )}
            {isPrinting ? "Preparing…" : "Print"}
          </button>
        </div>
      </div>

      {/* ── Filter body ── */}
      <div className="px-5 py-4 flex items-end gap-4">
        {/* Year — locked to 2025-26, shown as a static badge instead of a dropdown */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "#374151" }}>
            Financial Year
          </label>
          <div
            className="px-4 py-2.5 text-xs rounded border"
            style={{
              background: "#f9fafb",
              borderColor: "#d1d5db",
              color: "#111827",
              fontFamily: "'Merriweather', sans-serif",
              minWidth: "180px",
            }}>
            {FIXED_FY.label}
          </div>
        </div>

        {/* Apply button */}
        <button
          onClick={handleApply}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded cursor-pointer active:scale-95 transition-all duration-150"
          style={{
            background: applied ? "#14532d" : "#0f2744",
            color: applied ? "#ffffff" : "#c9a84c",
            border: `1.5px solid ${applied ? "#14532d" : "#c9a84c"}`,
            letterSpacing: "0.5px",
          }}
          onMouseEnter={(e) => {
            if (!applied) e.currentTarget.style.background = "#1a3a5c";
          }}
          onMouseLeave={(e) => {
            if (!applied) e.currentTarget.style.background = "#0f2744";
          }}>
          <FiFilter size={12} style={{ color: applied ? "#fff" : "#c9a84c" }} />
          {applied ? "Filter Applied" : "Apply Filter"}
        </button>

        {/* Active filter badge */}
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
            Showing: FY {FIXED_FY.label}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFunction;
