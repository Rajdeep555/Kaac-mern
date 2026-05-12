import React, { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Form1 from "../../components/DisplayForms/Form1";
import Form2 from "../../components/DisplayForms/Form2";
import Form3 from "../../components/DisplayForms/Form3";
import Form4 from "../../components/DisplayForms/Form4";
import Form5A from "../../components/DisplayForms/Form5A";
import Form5B from "../../components/DisplayForms/Form5B";
import Form5C from "../../components/DisplayForms/Form5C";
import Form5D from "../../components/DisplayForms/Form5D";
import Form5E from "../../components/DisplayForms/Form5E";
import Form6 from "../../components/DisplayForms/Form6";
import Form7 from "../../components/DisplayForms/Form7";
import Form7A from "../../components/DisplayForms/Form7A";
import Form7B from "../../components/DisplayForms/Form7B";
import Form8 from "../../components/DisplayForms/Form8";
import Form9 from "../../components/DisplayForms/Form9";
import Form10 from "../../components/DisplayForms/Form10";
import Form11 from "../../components/DisplayForms/Form11";
import Form12 from "../../components/DisplayForms/Form12";
import SearchFunction from "../SearchFunction";
import Button from "../../components/ui/Button";

const SECTOR_LABELS = {
  council: "COUNCIL",
  state: "STATE",
  consolidated: "CONSOLIDATED",
};

const SECTOR_META = {
  COUNCIL: {
    label: "Council Sector",
    subtitle: "Local Self-Government Department",
    color: "#1a3a5c",
    badge: "C",
  },
  STATE: {
    label: "State Sector",
    subtitle: "State Government Department",
    color: "#14532d",
    badge: "S",
  },
  CONSOLIDATED: {
    label: "Consolidated",
    subtitle: "Council & State Combined",
    color: "#4a1d96",
    badge: "CS",
  },
};

const FORM_LABELS = {
  1: "Cash Book",
  2: "Ledger",
  3: "Cheque Register",
  4: "Bill Register",
  "5A": "Abstract A",
  "5B": "Abstract B",
  "5C": "Abstract C",
  "5D": "Abstract D",
  "5E": "Abstract E",
  6: "Schedule VI",
  7: "Schedule VII",
  "7A": "Schedule VIIA",
  "7B": "Schedule VIIB",
  8: "Schedule VIII",
  9: "Schedule IX",
  10: "Schedule X",
  11: "Schedule XI",
  12: "Schedule XII",
};

const TrackForms = () => {
  const { sector } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState("1");
  const [selectedFY, setSelectedFY] = useState(null); // ✅ FY filter state

  // ✅ Ref on the form display area for targeted print
  const formAreaRef = useRef(null);

  const sectorType = sector
    ? SECTOR_LABELS[sector.toLowerCase()] || null
    : null;
  const sectorMeta = sectorType ? SECTOR_META[sectorType] : null;

  const array = [
    "1",
    "3",
    "4",
    "5A",
    "5B",
    "5C",
    "5D",
    "5E",
    "6",
    "7",
    "7A",
    "7B",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];

  // ✅ Handle FY filter from SearchFunction
  const handleFilter = useCallback((fy) => {
    setSelectedFY(fy);
  }, []);

  // ✅ Print only the form content div
  const handlePrint = useCallback(() => {
    if (!formAreaRef.current) return;
    const content = formAreaRef.current.innerHTML;
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Form ${activeStep} — ${FORM_LABELS[activeStep] || ""} ${sectorType ? `(${sectorType})` : ""}</title>
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

  // ✅ Download form info as CSV (label + metadata)
  const handleDownload = useCallback(
    (fy) => {
      const rows = [
        ["Form No", "Form Name", "Sector", "Financial Year"],
        [
          activeStep,
          FORM_LABELS[activeStep] || "",
          sectorType || "All",
          fy || "Current",
        ],
      ];
      const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Form_${activeStep}_${sectorType || "ALL"}_${fy || "current"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [activeStep, sectorType],
  );

  const stepComponents = useMemo(
    () => ({
      1: <Form1 sector={sectorType} financialYear={selectedFY} />,
      2: <Form2 sector={sectorType} financialYear={selectedFY} />,
      3: <Form3 sector={sectorType} financialYear={selectedFY} />,
      4: <Form4 sector={sectorType} financialYear={selectedFY} />,
      "5A": <Form5A sector={sectorType} financialYear={selectedFY} />,
      "5B": <Form5B sector={sectorType} financialYear={selectedFY} />,
      "5C": <Form5C sector={sectorType} financialYear={selectedFY} />,
      "5D": <Form5D sector={sectorType} financialYear={selectedFY} />,
      "5E": <Form5E sector={sectorType} financialYear={selectedFY} />,
      6: <Form6 sector={sectorType} financialYear={selectedFY} />,
      7: <Form7 sector={sectorType} financialYear={selectedFY} />,
      "7A": <Form7A sector={sectorType} financialYear={selectedFY} />,
      "7B": <Form7B sector={sectorType} financialYear={selectedFY} />,
      8: <Form8 sector={sectorType} financialYear={selectedFY} />,
      9: <Form9 sector={sectorType} financialYear={selectedFY} />,
      10: <Form10 sector={sectorType} financialYear={selectedFY} />,
      11: <Form11 sector={sectorType} financialYear={selectedFY} />,
      12: <Form12 sector={sectorType} financialYear={selectedFY} />,
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
          padding: "0",
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
                  fontFamily: "'Georgia', serif",
                }}>
                Government of India
              </p>
              <h1
                style={{
                  margin: "2px 0 0",
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#ffffff",
                  letterSpacing: "0.5px",
                  fontFamily: "'Georgia', serif",
                }}>
                Financial Management System
              </h1>
              <p
                style={{
                  margin: "1px 0 0",
                  fontSize: "11px",
                  color: "#93b8d8",
                  letterSpacing: "0.5px",
                }}>
                Treasury & Accounts Department
              </p>
            </div>
          </div>

          {sectorMeta && (
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
                  background: sectorMeta.color,
                  border: "1px solid rgba(201,168,76,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#c9a84c",
                  letterSpacing: "1px",
                }}>
                {sectorMeta.badge}
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#ffffff",
                  }}>
                  {sectorMeta.label}
                </p>
                <p
                  style={{
                    margin: "1px 0 0",
                    fontSize: "10px",
                    color: "#93b8d8",
                  }}>
                  {sectorMeta.subtitle}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sub-header: Search + Breadcrumb ── */}
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
          <span>Forms</span>
          {sectorType && (
            <>
              <span style={{ color: "#9ca3af" }}>›</span>
              <span style={{ color: "#1a3a5c", fontWeight: "600" }}>
                {sectorType}
              </span>
            </>
          )}
        </div>
        {/* ✅ SearchFunction now wired with onFilter, onDownload, onPrint */}
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
        {/* ── Section Title ── */}
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
                  fontFamily: "'Georgia', serif",
                }}>
                Official Register of Forms
              </h2>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "12px",
                  color: "#6b7280",
                }}>
                Select a form number below to view the corresponding register
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

        {/* ── Active Form Info Banner ── */}
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
              FORM {activeStep}
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: "600",
                  color: "#111827",
                  fontSize: "14px",
                }}>
                {FORM_LABELS[activeStep] || `Form ${activeStep}`}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "11px",
                  color: "#9ca3af",
                }}>
                Currently Viewing{selectedFY ? ` — FY ${selectedFY}` : ""}
              </p>
            </div>
          </div>
          <div
            style={{ fontSize: "11px", color: "#6b7280", textAlign: "right" }}>
            <div style={{ fontWeight: "600", color: "#374151" }}>
              {array.indexOf(activeStep) + 1} of {array.length} Forms
            </div>
            <div style={{ marginTop: "2px" }}>Financial Year Register</div>
          </div>
        </div>

        {/* ── Form Navigator ── */}
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
            Form Index
          </p>

          {/* Progress bar */}
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
                  title={FORM_LABELS[row] || `Form ${row}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "72px",
                    padding: "10px 6px 8px",
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
                      fontSize: "14px",
                      fontWeight: "700",
                      color: isActive ? "#c9a84c" : "#374151",
                      lineHeight: 1,
                      fontFamily: "'Georgia', serif",
                    }}>
                    {row}
                  </span>
                  <span
                    style={{
                      fontSize: "8.5px",
                      color: isActive ? "rgba(255,255,255,0.75)" : "#9ca3af",
                      marginTop: "4px",
                      textAlign: "center",
                      lineHeight: "1.2",
                      maxWidth: "60px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                    {FORM_LABELS[row] || ""}
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

        {/* ── Form Display Area — wrapped in ref for print ── */}
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
                Form No. {activeStep} — {FORM_LABELS[activeStep] || "Register"}
              </span>
            </div>
            {sectorType && (
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
                {sectorType}
              </span>
            )}
          </div>

          {/* ✅ ref attached here — only this div gets printed */}
          <div ref={formAreaRef} style={{ padding: "0" }}>
            {stepComponents[activeStep]}
          </div>
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

export default TrackForms;
