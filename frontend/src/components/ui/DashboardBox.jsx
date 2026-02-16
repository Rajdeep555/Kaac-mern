import React from "react";
import { RiArrowUpLine, RiArrowDownLine } from "react-icons/ri";

const DashboardBox = ({
  items = [],
  type = "stats",
  title,
  subtitle,
  children,
}) => {
  // Empty/placeholder box
  if (items.length === 0 && !children) {
    return (
      <div
        className="flex-1 rounded-lg border flex flex-col overflow-hidden"
        style={{
          background: "#ffffff",
          borderColor: "#e5e7eb",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          minHeight: "220px",
          fontFamily: "'Georgia', serif",
        }}>
        <div
          className="px-4 py-3 border-b flex items-center gap-2"
          style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}>
          <div
            className="w-1 h-4 rounded-full"
            style={{ background: "#c9a84c" }}
          />
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "#0f2744" }}>
            {title || "Overview"}
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-400">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 rounded-lg border overflow-hidden"
      style={{
        background: "#ffffff",
        borderColor: "#e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        fontFamily: "'Georgia', serif",
      }}>
      {/* Section Header */}
      {title && (
        <div
          className="px-4 py-3 border-b flex items-center gap-2"
          style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}>
          <div
            className="w-1 h-4 rounded-full"
            style={{ background: "#c9a84c" }}
          />
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "#0f2744" }}>
              {title}
            </p>
            {subtitle && (
              <p className="text-xs" style={{ color: "#6b7280" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 2x2 stat grid */}
      <div
        className="grid grid-cols-2 gap-px"
        style={{ background: "#e5e7eb" }}>
        {items.slice(0, 4).map((item, i) => (
          <StatCell key={i} {...item} index={i} />
        ))}
      </div>
    </div>
  );
};

export default DashboardBox;

const CELL_ACCENTS = [
  {
    bg: "#0f2744",
    text: "#ffffff",
    accent: "#c9a84c",
    subtext: "rgba(255,255,255,0.65)",
  },
  { bg: "#ffffff", text: "#0f2744", accent: "#0f2744", subtext: "#6b7280" },
  { bg: "#ffffff", text: "#0f2744", accent: "#0f2744", subtext: "#6b7280" },
  { bg: "#ffffff", text: "#0f2744", accent: "#0f2744", subtext: "#6b7280" },
];

export const StatCell = ({
  title,
  count,
  paragraph,
  icon,
  trend,
  trendValue,
  index = 0,
}) => {
  const style = CELL_ACCENTS[index] || CELL_ACCENTS[1];
  const isUp = trend === "up";
  const isDown = trend === "down";

  return (
    <div
      className="flex flex-col justify-between p-4"
      style={{ background: style.bg, minHeight: "110px" }}>
      {/* Top row: title + icon */}
      <div className="flex items-start justify-between gap-2">
        <p
          className="text-xs font-bold uppercase tracking-wide leading-tight"
          style={{ color: style.accent }}>
          {title}
        </p>
        {icon && (
          <span className="text-base flex-shrink-0" style={{ lineHeight: 1 }}>
            {icon}
          </span>
        )}
      </div>

      {/* Count */}
      <div>
        <div className="flex items-end gap-2">
          <span
            className="text-3xl font-bold leading-none"
            style={{ color: style.text, fontFamily: "'Georgia', serif" }}>
            {typeof count === "number" ? count.toLocaleString() : count}
          </span>

          {/* Trend badge */}
          {(isUp || isDown) && (
            <span
              className="flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded mb-0.5"
              style={{
                background: isUp
                  ? "rgba(20,83,45,0.12)"
                  : "rgba(185,28,28,0.10)",
                color: isUp ? "#14532d" : "#b91c1c",
              }}>
              {isUp ? (
                <RiArrowUpLine size={11} />
              ) : (
                <RiArrowDownLine size={11} />
              )}
              {trendValue}
            </span>
          )}
        </div>

        <p
          className="text-xs mt-1 leading-tight"
          style={{ color: style.subtext }}>
          {paragraph}
        </p>
      </div>
    </div>
  );
};
