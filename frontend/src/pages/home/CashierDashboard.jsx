import React, { useState, useEffect } from "react";
import { useGreeting } from "../../hooks/useGreeting";
import { useAuth } from "../../context/AuthContext";
import { capitalizeFullName } from "../../utils/string";
import { CashierDashboardCard } from "../../components/ui/CashierDashboardCard";
import { RiMoneyRupeeCircleLine, RiFileList3Line } from "react-icons/ri";
import { FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getAllChallans } from "../../api/challan.api.js";
import { useCashierExpenditures } from "../../hooks/useCashierExpenditures.js";
import { useStateChallan } from "../../hooks/useStateChallan.js";

// ─── Recent Transactions helpers ────────────────────────────────
const RECENT_TX_KEY = "cashier_recent_transactions";
const MAX_RECENT = 6;

export const pushRecentTransaction = (tx) => {
  try {
    const existing = JSON.parse(sessionStorage.getItem(RECENT_TX_KEY) || "[]");
    const updated = [tx, ...existing].slice(0, MAX_RECENT);
    sessionStorage.setItem(RECENT_TX_KEY, JSON.stringify(updated));
  } catch {}
};

export const clearRecentTransactions = () => {
  try {
    sessionStorage.removeItem(RECENT_TX_KEY);
  } catch {}
};

const loadRecentTransactions = () => {
  try {
    return JSON.parse(sessionStorage.getItem(RECENT_TX_KEY) || "[]");
  } catch {
    return [];
  }
};

// ─── Stat Card skeleton ──────────────────────────────────────────
const CardSkeleton = () => (
  <div
    className="col-span-3 rounded-lg border p-4 animate-pulse"
    style={{ background: "#fff", borderColor: "#e5e7eb" }}>
    <div className="h-3 w-24 rounded mb-3" style={{ background: "#e5e7eb" }} />
    <div className="h-7 w-16 rounded mb-2" style={{ background: "#f3f4f6" }} />
    <div className="h-2 w-20 rounded" style={{ background: "#f3f4f6" }} />
  </div>
);

// ─── Type dot colour ─────────────────────────────────────────────
const typeColor = { challan: "#1a3a5c", expenditure: "#14532d" };

const formatTime = (isoStr) => {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0)
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
};

