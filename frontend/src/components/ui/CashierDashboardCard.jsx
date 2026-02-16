// ── CashierDashboardCard.jsx ──────────────────────────────────────────────────
import React from "react";
import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";

export const CashierDashboardCard = ({
  title,
  count,
  paragraph,
  difference,
  accent = false,
}) => {
  const isPositive = difference >= 0;

  return (
    <div
      className="col-span-3 flex flex-col justify-between rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer"
      style={{
        background: accent
          ? "linear-gradient(135deg, #0f2744 0%, #1a3a5c 100%)"
          : "#ffffff",
        borderColor: accent ? "#1a3a5c" : "#e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        minHeight: "110px",
        fontFamily: "'Georgia', serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 14px rgba(15,39,68,0.15)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
        e.currentTarget.style.transform = "translateY(0)";
      }}>
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{ background: accent ? "#c9a84c" : "#0f2744" }}
      />

      <div className="px-5 py-4 flex flex-col gap-2">
        {/* Title */}
        <p
          className="text-xs font-bold uppercase tracking-wide leading-tight"
          style={{ color: accent ? "#c9a84c" : "#6b7280" }}>
          {title}
        </p>

        {/* Count */}
        <span
          className="text-3xl font-bold leading-none"
          style={{ color: accent ? "#ffffff" : "#0f2744" }}>
          {count}
        </span>

        {/* Trend */}
        <span
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{
            color: isPositive
              ? accent
                ? "#86efac"
                : "#14532d"
              : accent
                ? "#fca5a5"
                : "#991b1b",
          }}>
          {isPositive ? (
            <FaArrowTrendUp size={11} />
          ) : (
            <FaArrowTrendDown size={11} />
          )}
          <span>{Math.abs(difference)}</span>
          <span
            style={{
              color: accent ? "rgba(255,255,255,0.55)" : "#9ca3af",
              fontWeight: 400,
            }}>
            {paragraph}
          </span>
        </span>
      </div>
    </div>
  );
};

export default CashierDashboardCard;
