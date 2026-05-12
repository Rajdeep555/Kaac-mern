import React, { useState, useMemo, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import Statement1 from "../../components/Statements/Statement1";
import Statement2 from "../../components/Statements/Statement2";
import Statement3 from "../../components/Statements/Statement3";
import Statement4 from "../../components/Statements/Statement4";
import Statement5 from "../../components/Statements/Statement5";
import Statement6 from "../../components/Statements/Statement6";
import Statement7 from "../../components/Statements/Statement7";
import SearchFunction from "../SearchFunction";

const SECTOR_LABELS = {
  council: "COUNCIL",
  state: "STATE",
  consolidated: "CONSOLIDATED",
};

const STATEMENT_LABELS = {
  1: "Opening Balance",
  2: "Receipts Summary",
  3: "Expenditure Summary",
  4: "Bank Reconciliation",
  5: "Fund Position",
  6: "Scheme-wise Statement",
  7: "Closing Balance",
};

const TrackStatements = () => {
  const { sector } = useParams();
  const [activeStep, setActiveStep] = useState("1");
  const [selectedFY, setSelectedFY] = useState(null); // ✅ FY filter state

  // ✅ Ref for targeted print
  const statementAreaRef = useRef(null);

  const sectorType = sector
    ? SECTOR_LABELS[sector.toLowerCase()] || null
    : null;

  const array = ["1", "2", "3", "4", "5", "6", "7"];

  // ✅ Handle FY filter
  const handleFilter = useCallback((fy) => {
    setSelectedFY(fy);
  }, []);

  // ✅ Print only the statement content div
  const handlePrint = useCallback(() => {
    if (!statementAreaRef.current) return;
    const content = statementAreaRef.current.innerHTML;
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Statement ${activeStep} — ${STATEMENT_LABELS[activeStep] || ""} ${sectorType ? `(${sectorType})` : ""}</title>
          <style>
            body { font-family: 'Georgia', serif; margin: 24px; color: #111; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 6px 10px; font-size: 12px; }
            th { background: #f3f4f6; font-weight: 700; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }, [activeStep, sectorType]);

  // ✅ Download statement metadata as CSV
  const handleDownload = useCallback(
    (fy) => {
      const rows = [
        ["Statement No", "Statement Name", "Sector", "Financial Year"],
        [
          activeStep,
          STATEMENT_LABELS[activeStep] || "",
          sectorType || "All",
          fy || "Current",
        ],
      ];
      const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Statement_${activeStep}_${sectorType || "ALL"}_${fy || "current"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [activeStep, sectorType],
  );

  const stepComponents = useMemo(
    () => ({
      1: <Statement1 sector={sectorType} financialYear={selectedFY} />,
      2: <Statement2 sector={sectorType} financialYear={selectedFY} />,
      3: <Statement3 sector={sectorType} financialYear={selectedFY} />,
      4: <Statement4 sector={sectorType} financialYear={selectedFY} />,
      5: <Statement5 sector={sectorType} financialYear={selectedFY} />,
      6: <Statement6 sector={sectorType} financialYear={selectedFY} />,
      7: <Statement7 sector={sectorType} financialYear={selectedFY} />,
    }),
    [sectorType, selectedFY], // ✅ re-renders when FY changes
  );

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
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect
                  x="3"
                  y="2"
                  width="14"
                  height="16"
                  rx="1.5"
                  stroke="#c9a84c"
                  strokeWidth="1.4"
                />
                <line
                  x1="6"
                  y1="7"
                  x2="14"
                  y2="7"
                  stroke="#c9a84c"
                  strokeWidth="1.2"
                />
                <line
                  x1="6"
                  y1="10"
                  x2="14"
                  y2="10"
                  stroke="#c9a84c"
                  strokeWidth="1.2"
                />
                <line
                  x1="6"
                  y1="13"
                  x2="10"
                  y2="13"
                  stroke="#c9a84c"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#ffffff",
                }}>
                Statements Module
              </p>
              <p
                style={{
                  margin: "1px 0 0",
                  fontSize: "10px",
                  color: "#c9a84c",
                  fontWeight: "600",
                }}>
                {sectorType ?? "All Sectors"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-header ── */}
      <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #d1d5db",
          padding: "10px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            color: "#6b7280",
          }}>
          <span>Home</span>
          <span style={{ color: "#9ca3af" }}>›</span>
          <span style={{ color: "#1a3a5c", fontWeight: "600" }}>
            Statements
          </span>
          {sectorType && (
            <>
              <span style={{ color: "#9ca3af" }}>›</span>
              <span style={{ color: "#c9a84c", fontWeight: "600" }}>
                {sectorType}
              </span>
            </>
          )}
        </div>
        {/* ✅ SearchFunction wired */}
        <div style={{ flex: 1, maxWidth: "520px", marginLeft: "32px" }}>
          <SearchFunction
            onFilter={handleFilter}
            onDownload={handleDownload}
            onPrint={handlePrint}
          />
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ padding: "28px 32px" }}>
        <div style={{ marginBottom: "24px" }}>
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
                Official Financial Statements
              </h2>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "12px",
                  color: "#6b7280",
                }}>
                Select a statement number below to view the corresponding
                register
                {selectedFY && (
                  <span
                    style={{
                      marginLeft: "8px",
                      color: "#14532d",
                      fontWeight: "600",
                    }}>
                    — FY {selectedFY}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ── Active Statement Info Banner ── */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderLeft: "4px solid #1a3a5c",
            borderRadius: "6px",
            padding: "14px 20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                background: "#0f2744",
                color: "#c9a84c",
                fontWeight: "700",
                fontSize: "13px",
                padding: "6px 14px",
                borderRadius: "4px",
                letterSpacing: "0.5px",
              }}>
              STATEMENT {activeStep}
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: "600",
                  color: "#111827",
                  fontSize: "14px",
                }}>
                {STATEMENT_LABELS[activeStep] || `Statement ${activeStep}`}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "11px",
                  color: "#9ca3af",
                }}>
                Currently Viewing — {sectorType ?? "All Sectors"}
                {selectedFY ? ` — FY ${selectedFY}` : ""}
              </p>
            </div>
          </div>
          <div
            style={{ fontSize: "11px", color: "#6b7280", textAlign: "right" }}>
            <div style={{ fontWeight: "600", color: "#374151" }}>
              {array.indexOf(activeStep) + 1} of {array.length} Statements
            </div>
            <div style={{ marginTop: "2px" }}>Financial Year Register</div>
          </div>
        </div>

        {/* ── Statement Navigator ── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "20px 20px 16px",
            marginBottom: "24px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: "11px",
              fontWeight: "700",
              color: "#6b7280",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}>
            Statement Index
          </p>
          <div
            style={{
              width: "100%",
              height: "4px",
              background: "#e5e7eb",
              borderRadius: "2px",
              marginBottom: "16px",
              overflow: "hidden",
            }}>
            <div
              style={{
                height: "100%",
                width: `${((array.indexOf(activeStep) + 1) / array.length) * 100}%`,
                background: "linear-gradient(90deg, #0f2744, #1a3a5c)",
                borderRadius: "2px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {array.map((row) => {
              const isActive = activeStep === row;
              return (
                <button
                  key={row}
                  onClick={() => setActiveStep(row)}
                  title={STATEMENT_LABELS[row] || `Statement ${row}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100px",
                    padding: "12px 8px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    border: isActive
                      ? "2px solid #0f2744"
                      : "1.5px solid #d1d5db",
                    background: isActive
                      ? "linear-gradient(135deg, #0f2744 0%, #1a3a5c 100%)"
                      : "#f9fafb",
                    transition: "all 0.18s ease",
                    boxShadow: isActive
                      ? "0 3px 10px rgba(15,39,68,0.25)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "#f0f4f8";
                      e.currentTarget.style.borderColor = "#1a3a5c";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "#f9fafb";
                      e.currentTarget.style.borderColor = "#d1d5db";
                    }
                  }}>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      color: isActive ? "#c9a84c" : "#374151",
                      lineHeight: 1,
                      fontFamily: "'Georgia', serif",
                    }}>
                    {row}
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      color: isActive ? "rgba(255,255,255,0.75)" : "#9ca3af",
                      marginTop: "5px",
                      textAlign: "center",
                      lineHeight: "1.3",
                      maxWidth: "88px",
                    }}>
                    {STATEMENT_LABELS[row] || ""}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
              marginTop: "16px",
              borderTop: "1px solid #f3f4f6",
              paddingTop: "14px",
            }}>
            <button
              onClick={() => {
                const idx = array.indexOf(activeStep);
                if (idx > 0) setActiveStep(array[idx - 1]);
              }}
              disabled={array.indexOf(activeStep) === 0}
              style={{
                padding: "6px 16px",
                fontSize: "12px",
                fontWeight: "600",
                color: array.indexOf(activeStep) === 0 ? "#9ca3af" : "#1a3a5c",
                background: "transparent",
                border: "1.5px solid",
                borderColor:
                  array.indexOf(activeStep) === 0 ? "#e5e7eb" : "#1a3a5c",
                borderRadius: "4px",
                cursor:
                  array.indexOf(activeStep) === 0 ? "not-allowed" : "pointer",
              }}>
              ← Previous
            </button>
            <button
              onClick={() => {
                const idx = array.indexOf(activeStep);
                if (idx < array.length - 1) setActiveStep(array[idx + 1]);
              }}
              disabled={array.indexOf(activeStep) === array.length - 1}
              style={{
                padding: "6px 16px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#ffffff",
                background:
                  array.indexOf(activeStep) === array.length - 1
                    ? "#9ca3af"
                    : "#0f2744",
                border: "1.5px solid transparent",
                borderRadius: "4px",
                cursor:
                  array.indexOf(activeStep) === array.length - 1
                    ? "not-allowed"
                    : "pointer",
              }}>
              Next →
            </button>
          </div>
        </div>

        {/* ── Statement Display Area — ref for print ── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
          <div
            style={{
              background: "#0f2744",
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              </div>
              <span
                style={{
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "13px",
                }}>
                Statement No. {activeStep} —{" "}
                {STATEMENT_LABELS[activeStep] || "Register"}
              </span>
            </div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                color: "#c9a84c",
                background: "rgba(201,168,76,0.15)",
                border: "1px solid rgba(201,168,76,0.4)",
                padding: "3px 10px",
                borderRadius: "20px",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}>
              {sectorType ?? "All Sectors"}
            </span>
          </div>

          {/* ✅ ref attached here */}
          <div ref={statementAreaRef}>{stepComponents[activeStep]}</div>
        </div>

        {/* ── Footer Action Bar ── */}
        <div
          style={{
            marginTop: "24px",
            padding: "14px 20px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
          <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
            All records are official government documents. Unauthorized access
            is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrackStatements;
