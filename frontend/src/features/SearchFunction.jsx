import React, { useState } from "react";
import { TbDownload } from "react-icons/tb";
import { FiPrinter, FiFilter } from "react-icons/fi";

// ── Financial year utility ──────────────────────────────────────
const getFinancialYear = (startYear) => {
  const endYear = startYear + 1;
  return {
    label: `${startYear} – ${String(endYear).slice(2)}`,
    value: `${startYear}-${endYear}`,
  };
};

const getCurrentFYStartYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return month >= 3 ? year : year - 1;
};

const buildFYOptions = () => {
  const currentStart = getCurrentFYStartYear();
  return [
    getFinancialYear(currentStart),
    getFinancialYear(currentStart - 1),
    getFinancialYear(currentStart - 2),
    getFinancialYear(currentStart - 3),
  ];
};

// ────────────────────────────────────────────────────────────────

const SearchFunction = ({ onFilter, onDownload, onPrint }) => {
  const fyOptions = buildFYOptions();
  const [selectYear, setSelectYear] = useState(fyOptions[0].value);
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    setApplied(true);
    // ✅ Lift selected FY up to parent so the form/statement can filter its data
    if (onFilter) onFilter(selectYear);
    setTimeout(() => setApplied(false), 2000);
  };

  const selectedLabel =
    fyOptions.find((o) => o.value === selectYear)?.label || "";

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
            onClick={() => {
              // ✅ Call parent's download handler — parent knows what data to export
              if (onDownload) onDownload(selectYear);
            }}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded cursor-pointer transition-all duration-150"
            style={{
              color: "#c9a84c",
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.3)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(201,168,76,0.25)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(201,168,76,0.15)")
            }>
            <TbDownload size={13} />
            Download
          </button>

          <button
            onClick={() => {
              // ✅ Call parent's print handler — parent triggers print on the correct div
              if (onPrint) onPrint();
            }}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded cursor-pointer transition-all duration-150"
            style={{
              color: "#ffffff",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.18)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
            }>
            <FiPrinter size={13} />
            Print
          </button>
        </div>
      </div>

      {/* ── Filter body ── */}
      <div className="px-5 py-4 flex items-end gap-4">
        {/* Year select */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "#374151" }}>
            Financial Year
          </label>
          <div className="relative">
            <select
              value={selectYear}
              onChange={(e) => {
                setSelectYear(e.target.value);
                setApplied(false);
              }}
              className="appearance-none px-4 py-2.5 pr-9 text-xs rounded border outline-none cursor-pointer transition-all duration-150"
              style={{
                background: "#f9fafb",
                borderColor: "#d1d5db",
                color: "#111827",
                fontFamily: "'Georgia', serif",
                minWidth: "180px",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#1a3a5c";
                e.target.style.boxShadow = "0 0 0 3px rgba(26,58,92,0.08)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
                e.target.style.boxShadow = "none";
              }}>
              {fyOptions.map((fy, i) => (
                <option key={fy.value} value={fy.value}>
                  {i === 0 ? `Current Year (${fy.label})` : fy.label}
                </option>
              ))}
            </select>
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#6b7280" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 4l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
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
            Showing: FY {selectedLabel}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFunction;
