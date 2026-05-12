import { useState, useEffect, useRef } from "react";
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
import {
  getFinancialYear,
  formatLastSync,
} from "../../utils/adminFrontendData.js";
import { usePersonnelStats } from "../../hooks/usePersonnelStats.js";
import { getAdminExpenditures } from "../../api/expenditure.api.js";
import { getAllChallans } from "../../api/challan.api.js";
import { useStateChallan } from "../../hooks/useStateChallan.js";

// ─── sessionStorage helpers (same pattern as CashierDashboard) ──
const RECENT_KEY = "admin_recent_activities";
const MAX_RECENT = 6;

export const pushAdminActivity = (activity) => {
  try {
    const existing = JSON.parse(sessionStorage.getItem(RECENT_KEY) || "[]");
    const updated = [activity, ...existing].slice(0, MAX_RECENT);
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
};

export const clearAdminActivities = () => {
  try {
    sessionStorage.removeItem(RECENT_KEY);
  } catch {}
};

const loadActivities = () => {
  try {
    return JSON.parse(sessionStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
};

const formatTime = (isoStr) => {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0)
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  } catch {
    return "";
  }
};

// ─── Skeleton components ─────────────────────────────────────────
const SkeletonBox = () => (
  <div
    className="flex-1 rounded-lg border p-4 animate-pulse"
    style={{ background: "#fff", borderColor: "#e5e7eb" }}>
    <div className="h-3 w-24 rounded mb-4" style={{ background: "#e5e7eb" }} />
    <div className="flex gap-3">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded border p-3"
          style={{ borderColor: "#f3f4f6" }}>
          <div
            className="h-2 w-16 rounded mb-2"
            style={{ background: "#f3f4f6" }}
          />
          <div
            className="h-6 w-10 rounded mb-1"
            style={{ background: "#e5e7eb" }}
          />
          <div className="h-2 w-14 rounded" style={{ background: "#f3f4f6" }} />
        </div>
      ))}
    </div>
  </div>
);

const ActivitySkeleton = () => (
  <div
    className="flex flex-col divide-y animate-pulse"
    style={{ borderColor: "#f3f4f6" }}>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: "#e5e7eb" }}
        />
        <div className="flex-1">
          <div
            className="h-2.5 rounded w-40 mb-1.5"
            style={{ background: "#e5e7eb" }}
          />
          <div className="h-2 rounded w-28" style={{ background: "#f3f4f6" }} />
        </div>
        <div className="h-2 w-12 rounded" style={{ background: "#f3f4f6" }} />
      </div>
    ))}
  </div>
);

// ─── Type colours ─────────────────────────────────────────────────
const typeColors = {
  cheque: "#1a3a5c",
  voucher: "#14532d",
  challan: "#4a1d96",
  receipt: "#92400e",
  expenditure: "#14532d",
  update: "#374151",
};

