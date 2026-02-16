import React, { useState } from "react";
import { useGreeting } from "../../hooks/useGreeting";
import { useAuth } from "../../context/AuthContext";
import { capitalizeFullName } from "../../utils/string";
import { CashierDashboardCard } from "../../components/ui/CashierDashboardCard";
import FilterOptionButton from "../../components/ui/FilterOptionButton";
import DateRangePill from "../../components/ui/DateRangePill";
import { RiMoneyRupeeCircleLine, RiFileList3Line } from "react-icons/ri";
import { FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const CashierDashboard = () => {
  const greetings = useGreeting();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filter, setFilter] = useState("Day");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const handleFilterClick = (item) => {
    setFilter(item);
    setDateRange({ from: "", to: "" });
  };

  const handleDateChange = (range) => {
    setDateRange(range);
    if (range.from && range.to) setFilter(null);
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const recentTransactions = [
    {
      label: "Council Challan #CH-2241",
      amount: "₹14,500",
      time: "10:32 AM",
      type: "challan",
    },
    {
      label: "State Expenditure V#SE-991",
      amount: "₹8,200",
      time: "09:55 AM",
      type: "expenditure",
    },
    {
      label: "Council Expenditure V#CE-114",
      amount: "₹3,750",
      time: "Yesterday",
      type: "expenditure",
    },
    {
      label: "State Challan #SC-882",
      amount: "₹22,000",
      time: "Yesterday",
      type: "challan",
    },
  ];

  const typeColor = { challan: "#1a3a5c", expenditure: "#14532d" };

  return (
    <div
      className="w-full flex flex-col gap-5 pb-8"
      style={{ fontFamily: "'Georgia', serif" }}>
      {/* ── Welcome Banner ── */}
      <div
        className="w-full rounded-lg overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0f2744 0%, #1a3a5c 60%, #1e4976 100%)",
          border: "1px solid #1a3a5c",
          boxShadow: "0 2px 8px rgba(15,39,68,0.2)",
        }}>
        <div
          style={{
            height: "4px",
            background:
              "linear-gradient(90deg, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)",
          }}
        />
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p
              className="text-xs font-bold tracking-widest uppercase mb-1"
              style={{ color: "#c9a84c" }}>
              Cashier Portal — Treasury & Accounts
            </p>
            <h1 className="text-lg font-bold text-white mb-1">
              {greetings}, {capitalizeFullName(user.name)}
            </h1>
            <p className="text-sm" style={{ color: "#93b8d8" }}>
              Here is an overview of today's cashier activities.
            </p>
            <p
              className="text-xs mt-1.5"
              style={{ color: "rgba(147,184,216,0.7)" }}>
              📅 {today}
            </p>
          </div>
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              border: "2px solid #c9a84c",
              background: "rgba(201,168,76,0.12)",
            }}>
            <svg width="32" height="32" viewBox="0 0 30 30" fill="none">
              <circle
                cx="15"
                cy="15"
                r="12"
                stroke="#c9a84c"
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="15" cy="15" r="3" fill="#c9a84c" />
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
                (deg, i) => (
                  <line
                    key={i}
                    x1="15"
                    y1="15"
                    x2={15 + 9 * Math.cos(((deg - 90) * Math.PI) / 180)}
                    y2={15 + 9 * Math.sin(((deg - 90) * Math.PI) / 180)}
                    stroke="#c9a84c"
                    strokeWidth="1"
                  />
                ),
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-4 rounded-full"
            style={{ background: "#c9a84c" }}
          />
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "#0f2744" }}>
            Activity Summary
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["Day", "Week", "Month", "Year"].map((item) => (
            <FilterOptionButton
              key={item}
              title={item}
              selected={filter === item}
              onClick={() => handleFilterClick(item)}
            />
          ))}
          <DateRangePill
            value={dateRange}
            onChange={handleDateChange}
            active={!filter && dateRange.from && dateRange.to}
          />
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-12 gap-4">
        <CashierDashboardCard
          accent={true}
          title="Council's Challan"
          count="100"
          paragraph="from yesterday"
          difference={10 - 100}
        />
        <CashierDashboardCard
          title="Council's Expenditure"
          count="20"
          paragraph="from yesterday"
          difference={100 - 39}
        />
        <CashierDashboardCard
          title="State's Challan"
          count="12"
          paragraph="from yesterday"
          difference={200 - 39}
        />
        <CashierDashboardCard
          title="State's Expenditure"
          count="66"
          paragraph="from yesterday"
          difference={1 - 39}
        />
      </div>

      {/* ── Bottom Row ── */}
      <div className="flex gap-4">
        {/* Recent Transactions */}
        <div
          className="flex-1 rounded-lg border overflow-hidden"
          style={{
            background: "#fff",
            borderColor: "#e5e7eb",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}>
            <div className="flex items-center gap-2">
              <div
                className="w-1 h-4 rounded-full"
                style={{ background: "#c9a84c" }}
              />
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "#0f2744" }}>
                Recent Transactions
              </p>
            </div>
            <span className="text-xs" style={{ color: "#9ca3af" }}>
              Today
            </span>
          </div>
          <div
            className="flex flex-col divide-y"
            style={{ borderColor: "#f3f4f6" }}>
            {recentTransactions.map((t, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: typeColor[t.type] }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold truncate"
                    style={{ color: "#111827" }}>
                    {t.label}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "#9ca3af", fontSize: "10px" }}>
                    {t.time}
                  </p>
                </div>
                <span
                  className="text-xs font-bold flex-shrink-0"
                  style={{ color: "#0f2744" }}>
                  {t.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div
          className="rounded-lg border overflow-hidden flex-shrink-0"
          style={{
            background: "#fff",
            borderColor: "#e5e7eb",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            width: "220px",
          }}>
          <div className="px-4 py-3 border-b" style={{ background: "#0f2744" }}>
            <div className="flex items-center gap-2">
              <div
                className="w-1 h-4 rounded-full"
                style={{ background: "#c9a84c" }}
              />
              <p className="text-xs font-bold uppercase tracking-wider text-white">
                Quick Access
              </p>
            </div>
          </div>
          <div className="flex flex-col p-3 gap-2">
            {[
              {
                label: "New Challan",
                route: "/challan",
                icon: <RiFileList3Line size={15} />,
              },
              {
                label: "State Challan",
                route: "/state-challan",
                icon: <RiFileList3Line size={15} />,
              },
              {
                label: "New Expenditure",
                route: "/expenditures",
                icon: <RiMoneyRupeeCircleLine size={15} />,
              },
              {
                label: "Cash Receipt",
                route: "/cash-receipt",
                icon: <RiMoneyRupeeCircleLine size={15} />,
              },
            ].map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.route)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded border text-left cursor-pointer"
                style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f0f4f8";
                  e.currentTarget.style.borderColor = "#1a3a5c";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: "#1a3a5c" }}>{link.icon}</span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#0f2744" }}>
                    {link.label}
                  </span>
                </div>
                <FiArrowRight size={12} style={{ color: "#c9a84c" }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Notice ── */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded border"
        style={{
          background: "#fffbeb",
          borderColor: "#fde68a",
          borderLeft: "4px solid #c9a84c",
        }}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          style={{ marginTop: "1px", flexShrink: 0 }}>
          <circle cx="8" cy="8" r="7" stroke="#c9a84c" strokeWidth="1.4" />
          <line
            x1="8"
            y1="5"
            x2="8"
            y2="8.5"
            stroke="#c9a84c"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="11" r="0.8" fill="#c9a84c" />
        </svg>
        <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
          <strong>Official Notice:</strong> All cashier transactions are subject
          to daily reconciliation and audit review. Discrepancies must be
          reported to the senior accountant by end of business day.
        </p>
      </div>
    </div>
  );
};

export default CashierDashboard;
