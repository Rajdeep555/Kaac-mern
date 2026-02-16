import React, { useState } from "react";
import { TbDownload } from "react-icons/tb";
import {
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
} from "react-icons/fi";
import { MdOutlineSupportAgent } from "react-icons/md";

const STATUS_CONFIG = {
  Pending: {
    color: "#92400e",
    bg: "rgba(146,64,14,0.08)",
    border: "rgba(146,64,14,0.2)",
    icon: <FiClock size={11} />,
  },
  Approve: {
    color: "#14532d",
    bg: "rgba(20,83,45,0.08)",
    border: "rgba(20,83,45,0.2)",
    icon: <FiCheckCircle size={11} />,
  },
  Process: {
    color: "#1a3a5c",
    bg: "rgba(26,58,92,0.08)",
    border: "rgba(26,58,92,0.2)",
    icon: <FiLoader size={11} />,
  },
  Cancelled: {
    color: "#991b1b",
    bg: "rgba(153,27,27,0.08)",
    border: "rgba(153,27,27,0.2)",
    icon: <FiXCircle size={11} />,
  },
};

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

const Support = () => {
  const [form, setForm] = useState({
    type: "Reissue Request",
    reason: "Voluntary Reissue",
    date: "",
    remarks: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const SupportHistory = [
    {
      id: "SR#136354726",
      type: "Refund Request",
      date: "20/01/2023",
      status: "Pending",
    },
    {
      id: "SR#136354745",
      type: "Reissue Request",
      date: "25/01/2023",
      status: "Approve",
    },
    {
      id: "SR#136354787",
      type: "VIP Request",
      date: "23/01/2023",
      status: "Process",
    },
    {
      id: "SR#136354788",
      type: "VIP Request",
      date: "23/01/2023",
      status: "Cancelled",
    },
  ];

  return (
    <div
      className="w-full flex flex-col gap-5 pb-8"
      style={{ fontFamily: "'Georgia', serif" }}>
      {/* ── Page Title ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-1 h-7 rounded-full"
          style={{ background: "#c9a84c" }}
        />
        <div>
          <h2 className="text-lg font-bold" style={{ color: "#0f2744" }}>
            Support Centre
          </h2>
          <p className="text-xs" style={{ color: "#6b7280" }}>
            Raise issues and track your support requests
          </p>
        </div>
      </div>

      {/* ── Raise Issue Card ── */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          background: "#fff",
          borderColor: "#e5e7eb",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
        {/* Card header */}
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
            Raise an Issue
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
            New Request
          </span>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "rgba(201,168,76,0.9)" }}>
            Request Details
          </p>

          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            {[
              {
                label: "Request Type *",
                el: (
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, type: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 text-xs rounded border outline-none transition-all duration-150"
                    style={{
                      background: "#f9fafb",
                      borderColor: "#d1d5db",
                      fontFamily: "'Georgia', serif",
                      color: "#111827",
                    }}>
                    <option>Reissue Request</option>
                    <option>Refund Request</option>
                    <option>VIP Request</option>
                    <option>Cancel Request</option>
                  </select>
                ),
              },
              {
                label: "Phone Number",
                el: (
                  <input
                    type="text"
                    value="+91-01010101"
                    readOnly
                    className="w-full px-3 py-2.5 text-xs rounded border"
                    style={{
                      background: "#f3f4f6",
                      borderColor: "#d1d5db",
                      color: "#6b7280",
                      fontFamily: "'Georgia', serif",
                    }}
                  />
                ),
              },
              {
                label: "Full Name",
                el: (
                  <input
                    type="text"
                    value="Mark Anderson"
                    readOnly
                    className="w-full px-3 py-2.5 text-xs rounded border"
                    style={{
                      background: "#f3f4f6",
                      borderColor: "#d1d5db",
                      color: "#6b7280",
                      fontFamily: "'Georgia', serif",
                    }}
                  />
                ),
              },
              {
                label: "Code Number",
                el: (
                  <input
                    type="text"
                    value="996502333736727"
                    readOnly
                    className="w-full px-3 py-2.5 text-xs rounded border"
                    style={{
                      background: "#f3f4f6",
                      borderColor: "#d1d5db",
                      color: "#6b7280",
                      fontFamily: "'Georgia', serif",
                    }}
                  />
                ),
              },
            ].map(({ label, el }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: "#374151" }}>
                  {label}
                </label>
                {el}
              </div>
            ))}
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: "Reissue Reason",
                el: (
                  <select
                    value={form.reason}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, reason: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 text-xs rounded border outline-none"
                    style={{
                      background: "#f9fafb",
                      borderColor: "#d1d5db",
                      fontFamily: "'Georgia', serif",
                      color: "#111827",
                    }}>
                    <option>Voluntary Reissue</option>
                    <option>Involuntary Reissue</option>
                  </select>
                ),
              },
              {
                label: "Change Date",
                el: (
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, date: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 text-xs rounded border outline-none"
                    style={{
                      background: "#f9fafb",
                      borderColor: "#d1d5db",
                      fontFamily: "'Georgia', serif",
                      color: "#111827",
                    }}
                  />
                ),
              },
              {
                label: "Remarks",
                col: "col-span-2",
                el: (
                  <textarea
                    value={form.remarks}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, remarks: e.target.value }))
                    }
                    placeholder="Write your remarks here..."
                    rows={1}
                    className="w-full px-3 py-2.5 text-xs rounded border outline-none resize-none"
                    style={{
                      background: "#f9fafb",
                      borderColor: "#d1d5db",
                      fontFamily: "'Georgia', serif",
                      color: "#111827",
                    }}
                  />
                ),
              },
            ].map(({ label, el, col }) => (
              <div key={label} className={`flex flex-col gap-1.5 ${col || ""}`}>
                <label
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: "#374151" }}>
                  {label}
                </label>
                {el}
              </div>
            ))}
          </div>

          {/* Divider + Submit */}
          <div
            className="mt-6 pt-4 flex items-center justify-between"
            style={{ borderTop: "1px solid #e5e7eb" }}>
            <p className="text-xs" style={{ color: "#9ca3af" }}>
              All support requests are logged and tracked.
            </p>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded cursor-pointer active:scale-95 transition-all duration-150"
              style={{
                background: submitted ? "#14532d" : "#0f2744",
                color: submitted ? "#fff" : "#c9a84c",
                border: `1.5px solid ${submitted ? "#14532d" : "#c9a84c"}`,
              }}>
              <FiAlertCircle size={13} />
              {submitted ? "Issue Submitted!" : "Submit Issue"}
            </button>
          </div>

          {submitted && (
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
              Your support request has been submitted successfully. You will
              receive a response within 2–3 working days.
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
        {/* Card header */}
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
              <FiClock size={12} style={{ color: "#c9a84c" }} />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wide uppercase">
                Support History
              </p>
              <p className="text-xs" style={{ color: "#93b8d8" }}>
                Your most recent requests
              </p>
            </div>
          </div>
          <button
            onClick={() => alert("Downloading...")}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded cursor-pointer transition-all duration-150"
            style={{
              color: "#c9a84c",
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.3)",
            }}>
            <TbDownload size={13} />
            Download
          </button>
        </div>

        {/* Table header */}
        <div
          className="grid grid-cols-4 px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
          style={{
            background: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            color: "#6b7280",
          }}>
          <span>Request No.</span>
          <span>Type</span>
          <span>Date</span>
          <span>Status</span>
        </div>

        {/* Rows */}
        <div
          className="flex flex-col divide-y"
          style={{ borderColor: "#f3f4f6" }}>
          {SupportHistory.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-4 items-center px-6 py-4 transition-colors duration-100"
              style={{ background: "transparent" }}
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
                <p
                  className="text-xs"
                  style={{ color: "#9ca3af", fontSize: "10px" }}>
                  Support Req No.
                </p>
              </div>
              <div>
                <p
                  className="text-xs font-semibold"
                  style={{ color: "#111827" }}>
                  {item.type}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "#9ca3af", fontSize: "10px" }}>
                  Support Type
                </p>
              </div>
              <div>
                <p
                  className="text-xs font-semibold"
                  style={{ color: "#374151" }}>
                  {item.date}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "#9ca3af", fontSize: "10px" }}>
                  Date Filed
                </p>
              </div>
              <div>
                <StatusBadge status={item.status} />
              </div>
            </div>
          ))}
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
          <strong>Notice:</strong> Support requests are processed within 2–3
          working days. For urgent matters, contact your department's nodal
          officer directly. All communications are recorded for compliance
          purposes.
        </p>
      </div>
    </div>
  );
};

export default Support;