// ─────────────────────────────────────────────────────────────────
const DashBoard = () => {
  const greetings = useGreeting();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const { stats, loading: personnelLoading } = usePersonnelStats();

  // ── Financial data state ────────────────────────────────────────
  const [financialLoading, setFinancialLoading] = useState(true);
  const [financialStats, setFinancialStats] = useState({
    totalReceiptsCount: 0,
    totalReceiptsAmount: 0,
    totalExpenditureCount: 0,
    totalExpenditureAmount: 0,
  });

  // ── Recent Activities ───────────────────────────────────────────
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // ── State challan via existing hook ────────────────────────────
  const { challans: stateChallans, loading: stateChallanLoading } =
    useStateChallan();

  useEffect(() => {
    setLastSyncedAt(new Date());
  }, []);

  // ── Fetch expenditures + receipts (challans) for financial stats ─
  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        setFinancialLoading(true);

        const [expenditureRes, councilChallanRes] = await Promise.all([
          getAdminExpenditures({}),
          getAllChallans({ isActive: true, limit: 10000 }),
        ]);

        const expenditures =
          expenditureRes.data?.data || expenditureRes.data || [];
        const councilChallans =
          councilChallanRes.data?.data || councilChallanRes.data || [];
        const expArr = Array.isArray(expenditures) ? expenditures : [];
        const challanArr = Array.isArray(councilChallans)
          ? councilChallans.filter(
              (c) => c.isActive === true || c.isActive === 1,
            )
          : [];

        // Combine council challan + state challans for total receipts
        // stateChallans comes from the hook — computed after it's loaded
        const totalReceiptsCount = challanArr.length; // updated below after stateChallans load
        const totalReceiptsAmount = challanArr.reduce(
          (sum, c) => sum + (Number(c.amount) || Number(c.totalAmount) || 0),
          0,
        );
        const totalExpenditureCount = expArr.length;
        const totalExpenditureAmount = expArr.reduce(
          (sum, e) => sum + (Number(e.netAmount) || 0),
          0,
        );

        setFinancialStats((prev) => ({
          ...prev,
          totalReceiptsCount,
          totalReceiptsAmount,
          totalExpenditureCount,
          totalExpenditureAmount,
        }));

        // ── Seed recent activities from real data if sessionStorage empty ──
        const existing = loadActivities();
        if (existing.length === 0) {
          const acts = [];
          expArr.slice(0, 3).forEach((e) => {
            acts.push({
              action: `Expenditure Voucher #${e.voucherNo || e.id}`,
              dept: e.sector
                ? `${e.sector} — ${e.ddo?.name || "DDO"}`
                : e.ddo?.name || "DDO",
              time: e.voucherDate || new Date().toISOString(),
              type: "expenditure",
            });
          });
          challanArr.slice(0, 2).forEach((c) => {
            acts.push({
              action: `Challan #${c.challanNo || c.voucherNo || c.id}`,
              dept: `Council`,
              time: c.challanDate || c.date || new Date().toISOString(),
              type: "challan",
            });
          });
          const sorted = acts
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, MAX_RECENT);
          sessionStorage.setItem(RECENT_KEY, JSON.stringify(sorted));
          setRecentActivities(sorted);
        } else {
          setRecentActivities(existing);
        }
      } catch (err) {
        console.error("Failed to fetch financial stats", err);
      } finally {
        setFinancialLoading(false);
        setActivitiesLoading(false);
      }
    };

    fetchFinancials();
  }, []);

  // ── Add state challan count to receipts after hook loads ────────
  useEffect(() => {
    if (stateChallanLoading) return;
    const stateCount = stateChallans.length;
    const stateAmount = stateChallans.reduce(
      (sum, c) => sum + (Number(c.totalAmount) || 0),
      0,
    );
    setFinancialStats((prev) => ({
      ...prev,
      totalReceiptsCount: prev.totalReceiptsCount + stateCount,
      totalReceiptsAmount: prev.totalReceiptsAmount + stateAmount,
    }));

    // Seed state challan activities if session is empty
    const existing = loadActivities();
    if (existing.length === 0 && stateChallans.length > 0) {
      const acts = stateChallans.slice(0, 2).map((c) => ({
        action: `State Challan #${c.challanNo || c.id}`,
        dept: "State",
        time: c.challanDate || new Date().toISOString(),
        type: "challan",
      }));
      sessionStorage.setItem(RECENT_KEY, JSON.stringify(acts));
      setRecentActivities((prev) => [...acts, ...prev].slice(0, MAX_RECENT));
    }
  }, [stateChallans, stateChallanLoading]);

  const formatAmount = (amount) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toFixed(0)}`;
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const personnelData = [
    {
      title: "Cashier",
      count: personnelLoading ? "..." : stats.cashier,
      paragraph: "Active this month",
      icon: "💼",
      trend: "up",
      trendValue: "+3",
    },
    {
      title: "DDO",
      count: personnelLoading ? "..." : stats.ddo,
      paragraph: "Active this month",
      icon: "📂",
      trend: "down",
      trendValue: "-1",
    },
    {
      title: "Department",
      count: personnelLoading ? "..." : stats.department,
      paragraph: "Registered depts.",
      icon: "🏛️",
      trend: "up",
      trendValue: "+2",
    },
    {
      title: "Division",
      count: personnelLoading ? "..." : stats.division,
      paragraph: "Total divisions",
      icon: "📊",
      trend: "up",
      trendValue: "+15",
    },
  ];

  // ✅ Real financial data — removed Cheques Issued and Pending Vouchers
  const financialData = [
    {
      title: "Total Receipts",
      count: financialLoading
        ? "..."
        : String(financialStats.totalReceiptsCount),
      paragraph: "All challans (count)",
      icon: "📥",
      trend: "up",
      trendValue: "",
    },
    {
      title: "Receipts Amount",
      count: financialLoading
        ? "..."
        : formatAmount(financialStats.totalReceiptsAmount),
      paragraph: "Total amount received",
      icon: "💰",
      trend: "up",
      trendValue: "",
    },
    {
      title: "Total Expenditure",
      count: financialLoading
        ? "..."
        : String(financialStats.totalExpenditureCount),
      paragraph: "All vouchers (count)",
      icon: "📤",
      trend: "up",
      trendValue: "",
    },
    {
      title: "Expenditure Amount",
      count: financialLoading
        ? "..."
        : formatAmount(financialStats.totalExpenditureAmount),
      paragraph: "Total amount spent",
      icon: "📊",
      trend: "up",
      trendValue: "",
    },
  ];

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
            value: getFinancialYear(),
            color: "#1a3a5c",
            dot: "#c9a84c",
          },
          {
            label: "Last Sync",
            value: formatLastSync(lastSyncedAt),
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
        {/* ✅ Skeleton while loading */}
        {personnelLoading || financialLoading ? (
          <div className="flex gap-4">
            <SkeletonBox />
            <SkeletonBox />
          </div>
        ) : (
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
        )}
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
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "#9ca3af" }}>
                This session
              </span>
              {recentActivities.length > 0 && (
                <button
                  onClick={() => {
                    clearAdminActivities();
                    setRecentActivities([]);
                  }}
                  className="text-xs px-2 py-0.5 rounded transition-colors"
                  style={{
                    color: "#9ca3af",
                    background: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#991b1b";
                    e.currentTarget.style.borderColor = "rgba(153,27,27,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#9ca3af";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* ✅ Skeleton while loading */}
          {activitiesLoading ? (
            <ActivitySkeleton />
          ) : recentActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <RiFileChartLine size={28} style={{ color: "#d1d5db" }} />
              <p className="text-xs font-semibold" style={{ color: "#9ca3af" }}>
                No recent activity this session
              </p>
              <p
                className="text-xs text-center px-6"
                style={{ color: "#d1d5db" }}>
                Activities appear here as transactions are created
              </p>
            </div>
          ) : (
            <div
              className="flex flex-col divide-y"
              style={{ borderColor: "#f3f4f6" }}>
              {recentActivities.map((act, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
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
                    <p
                      className="text-xs truncate"
                      style={{ color: "#6b7280" }}>
                      {act.dept}
                    </p>
                  </div>
                  <span
                    className="text-xs flex-shrink-0"
                    style={{ color: "#9ca3af", fontSize: "10px" }}>
                    {formatTime(act.time)}
                  </span>
                </div>
              ))}
            </div>
          )}
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
          <div className="flex flex-col p-3 gap-2">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.route)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded border text-left transition-all duration-150 cursor-pointer"
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
