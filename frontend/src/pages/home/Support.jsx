import React, { useState, useEffect } from "react";
import { TbDownload, TbFileDescription } from "react-icons/tb";
import {
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiSend,
  FiHeadphones,
  FiTrash2,
} from "react-icons/fi";
import { MdOutlineSupportAgent } from "react-icons/md";

// ─── Constants ────────────────────────────────────────────────
const STORAGE_KEY = "govt_support_tickets";

const REQUEST_TYPES = [
  "Voucher Correction Request",
  "Expenditure Entry Error",
  "DDO Code Mismatch",
  "Budget Allocation Issue",
  "Treasury Reconciliation",
  "Account Head Rectification",
  "Grant Utilisation Query",
  "Audit Objection Support",
  "Other Technical Issue",
];

const PRIORITY_LEVELS = ["Normal", "High", "Urgent"];

const DEPARTMENTS = [
  "Finance & Accounts",
  "Treasury Operations",
  "Audit Division",
  "Budget Branch",
  "DDO Office",
  "Planning Department",
];

const WHATSAPP_NUMBER = "916002130320";

const STATUS_CONFIG = {
  Pending: {
    color: "#92400e",
    bg: "rgba(146,64,14,0.08)",
    border: "rgba(146,64,14,0.2)",
    icon: <FiClock size={11} />,
  },
  Approved: {
    color: "#14532d",
    bg: "rgba(20,83,45,0.08)",
    border: "rgba(20,83,45,0.2)",
    icon: <FiCheckCircle size={11} />,
  },
  "In Progress": {
    color: "#1a3a5c",
    bg: "rgba(26,58,92,0.08)",
    border: "rgba(26,58,92,0.2)",
    icon: <FiLoader size={11} />,
  },
  Closed: {
    color: "#991b1b",
    bg: "rgba(153,27,27,0.08)",
    border: "rgba(153,27,27,0.2)",
    icon: <FiXCircle size={11} />,
  },
};

// ─── Helpers ──────────────────────────────────────────────────
const generateTicketId = () => {
  const prefix = "GS";
  const num = Math.floor(100000000 + Math.random() * 900000000);
  return `${prefix}#${num}`;
};

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (tickets) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch {}
};

// ─── Sub-components ───────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded"
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}>
      {cfg.icon}
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const map = {
    Normal: {
      color: "#374151",
      bg: "rgba(55,65,81,0.08)",
      border: "rgba(55,65,81,0.2)",
    },
    High: {
      color: "#92400e",
      bg: "rgba(146,64,14,0.08)",
      border: "rgba(146,64,14,0.2)",
    },
    Urgent: {
      color: "#991b1b",
      bg: "rgba(153,27,27,0.1)",
      border: "rgba(153,27,27,0.3)",
    },
  };
  const cfg = map[priority] || map.Normal;
  return (
    <span
      className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded"
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        fontSize: "10px",
      }}>
      {priority}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────
