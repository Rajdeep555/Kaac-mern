import React from "react";
import { VscFile } from "react-icons/vsc";
import { VscArrowRight } from "react-icons/vsc";
import { Outlet, useNavigate } from "react-router-dom";

const REPORTS = [
  {
    label: "Council Report",
    subtitle: "Local Self-Government",
    route: "/track-forms/council",
    badge: "C",
    badgeColor: "#1a3a5c",
  },
  {
    label: "State Report",
    subtitle: "State Government Dept.",
    route: "/track-forms/state",
    badge: "S",
    badgeColor: "#14532d",
  },
  {
    label: "Consolidated Report",
    subtitle: "Council & State Combined",
    route: "/track-forms/consolidated",
    badge: "CS",
    badgeColor: "#4a1d96",
  },
];

const STATEMENTS = [
  {
    label: "Council Statements",
    subtitle: "Local Self-Government",
    route: "/track-statements",
    badge: "C",
    badgeColor: "#1a3a5c",
  },
  {
    label: "State Statements",
    subtitle: "State Government Dept.",
    route: "/track-statements",
    badge: "S",
    badgeColor: "#14532d",
  },
  {
    label: "Consolidated Statements",
    subtitle: "Council & State Combined",
    route: "/track-statements",
    badge: "CS",
    badgeColor: "#4a1d96",
  },
];

const NavCard = ({ item, onClick }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "14px 18px",
        borderRadius: "6px",
        cursor: "pointer",
        border: hovered ? "1.5px solid #1a3a5c" : "1.5px solid #d1d5db",
        background: hovered ? "#f0f4f8" : "#f9fafb",
        transition: "all 0.18s ease",
        boxShadow: hovered
          ? "0 4px 12px rgba(15,39,68,0.12)"
          : "0 1px 3px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        minWidth: "210px",
        flex: "1",
      }}>
      {/* Sector Badge */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "4px",
          background: item.badgeColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: "700",
          color: "#c9a84c",
          letterSpacing: "0.5px",
          flexShrink: 0,
        }}>
        {item.badge}
      </div>

      {/* Labels */}
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            fontWeight: "700",
            color: "#0f2744",
            fontFamily: "'Georgia', serif",
          }}>
          {item.label}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#6b7280" }}>
          {item.subtitle}
        </p>
      </div>

      {/* Arrow */}
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: hovered ? "#0f2744" : "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.18s ease",
          flexShrink: 0,
        }}>
        <VscArrowRight
          style={{ color: hovered ? "#c9a84c" : "#6b7280", fontSize: "13px" }}
        />
      </div>
    </div>
  );
};

