import DashboardBox from "../../components/ui/DashboardBox";
import { useAuth } from "../../context/AuthContext";
import { capitalizeFullName } from "../../utils/string.js";
import { useGreeting } from "../../hooks/useGreeting.js";
import {
  RiFileChartLine,
  RiMoneyRupeeCircleLine,
  RiGroupLine,
  RiBuilding2Line,
} from "react-icons/ri";
import { MdOutlineAccountBalance, MdOutlineAssignment } from "react-icons/md";
import { FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const DashBoard = () => {
  const greetings = useGreeting();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Today's date formatted
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const personnelData = [
    {
      title: "Cashier",
      count: 99,
      paragraph: "Active this month",
      icon: "💼",
      trend: "up",
      trendValue: "+3",
    },
    {
      title: "DDO",
      count: 12,
      paragraph: "Active this month",
      icon: "📂",
      trend: "down",
      trendValue: "-1",
    },
    {
      title: "Department",
      count: 45,
      paragraph: "Registered depts.",
      icon: "🏛️",
      trend: "up",
      trendValue: "+2",
    },
    {
      title: "Division",
      count: 1200,
      paragraph: "Total divisions",
      icon: "📊",
      trend: "up",
      trendValue: "+15",
    },
  ];

  const financialData = [
    {
      title: "Total Receipts",
      count: "₹84.2L",
      paragraph: "This financial year",
      icon: "📥",
      trend: "up",
      trendValue: "+12%",
    },
    {
      title: "Total Expenditure",
      count: "₹61.5L",
      paragraph: "This financial year",
      icon: "📤",
      trend: "up",
      trendValue: "+8%",
    },
    {
      title: "Pending Vouchers",
      count: 34,
      paragraph: "Awaiting approval",
      icon: "📋",
      trend: "down",
      trendValue: "-6",
    },
    {
      title: "Cheques Issued",
      count: 218,
      paragraph: "This month",
      icon: "🏦",
      trend: "up",
      trendValue: "+22",
    },
  ];

  const recentActivities = [
    {
      action: "Cheque #CC-4521 issued",
      dept: "Council – PWD",
      time: "10:42 AM",
      type: "cheque",
    },
    {
      action: "Expenditure voucher approved",
      dept: "State – Education",
      time: "09:15 AM",
      type: "voucher",
    },
    {
      action: "New challan generated",
      dept: "Council – Health",
      time: "Yesterday",
      type: "challan",
    },
    {
      action: "Cash receipt recorded",
      dept: "State – Revenue",
      time: "Yesterday",
      type: "receipt",
    },
    {
      action: "DDO account updated",
      dept: "Council – Admin",
      time: "2 days ago",
      type: "update",
    },
  ];

  const typeColors = {
    cheque: "#1a3a5c",
    voucher: "#14532d",
    challan: "#4a1d96",
    receipt: "#92400e",
    update: "#374151",
  };

  const quickLinks = [
    {
      label: "Generate Reports",
      route: "/generate-reports",
      icon: <RiFileChartLine size={16} />,
    },
    {
      label: "New Expenditure",
      route: "/expenditures",
      icon: <RiMoneyRupeeCircleLine size={16} />,
    },
    {
      label: "Council Forms",
      route: "/track-forms/council",
      icon: <MdOutlineAssignment size={16} />,
    },
    {
      label: "State Forms",
      route: "/track-forms/state",
      icon: <MdOutlineAccountBalance size={16} />,
    },
    {
      label: "Statements",
      route: "/track-statements",
      icon: <RiBuilding2Line size={16} />,
    },
    {
      label: "Challans",
      route: "/generated-challan",
      icon: <RiGroupLine size={16} />,
    },
  ];

  return (
    <div
      className="w-full flex flex-col gap-6 pb-6"
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
        {/* Tricolor strip */}
        <div
          style={{
            height: "4px",
            background:
              "linear-gradient(90deg, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)",
          }}
        />

        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p
              className="text-xs font-bold tracking-widest uppercase mb-1"
              style={{ color: "#c9a84c" }}>
              Treasury & Accounts Department
            </p>
            <h1 className="text-xl font-bold text-white mb-1">
              {greetings}, {capitalizeFullName(user.name)}
            </h1>
            <p className="text-sm" style={{ color: "#93b8d8" }}>
              Here is an overview of today's financial activities.
            </p>
            <p
              className="text-xs mt-2"
              style={{ color: "rgba(147,184,216,0.7)" }}>
              📅 {today}
            </p>
          </div>

          {/* Emblem */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              border: "2px solid #c9a84c",
              background: "rgba(201,168,76,0.12)",
            }}>
            <svg width="38" height="38" viewBox="0 0 30 30" fill="none">
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

      {/* ── Status Strip ── */}
      <div className="flex gap-3">
        {[
          {
            label: "System Status",
            value: "Operational",
            color: "#14532d",
            dot: "#22c55e",
          },
          {
            label: "Financial Year",
            value: "2024–25",
            color: "#1a3a5c",
            dot: "#c9a84c",
          },
          {
            label: "Last Sync",
            value: "Today, 11:30 AM",
            color: "#374151",
            dot: "#93b8d8",
          },
          {
            label: "Role",
            value: user.role || "ADMIN",
            color: "#4a1d96",
            dot: "#a78bfa",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded border"
            style={{
              background: "#fff",
              borderColor: "#e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: s.dot }}
            />
            <div>
              <p className="text-xs font-bold" style={{ color: s.color }}>
                {s.value}
              </p>
              <p
                className="text-xs"
                style={{ color: "#9ca3af", fontSize: "10px" }}>
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Stat Boxes Row ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-1 h-4 rounded-full"
            style={{ background: "#c9a84c" }}
          />
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "#0f2744" }}>
            Personnel Overview
          </p>
        </div>
        <div className="flex gap-4">
          <DashboardBox
            items={personnelData}
            title="Personnel"
            subtitle="Active government staff"
          />
          <DashboardBox
            items={financialData}
            title="Financials"
            subtitle="Current financial year"
          />
        </div>
      </div>

      {/* ── Bottom Row: Activity + Quick Links ── */}
      <div className="flex gap-4">
        {/* Recent Activity */}
        <div
          className="flex-1 rounded-lg border overflow-hidden"
          style={{
            background: "#fff",
            borderColor: "#e5e7eb",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
          {/* Header */}
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
                Recent Activity
              </p>
            </div>
            <span className="text-xs" style={{ color: "#9ca3af" }}>
              Today
            </span>
          </div>

          {/* Activity list */}
          <div
            className="flex flex-col divide-y"
            style={{ borderColor: "#f3f4f6" }}>
            {recentActivities.map((act, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                {/* Type dot */}
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: typeColors[act.type] || "#374151" }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold truncate"
                    style={{ color: "#111827" }}>
                    {act.action}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#6b7280" }}>
                    {act.dept}
                  </p>
                </div>
                <span
                  className="text-xs flex-shrink-0"
                  style={{ color: "#9ca3af", fontSize: "10px" }}>
                  {act.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            background: "#fff",
            borderColor: "#e5e7eb",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            width: "240px",
            flexShrink: 0,
          }}>
          {/* Header */}
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: "#e5e7eb", background: "#0f2744" }}>
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

          {/* Links */}
          <div className="flex flex-col p-3 gap-2">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.route)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded border text-left transition-all duration-150 cursor-pointer group"
                style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f0f4f8";
                  e.currentTarget.style.borderColor = "#1a3a5c";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}>
                <div className="flex items-center gap-2.5">
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

      {/* ── Official Notice ── */}
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
          <strong>Official Notice:</strong> This dashboard displays live
          financial data for the current fiscal year. All records are classified
          as official government documents. Unauthorized access or data
          tampering is a punishable offence under the Official Secrets Act and
          applicable IT regulations.
        </p>
      </div>
    </div>
  );
};

export default DashBoard;
