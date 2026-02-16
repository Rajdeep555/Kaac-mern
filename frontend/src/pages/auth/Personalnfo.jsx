import React, { useState } from "react";
import { GrUpdate } from "react-icons/gr";
import {
  FiCamera,
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiShield,
} from "react-icons/fi";

const PersonalInfo = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const fields = [
    {
      id: "name",
      label: "Full Name",
      type: "text",
      placeholder: "Enter your full name",
      icon: <FiUser size={14} />,
    },
    {
      id: "email",
      label: "Email Address",
      type: "email",
      placeholder: "Enter your email address",
      icon: <FiMail size={14} />,
    },
    {
      id: "phone",
      label: "Phone Number",
      type: "tel",
      placeholder: "Enter your phone number",
      icon: <FiPhone size={14} />,
    },
    {
      id: "role",
      label: "Designation / Role",
      type: "text",
      placeholder: "Enter your role",
      icon: <FiBriefcase size={14} />,
    },
  ];

  return (
    <div
      className="w-full flex flex-col gap-5 pb-8 min-h-fit"
      style={{ fontFamily: "'Georgia', serif" }}>
      {/* ── Page Title ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-1 h-7 rounded-full"
          style={{ background: "#c9a84c" }}
        />
        <div>
          <h2 className="text-lg font-bold" style={{ color: "#0f2744" }}>
            Personal Information
          </h2>
          <p className="text-xs" style={{ color: "#6b7280" }}>
            Manage and update your official profile details
          </p>
        </div>
      </div>

      {/* ── Profile Card ── */}
      <div
        className="rounded-lg border overflow-y-auto"
        style={{
          background: "#fff",
          borderColor: "#e5e7eb",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
        {/* Card header strip */}
        <div
          className="px-6 py-3 flex min-h-fit items-center gap-2 border-b"
          style={{ background: "#0f2744", borderColor: "#000" }}>
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{
              background: "rgba(201,168,76,0.2)",
              border: "1px solid #c9a84c",
            }}>
            <FiShield size={12} style={{ color: "#c9a84c" }} />
          </div>
          <p className="text-xs font-bold text-white tracking-wide uppercase">
            Official Profile Record
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
            Editable
          </span>
        </div>

        {/* Avatar section */}
        <div
          className="flex items-center gap-5 px-6 py-5 border-b"
          style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}>
          <div className="relative flex-shrink-0">
            <img
              className="w-20 h-20 rounded-full object-cover"
              style={{ border: "3px solid #c9a84c" }}
              src="https://static.vecteezy.com/system/resources/previews/007/409/979/original/people-icon-design-avatar-icon-person-icons-people-icons-are-set-in-trendy-flat-style-user-icon-set-vector.jpg"
              alt="Profile"
            />
            {/* Camera overlay */}
            <button
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150"
              style={{ background: "#0f2744", border: "2px solid #fff" }}
              title="Change photo">
              <FiCamera size={12} style={{ color: "#c9a84c" }} />
            </button>
          </div>

          <div>
            <p className="text-sm font-bold" style={{ color: "#0f2744" }}>
              {formData.name || "Official User"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
              {formData.role || "Government Department"}
            </p>
            <p
              className="text-xs mt-2"
              style={{ color: "#9ca3af", fontSize: "10px" }}>
              Employee ID: GOI-2024-00{Math.floor(Math.random() * 900) + 100}
            </p>
          </div>

          {/* Status badge */}
          <div className="ml-auto flex flex-col items-end gap-1.5">
            <span
              className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold"
              style={{
                background: "rgba(20,83,45,0.1)",
                color: "#14532d",
                border: "1px solid rgba(20,83,45,0.2)",
              }}>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#22c55e" }}
              />
              Active
            </span>
            <p
              className="text-xs"
              style={{ color: "#9ca3af", fontSize: "10px" }}>
              Last updated: Today
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "rgba(201,168,76,0.9)" }}>
            Profile Details
          </p>

          <div className="grid grid-cols-2 gap-5">
            {fields.map((field) => (
              <div key={field.id} className="flex flex-col gap-1.5">
                <label
                  htmlFor={field.id}
                  className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5"
                  style={{ color: "#374151" }}>
                  <span style={{ color: "#1a3a5c" }}>{field.icon}</span>
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.id]}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm rounded border outline-none transition-all duration-150"
                    style={{
                      background: "#f9fafb",
                      borderColor: "#d1d5db",
                      color: "#111827",
                      fontFamily: "'Georgia', serif",
                      fontSize: "13px",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#1a3a5c";
                      e.target.style.background = "#ffffff";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(26,58,92,0.08)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d5db";
                      e.target.style.background = "#f9fafb";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            className="my-6"
            style={{ height: "1px", background: "#e5e7eb" }}
          />

          {/* Footer row */}
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "#9ca3af" }}>
              All changes are logged for audit compliance.
            </p>

            <div className="flex items-center gap-3">
              {/* Reset button */}
              <button
                type="button"
                onClick={() => {
                  setFormData({ name: "", email: "", phone: "", role: "" });
                  setSaved(false);
                }}
                className="px-5 py-2.5 text-xs font-bold rounded border transition-all duration-150 cursor-pointer"
                style={{
                  borderColor: "#d1d5db",
                  color: "#374151",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}>
                Reset
              </button>

              {/* Submit button */}
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded transition-all duration-150 cursor-pointer active:scale-95"
                style={{
                  background: saved ? "#14532d" : "#0f2744",
                  color: saved ? "#ffffff" : "#c9a84c",
                  border: `1.5px solid ${saved ? "#14532d" : "#c9a84c"}`,
                  letterSpacing: "0.5px",
                }}
                onMouseEnter={(e) => {
                  if (!saved) {
                    e.currentTarget.style.background = "#1a3a5c";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saved) {
                    e.currentTarget.style.background = "#0f2744";
                  }
                }}>
                <GrUpdate
                  size={12}
                  style={{ color: saved ? "#fff" : "#c9a84c" }}
                />
                {saved ? "Changes Saved!" : "Update Profile"}
              </button>
            </div>
          </div>

          {/* Success banner */}
          {saved && (
            <div
              className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded border text-xs font-semibold"
              style={{
                background: "rgba(20,83,45,0.08)",
                borderColor: "rgba(20,83,45,0.2)",
                color: "#14532d",
              }}>
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "#22c55e" }}
              />
              Profile updated successfully. Changes have been logged for audit
              compliance.
            </div>
          )}
        </form>
      </div>

      {/* ── Security Notice ── */}
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
          <strong>Security Notice:</strong> Your profile information is
          protected under government data privacy regulations. Any changes to
          official records are subject to audit review and must comply with
          applicable government service rules.
        </p>
      </div>
    </div>
  );
};

export default PersonalInfo;