const SectionCard = ({ title, subtitle, icon, children }) => (
  <div
    style={{
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
    {/* Section Header */}
    <div
      style={{
        background: "#0f2744",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "4px",
          background: "rgba(201,168,76,0.2)",
          border: "1px solid #c9a84c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        {icon}
      </div>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            fontWeight: "700",
            color: "#ffffff",
          }}>
          {title}
        </p>
        <p style={{ margin: 0, fontSize: "10px", color: "#93b8d8" }}>
          {subtitle}
        </p>
      </div>
    </div>

    {/* Cards Grid */}
    <div
      style={{
        padding: "18px 20px",
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
      }}>
      {children}
    </div>
  </div>
);

const GenerateReports = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
        fontFamily: "'Georgia', serif",
      }}>
      {/* ── Top Government Header Bar ── */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #0f2744 0%, #1a3a5c 60%, #1e4976 100%)",
          borderBottom: "4px solid #c9a84c",
        }}>
        {/* Tricolor stripe */}
        <div
          style={{
            height: "5px",
            background:
              "linear-gradient(90deg, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)",
          }}
        />

        <div
          style={{
            padding: "16px 32px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Emblem */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                border: "2px solid #c9a84c",
                background: "rgba(201,168,76,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
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

            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "10px",
                  color: "#c9a84c",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                }}>
                Government of India ( KAAC )
              </p>
              <h1
                style={{
                  margin: "2px 0 0",
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#ffffff",
                  letterSpacing: "0.5px",
                }}>
                Financial Management System
              </h1>
              <p
                style={{
                  margin: "1px 0 0",
                  fontSize: "11px",
                  color: "#93b8d8",
                }}>
                Treasury & Accounts Department
              </p>
            </div>
          </div>

          {/* Module badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(201,168,76,0.4)",
              borderRadius: "6px",
              padding: "10px 18px",
            }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "4px",
                background: "#1a3a5c",
                border: "1px solid rgba(201,168,76,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <VscFile style={{ color: "#c9a84c", fontSize: "18px" }} />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#ffffff",
                }}>
                Reports & Statements
              </p>
              <p
                style={{
                  margin: "1px 0 0",
                  fontSize: "10px",
                  color: "#93b8d8",
                }}>
                Generate Official Documents
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-header Breadcrumb ── */}
      <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #d1d5db",
          padding: "10px 32px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          color: "#6b7280",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
        <span>Home</span>
        <span style={{ color: "#9ca3af" }}>›</span>
        <span style={{ color: "#1a3a5c", fontWeight: "600" }}>
          Generate Reports
        </span>
      </div>

      {/* ── Main Content ── */}
      <div
        style={{
          padding: "28px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}>
        {/* ── Page Title ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "4px",
              height: "28px",
              background: "#c9a84c",
              borderRadius: "2px",
            }}
          />
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: "700",
                color: "#0f2744",
              }}>
              Generate Official Reports
            </h2>
            <p
              style={{ margin: "2px 0 0", fontSize: "12px", color: "#6b7280" }}>
              Select a category to generate and view the corresponding official
              register
            </p>
          </div>
        </div>

        {/* ── Summary Tiles ── */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {[
            { num: "3", label: "Report Types", color: "#1a3a5c" },
            { num: "2", label: "Statement Types", color: "#14532d" },
            { num: "19", label: "Total Form Registers", color: "#92400e" },
            { num: "7", label: "Statement Registers", color: "#4a1d96" },
          ].map((tile) => (
            <div
              key={tile.label}
              style={{
                flex: "1",
                minWidth: "140px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderTop: `3px solid ${tile.color}`,
                borderRadius: "6px",
                padding: "14px 18px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "26px",
                  fontWeight: "700",
                  color: tile.color,
                  fontFamily: "'Georgia', serif",
                }}>
                {tile.num}
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "11px",
                  color: "#6b7280",
                  fontWeight: "600",
                }}>
                {tile.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Forms / Reports Section ── */}
        <SectionCard
          title="Forms & Reports"
          subtitle="Official financial form registers by sector"
          icon={
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect
                x="1"
                y="1"
                width="12"
                height="12"
                rx="1"
                stroke="#c9a84c"
                strokeWidth="1.2"
              />
              <line
                x1="3"
                y1="4"
                x2="11"
                y2="4"
                stroke="#c9a84c"
                strokeWidth="1"
              />
              <line
                x1="3"
                y1="7"
                x2="11"
                y2="7"
                stroke="#c9a84c"
                strokeWidth="1"
              />
              <line
                x1="3"
                y1="10"
                x2="8"
                y2="10"
                stroke="#c9a84c"
                strokeWidth="1"
              />
            </svg>
          }>
          {REPORTS.map((item) => (
            <NavCard
              key={item.label}
              item={item}
              onClick={() => navigate(item.route)}
            />
          ))}
        </SectionCard>

        {/* ── Statements Section ── */}
        <SectionCard
          title="Financial Statements"
          subtitle="Official financial statement registers by sector"
          icon={
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect
                x="1"
                y="2"
                width="12"
                height="10"
                rx="1"
                stroke="#c9a84c"
                strokeWidth="1.2"
              />
              <line
                x1="4"
                y1="5"
                x2="10"
                y2="5"
                stroke="#c9a84c"
                strokeWidth="1"
              />
              <line
                x1="4"
                y1="7.5"
                x2="10"
                y2="7.5"
                stroke="#c9a84c"
                strokeWidth="1"
              />
              <line
                x1="4"
                y1="10"
                x2="7"
                y2="10"
                stroke="#c9a84c"
                strokeWidth="1"
              />
            </svg>
          }>
          {STATEMENTS.map((item) => (
            <NavCard
              key={item.label}
              item={item}
              onClick={() => navigate(item.route)}
            />
          ))}
        </SectionCard>

        {/* ── Notice ── */}
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderLeft: "4px solid #c9a84c",
            borderRadius: "6px",
            padding: "12px 18px",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
          }}>
          <svg
            width="16"
            height="16"
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
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              color: "#92400e",
              lineHeight: "1.6",
            }}>
            <strong>Official Notice:</strong> All generated reports and
            statements are classified as official government documents.
            Unauthorized reproduction, distribution, or modification is strictly
            prohibited under the Official Secrets Act.
          </p>
        </div>
      </div>

      {/* ── Outlet ── */}
      <div style={{ padding: "0 32px 32px" }}>
        <Outlet />
      </div>

      {/* ── Bottom Footer ── */}
      <div
        style={{
          background: "#0f2744",
          borderTop: "3px solid #c9a84c",
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
        <p style={{ margin: 0, fontSize: "11px", color: "#93b8d8" }}>
          © KAAC Financial Management System. All rights reserved.
        </p>
        <p style={{ margin: 0, fontSize: "11px", color: "#93b8d8" }}>
          Official Use Only — Confidential
        </p>
      </div>
    </div>
  );
};

export default GenerateReports;