const Support = () => {
  const EMPTY_FORM = {
    type: REQUEST_TYPES[0],
    priority: "Normal",
    department: DEPARTMENTS[0],
    employeeId: "",
    subject: "",
    remarks: "",
  };

  const [form, setForm] = useState(EMPTY_FORM);
  const [tickets, setTickets] = useState([]);
  const [submitState, setSubmitState] = useState("idle"); // idle | success | error
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load tickets from localStorage on mount
  useEffect(() => {
    setTickets(loadFromStorage());
  }, []);

  const handleChange = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const buildWhatsAppMessage = (ticket) => {
    return encodeURIComponent(
      `*NEW SUPPORT REQUEST*\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `*Ticket ID:* ${ticket.id}\n` +
        `*Type:* ${ticket.type}\n` +
        `*Priority:* ${ticket.priority}\n` +
        `*Department:* ${ticket.department}\n` +
        `*Employee ID:* ${ticket.employeeId || "N/A"}\n` +
        `*Subject:* ${ticket.subject}\n` +
        `*Remarks:* ${ticket.remarks || "None"}\n` +
        `*Filed On:* ${formatDate(ticket.date)}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `_Submitted via Govt. Expenditure Management System_`,
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.subject.trim()) {
      setSubmitState("error");
      setTimeout(() => setSubmitState("idle"), 3000);
      return;
    }

    const newTicket = {
      id: generateTicketId(),
      type: form.type,
      priority: form.priority,
      department: form.department,
      employeeId: form.employeeId,
      subject: form.subject,
      remarks: form.remarks,
      date: new Date().toISOString(),
      status: "Pending",
    };

    // Save to localStorage
    const updated = [newTicket, ...tickets];
    setTickets(updated);
    saveToStorage(updated);

    // Open WhatsApp
    const msg = buildWhatsAppMessage(newTicket);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");

    setForm(EMPTY_FORM);
    setSubmitState("success");
    setTimeout(() => setSubmitState("idle"), 4000);
  };

  const handleDelete = (ticketId) => {
    const updated = tickets.filter((t) => t.id !== ticketId);
    setTickets(updated);
    saveToStorage(updated);
    setDeleteConfirm(null);
  };

  const handleDownload = () => {
    if (!tickets.length) return;
    const headers = [
      "Ticket ID",
      "Type",
      "Priority",
      "Department",
      "Employee ID",
      "Subject",
      "Date",
      "Status",
    ];
    const rows = tickets.map((t) =>
      [
        t.id,
        t.type,
        t.priority,
        t.department,
        t.employeeId || "-",
        t.subject,
        formatDate(t.date),
        t.status,
      ].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `support-tickets-${Date.now()}.csv`;
    a.click();
  };

  // ─── Field helper ─────────────────────────────────────────
  const fieldStyle = {
    background: "#f9fafb",
    borderColor: "#d1d5db",
    color: "#111827",
    fontFamily: "inherit",
  };
  const readOnlyStyle = {
    background: "#f3f4f6",
    borderColor: "#e5e7eb",
    color: "#6b7280",
    fontFamily: "inherit",
  };
  const inputClass =
    "w-full px-3 py-2.5 text-xs rounded border outline-none transition-all duration-150 focus:border-blue-400 focus:ring-1 focus:ring-blue-100";

  return (
    <div
      className="w-full flex flex-col gap-5 pb-8"
      style={{ fontFamily: "'Inter', 'Georgia', sans-serif" }}>
      {/* ── Page Title ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-1 h-7 rounded-full"
          style={{ background: "#0f2744" }}
        />
        <div>
          <h2 className="text-lg font-bold" style={{ color: "#0f2744" }}>
            IT Helpdesk &amp; Support
          </h2>
          <p className="text-xs" style={{ color: "#6b7280" }}>
            Raise system issues, rectification requests and track their
            resolution status
          </p>
        </div>
        {tickets.length > 0 && (
          <span
            className="ml-auto text-xs font-bold px-2.5 py-1 rounded"
            style={{
              background: "rgba(15,39,68,0.08)",
              color: "#0f2744",
              border: "1px solid rgba(15,39,68,0.15)",
            }}>
            {tickets.filter((t) => t.status === "Pending").length} Pending
          </span>
        )}
      </div>

      {/* ── Raise Issue Card ── */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          background: "#fff",
          borderColor: "#e5e7eb",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
        {/* Card Header */}
        <div
          className="px-6 py-3 flex items-center gap-2 border-b"
          style={{ background: "#0f2744", borderColor: "#1a3a5c" }}>
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{
              background: "rgba(201,168,76,0.2)",
              border: "1px solid #c9a84c",
            }}>
            <MdOutlineSupportAgent size={13} style={{ color: "#c9a84c" }} />
          </div>
          <p className="text-xs font-bold text-white tracking-wide uppercase">
            Raise a Support Request
          </p>
          <span
            className="ml-auto text-xs px-2 py-0.5 rounded"
            style={{
              color: "#c9a84c",
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.3)",
              fontSize: "9px",
              fontWeight: "700",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}>
            Helpdesk Portal
          </span>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "rgba(201,168,76,0.9)" }}>
            Issue Details
          </p>

          {/* Row 1: Type, Priority, Department, Employee ID */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: "#374151" }}>
                Issue Type *
              </label>
              <select
                value={form.type}
                onChange={handleChange("type")}
                className={inputClass}
                style={fieldStyle}>
                {REQUEST_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: "#374151" }}>
                Priority Level *
              </label>
              <select
                value={form.priority}
                onChange={handleChange("priority")}
                className={inputClass}
                style={fieldStyle}>
                {PRIORITY_LEVELS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: "#374151" }}>
                Department *
              </label>
              <select
                value={form.department}
                onChange={handleChange("department")}
                className={inputClass}
                style={fieldStyle}>
                {DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: "#374151" }}>
                Employee / DDO Code
              </label>
              <input
                type="text"
                placeholder="e.g. DDO-2024-001"
                value={form.employeeId}
                onChange={handleChange("employeeId")}
                className={inputClass}
                style={fieldStyle}
              />
            </div>
          </div>

          {/* Row 2: Subject + Remarks */}
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: "#374151" }}>
                Subject / Brief Description *
              </label>
              <input
                type="text"
                placeholder="e.g. Incorrect voucher number generated for COUNCIL sector"
                value={form.subject}
                onChange={handleChange("subject")}
                className={inputClass}
                style={fieldStyle}
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <label
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: "#374151" }}>
                Detailed Remarks
              </label>
              <textarea
                value={form.remarks}
                onChange={handleChange("remarks")}
                placeholder="Describe the issue in detail — steps to reproduce, affected records, etc."
                rows={1}
                className={`${inputClass} resize-none`}
                style={fieldStyle}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className="mt-6 pt-4 flex items-center justify-between gap-4"
            style={{ borderTop: "1px solid #e5e7eb" }}>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-semibold" style={{ color: "#374151" }}>
                Submission will send a WhatsApp notification to the IT Helpdesk.
              </p>
              <p className="text-xs" style={{ color: "#9ca3af" }}>
                Keep your Employee / DDO Code handy for faster resolution.
              </p>
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded cursor-pointer active:scale-95 transition-all duration-150 shrink-0"
              style={{
                background:
                  submitState === "success"
                    ? "#14532d"
                    : submitState === "error"
                      ? "#991b1b"
                      : "#0f2744",
                color: submitState === "error" ? "#fff" : "#c9a84c",
                border: `1.5px solid ${submitState === "success" ? "#14532d" : submitState === "error" ? "#991b1b" : "#c9a84c"}`,
              }}>
              <FiSend size={12} />
              {submitState === "success"
                ? "Request Submitted!"
                : submitState === "error"
                  ? "Subject Required"
                  : "Submit Request"}
            </button>
          </div>

          {/* Success Banner */}
          {submitState === "success" && (
            <div
              className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded border text-xs font-semibold"
              style={{
                background: "rgba(20,83,45,0.08)",
                borderColor: "rgba(20,83,45,0.2)",
                color: "#14532d",
              }}>
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "#22c55e" }}
              />
              Ticket logged successfully. WhatsApp notification sent to the IT
              Helpdesk (+91-6002130320). Expected response: 1–2 working days.
            </div>
          )}
        </form>
      </div>

      {/* ── Support History Card ── */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          background: "#fff",
          borderColor: "#e5e7eb",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
        {/* Card Header */}
        <div
          className="px-6 py-3 flex items-center justify-between border-b"
          style={{ background: "#0f2744", borderColor: "#1a3a5c" }}>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{
                background: "rgba(201,168,76,0.2)",
                border: "1px solid #c9a84c",
              }}>
              <FiHeadphones size={12} style={{ color: "#c9a84c" }} />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wide uppercase">
                Ticket History
              </p>
              <p className="text-xs" style={{ color: "#93b8d8" }}>
                {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} filed
                from this device
              </p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            disabled={!tickets.length}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded cursor-pointer transition-all duration-150 disabled:opacity-40"
            style={{
              color: "#c9a84c",
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.3)",
            }}>
            <TbDownload size={13} />
            Export CSV
          </button>
        </div>

        {/* Table header */}
        <div
          className="grid px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
          style={{
            gridTemplateColumns: "1.4fr 1.8fr 0.8fr 1.2fr 0.7fr 0.8fr 0.6fr",
            background: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            color: "#6b7280",
          }}>
          <span>Ticket No.</span>
          <span>Issue Type</span>
          <span>Priority</span>
          <span>Department</span>
          <span>Filed On</span>
          <span>Status</span>
          <span></span>
        </div>

        {/* Rows */}
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <TbFileDescription size={32} style={{ color: "#d1d5db" }} />
            <p className="text-xs font-semibold" style={{ color: "#9ca3af" }}>
              No tickets raised yet
            </p>
            <p className="text-xs" style={{ color: "#d1d5db" }}>
              Submitted requests will appear here
            </p>
          </div>
        ) : (
          <div
            className="flex flex-col divide-y"
            style={{ borderColor: "#f3f4f6" }}>
            {tickets.map((item, i) => (
              <div
                key={i}
                className="grid items-center px-6 py-3.5 transition-colors duration-100"
                style={{
                  gridTemplateColumns:
                    "1.4fr 1.8fr 0.8fr 1.2fr 0.7fr 0.8fr 0.6fr",
                  background: "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f9fafb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }>
                <div>
                  <p className="text-xs font-bold" style={{ color: "#0f2744" }}>
                    {item.id}
                  </p>
                  {item.employeeId && (
                    <p
                      className="text-xs"
                      style={{ color: "#9ca3af", fontSize: "10px" }}>
                      {item.employeeId}
                    </p>
                  )}
                </div>

                <div>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "#111827" }}>
                    {item.type}
                  </p>
                  {item.subject && (
                    <p
                      className="text-xs truncate max-w-xs"
                      style={{ color: "#9ca3af", fontSize: "10px" }}
                      title={item.subject}>
                      {item.subject}
                    </p>
                  )}
                </div>

                <div>
                  <PriorityBadge priority={item.priority} />
                </div>

                <p className="text-xs" style={{ color: "#374151" }}>
                  {item.department}
                </p>

                <p className="text-xs" style={{ color: "#6b7280" }}>
                  {formatDate(item.date)}
                </p>

                <div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="flex justify-end">
                  {deleteConfirm === item.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs px-2 py-1 rounded font-bold"
                        style={{
                          background: "rgba(153,27,27,0.1)",
                          color: "#991b1b",
                        }}>
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs px-2 py-1 rounded font-bold"
                        style={{ background: "#f3f4f6", color: "#6b7280" }}>
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(item.id)}
                      className="p-1.5 rounded transition-colors"
                      style={{ color: "#d1d5db" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#991b1b")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#d1d5db")
                      }
                      title="Remove ticket">
                      <FiTrash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
          <strong>Official Notice:</strong> This helpdesk is intended for issues
          related to the Expenditure Management System only. Requests are
          forwarded to the IT Cell via WhatsApp and logged locally on your
          device. For audit-related queries, contact the Audit Division
          directly. All submissions are subject to departmental review under the
          applicable government IT policy.
        </p>
      </div>
    </div>
  );
};

export default Support;