// ────────────────────────────────────────────────────────────────
const CashierDashboard = () => {
  const greetings = useGreeting();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Council Challan ──────────────────────────────────────────
  const [councilChallanCount, setCouncilChallanCount] = useState(null);
  const [councilChallanLoading, setCouncilChallanLoading] = useState(true);

  useEffect(() => {
    const fetchCouncilChallans = async () => {
      try {
        setCouncilChallanLoading(true);

        const res = await getAllChallans({
          isActive: true,
          limit: 10000,
        });

        const data = res.data?.data || res.data || [];
        const arr = Array.isArray(data) ? data : [];

        // Client-side fallback filter
        const activeCount = arr.filter(
          (c) => c.isActive === true || c.isActive === 1,
        ).length;

        setCouncilChallanCount(activeCount);
      } catch (err) {
        console.error("Failed to fetch council challans", err);
        setCouncilChallanCount(0);
      } finally {
        setCouncilChallanLoading(false);
      }
    };
    fetchCouncilChallans();
  }, []);

  // ── State Challan ────────────────────────────────────────────
  const { challans: stateChallans, loading: stateChallanLoading } =
    useStateChallan();
  const stateChallanCount = stateChallans.length;

  // ── Expenditures ─────────────────────────────────────────────

  const { data: councilExpenditures, loading: councilExpLoading } =
    useCashierExpenditures({
      sector: "COUNCIL",
    });
  const { data: stateExpenditures, loading: stateExpLoading } =
    useCashierExpenditures({
      sector: "STATE",
    });
  const councilExpCount = councilExpenditures.length;
  const stateExpCount = stateExpenditures.length;

  // ── Recent Transactions (sessionStorage) ─────────────────────
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    setRecentTransactions(loadRecentTransactions());
  }, []);

  // Auto-populate from fetched data on first load if sessionStorage is empty
  useEffect(() => {
    const existing = loadRecentTransactions();
    if (existing.length > 0) return; // already has data

    const txs = [];

    // Pick latest 2 council challans
    // (API returns array — no date available here so we just take first 2)
    // We'll build placeholders if you don't have date fields from the list API.
    // Expenditures have voucherNo and voucherDate
    if (councilExpenditures.length > 0) {
      councilExpenditures.slice(0, 2).forEach((e) => {
        txs.push({
          label: `Council Expenditure V#${e.voucherNo || e.id}`,
          amount:
            e.netAmount != null
              ? `₹${Number(e.netAmount).toLocaleString("en-IN")}`
              : "-",
          time: e.voucherDate || new Date().toISOString(),
          type: "expenditure",
        });
      });
    }

    if (stateExpenditures.length > 0) {
      stateExpenditures.slice(0, 2).forEach((e) => {
        txs.push({
          label: `State Expenditure V#${e.voucherNo || e.id}`,
          amount:
            e.netAmount != null
              ? `₹${Number(e.netAmount).toLocaleString("en-IN")}`
              : "-",
          time: e.voucherDate || new Date().toISOString(),
          type: "expenditure",
        });
      });
    }

    if (stateChallans.length > 0) {
      stateChallans.slice(0, 2).forEach((c) => {
        txs.push({
          label: `State Challan #${c.challanNo || c.id}`,
          amount:
            c.totalAmount != null
              ? `₹${Number(c.totalAmount).toLocaleString("en-IN")}`
              : "-",
          time: c.challanDate || new Date().toISOString(),
          type: "challan",
        });
      });
    }

    if (txs.length > 0) {
      const sorted = txs
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, MAX_RECENT);
      sessionStorage.setItem(RECENT_TX_KEY, JSON.stringify(sorted));
      setRecentTransactions(sorted);
    }
  }, [councilExpenditures, stateExpenditures, stateChallans]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const allLoading =
    councilChallanLoading ||
    stateChallanLoading ||
    councilExpLoading ||
    stateExpLoading;

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

      {/* ── Section Label ── */}
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
        {allLoading && (
          <span className="text-xs ml-2" style={{ color: "#9ca3af" }}>
            Loading…
          </span>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-12 gap-4">
        {councilChallanLoading ? (
          <CardSkeleton />
        ) : (
          <CashierDashboardCard
            accent={true}
            title="Council's Challan"
            count={String(councilChallanCount ?? 0)}
            paragraph="total active challans"
            difference={councilChallanCount - 0}
          />
        )}
        {councilExpLoading ? (
          <CardSkeleton />
        ) : (
          <CashierDashboardCard
            title="Council's Expenditure"
            count={String(councilExpCount)}
            paragraph="total expenditures"
            difference={councilExpCount - 0}
          />
        )}
        {stateChallanLoading ? (
          <CardSkeleton />
        ) : (
          <CashierDashboardCard
            title="State's Challan"
            count={String(stateChallanCount)}
            paragraph="total state challans"
            difference={stateChallanCount - 0}
          />
        )}
        {stateExpLoading ? (
          <CardSkeleton />
        ) : (
          <CashierDashboardCard
            title="State's Expenditure"
            count={String(stateExpCount)}
            paragraph="total expenditures"
            difference={stateExpCount - 0}
          />
        )}
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
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "#9ca3af" }}>
                This session
              </span>
              {recentTransactions.length > 0 && (
                <button
                  onClick={() => {
                    clearRecentTransactions();
                    setRecentTransactions([]);
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

          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <RiMoneyRupeeCircleLine size={28} style={{ color: "#d1d5db" }} />
              <p className="text-xs font-semibold" style={{ color: "#9ca3af" }}>
                No transactions this session
              </p>
              <p className="text-xs" style={{ color: "#d1d5db" }}>
                Transactions appear here as you create challans and expenditures
              </p>
            </div>
          ) : (
            <div
              className="flex flex-col divide-y"
              style={{ borderColor: "#f3f4f6" }}>
              {recentTransactions.map((t, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: typeColor[t.type] || "#6b7280" }}
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
                      {formatTime(t.time)}
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
          )}
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
