import React, { useState } from "react";
import { GrUpdate } from "react-icons/gr";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiAlertTriangle,
} from "react-icons/fi";

const PasswordChanger = () => {
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const strength = (val) => {
    if (!val) return { label: "", width: "0%", color: "#e5e7eb" };
    if (val.length < 6)
      return { label: "Weak", width: "25%", color: "#dc2626" };
    if (val.length < 10)
      return { label: "Fair", width: "55%", color: "#d97706" };
    if (/[A-Z]/.test(val) && /[0-9]/.test(val) && /[^a-zA-Z0-9]/.test(val))
      return { label: "Strong", width: "100%", color: "#14532d" };
    return { label: "Good", width: "75%", color: "#1a3a5c" };
  };

  const pwStrength = strength(password);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== newPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setSaved(true);
    setPassword("");
    setNewPassword("");
    setTimeout(() => setSaved(false), 3000);
  };

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
            Change Password
          </h2>
          <p className="text-xs" style={{ color: "#6b7280" }}>
            Update your official account credentials securely
          </p>
        </div>
      </div>

      {/* ── Card ── */}
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
            <FiShield size={12} style={{ color: "#c9a84c" }} />
          </div>
          <p className="text-xs font-bold text-white tracking-wide uppercase">
            Security Settings
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
            Encrypted
          </span>
        </div>

        {/* Profile strip */}
        <div
          className="flex items-center gap-4 px-6 py-4 border-b"
          style={{ borderColor: "#e5e7eb", background: "#f9fafb" }}>
          <img
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            style={{ border: "2px solid #c9a84c" }}
            src="https://static.vecteezy.com/system/resources/previews/007/409/979/original/people-icon-design-avatar-icon-person-icons-people-icons-are-set-in-trendy-flat-style-user-icon-set-vector.jpg"
            alt="User"
          />
          <div>
            <p className="text-sm font-bold" style={{ color: "#0f2744" }}>
              Official Account
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
              Government Financial Management System
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "#9ca3af", fontSize: "10px" }}>
              Last password change: Never · Changes logged for audit
            </p>
          </div>
          <span
            className="ml-auto flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
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
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-5"
            style={{ color: "rgba(201,168,76,0.9)" }}>
            Credential Update
          </p>

          <div className="flex flex-col gap-5 max-w-md">
            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5"
                style={{ color: "#374151" }}>
                <FiLock size={13} style={{ color: "#1a3a5c" }} />
                New Password
              </label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  type={showPass ? "text" : "password"}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 pr-10 text-sm rounded border outline-none transition-all duration-150"
                  style={{
                    background: "#f9fafb",
                    borderColor: error && !password ? "#dc2626" : "#d1d5db",
                    fontFamily: "'Georgia', serif",
                    fontSize: "13px",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1a3a5c";
                    e.target.style.background = "#fff";
                    e.target.style.boxShadow = "0 0 0 3px rgba(26,58,92,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#d1d5db";
                    e.target.style.background = "#f9fafb";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: "#9ca3af" }}>
                  {showPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>

              {/* Strength bar */}
              {password && (
                <div className="mt-1">
                  <div
                    className="w-full h-1.5 rounded-full"
                    style={{ background: "#e5e7eb" }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: pwStrength.width,
                        background: pwStrength.color,
                      }}
                    />
                  </div>
                  <p
                    className="text-xs mt-1 font-semibold"
                    style={{ color: pwStrength.color }}>
                    Strength: {pwStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5"
                style={{ color: "#374151" }}>
                <FiShield size={13} style={{ color: "#1a3a5c" }} />
                Confirm Password
              </label>
              <div className="relative">
                <input
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  type={showNew ? "text" : "password"}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-2.5 pr-10 text-sm rounded border outline-none transition-all duration-150"
                  style={{
                    background: "#f9fafb",
                    borderColor:
                      newPassword && newPassword !== password
                        ? "#dc2626"
                        : "#d1d5db",
                    fontFamily: "'Georgia', serif",
                    fontSize: "13px",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1a3a5c";
                    e.target.style.background = "#fff";
                    e.target.style.boxShadow = "0 0 0 3px rgba(26,58,92,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor =
                      newPassword && newPassword !== password
                        ? "#dc2626"
                        : "#d1d5db";
                    e.target.style.background = "#f9fafb";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: "#9ca3af" }}>
                  {showNew ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
              {newPassword && newPassword !== password && (
                <p
                  className="text-xs font-semibold"
                  style={{ color: "#dc2626" }}>
                  Passwords do not match.
                </p>
              )}
              {newPassword && newPassword === password && password && (
                <p
                  className="text-xs font-semibold"
                  style={{ color: "#14532d" }}>
                  ✓ Passwords match.
                </p>
              )}
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded border text-xs font-semibold max-w-md"
              style={{
                background: "rgba(220,38,38,0.07)",
                borderColor: "rgba(220,38,38,0.25)",
                color: "#991b1b",
              }}>
              <FiAlertTriangle size={13} />
              {error}
            </div>
          )}

          {/* Divider + Actions */}
          <div
            className="mt-6 pt-4 flex items-center justify-between max-w-md"
            style={{ borderTop: "1px solid #e5e7eb" }}>
            <p className="text-xs" style={{ color: "#9ca3af" }}>
              Changes are audit-logged.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPassword("");
                  setNewPassword("");
                  setError("");
                }}
                className="px-5 py-2.5 text-xs font-bold rounded border transition-all duration-150 cursor-pointer"
                style={{
                  borderColor: "#d1d5db",
                  color: "#374151",
                  background: "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f3f4f6")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }>
                Clear
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded cursor-pointer active:scale-95 transition-all duration-150"
                style={{
                  background: saved ? "#14532d" : "#0f2744",
                  color: saved ? "#fff" : "#c9a84c",
                  border: `1.5px solid ${saved ? "#14532d" : "#c9a84c"}`,
                }}>
                <GrUpdate
                  size={12}
                  style={{ color: saved ? "#fff" : "#c9a84c" }}
                />
                {saved ? "Password Updated!" : "Update Password"}
              </button>
            </div>
          </div>

          {saved && (
            <div
              className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded border text-xs font-semibold max-w-md"
              style={{
                background: "rgba(20,83,45,0.08)",
                borderColor: "rgba(20,83,45,0.2)",
                color: "#14532d",
              }}>
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "#22c55e" }}
              />
              Password updated successfully. Please use your new credentials on
              next login.
            </div>
          )}
        </form>
      </div>

      {/* ── Security Notice ── */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded border max-w-2xl"
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
          <strong>Security Policy:</strong> Passwords must be at least 8
          characters and include uppercase letters, numbers, and special
          characters. Do not share your credentials with anyone. Password
          changes are logged for compliance under government IT security
          guidelines.
        </p>
      </div>
    </div>
  );
};

export default PasswordChanger;
